import { NextResponse } from "next/server";
import { decryptPayload, encryptPayload } from "../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const body = await request.json();
  const cookies = request.headers.get("cookie") || "";
  const pendingCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ums_pending_auth="));
  if (!pendingCookie) {
    return NextResponse.json({ message: "OTP session expired" }, { status: 400 });
  }
  const pendingToken = pendingCookie.split("=")[1];
  const pending = await decryptPayload(pendingToken);
  const email = pending.email as string | undefined;
  if (!email) {
    return NextResponse.json({ message: "OTP session invalid" }, { status: 400 });
  }

  const backendBody = JSON.stringify({
    email,
    code: String(body?.code ?? "")
  });
  const response = await fetch(`${BACKEND_URL}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: backendBody
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

  const nextResponse = NextResponse.json(payload, { status: response.status });
  const token = payload?.data?.token ?? payload?.token;
  if (response.ok && token) {
    console.log("[auth][verify] setting ums_token", { token });
    const sealed = await encryptPayload({ token });
    nextResponse.cookies.set("ums_token", sealed, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 20 * 60
    });
    const team = payload?.data?.team ?? payload?.team;
    if (team) {
      console.log("[auth][verify] setting ums_team", { team });
      const teamSealed = await encryptPayload({ team });
      nextResponse.cookies.set("ums_team", teamSealed, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 20 * 60
      });
    }
    nextResponse.cookies.set("ums_pending_auth", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  }
  return nextResponse;
}
