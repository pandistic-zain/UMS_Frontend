import { NextResponse } from "next/server";
import { decryptPayload } from "../../../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function PUT(
  request: Request,
  context: { params?: Promise<{ userId?: string }> | { userId?: string } }
) {
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

  const resolvedParams = await context.params;
  const idFromParams = resolvedParams?.userId;
  const idFromPath = new URL(request.url).pathname.split("/").filter(Boolean).pop();
  const userId = idFromParams ?? idFromPath;
  if (!userId || userId === "undefined") {
    return NextResponse.json({ message: "User id is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/team`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const payloadBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!contentType.includes("application/json")) {
    return new NextResponse(payloadBody as string, {
      status: response.status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(payloadBody, { status: response.status });
}
