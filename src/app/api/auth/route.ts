import { NextRequest, NextResponse } from "next/server";
import { generateAuthToken, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "logout") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("hermes_auth", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Login - support both JSON and form data
  let password: string | null = null;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    password = body.password;
  } else {
    const formData = await request.formData();
    password = formData.get("password") as string;
  }

  if (!password || !verifyPassword(password)) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  const token = generateAuthToken();

  if (contentType.includes("application/json")) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("hermes_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("hermes_auth", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
