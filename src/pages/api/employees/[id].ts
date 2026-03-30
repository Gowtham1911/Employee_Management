import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/jwt";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/models/Employee";
import { parse } from "cookie";

function getUser(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || "");
  if (!cookies.token) return null;
  try { return verifyToken(cookies.token); } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

  if (req.method === "GET") {
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const employee = await getEmployeeById(id);
    if (!employee) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(employee);
  }

  if (req.method === "PUT") {
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    await updateEmployee(id, req.body);
    return res.status(200).json({ message: "Updated successfully" });
  }

  if (req.method === "DELETE") {
    if (user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    await deleteEmployee(id);
    return res.status(200).json({ message: "Deleted successfully" });
  }

  return res.status(405).end();
}
