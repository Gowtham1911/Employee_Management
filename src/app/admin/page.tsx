"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { IEmployee } from "@/types/employee";
import { apiFetch, apiFetchFormData } from "@/lib/api";
import * as XLSX from "xlsx";

interface Me { id: number; email: string; role: "admin" | "employee" }

const DEPARTMENTS = ["All", "Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];
const FORM_DEPARTMENTS = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];

const emptyForm = {
  first_name: "", last_name: "", email: "", phone: "",
  department: FORM_DEPARTMENTS[0], position: "",
  salary: "", hire_date: "", status: "active" as "active" | "inactive",
  password: "",
};

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const tab = (searchParams.get("tab") ?? "overview") as "overview" | "add";

  // Overview state
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [filtered, setFiltered] = useState<IEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Add Employee state
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const meRes = await apiFetch("/api/auth/me");
      if (!meRes.ok) return router.push("/login");
      const meData: Me = await meRes.json();
      if (meData.role !== "admin") return router.push("/dashboard");
      setMe(meData);
      const empRes = await apiFetch("/api/employees");
      if (empRes.ok) { const d = await empRes.json(); setEmployees(d); setFiltered(d); }
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
    await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    // Step 1: register user account
    const regRes = await apiFetch("/api/auth/password/register", {
      method: "POST",
      body: JSON.stringify({ email: form.email, password: form.password, role: "employee" }),
    });
    if (!regRes.ok) {
      const err = await regRes.json();
      setSubmitting(false);
      return setFormError(err.message || "Failed to create user account");
    }

    // Step 2: get the new user's ID
    const userRes = await apiFetch(`/api/auth/user-by-email?email=${encodeURIComponent(form.email)}`);
    let userId: number | null = null;
    if (userRes.ok) {
      const u = await userRes.json();
      userId = u.id;
    }

    if (!userId) {
      // fallback: fetch all employees and find by email after creation attempt
      setFormError("User created but could not retrieve user ID. Please add employee manually.");
      setSubmitting(false);
      return;
    }

    // Step 3: create employee profile
    const res = await apiFetch("/api/employees", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        department: form.department,
        position: form.position,
        salary: Number(form.salary),
        hire_date: form.hire_date,
        status: form.status,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) return setFormError(data.message || "Failed to add employee");
    setFormSuccess("Employee added successfully!");
    setForm({ ...emptyForm });
    const empRes = await apiFetch("/api/employees");
    if (empRes.ok) { const d = await empRes.json(); setEmployees(d); setFiltered(d); }
  }

  function handleExcelImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      if (rows.length === 0) return;
      const row = rows[0];
      setForm({
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        email: row.email || "",
        phone: String(row.phone || ""),
        department: row.department || FORM_DEPARTMENTS[0],
        position: row.position || "",
        salary: row.salary ? String(row.salary) : "",
        hire_date: row.hire_date ? String(row.hire_date) : "",
        status: row.status === "inactive" ? "inactive" : "active",
        password: row.password || "",
      });
      setFormSuccess("Excel data loaded into form. Review and submit.");
    };
    reader.readAsBinaryString(file);
  }

  async function handleBulkImport(file: File) {
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetchFormData("/api/employees/bulk", formData);
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      setFormError(`Import failed: ${data.message || "Unknown error"}`);
    } else {
      setFormSuccess(`Import complete! Success: ${data.success}, Failed: ${data.failed}`);
      const empRes = await apiFetch("/api/employees");
      if (empRes.ok) { const d = await empRes.json(); setEmployees(d); setFiltered(d); }
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) handleExcelImport(file);
    else setFormError("Please drop an Excel file (.xlsx or .xls)");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleExcelImport(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["first_name", "last_name", "email", "phone", "department", "position", "salary", "hire_date", "status", "password"],
      ["John", "Doe", "john@company.com", "9876543210", "Engineering", "Developer", "60000", "2024-01-15", "active", "Welcome@123"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees_template.xlsx");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const active = employees.filter((e) => e.status === "active").length;
  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" userName={me?.email ?? ""} />
      <main className="flex-1 p-8 overflow-auto">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                <p className="text-gray-500 text-sm mt-1">{employees.length} total · {active} active</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Employees", value: employees.length, color: "text-blue-700" },
                { label: "Active", value: active, color: "text-green-700" },
                { label: "Inactive", value: employees.length - active, color: "text-red-700" },
                { label: "Departments", value: new Set(employees.map((e) => e.department)).size, color: "text-purple-700" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by name, email, position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                />
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Employee", "Department", "Position", "Salary", "Hire Date", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
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
                        <td className="px-6 py-4 text-gray-600">₹{Number(emp.salary).toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-gray-600">{new Date(emp.hire_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/edit/${emp.id}`} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">Edit</Link>
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
          </>
        )}

        {/* ── ADD EMPLOYEE TAB ── */}
        {tab === "add" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
              <p className="text-gray-500 text-sm mt-1">Import from Excel to auto-fill the form, or fill manually</p>
            </div>

            {/* Excel Import */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"}`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              <div className="flex flex-col items-center gap-2">
                <svg className={`w-10 h-10 ${dragOver ? "text-blue-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700">{dragOver ? "Drop your Excel file here" : "Drag & drop Excel file to auto-fill form, or click to browse"}</p>
                <p className="text-xs text-gray-400">.xlsx or .xls</p>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Template
              </button>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-2xl">
              {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{formError}</p>}
              {formSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg mb-4">{formSuccess}</p>}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input className={inputClass} value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input className={inputClass} value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input className={inputClass} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Department</label>
                    <select className={inputClass} value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
                      {FORM_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Position</label>
                    <input className={inputClass} value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Salary (₹)</label>
                    <input type="number" min={0} className={inputClass} value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Hire Date</label>
                    <input type="date" className={inputClass} value={form.hire_date} onChange={(e) => setForm((p) => ({ ...p, hire_date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <input type="password" className={inputClass} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required placeholder="Initial password" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60 text-sm"
                >
                  {submitting ? "Adding..." : "Add Employee"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
