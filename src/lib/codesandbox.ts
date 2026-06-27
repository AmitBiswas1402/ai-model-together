import { compressToBase64 } from "lz-string";

type SandboxFile = {
  content: string;
  isBinary?: boolean;
};

export async function createCodeSandbox(
  files: Record<string, SandboxFile>,
): Promise<string> {
  const parameters = compressToBase64(
    JSON.stringify({
      files,
    }),
  );

  const response = await fetch(
    "https://codesandbox.io/api/v1/sandboxes/define?json=1",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `parameters=${encodeURIComponent(parameters)}`,
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText || `CodeSandbox API failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  if (!data.sandbox_id) {
    throw new Error("No sandbox ID returned from CodeSandbox");
  }

  return data.sandbox_id as string;
}
