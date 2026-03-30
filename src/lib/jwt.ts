import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: number;
  email: string;
  role: "admin" | "employee";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
