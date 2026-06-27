export function getImageKitConfig() {
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint =
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  return {
    publicKey,
    privateKey,
    urlEndpoint,
    isConfigured: Boolean(publicKey && privateKey && urlEndpoint),
  };
}

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured: Boolean(cloudName && apiKey && apiSecret),
  };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function buildPollinationsImageUrl(prompt: string) {
  const encoded = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true`;
}
