import React, { useState } from "react";
import { Menu, X, Lock } from "lucide-react";
import AdminOverView from "./AdminOverView";
import AdminMenu from "./AdminMenu";
import AdminAnalytics from "./AdminAnalytics";

export default function AdminLayout({ onLock }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "menu", label: "Menu" },
    { id: "analytics", label: "Analytics" },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false); // Collapses menu on mobile after choosing an item
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Admin Header / Navigation Block */}
      <div className="bg-[#7c2d08] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md transition-all">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase">
              Admin Portal
            </h2>
          </div>

          {/* Hamburger Icon (Mobile Only) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 rounded-xl bg-[#5c2105] text-amber-100 hover:text-white transition-colors border border-amber-900/50"
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Collapsible Tabs Container */}
        <div
          className={`${
            isMenuOpen ? "block mt-4 pt-3 border-t border-amber-900/50" : "hidden"
          } sm:block sm:mt-4 space-y-4`}
        >
          {/* Navigation Items */}
          <nav className="flex flex-col sm:flex-row gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full sm:w-auto text-left sm:text-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-[#3e1402] text-amber-100 shadow-inner border border-amber-900/40"
                      : "text-amber-200/80 hover:text-white hover:bg-[#5c2105]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Lock Controls & Version Footer */}
          <div className="pt-2 sm:pt-4 sm:border-t sm:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={onLock}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#3b0b02] hover:bg-[#280701] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-colors border border-rose-950"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>

            <span className="text-[10px] text-amber-200/50 font-mono text-center sm:text-right">
              Zion Coffee POS Admin v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Main View Router */}
      <main>
        {activeTab === "overview" && (
          <AdminOverView onNavigateToMenu={() => setActiveTab("menu")} />
        )}
        {activeTab === "menu" && <AdminMenu />}
        {activeTab === "analytics" && <AdminAnalytics />}
      </main>
    </div>
  );
}