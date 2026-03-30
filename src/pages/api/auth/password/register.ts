import type { NextApiRequest, NextApiResponse } from "next";
import { findUserByEmail, createUser } from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const existing = await findUserByEmail(email);
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  await createUser(email, hashedPassword, role === "admin" ? "admin" : "employee");

  return res.status(201).json({ message: "Account created successfully" });
}
