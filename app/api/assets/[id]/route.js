import fs from "fs";
import path from "path";
import { query } from "@/lib/db/adapters/postgres/pool";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return new Response("Asset ID required", { status: 400 });
    }

    const res = await query("SELECT * FROM assets WHERE id = $1 LIMIT 1;", [id]);
    if (res.rows.length === 0) {
      return new Response("Asset not found", { status: 404 });
    }

    const asset = res.rows[0];
    const absolutePath = path.isAbsolute(asset.file_path)
      ? asset.file_path
      : path.join(process.cwd(), asset.file_path);

    if (!fs.existsSync(absolutePath)) {
      return new Response("File not found on storage", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mime_type || "application/octet-stream",
        "Content-Length": String(asset.file_size || fileBuffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Asset serving error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
