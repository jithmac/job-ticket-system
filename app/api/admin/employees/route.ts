import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { departments, skillLevels } from "@/lib/db-data";
import type { Employee } from "@/lib/types";
import { UserRole } from "@prisma/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    await requireRole([UserRole.ADMIN]);
    const body = (await request.json()) as Partial<Employee> & { password?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const department = typeof body.department === "string" ? body.department : "";
    const skillLevel = typeof body.skillLevel === "string" ? body.skillLevel : "";
    if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || !departments.includes(department as (typeof departments)[number]) || !skillLevels.includes(skillLevel as (typeof skillLevels)[number])) {
      return NextResponse.json({ error: "Name, valid email, department, and skill level are required." }, { status: 400 });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}/.test(password)) {
      return NextResponse.json({ error: "Password must be 12+ characters with upper, lower, and numeric characters." }, { status: 400 });
    }
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: "That email is already assigned." }, { status: 409 });
    }

    let id = "";
    do {
      id = `EMP-${randomInt(100000, 1000000)}`;
    } while (await db.user.findUnique({ where: { id }, select: { id: true } }));

    const user = await db.user.create({
      data: {
        id,
        name,
        email,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        title: typeof body.title === "string" ? body.title.trim() || skillLevel : skillLevel,
        department,
        role: UserRole.EMPLOYEE,
        passwordHash: await hashPassword(password),
      },
    });
    const employee: Employee = {
      id: user.id,
      name: user.name,
      initials: user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      title: user.title ?? skillLevel,
      department: user.department ?? department,
      skillLevel,
      email: user.email,
      phone: user.phone ?? "—",
      status: "available",
      location: "HQ Dispatch",
      joinedOn: user.createdAt.toISOString().slice(0, 10),
    };
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Employee creation failed", error);
    return NextResponse.json({ error: "Unable to create employee." }, { status: 500 });
  }
}

