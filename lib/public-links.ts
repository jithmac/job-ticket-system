import { randomBytes } from "node:crypto";

export function createPublicJobToken() {
  return randomBytes(24).toString("base64url");
}

export function publicJobUrl(publicToken: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  return new URL(`/customer/jobs/${publicToken}`, baseUrl).toString();
}
