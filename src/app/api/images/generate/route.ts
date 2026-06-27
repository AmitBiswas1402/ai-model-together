import { NextRequest, NextResponse } from "next/server";
import {
  buildPollinationsImageUrl,
  getImageKitConfig,
} from "@/lib/image-storage";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const { urlEndpoint } = getImageKitConfig();
    const timestamp = Date.now();
    const safePrompt = prompt.trim().replace(/\//g, "-");

    if (urlEndpoint) {
      const base = urlEndpoint.replace(/\/$/, "");
      const fileName = `ai-${timestamp}.jpg`;
      const url = `${base}/ik-genimg-prompt-${safePrompt}/${fileName}?v=${timestamp}`;

      return NextResponse.json({ url, provider: "imagekit" });
    }

    const url = `${buildPollinationsImageUrl(prompt)}&seed=${timestamp}`;

    return NextResponse.json({
      url,
      provider: "pollinations",
      message:
        "ImageKit is not configured. Using fallback AI image generation.",
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 },
    );
  }
}
