import { NextResponse } from "next/server";
import { decryptPayload } from "../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const getToken = async (request: Request) => {
  const cookies = request.headers.get("cookie") || "";
  const tokenCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ums_token="));
  if (!tokenCookie) {
    return null;
  }
  const sealed = tokenCookie.split("=")[1];
  const payload = await decryptPayload(sealed);
  return payload.token as string | undefined;
};

export async function GET(request: Request) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(`${BACKEND_URL}/api/v1/notifications`);
  const { searchParams } = new URL(request.url);
  ["category", "unreadOnly", "limit"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
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

export async function PUT(request: Request) {
  const token = await getToken(request);
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/notifications/read-all`, {
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
