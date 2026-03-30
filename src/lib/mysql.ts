import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "gondola.proxy.rlwy.net",
  port: Number(process.env.MYSQL_PORT) || 57160,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "djQLqFaBWnMdoRMYVphnzcnHQjNrcesx",
  database: process.env.MYSQL_DATABASE || "railway",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
