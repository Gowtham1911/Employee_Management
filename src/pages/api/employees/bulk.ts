import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";
import pool from "@/lib/mysql";
import bcrypt from "bcryptjs";
import { ResultSetHeader } from "mysql2";
import * as XLSX from "xlsx";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

function getUser(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || "");
  if (!cookies.token) return null;
  try { return verifyToken(cookies.token); } catch { return null; }
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const user = getUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  const form = formidable({ keepExtensions: true });
  const [, files] = await form.parse(req);
  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const buffer = fs.readFileSync(file.filepath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const employees = rows.map((row) => {
    const normalized: any = {};
    for (const key of Object.keys(row)) normalized[normalizeKey(key)] = row[key];
    return normalized;
  });

  if (employees.length === 0) return res.status(400).json({ message: "No data found in file" });

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const emp of employees) {
    try {
      const defaultPassword = bcrypt.hashSync("Welcome@123", 10);
      let hireDate = emp.hire_date;
      if (hireDate instanceof Date) hireDate = hireDate.toISOString().split("T")[0];
      const [userResult] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (email, password, role) VALUES (?, ?, 'employee')",
        [emp.email, defaultPassword]
      );
      await pool.query(
        `INSERT INTO employees (user_id, first_name, last_name, phone, department, position, salary, hire_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userResult.insertId, emp.first_name, emp.last_name, emp.phone || null,
         emp.department || null, emp.position || null, emp.salary || null,
         hireDate || null, emp.status || "active"]
      );
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${emp.email}: ${err.message}`);
    }
  }

  return res.status(200).json(results);
}
