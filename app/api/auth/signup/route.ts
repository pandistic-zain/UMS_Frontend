import { NextResponse } from "next/server";
import { encryptPayload } from "../../../../lib/auth/crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const body = await request.formData();
  const formData = new FormData();
  for (const [key, value] of body.entries()) {
    formData.append(key, value);
  }
  const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
    method: "POST",
    body: formData
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (contentType.includes("application/json")) {
    const nextResponse = NextResponse.json(payload, { status: response.status });
    const email = payload?.data?.email;
    const teamCode = body.get("teamCode");
    if (response.ok && email) {
      const pendingPayload = {
        email,
        teamCode: typeof teamCode === "string" ? teamCode : undefined
      };
      console.log("[auth][signup] setting ums_pending_auth", pendingPayload);
      const pending = await encryptPayload(pendingPayload);
      nextResponse.cookies.set("ums_pending_auth", pending, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 5 * 60
      });
      if (typeof teamCode === "string" && teamCode) {
        console.log("[auth][signup] setting ums_team", { team: { code: teamCode } });
        const teamSealed = await encryptPayload({ team: { code: teamCode } });
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
