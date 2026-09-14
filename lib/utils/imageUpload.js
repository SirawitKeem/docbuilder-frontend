/**
 * Convert and compress an uploaded image File to a lightweight base64 Data URL.
 * Resizes proportionally to fit within maxWidth/maxHeight.
 */
export async function optimizeImageFile(file, maxWidth = 512, maxHeight = 512, quality = 0.85) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Invalid image file");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(reader.result);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG/PNG
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            return resolve(webpData);
          }
        } catch {
          // fallback
        }

        const jpegData = canvas.toDataURL("image/jpeg", quality);
        resolve(jpegData);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
