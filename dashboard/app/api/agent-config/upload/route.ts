import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    const file = formData.get("file") as File;

    if (!mode || !["inbound", "outbound"].includes(mode)) {
      return NextResponse.json({ error: "mode must be 'inbound' or 'outbound'" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Only allow text-based files
    const allowedExtensions = [".txt", ".md", ".csv", ".json"];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `File type '${ext}' not supported. Allowed: ${allowedExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // Create resources directory
    const resourceDir = path.join(DATA_DIR, "resources", mode);
    if (!fs.existsSync(resourceDir)) {
      fs.mkdirSync(resourceDir, { recursive: true });
    }

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(resourceDir, file.name);
    fs.writeFileSync(filePath, buffer);

    // Read content as text
    const textContent = buffer.toString("utf-8");

    return NextResponse.json({
      success: true,
      resource: {
        type: "file",
        name: file.name,
        value: textContent,
        path: filePath,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
