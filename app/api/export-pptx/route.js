import { customTemplatesRepo } from "@/lib/db/repositories";
import { exportFabricToPptx } from "@/lib/export/fabricToPptx";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      templateId,
      template: rawTemplate,
      pages,
      canvasPreset,
      name,
      theme,
      values = {},
      fileName,
    } = body;

    let targetTemplate = rawTemplate || null;

    // 1. If templateId is provided, fetch template from database
    if (templateId) {
      try {
        const tmpl = await customTemplatesRepo.getById(templateId);
        if (tmpl) {
          targetTemplate = tmpl;
        }
      } catch (dbErr) {
        console.warn("Could not fetch template by id for PPTX export:", dbErr);
      }
    }

    // 2. If no targetTemplate, construct from direct payload
    if (!targetTemplate) {
      targetTemplate = {
        name: name || "Presentation",
        editorType: "slide",
        canvasPreset: canvasPreset || "slide-16-9",
        theme: theme || { backgroundColor: "#FFFFFF" },
        pages: Array.isArray(pages) && pages.length > 0 ? pages : [],
      };
    } else {
      // Overlay any explicitly passed pages/preset/values
      if (Array.isArray(pages) && pages.length > 0) {
        targetTemplate.pages = pages;
      }
      if (canvasPreset) {
        targetTemplate.canvasPreset = canvasPreset;
      }
      if (name && !targetTemplate.name) {
        targetTemplate.name = name;
      }
    }

    // 3. Generate Native PPTX Binary Buffer
    const pptxBuffer = await exportFabricToPptx(targetTemplate, {
      values,
      returnType: "nodebuffer",
    });

    // 4. Resolve safe filename
    const safeTitle = (targetTemplate.name || name || "presentation").replace(/[/\\?%*:|"<>]/g, "_");
    const rawFileName = fileName || `${safeTitle}.pptx`;
    const downloadFileName = rawFileName.endsWith(".pptx") ? rawFileName : `${rawFileName}.pptx`;

    return new Response(pptxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("export-pptx API error:", error);
    return Response.json(
      { error: "สร้างไฟล์ PowerPoint (.pptx) ไม่สำเร็จ", details: error.message },
      { status: 500 }
    );
  }
}
