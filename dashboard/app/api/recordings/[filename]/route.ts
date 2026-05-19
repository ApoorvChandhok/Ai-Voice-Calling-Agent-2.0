import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define paths relative to the root project
const DATA_DIR = path.join(process.cwd(), "..", "data");
const RECORDINGS_DIR = path.join(DATA_DIR, "recordings");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // 1. Try to serve the local recording from the python agent
  const filePath = path.join(RECORDINGS_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    const range = request.headers.get("range");

    // Support range requests for seeking
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end }) as any;

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Type": "audio/wav",
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
        },
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  }

  // 2. If not found locally, proxy it from the Vobiz API
  // Get credentials from root .env manually
  const envPath = path.join(process.cwd(), "..", ".env");
  let authId = process.env.VOBIZ_AUTH_ID;
  let authToken = process.env.VOBIZ_AUTH_TOKEN;
  
  if (fs.existsSync(envPath) && (!authId || !authToken)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const [key, ...values] = line.split("=");
      if (key === "VOBIZ_AUTH_ID") authId = values.join("=").trim().replace(/\r/g, "");
      if (key === "VOBIZ_AUTH_TOKEN") authToken = values.join("=").trim().replace(/\r/g, "");
    });
  }

  if (authId && authToken) {
    try {
      // Extract the call UUID from the filename (e.g. uuid.wav)
      const callUuid = filename.replace(/\.wav$/, "");
      const vobizMediaUrl = `https://media.vobiz.ai/v1/Account/${authId}/Recording/${callUuid}.wav`;
      
      const res = await fetch(vobizMediaUrl, {
        headers: {
          "X-Auth-ID": authId,
          "X-Auth-Token": authToken
        }
      });
      
      if (res.ok) {
        // Download the entire audio into a buffer so we can report Content-Length
        // This enables the browser to know the duration and allow seeking
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": buffer.length.toString(),
            "Accept-Ranges": "bytes",
          }
        });
      }
    } catch (e) {
      console.error("Failed to proxy recording from Vobiz", e);
    }
  }

  return new NextResponse("Recording not found locally or on Vobiz", { status: 404 });
}
