import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize("token", "", { httpOnly: true, path: "/", maxAge: 0 })
  );
  return res.status(200).json({ message: "Logged out" });
}
