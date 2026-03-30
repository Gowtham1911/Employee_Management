"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SidebarProps {
  role: "admin" | "employee";
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <p className="font-bold text-base">WorkForce</p>
        <p className="text-slate-400 text-xs mt-0.5">Employee Management System</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {role === "admin" ? (
          <>
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
              All Employees
            </Link>
            <Link href="/admin/add" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Employee
            </Link>
          </>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Profile
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold uppercase">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
