import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/api/v1/teams/public`, {
    method: "GET"
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!contentType.includes("application/json")) {
    return new NextResponse(payload as string, {
      status: response.status,
      headers: { "Content-Type": "text/plain" }
    });
  }
  return NextResponse.json(payload, { status: response.status });
}
