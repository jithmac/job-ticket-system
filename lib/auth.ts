import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "apex_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function sessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex || !/^[a-f0-9]+$/i.test(expectedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function decodeSession(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & { exp?: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!parsed.id || !parsed.email || !parsed.role || !Object.values(UserRole).includes(parsed.role)) return null;
    return { id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const session = decodeSession(value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  });
  if (!user || !user.passwordHash || user.email.toLowerCase() !== session.email.toLowerCase()) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function requireRole(roles: UserRole[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export function roleForWorkspace(value: string | null) {
  if (value === "admin") return UserRole.ADMIN;
  if (value === "customer-care") return UserRole.CARE;
  return UserRole.EMPLOYEE;
}

