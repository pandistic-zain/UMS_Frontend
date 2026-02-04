import { NextResponse } from "next/server";
import { decryptPayload } from "../../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function PUT(request: Request) {
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

  const id = new URL(request.url).pathname.split("/").filter(Boolean).at(-2);
  if (!id) {
    return NextResponse.json({ message: "Notification id is required" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/notifications/${id}/read`, {
    method: "PUT",
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
