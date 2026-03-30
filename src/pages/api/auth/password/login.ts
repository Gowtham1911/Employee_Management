import type { NextApiRequest, NextApiResponse } from "next";
import { findUserByEmail } from "@/models/User";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  const user = await findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.setHeader(
    "Set-Cookie",
    serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
  );

  return res.status(200).json({ role: user.role });
}
