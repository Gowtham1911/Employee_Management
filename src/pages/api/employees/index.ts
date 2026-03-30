import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/jwt";
import { getAllEmployees, getEmployeeByUserId, createEmployee } from "@/models/Employee";
import { parse } from "cookie";

function getUser(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || "");
  if (!cookies.token) return null;
  try { return verifyToken(cookies.token); } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  if (req.method === "GET") {
    if (user.role === "admin") {
      const employees = await getAllEmployees();
      return res.status(200).json(employees);
    } else {
      const employee = await getEmployeeByUserId(user.id);
      return res.status(200).json(employee ?? {});
    }
  }

  if (req.method === "POST") {
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const id = await createEmployee(req.body);
    return res.status(201).json({ id });
  }

  return res.status(405).end();
}
