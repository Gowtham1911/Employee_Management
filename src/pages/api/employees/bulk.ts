import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";
import pool from "@/lib/mysql";
import bcrypt from "bcryptjs";
import { ResultSetHeader } from "mysql2";

function getUser(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || "");
  if (!cookies.token) return null;
  try { return verifyToken(cookies.token); } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const user = getUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  const { employees } = req.body as { employees: any[] };
  if (!Array.isArray(employees) || employees.length === 0)
    return res.status(400).json({ message: "No employee data provided" });

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const emp of employees) {
    try {
      const defaultPassword = bcrypt.hashSync("Welcome@123", 10);
      const [userResult] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (email, password, role) VALUES (?, ?, 'employee')",
        [emp.email, defaultPassword]
      );
      await pool.query(
        `INSERT INTO employees (user_id, first_name, last_name, phone, department, position, salary, hire_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userResult.insertId, emp.first_name, emp.last_name, emp.phone || null,
         emp.department || null, emp.position || null, emp.salary || null,
         emp.hire_date || null, emp.status || "active"]
      );
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${emp.email}: ${err.message}`);
    }
  }

  return res.status(200).json(results);
}
