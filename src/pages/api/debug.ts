import type { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = {
    host: process.env.MYSQL_HOST || "NOT SET",
    port: process.env.MYSQL_PORT || "NOT SET",
    user: process.env.MYSQL_USER || "NOT SET",
    database: process.env.MYSQL_DATABASE || "NOT SET",
    password: process.env.MYSQL_PASSWORD ? "SET" : "NOT SET",
  };

  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ config, db: "connected" });
  } catch (err: any) {
    return res.status(500).json({ config, db: "failed", error: err.message });
  }
}
