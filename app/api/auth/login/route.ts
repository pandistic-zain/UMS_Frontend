import { NextResponse } from "next/server";
import { encryptPayload } from "../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const bodyJson = await request.json();
  const body = JSON.stringify(bodyJson);
  const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (contentType.includes("application/json")) {
    const nextResponse = NextResponse.json(payload, { status: response.status });
    const email = bodyJson?.email as string | undefined;
    const userId = payload?.data?.userId;
    const role = payload?.data?.role;
    const team = payload?.data?.team;
    if (response.ok && email && userId && role) {
      const pendingPayload = {
        email,
        userId,
        role,
        team
      };
      console.log("[auth][login] setting ums_pending_auth", pendingPayload);
      const pending = await encryptPayload(pendingPayload);
      nextResponse.cookies.set("ums_pending_auth", pending, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 5 * 60
      });
      if (team) {
        console.log("[auth][login] setting ums_team", { team });
        const teamSealed = await encryptPayload({ team });
        nextResponse.cookies.set("ums_team", teamSealed, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 5 * 60
        });
      }
    }
    return nextResponse;
  }
  return new NextResponse(payload as string, {
    status: response.status,
    headers: { "Content-Type": "text/plain" }
  });
}
