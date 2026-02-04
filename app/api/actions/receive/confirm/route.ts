import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/actions/receive/confirm?token=${encodeURIComponent(token)}`);
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
