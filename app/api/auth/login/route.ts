import { NextResponse } from "next/server";
import { createSession, roleForWorkspace, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown; workspace?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const workspace = typeof body.workspace === "string" ? body.workspace : "employee";
    if (!emailPattern.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true, passwordHash: true } });
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid || user.role !== roleForWorkspace(workspace)) {
      return NextResponse.json({ error: "Invalid credentials or workspace access." }, { status: 401 });
    }

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    const destinations = { admin: "/admin", employee: "/employee", "customer-care": "/customer-care" };
    return NextResponse.json({ destination: destinations[workspace as keyof typeof destinations] ?? "/employee" });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}

