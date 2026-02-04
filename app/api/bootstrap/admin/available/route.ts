import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/api/v1/bootstrap/admin/available`, {
    method: "GET",
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
