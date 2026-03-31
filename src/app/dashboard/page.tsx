"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { IEmployee } from "@/types/employee";
import { apiFetch } from "@/lib/api";

interface Me { id: number; email: string; role: "admin" | "employee" }

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 sm:w-40">{label}</span>
      <span className="text-sm text-gray-900 mt-0.5 sm:mt-0">{value ?? "—"}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await apiFetch("/api/auth/me");
      if (!meRes.ok) return router.push("/login");
      const meData: Me = await meRes.json();
      if (meData.role === "admin") return router.push("/admin");
      setMe(meData);
      const empRes = await apiFetch("/api/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(Object.keys(empData).length ? empData : null);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="employee" userName={me?.email ?? ""} />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal and employment details</p>
        </div>

        {!employee ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-gray-500 font-medium">No profile found</p>
            <p className="text-gray-400 text-sm mt-1">Contact your admin to set up your employee profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4">
                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h2>
              <p className="text-blue-600 font-medium text-sm mt-1">{employee.position}</p>
              <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${employee.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </span>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Employment Details</h3>
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Department" value={employee.department} />
              <InfoRow label="Position" value={employee.position} />
              <InfoRow label="Hire Date" value={new Date(employee.hire_date).toLocaleDateString()} />
              <InfoRow label="Salary" value={`$${Number(employee.salary).toLocaleString()}`} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
