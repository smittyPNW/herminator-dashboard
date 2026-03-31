import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "development-only-secret-change-me";
const DEFAULT_PASSWORD = "change-me";

function makeToken(): string {
  return crypto.createHmac("sha256", SECRET).update("authenticated").digest("hex");
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("hermes_auth")?.value;
  if (!token) return false;
  return token === makeToken();
}

export function generateAuthToken(): string {
  return makeToken();
}

export function verifyPassword(password: string): boolean {
  return password === (process.env.DASHBOARD_PASSWORD || DEFAULT_PASSWORD);
}
