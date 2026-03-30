import pool from "@/lib/mysql";
import { RowDataPacket } from "mysql2";

export interface IUser {
  id: number;
  email: string;
  password: string;
  role: "admin" | "employee";
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return (rows[0] as IUser) ?? null;
}

export async function findUserById(id: number): Promise<IUser | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, email, role FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as IUser) ?? null;
}

export async function createUser(
  email: string,
  hashedPassword: string,
  role: "admin" | "employee" = "employee"
): Promise<void> {
  await pool.query(
    "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
    [email, hashedPassword, role]
  );
}
