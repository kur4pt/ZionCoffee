import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, ArrowRight } from "lucide-react";

export default function AdminOverview({ onNavigateToMenu }) {
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(14); // Options: 7, 14, 30
  const [todayStats, setTodayStats] = useState({ sales: 0, orders: 0, avg: 0 });
  const [rangeSummary, setRangeSummary] = useState({
    totalSales: 0,
    dailyAvg: 0,
    growth: 0,
    dailyList: [],
  });
  const [topItems, setTopItems] = useState([]);
  const [worstItems, setWorstItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedRange]);

  const fetchDashboardData = async () => {
    setLoading(true);

    const now = new Date();
    // Fetch up to 60 days to support 30D period comparison (30d vs prior 30d)
    const fetchWindowDays = Math.max(selectedRange * 2, 30);
    const startDate = new Date();
    startDate.setDate(now.getDate() - fetchWindowDays);

    // 1. Fetch Orders
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("id, subtotal, created_at, status")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    // 2. Fetch Order Items for Item Performance
    const { data: itemsData, error: itemsErr } = await supabase
      .from("order_items")
      .select("name, created_at")
      .gte("created_at", startDate.toISOString());

    if (!ordersErr && ordersData) {
      processSalesData(ordersData, selectedRange);
    }

    if (!itemsErr && itemsData) {
      processItemPerformance(itemsData);
    }

    setLoading(false);
  };

  const processSalesData = (orders, days) => {
    const todayStr = new Date().toISOString().split("T")[0];

    let todaySales = 0;
    let todayOrdersCount = 0;

    // Track daily sales map for fetching window
    const fetchWindowDays = days * 2;
    const salesByDay = {};

    for (let i = 0; i < fetchWindowDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split("T")[0];
      salesByDay[dayKey] = { sales: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const orderDateStr = o.created_at.split("T")[0];
      const amount = Number(o.subtotal || 0);

      // Today Stats
      if (orderDateStr === todayStr) {
        todaySales += amount;
        todayOrdersCount += 1;
      }

      // Range Map
      if (salesByDay[orderDateStr]) {
        salesByDay[orderDateStr].sales += amount;
        salesByDay[orderDateStr].orders += 1;
      }
    });

    setTodayStats({
      sales: todaySales,
      orders: todayOrdersCount,
      avg: todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0,
    });

    // Calculate Growth vs Prior Period
    const dates = Object.keys(salesByDay).sort().reverse(); // Recent first
    const currentPeriodDates = dates.slice(0, days);
    const priorPeriodDates = dates.slice(days, days * 2);

    const currentSales = currentPeriodDates.reduce(
      (acc, date) => acc + (salesByDay[date]?.sales || 0),
      0
    );
    const priorSales = priorPeriodDates.reduce(
      (acc, date) => acc + (salesByDay[date]?.sales || 0),
      0
    );

    let growth = 0;
    if (priorSales > 0) {
      growth = ((currentSales - priorSales) / priorSales) * 100;
    } else if (currentSales > 0) {
      growth = 100;
    }

    const dailyList = currentPeriodDates.map((date) => ({
      date,
      sales: salesByDay[date].sales,
      orders: salesByDay[date].orders,
    }));

    setRangeSummary({
      totalSales: currentSales,
      dailyAvg: currentSales / days,
      growth,
      dailyList,
    });
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

  const getRangeLabel = () => {
    if (selectedRange === 7) return "7-Day";
    if (selectedRange === 14) return "14-Day";
    return "30-Day (Month)";
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto text-stone-800">
      <header className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time sales performance and store insights.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-1.5 bg-white border hover:bg-stone-50 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      {/* SECTION 1: TODAY'S PERFORMANCE */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-stone-700 mb-3">Today's Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-emerald-900">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Today's Gross Sales
            </span>
            <p className="text-3xl sm:text-4xl font-bold mt-2 text-emerald-400">
              ${todayStats.sales.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border p-5 sm:p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider">
              Today's Total Orders
            </span>
            <p className="text-3xl sm:text-4xl font-bold mt-2 text-stone-800">
              {todayStats.orders}
            </p>
          </div>

          <div className="bg-white border p-5 sm:p-6 rounded-2xl shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider">
              Avg Ticket Size
            </span>
            <p className="text-3xl sm:text-4xl font-bold mt-2 text-amber-900">
              ${todayStats.avg.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: DYNAMIC TIME-RANGE REVENUE OVERVIEW */}
      <div className="bg-white border p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-800">
              Revenue Overview
            </h2>
            <p className="text-xs text-stone-400">
              Trailing performance insights and daily totals
            </p>
          </div>

          {/* Time Range Selector Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedRange(7)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRange === 7
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange(14)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRange === 14
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              14D
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange(30)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedRange === 30
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Month (30D)
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-stone-50 p-4 rounded-xl border">
            <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
              <span>{getRangeLabel()} Revenue</span>
              <DollarSign className="w-4 h-4 text-stone-400" />
            </div>
            <p className="text-2xl font-bold text-stone-800 mt-1">
              ${rangeSummary.totalSales.toFixed(2)}
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border">
            <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
              <span>Daily Average</span>
              <Calendar className="w-4 h-4 text-stone-400" />
            </div>
            <p className="text-2xl font-bold text-stone-800 mt-1">
              ${rangeSummary.dailyAvg.toFixed(2)}/day
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border">
            <div className="flex justify-between items-center text-xs text-stone-500 font-medium">
              <span>vs Prior Period Growth</span>
              {rangeSummary.growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <p
              className={`text-2xl font-bold mt-1 ${
                rangeSummary.growth >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {rangeSummary.growth >= 0 ? "+" : ""}
              {rangeSummary.growth.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: DRINK PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Best Sellers */}
        <div className="bg-white border p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-800 flex items-center justify-between">
            <span>Best Selling Drinks</span>
            <span className="text-xs font-normal text-stone-400">({getRangeLabel()})</span>
          </h2>
          <div className="space-y-2.5">
            {topItems.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No sales recorded yet.</p>
            ) : (
              topItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border text-xs sm:text-sm"
                >
                  <span className="font-bold text-stone-800">
                    {i + 1}. {item.name}
                  </span>
                  <span className="font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                    {item.count} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slowest Performers */}
        <div className="bg-white border p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-800 flex items-center justify-between">
            <span>Slowest Moving Drinks</span>
            <span className="text-xs font-normal text-stone-400">({getRangeLabel()})</span>
          </h2>
          <div className="space-y-2.5">
            {worstItems.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No sales recorded yet.</p>
            ) : (
              worstItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border text-xs sm:text-sm"
                >
                  <span className="font-bold text-stone-800">{item.name}</span>
                  <span className="font-bold bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full">
                    {item.count} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: QUICK MENU EDITOR BANNER */}
      <div className="bg-[#7c2d08] text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">Manage Menu & Pricing</h3>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
            Update drink titles, base prices, or add new seasonal menu offerings.
          </p>
        </div>
        <button
          onClick={onNavigateToMenu}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-amber-950 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-100 transition-colors shrink-0 text-xs sm:text-sm"
        >
          <span>Open Menu Editor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}