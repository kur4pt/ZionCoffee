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
    setIsMenuOpen(false); // Collapses mobile menu upon selection
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 flex flex-col md:flex-row gap-6">
      {/* Floating Rounded Sidebar Container */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-6 md:h-[calc(100vh-3rem)] z-20">
        <div className="bg-[#7c2d08] text-white rounded-2xl md:rounded-3xl p-5 shadow-lg border border-amber-900/40 flex flex-col justify-between h-full transition-all">
          <div>
            {/* Header / Mobile Toggle Bar */}
            <div className="flex items-center justify-between md:border-b md:border-amber-900/60 md:pb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black tracking-wider uppercase">
                  Admin Portal
                </h2>
              </div>

              {/* Hamburger Icon (Mobile Only) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-[#5c2105] text-amber-100 hover:text-white transition-colors border border-amber-900/50"
                aria-label="Toggle Navigation Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Navigation Options */}
            <nav
              className={`${
                isMenuOpen ? "block mt-4 pt-3 border-t border-amber-900/50" : "hidden"
              } md:block space-y-2`}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
          </div>

          {/* Lock Action & Footer */}
          <div
            className={`${
              isMenuOpen ? "block mt-4 pt-4 border-t border-amber-900/50" : "hidden"
            } md:block md:mt-6 space-y-4`}
          >
            <button
              onClick={onLock}
              className="w-full flex items-center justify-center gap-2 bg-[#3b0b02] hover:bg-[#280701] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors border border-rose-950"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>

            <div className="text-[10px] text-amber-200/50 font-mono text-center">
              Zion Coffee POS Admin v1.0
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl">
        {activeTab === "overview" && (
          <AdminOverView onNavigateToMenu={() => setActiveTab("menu")} />
        )}
        {activeTab === "menu" && <AdminMenu />}
        {activeTab === "analytics" && <AdminAnalytics />}
      </main>
    </div>
  );
}