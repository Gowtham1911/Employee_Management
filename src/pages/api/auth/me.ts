import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = verifyToken(token);
    return res.status(200).json(payload);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
