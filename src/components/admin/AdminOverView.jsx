import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function AdminOverview({ onNavigateToMenu }) {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ sales: 0, orders: 0, avg: 0 });
  const [fourteenDaySales, setFourteenDaySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [worstItems, setWorstItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // 1. Fetch Orders from past 14 days
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("id, subtotal, created_at, status")
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // 2. Fetch Order Items from past 14 days for Item Performance
    const { data: itemsData, error: itemsErr } = await supabase
      .from("order_items")
      .select("name, created_at")
      .gte("created_at", fourteenDaysAgo.toISOString());

    if (!ordersErr && ordersData) {
      processSalesData(ordersData);
    }

    if (!itemsErr && itemsData) {
      processItemPerformance(itemsData);
    }

    setLoading(false);
  };

  const processSalesData = (orders) => {
    const todayStr = new Date().toISOString().split("T")[0];

    let todaySales = 0;
    let todayOrdersCount = 0;

    // Map for 14-day timeline
    const salesByDay = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split("T")[0];
      salesByDay[dayKey] = 0;
    }

    orders.forEach((o) => {
      const orderDateStr = o.created_at.split("T")[0];
      const amount = Number(o.subtotal || 0);

      // Aggregate Today's Metrics
      if (orderDateStr === todayStr) {
        todaySales += amount;
        todayOrdersCount += 1;
      }

      // Aggregate 14-Day Timeline
      if (salesByDay[orderDateStr] !== undefined) {
        salesByDay[orderDateStr] += amount;
      }
    });

    setTodayStats({
      sales: todaySales,
      orders: todayOrdersCount,
      avg: todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0,
    });

    const chartArray = Object.keys(salesByDay).map((date) => ({
      date: date.slice(5), // "MM-DD"
      sales: salesByDay[date],
    }));

    setFourteenDaySales(chartArray);
  };

  const processItemPerformance = (items) => {
    const itemCounts = {};

    items.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
    });

    const sorted = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length > 0) {
      setTopItems(sorted.slice(0, 3));
      setWorstItems(sorted.slice(-3).reverse());
    }
  };

  const maxChartSales = Math.max(...fourteenDaySales.map((d) => d.sales), 100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Dashboard Overview</h1>
          <p className="text-sm text-stone-500">
            Real-time sales performance and store insights.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-white border hover:bg-stone-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
            Refresh
        </button>
      </header>

      {/* SECTION 1: TODAY'S SALES */}
      <div>
        <h2 className="text-lg font-bold text-stone-700 mb-3">Today's Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-sm border border-emerald-900">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Today's Gross Sales
            </span>
            <p className="text-4xl font-bold mt-2 text-emerald-400">
              ${todayStats.sales.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border p-6 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Today's Total Orders
            </span>
            <p className="text-4xl font-bold mt-2 text-stone-800">
              {todayStats.orders}
            </p>
          </div>

          <div className="bg-white border p-6 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Avg Ticket Size
            </span>
            <p className="text-4xl font-bold mt-2 text-amber-900">
              ${todayStats.avg.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: 14-DAY SALES GRAPH */}
      <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-stone-800">
            Past 14 Days Sales Trend
          </h2>
          <span className="text-xs text-stone-400">Total revenue per day ($)</span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-stone-400">
            Loading chart data...
          </div>
        ) : (
          <div className="h-56 flex items-end gap-2 pt-8 px-2 border-b">
            {fourteenDaySales.map((item, idx) => {
              const heightPercent = (item.sales / maxChartSales) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-bold text-stone-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.sales.toFixed(0)}
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full bg-amber-800 group-hover:bg-amber-600 rounded-t-md transition-all"
                  />
                  <span className="text-[10px] text-stone-400 mt-2 rotate-45 sm:rotate-0">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: DRINK PERFORMANCE (BEST VS WORST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            Best Selling Drinks <span className="text-xs font-normal text-stone-400">(Past 14 Days)</span>
          </h2>
          <div className="space-y-3">
            {topItems.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No sales recorded yet.</p>
            ) : (
              topItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border"
                >
                  <span className="font-bold text-stone-800">{i + 1}. {item.name}</span>
                  <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                    {item.count} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Worst Performers */}
        <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            Slowest Moving Drinks <span className="text-xs font-normal text-stone-400">(Past 14 Days)</span>
          </h2>
          <div className="space-y-3">
            {worstItems.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No sales recorded yet.</p>
            ) : (
              worstItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border"
                >
                  <span className="font-bold text-stone-800">{item.name}</span>
                  <span className="text-xs font-bold bg-stone-200 text-stone-700 px-3 py-1 rounded-full">
                    {item.count} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: QUICK MENU EDITOR BANNER */}
      <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">Manage Menu & Pricing</h3>
          <p className="text-sm text-amber-200 mt-1">
            Update drink titles, base prices, or add new seasonal menu offerings.
          </p>
        </div>
        <button
          onClick={onNavigateToMenu}
          className="bg-white text-amber-950 font-bold px-6 py-3 rounded-xl hover:bg-amber-100 transition-colors shrink-0"
        >
          Open Menu Editor →
        </button>
      </div>
    </div>
  );
}