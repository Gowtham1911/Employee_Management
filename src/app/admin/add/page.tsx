"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import EmployeeForm, { EmployeeFormData } from "@/components/EmployeeForm";
import { useEffect, useState } from "react";

interface Me { id: number; email: string; role: "admin" | "employee" }

export default function AddEmployeePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) return router.push("/login");
      r.json().then((d: Me) => {
        if (d.role !== "admin") return router.push("/dashboard");
        setMe(d);
      });
    });
  }, [router]);

  async function handleSubmit(data: EmployeeFormData) {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    router.push("/admin");
  }

  if (!me) return (
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
            <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
            <p className="text-gray-500 text-sm">Create a new employee profile</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-2xl">
          <EmployeeForm onSubmit={handleSubmit} submitLabel="Add Employee" />
        </div>
      </main>
    </div>
  );
}
