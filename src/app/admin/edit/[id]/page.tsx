"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import EmployeeForm, { EmployeeFormData } from "@/components/EmployeeForm";
import { IEmployee } from "@/models/Employee";

interface Me { id: number; email: string; role: "admin" | "employee" }

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [me, setMe] = useState<Me | null>(null);
  const [employee, setEmployee] = useState<IEmployee | null>(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) return router.push("/login");
      const meData: Me = await meRes.json();
      if (meData.role !== "admin") return router.push("/dashboard");
      setMe(meData);
      const empRes = await fetch(`/api/employees/${id}`);
      if (!empRes.ok) return router.push("/admin");
      setEmployee(await empRes.json());
    }
    load();
  }, [router, id]);

  async function handleSubmit(data: EmployeeFormData) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    router.push("/admin");
  }

  if (!me || !employee) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" userName={me.email} />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
            <p className="text-gray-500 text-sm">{employee.first_name} {employee.last_name}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-2xl">
          <EmployeeForm initial={employee} onSubmit={handleSubmit} submitLabel="Save Changes" />
        </div>
      </main>
    </div>
  );
}
