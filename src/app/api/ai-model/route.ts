import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: string;
  content: string;
};

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

async function imageUrlToInlinePart(imageUrl: string): Promise<GeminiPart> {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match?.[1] || !match[2]) {
      throw new Error("Invalid image data URL");
    }

    return {
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch image for analysis");
  }

  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "image/jpeg";

  return {
    inlineData: {
      mimeType,
      data: Buffer.from(buffer).toString("base64"),
    },
  };
}

async function buildGeminiRequest({
  messages,
  imageUrl,
}: {
  messages: ChatMessage[];
  imageUrl?: string;
}) {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const message of messages) {
    const text = message.content?.trim();
    if (!text) continue;

    if (message.role === "system") {
      systemParts.push(text);
      continue;
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text }],
    });
  }

  if (!contents.length) {
    throw new Error("No messages to send to Gemini");
  }

  if (imageUrl) {
    const lastUserIndex = contents.map((item) => item.role).lastIndexOf("user");
    if (lastUserIndex >= 0) {
      contents[lastUserIndex].parts.push(await imageUrlToInlinePart(imageUrl));
    }
  }

  return {
    ...(systemParts.length
      ? {
          systemInstruction: {
            parts: [{ text: systemParts.join("\n\n") }],
          },
        }
      : {}),
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };
}

function extractGeminiText(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const parts = parsed.candidates?.[0]?.content?.parts;
    if (!parts?.length) return "";

    return parts.map((part) => part.text ?? "").join("");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const { messages, imageUrl } = (await req.json()) as {
      messages?: ChatMessage[];
      imageUrl?: string;
    };

    if (!messages?.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    const geminiBody = await buildGeminiRequest({ messages, imageUrl });
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = "Gemini API error";

      try {
        const parsed = JSON.parse(errorBody) as {
          error?: { message?: string };
        };
        message = parsed.error?.message ?? message;
      } catch {
        if (errorBody) message = errorBody;
      }

      return NextResponse.json({ error: message }, { status: response.status });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response stream from Gemini" },
        { status: 500 },
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const payload = trimmed.slice(5).trim();
              if (!payload) continue;

              const text = extractGeminiText(payload);
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          }

          const trailing = buffer.trim();
          if (trailing.startsWith("data:")) {
            const payload = trailing.slice(5).trim();
            const text = extractGeminiText(payload);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          controller.close();
        } catch (error) {
          console.error("Gemini stream error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
