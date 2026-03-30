"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { IEmployee } from "@/models/Employee";

interface Me { id: number; email: string; role: "admin" | "employee" }

const DEPARTMENTS = ["All", "Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [filtered, setFiltered] = useState<IEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) return router.push("/login");
      const meData: Me = await meRes.json();
      if (meData.role !== "admin") return router.push("/dashboard");
      setMe(meData);
      const empRes = await fetch("/api/employees");
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
        setFiltered(data);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    let result = employees;
    if (dept !== "All") result = result.filter((e) => e.department === dept);
    if (search) result = result.filter((e) =>
      `${e.first_name} ${e.last_name} ${e.email} ${e.position}`.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, dept, employees]);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    setDeleting(id);
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const active = employees.filter((e) => e.status === "active").length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" userName={me?.email ?? ""} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-500 text-sm mt-1">{employees.length} total · {active} active</p>
          </div>
          <Link href="/admin/add" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Employee
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Employees", value: employees.length, color: "bg-blue-50 text-blue-700" },
            { label: "Active", value: active, color: "bg-green-50 text-green-700" },
            { label: "Inactive", value: employees.length - active, color: "bg-red-50 text-red-700" },
            { label: "Departments", value: new Set(employees.map((e) => e.department)).size, color: "bg-purple-50 text-purple-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, email, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hire Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No employees found</td></tr>
                ) : filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                          {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                          <p className="text-gray-400 text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.position}</td>
                    <td className="px-6 py-4 text-gray-600">${Number(emp.salary).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(emp.hire_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/edit/${emp.id}`} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deleting === emp.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          {deleting === emp.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
