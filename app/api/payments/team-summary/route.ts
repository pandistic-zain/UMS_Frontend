import { NextResponse } from "next/server";
import { decryptPayload } from "../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const tokenCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ums_token="));
  if (!tokenCookie) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const sealed = tokenCookie.split("=")[1];
  const payload = await decryptPayload(sealed);
  const token = payload.token as string | undefined;
  if (!token) {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/payments/team-summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!contentType.includes("application/json")) {
    return new NextResponse(body as string, {
      status: response.status,
      headers: { "Content-Type": "text/plain" }
    });
  }

  return NextResponse.json(body, { status: response.status });
}
