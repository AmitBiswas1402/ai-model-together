import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import {
  bufferToDataUrl,
  getCloudinaryConfig,
  getImageKitConfig,
} from "@/lib/image-storage";

async function uploadToImageKit(buffer: Buffer, fileName: string) {
  const { publicKey, privateKey, urlEndpoint, isConfigured } =
    getImageKitConfig();
  if (!isConfigured) return null;

  const imagekit = new ImageKit({
    publicKey: publicKey!,
    privateKey: privateKey!,
    urlEndpoint: urlEndpoint!,
  });

  const result = await imagekit.upload({ file: buffer, fileName });
  return result.url;
}

async function uploadToCloudinary(buffer: Buffer) {
  const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();
  if (!isConfigured) return null;

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "ai-websites" }, (error, uploadResult) => {
        if (error || !uploadResult) reject(error ?? new Error("Upload failed"));
        else resolve(uploadResult);
      })
      .end(buffer);
  });

  return result.secure_url;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";
    const extension = file.name.split(".").pop() || "png";
    const fileName = `upload-${Date.now()}.${extension}`;

    let url: string | null = null;
    let provider: string | null = null;

    try {
      url = await uploadToImageKit(buffer, fileName);
      if (url) provider = "imagekit";
    } catch (error) {
      console.warn("ImageKit upload failed:", error);
    }

    if (!url) {
      try {
        url = await uploadToCloudinary(buffer);
        if (url) provider = "cloudinary";
      } catch (error) {
        console.warn("Cloudinary upload failed:", error);
      }
    }

    if (!url) {
      url = bufferToDataUrl(buffer, mimeType);
      provider = "local";
    }

    return NextResponse.json({
      url,
      provider,
      local: provider === "local",
      message:
        provider === "local"
          ? "Image applied locally. Configure ImageKit or Cloudinary for cloud hosting."
          : undefined,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
