import puppeteer from "puppeteer";
import { customTemplatesRepo } from "@/lib/db/repositories";
import { getCanvasPreset } from "@/lib/editor/canvasPresets";

export async function POST(request) {
  let browser;
  try {
    const { templateId, values, quotationData, fileName, format = "pdf" } = await request.json();

    const payload = quotationData || values || {};
    
    // Dynamically determine template format & dimensions (Docs A4 vs Slides 16:9 vs Custom)
    let isSlide = false;
    let pageWidth = 794;
    let pageHeight = 1123;

    try {
      if (templateId) {
        const tmpl = await customTemplatesRepo.getById(templateId);
        if (tmpl) {
          if (tmpl.canvasPreset) {
            const preset = getCanvasPreset(tmpl.canvasPreset);
            if (preset) {
              pageWidth = preset.width;
              pageHeight = preset.height;
              isSlide = tmpl.editorType === "slide" || tmpl.canvasPreset === "slide-16-9";
            }
          } else if (tmpl.editorType === "slide") {
            isSlide = true;
            pageWidth = 1280;
            pageHeight = 720;
          } else if (tmpl.orientation === "landscape") {
            pageWidth = 1123;
            pageHeight = 794;
          }
        }
      }
    } catch (tmplErr) {
      console.warn("Could not load template config for export-pdf:", tmplErr);
    }

    // Dynamically resolve host and protocol from current incoming request
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    // Also include encoded query string as a secondary fallback
    const jsonString = JSON.stringify(payload);
    const encoded = Buffer.from(jsonString, "utf-8").toString("base64");
    const printUrl = `${baseUrl}/print/${templateId}?data=${encodeURIComponent(encoded)}`;

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();

    // Inject data object directly into page window.__PRINT_DATA__ (bypasses URL length limits)
    await page.evaluateOnNewDocument((data) => {
      window.__PRINT_DATA__ = data;
      const style = document.createElement("style");
      style.innerHTML = "* { animation: none !important; transition: none !important; }";
      document.head.appendChild(style);
    }, payload);

    // Set initial viewport matching page dimensions
    await page.setViewport({
      width: pageWidth,
      height: pageHeight,
      deviceScaleFactor: 2,
    });

    await page.goto(printUrl, { waitUntil: "networkidle0" });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
    await page.waitForSelector('[data-ready="true"]', { timeout: 15000 });

    // Count actual page card elements rendered in the DOM
    const pageCount = await page.evaluate(() => {
      const wrapper = document.querySelector(".quotation-document-wrapper");
      if (wrapper && wrapper.children.length > 0) return wrapper.children.length;
      const printPages = document.querySelectorAll(".print-page");
      if (printPages && printPages.length > 0) return printPages.length;
      const readyPages = document.querySelectorAll("[data-ready='true']");
      if (readyPages && readyPages.length > 0) return readyPages.length;
      return 1;
    });

    // Resize viewport to exactly fit all pages
    await page.setViewport({
      width: pageWidth,
      height: Math.max(pageHeight, pageCount * pageHeight),
      deviceScaleFactor: 2,
    });

    // Small wait for any reflow after resize
    await new Promise((r) => setTimeout(r, 300));

    const baseName = (fileName || `${payload.quotationNo || "document"}`).replace(/\.(pdf|html|webp)$/i, "");

    // 🌐 FORMAT 1: HTML Document (Standalone Offline HTML)
    if (format === "html") {
      const standaloneHtml = await page.evaluate((docTitle) => {
        // 1. Collect all CSS rules from all loaded style sheets for complete offline styling
        let allCss = "";
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              allCss += rule.cssText + "\n";
            }
          } catch (e) {
            // Ignore cross-origin stylesheet access restrictions if any
          }
        }

        const printRoot = document.querySelector("#print-root");
        const container = printRoot ? printRoot.cloneNode(true) : document.body.cloneNode(true);

        // 2. Convert relative & local images to base64 Data URLs so they work offline & in email
        const imgs = container.querySelectorAll("img");
        for (const img of Array.from(imgs)) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 100;
            canvas.height = img.naturalHeight || img.height || 100;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            img.setAttribute("src", dataUrl);
          } catch (err) {
            if (img.src && !img.src.startsWith("data:")) {
              img.setAttribute("src", img.src);
            }
          }
        }

        const bodyContent = container.outerHTML;

        return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
${allCss}
  </style>
  <style>
    body {
      background-color: #f1f5f9;
      margin: 0;
      padding: 32px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      gap: 24px;
      font-family: 'Inter', 'Noto Sans Thai', sans-serif;
    }
    .print-page,
    .quotation-document-wrapper > div,
    #print-root {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      background: white;
    }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        gap: 0 !important;
      }
      .print-page,
      .quotation-document-wrapper > div,
      #print-root {
        box-shadow: none !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
      }, baseName);

      await browser.close();

      const downloadFileName = `${baseName}.html`;
      return new Response(standaloneHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
        },
      });
    }

    // 🖼️ FORMAT 2: WebP Image (Ultra-Crisp 2x Retina Snapshot)
    if (format === "webp") {
      const printRoot = await page.$("#print-root");
      const targetElement = printRoot || page;
      const webpBuffer = await targetElement.screenshot({
        type: "webp",
        quality: 95,
      });

      await browser.close();

      const downloadFileName = `${baseName}.webp`;
      return new Response(webpBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
        },
      });
    }

    // 🔴 FORMAT 3: PDF Document (Default - Unchanged)
    // 🛡️ CRITICAL RULE: Pure isolation between format: "A4" and custom width/height
    let pdfBuffer;
    if (isSlide) {
      pdfBuffer = await page.pdf({
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
        displayHeaderFooter: false,
      });
    } else {
      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
        displayHeaderFooter: false,
      });
    }

    await browser.close();

    const downloadFileName = `${baseName}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
      },
    });
  } catch (error) {
    if (browser) await browser.close();
    console.error("export-pdf error:", error);
    return Response.json({ error: "ส่งออกไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
