import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Award,
  AlertTriangle,
  Calendar as CalendarIcon,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
  Coffee,
} from "lucide-react";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'calendar'
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [errorMessage, setErrorMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const [rawOrders, setRawOrders] = useState([]);
  const [orderItemsMap, setOrderItemsMap] = useState({}); // Stores items grouped by order_id
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    avgPrepTimeMinutes: 0,
  });

  const [salesByDay, setSalesByDay] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [bottomItems, setBottomItems] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);

  // Calendar Specific States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setErrorMessage(null);
    setDebugInfo(null);

    try {
      let query = supabase.from("orders").select("*");

      const now = new Date();
      if (timeRange === "7d") {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      } else if (timeRange === "30d") {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        query = query.gte("created_at", d.toISOString());
      }

      const { data: orders, error: ordersError } = await query;

      if (ordersError) {
        setErrorMessage(`Supabase Error: ${ordersError.message}`);
        setLoading(false);
        return;
      }

      if (!orders || orders.length === 0) {
        setDebugInfo("No records returned from 'orders' table. Verify RLS permissions or database entries.");
        setMetrics({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, avgPrepTimeMinutes: 0 });
        setSalesByDay([]);
        setDailySummaries([]);
        setTopItems([]);
        setBottomItems([]);
        setRawOrders([]);
        setOrderItemsMap({});
        setLoading(false);
        return;
      }

      const validOrders = orders.filter((o) => (o.status ? o.status.toLowerCase() !== "cancelled" : true));
      setRawOrders(validOrders);

      const totalRevenue = validOrders.reduce((acc, curr) => {
        return acc + Number(curr.subtotal || curr.price || curr.total_amount || 0);
      }, 0);

      const totalOrders = validOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      let totalPrepMinutes = 0;
      let completedCount = 0;
      validOrders.forEach((o) => {
        if (o.completed_at && o.created_at) {
          const diffMs = new Date(o.completed_at) - new Date(o.created_at);
          const diffMins = diffMs / (1000 * 60);
          if (diffMins > 0 && diffMins < 180) {
            totalPrepMinutes += diffMins;
            completedCount++;
          }
        }
      });
      const avgPrepTimeMinutes = completedCount > 0 ? Math.round(totalPrepMinutes / completedCount) : 4;

      setMetrics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        avgPrepTimeMinutes,
      });

      const daysMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      const dateListMap = {};

      validOrders.forEach((order) => {
        const dateObj = new Date(order.created_at || Date.now());
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const dateKey = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const orderTotal = Number(order.subtotal || order.price || order.total_amount || 0);

        if (daysMap[dayName] !== undefined) {
          daysMap[dayName] += orderTotal;
        }

        if (!dateListMap[dateKey]) {
          dateListMap[dateKey] = { date: dateKey, orders: 0, sales: 0, timestamp: dateObj };
        }
        dateListMap[dateKey].orders += 1;
        dateListMap[dateKey].sales += orderTotal;
      });

      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const formattedSalesByDay = dayOrder.map((day) => ({
        day,
        sales: daysMap[day] || 0,
      }));
      setSalesByDay(formattedSalesByDay);

      const summaries = Object.values(dateListMap)
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((item) => ({
          ...item,
          avg: item.orders > 0 ? item.sales / item.orders : 0,
        }));
      setDailySummaries(summaries);

      // Fetch order_items data and map by order_id
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*");

      if (!itemsError && orderItems && orderItems.length > 0) {
        const itemCountsMap = {};
        const groupedByOrder = {};

        orderItems.forEach((oi) => {
          const itemName = oi.name || "Unknown Item";
          itemCountsMap[itemName] = (itemCountsMap[itemName] || 0) + (oi.quantity || 1);

          if (oi.order_id) {
            if (!groupedByOrder[oi.order_id]) {
              groupedByOrder[oi.order_id] = [];
            }
            groupedByOrder[oi.order_id].push(oi);
          }
        });

        setOrderItemsMap(groupedByOrder);

        const sortedItems = Object.entries(itemCountsMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        setTopItems(sortedItems.slice(0, 5));
        setBottomItems(sortedItems.length > 1 ? sortedItems.slice(-3).reverse() : []);
      }

    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred while loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  const maxSalesVal = Math.max(...salesByDay.map((d) => d.sales), 1);

  // Calendar Helper Logic
  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startingDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getOrdersForDate = (dateObj) => {
    if (!dateObj) return [];
    return rawOrders.filter((order) => {
      const oDate = new Date(order.created_at);
      return (
        oDate.getFullYear() === dateObj.getFullYear() &&
        oDate.getMonth() === dateObj.getMonth() &&
        oDate.getDate() === dateObj.getDate()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto p-3 sm:p-6 text-stone-800">
      
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Café Analytics</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time business performance, revenue, and product trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* SUB MENU SWITCHER */}
          <div className="flex items-center bg-stone-200/70 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "calendar"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar View
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchAnalyticsData}
              className="p-2 border bg-white rounded-xl hover:bg-stone-100 text-stone-600 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {activeTab === "overview" && (
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border">
                {["7d", "30d", "all"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      timeRange === range
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {range === "7d" ? "7D" : range === "30d" ? "30D" : "All"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {debugInfo && !errorMessage && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-amber-700" />
            <span>{debugInfo}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-stone-400 font-medium space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-amber-900 mb-2"></div>
          <div className="text-sm">Loading analytics breakdown...</div>
        </div>
      ) : activeTab === "overview" ? (
        /* OVERVIEW TAB */
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Revenue</span>
                <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-700 rounded-lg sm:rounded-xl">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black font-mono">
                ${metrics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400">Total gross income</p>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Orders</span>
                <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-800 rounded-lg sm:rounded-xl">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black font-mono">
                {metrics.totalOrders}
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400">Completed tickets</p>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Avg Order</span>
                <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-700 rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black font-mono">
                ${metrics.avgOrderValue.toFixed(2)}
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400">Revenue ÷ Orders</p>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Prep Time</span>
                <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-700 rounded-lg sm:rounded-xl">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black font-mono">
                ~{metrics.avgPrepTimeMinutes} <span className="text-xs font-normal text-stone-500">min</span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400">Avg fulfillment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <h2 className="text-base sm:text-lg font-bold">Sales Overview</h2>
                <p className="text-xs text-stone-400 mb-4 sm:mb-6">Daily revenue trends</p>
              </div>

              <div className="h-40 sm:h-48 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 px-1 border-b">
                {salesByDay.map((item) => {
                  const heightPercent = Math.round((item.sales / maxSalesVal) * 100);
                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${item.sales.toFixed(0)}
                      </span>
                      <div
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className="w-full max-w-[32px] bg-amber-900/90 group-hover:bg-amber-800 rounded-t-lg transition-all"
                      />
                      <span className="text-[10px] sm:text-xs font-bold text-stone-600 mt-1 sm:mt-2">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-amber-900">
                  <Award className="w-5 h-5" />
                  <h2 className="font-bold text-stone-800 text-sm sm:text-base">Most Popular Drinks</h2>
                </div>
                <div className="space-y-2">
                  {topItems.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">No drink items recorded yet.</p>
                  ) : (
                    topItems.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-stone-700 truncate pr-2">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                          {item.count} sold
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {bottomItems.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="font-bold text-[11px] uppercase tracking-wider text-stone-500">Lowest Performing</h3>
                  </div>
                  <div className="space-y-2">
                    {bottomItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs text-stone-500">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="font-mono font-bold shrink-0">{item.count} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b bg-stone-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-stone-800 text-sm sm:text-base">Daily Breakdown</h2>
                <p className="text-xs text-stone-500">Historical summary of daily transaction averages</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100/50 text-stone-500 text-[10px] sm:text-xs font-bold uppercase border-b">
                  <tr>
                    <th className="p-3 sm:p-4">Date</th>
                    <th className="p-3 sm:p-4 text-center">Orders</th>
                    <th className="p-3 sm:p-4 text-right">Sales ($)</th>
                    <th className="p-3 sm:p-4 text-right">Avg Order ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailySummaries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-stone-400 italic text-xs">
                        No historical sales entries found.
                      </td>
                    </tr>
                  ) : (
                    dailySummaries.map((row) => (
                      <tr key={row.date} className="hover:bg-stone-50/50">
                        <td className="p-3 sm:p-4 font-bold text-stone-800 whitespace-nowrap">{row.date}</td>
                        <td className="p-3 sm:p-4 text-center font-mono">{row.orders}</td>
                        <td className="p-3 sm:p-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          ${row.sales.toFixed(2)}
                        </td>
                        <td className="p-3 sm:p-4 text-right font-mono text-stone-600 whitespace-nowrap">
                          ${row.avg.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* CALENDAR SUB MENU TAB */
        <div className="bg-white rounded-2xl border shadow-sm p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between border-b pb-3 sm:pb-4">
            <h2 className="text-base sm:text-xl font-bold text-stone-800 flex items-center gap-1.5 sm:gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" />
              {currentCalendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 sm:p-2 hover:bg-stone-100 rounded-xl border text-stone-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold border rounded-xl hover:bg-stone-100 transition-colors text-stone-700"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 sm:p-2 hover:bg-stone-100 rounded-xl border text-stone-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((dayName, index) => (
              <div key={index} className="text-[10px] sm:text-xs font-bold uppercase text-stone-400 py-0.5 sm:py-1">
                {dayName}
              </div>
            ))}

            {getCalendarDays().map((dayDate, idx) => {
              if (!dayDate) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-28 bg-stone-50/40 rounded-lg sm:rounded-xl border border-dashed border-stone-100" />;
              }

              const dayOrders = getOrdersForDate(dayDate);
              const totalSales = dayOrders.reduce((sum, o) => sum + Number(o.subtotal || o.price || o.total_amount || 0), 0);
              const orderCount = dayOrders.length;
              const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;
              const isToday = new Date().toDateString() === dayDate.toDateString();

              return (
                <div
                  key={dayDate.toISOString()}
                  onClick={() => {
                    if (orderCount > 0) {
                      setSelectedDayDetails({
                        dateString: dayDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }),
                        orders: dayOrders,
                      });
                    }
                  }}
                  className={`h-20 sm:h-28 p-1 sm:p-2 rounded-lg sm:rounded-xl border text-left flex flex-col justify-between transition-all ${
                    orderCount > 0 ? "hover:border-amber-900 hover:shadow-md cursor-pointer bg-white" : "bg-stone-50/60 text-stone-400 cursor-default"
                  } ${isToday ? "ring-2 ring-amber-900 border-amber-900" : "border-stone-200"}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] sm:text-xs font-bold ${isToday ? "bg-amber-900 text-white px-1 sm:px-1.5 py-0.5 rounded-full" : "text-stone-700"}`}>
                      {dayDate.getDate()}
                    </span>
                    {orderCount > 0 && (
                      <span className="text-[8px] sm:text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-1 sm:px-1.5 py-0.5 rounded-md">
                        {orderCount}
                      </span>
                    )}
                  </div>

                  {orderCount > 0 ? (
                    <div className="space-y-0.5">
                      <div className="text-[10px] sm:text-xs font-bold font-mono text-emerald-700 leading-tight">
                        ${totalSales.toFixed(0)}
                      </div>
                      <div className="hidden sm:block text-[10px] font-mono text-stone-500">
                        Avg: ${avgOrder.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] text-stone-300 italic hidden sm:block">No orders</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED DAILY ORDERS MODAL WITH ITEM BREAKDOWN */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="font-bold text-stone-800 text-base sm:text-lg">
                  {selectedDayDetails.dateString}
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedDayDetails.orders.length} order(s) processed
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="p-1.5 hover:bg-stone-200 text-stone-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Orders List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {selectedDayDetails.orders.map((order, idx) => {
                const total = Number(order.subtotal || order.price || order.total_amount || 0);
                const orderTime = order.created_at
                  ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "N/A";

                // Check for items either in the fetched orderItemsMap or embedded JSON field
                const itemsList = orderItemsMap[order.id] || order.items || [];

                return (
                  <div key={order.id || idx} className="p-3.5 sm:p-4 border rounded-xl bg-stone-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-stone-800 text-xs sm:text-sm">
                          {order.customer_name || "Guest Customer"}
                        </span>
                        <div className="text-[11px] text-stone-400">
                          {orderTime}
                        </div>
                      </div>
                      <span className="font-bold font-mono text-emerald-700 text-sm sm:text-base">
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    {/* Itemized Breakdown List */}
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-amber-800" />
                        <span>Order Items ({itemsList.length})</span>
                      </div>

                      {itemsList.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">No item details recorded.</p>
                      ) : (
                        <ul className="divide-y divide-stone-100 text-xs">
                          {itemsList.map((item, itemIdx) => (
                            <li key={itemIdx} className="py-1.5 flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-stone-800">
                                  {item.quantity ? `${item.quantity}x ` : "1x "}
                                  {item.name || item.title || "Unknown Drink"}
                                </span>

                                {/* Drink Customization details (Milk, Sweetness, Size) */}
                                {(item.options || item.customizations) && (
                                  <p className="text-[11px] text-stone-500 font-normal">
                                    {typeof item.options === "string"
                                      ? item.options
                                      : Object.values(item.options || item.customizations).join(", ")}
                                  </p>
                                )}
                              </div>

                              {item.price && (
                                <span className="font-mono text-stone-500 text-[11px]">
                                  ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          order.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t bg-stone-50 text-right">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}