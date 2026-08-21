import React, { useState } from "react";
import AdminOverview from "./AdminOverview";
import AdminMenu from "./AdminMenu";

export default function AdminLayout({ setActiveMainTab, onLogout }) {
  const [activeAdminSection, setActiveAdminSection] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "menu", label: "Menu" },
    { id: "orders", label: "Orders" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="h-screen bg-stone-100 flex flex-col md:flex-row overflow-hidden">
      {/* Sticky Sidebar */}
      <aside className="w-full md:w-52 bg-amber-900 text-stone-200 rounded-xl p-6 flex flex-col justify-between shrink-0 md:h-full sticky top-0">
        <div>
          <div className="flex items-center justify-between border-b border-amber-800 pb-4 mb-6">
            <h2 className="text-xl font-bold tracking-wider text-gray-50 uppercase">
              Admin Portal
            </h2>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveAdminSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeAdminSection === item.id
                    ? "bg-amber-950 text-white shadow-md"
                    : "text-amber-200/70 hover:text-white hover:bg-amber-800/50"
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
              onClick={onLogout}
              className="text-md bg-red-950 hover:bg-red-900 text-gray-200 px-6 py-3 rounded-lg border border-red-800 font-bold transition-colors"
            >
              Lock
            </button>
        </div>

        <div className="border-t border-amber-800 pt-2 mt-6 text-xs text-amber-200/60 text-center">
          Zion Coffee POS Admin v1.0
        </div>
      </aside>

      {/* Scrollable Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-full">
        {activeAdminSection === "overview" && (
          <AdminOverview onNavigateToMenu={() => setActiveAdminSection("menu")} />
        )}
        {activeAdminSection === "menu" && <AdminMenu />}
      </main>
    </div>
  );
}