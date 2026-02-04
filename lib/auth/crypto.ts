const encoder = new TextEncoder();

function getKey() {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error("AUTH_COOKIE_SECRET is not set");
  }
  return encoder.encode(secret);
}

export async function encryptPayload(payload: Record<string, unknown>) {
  const { EncryptJWT } = await import("jose");
  const key = getKey();
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(key);
}

export async function decryptPayload(token: string) {
  const { jwtDecrypt } = await import("jose");
  const key = getKey();
  const { payload } = await jwtDecrypt(token, key);
  return payload;
}
