import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Award,
  AlertTriangle,
  Calendar,
  Database,
  RefreshCw,
} from "lucide-react";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [errorMessage, setErrorMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

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
      console.log("Supabase Orders Output:", orders, "Error:", ordersError);

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
        setLoading(false);
        return;
      }

      // Include orders even if status is null or undefined (only exclude explicitly 'cancelled')
      const validOrders = orders.filter((o) => (o.status ? o.status.toLowerCase() !== "cancelled" : true));

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

      // Fetch order_items data
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("name");
      
      console.log("Supabase Order Items Output:", orderItems, "Error:", itemsError);

      if (!itemsError && orderItems && orderItems.length > 0) {
        const itemCountsMap = {};
        orderItems.forEach((oi) => {
          const itemName = oi.name || "Unknown Item";
          itemCountsMap[itemName] = (itemCountsMap[itemName] || 0) + 1;
        });

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 text-stone-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Café Analytics</h1>
          <p className="text-sm text-stone-500">
            Real-time business performance, revenue, and product trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalyticsData}
            className="p-2 border rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-stone-500 ml-2" />
            {["7d", "30d", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  timeRange === range
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {debugInfo && !errorMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 flex-shrink-0 text-amber-700" />
            <span>{debugInfo}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-stone-400 font-medium space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-stone-300 border-t-amber-900 mb-2"></div>
          <div>Loading analytics breakdown...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-mono">
                ${metrics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-stone-400">Total gross income</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Orders Processed</span>
                <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-mono">
                {metrics.totalOrders}
              </div>
              <p className="text-xs text-stone-400">Completed order tickets</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value</span>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-mono">
                ${metrics.avgOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-stone-400">Revenue ÷ Orders calculation</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Order Efficiency</span>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-mono">
                ~{metrics.avgPrepTimeMinutes} <span className="text-sm font-normal text-stone-500">min</span>
              </div>
              <p className="text-xs text-stone-400">Avg ticket fulfillment time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[280px]">
              <div>
                <h2 className="text-lg font-bold">Sales Overview</h2>
                <p className="text-xs text-stone-400 mb-6">Daily revenue trends</p>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b">
                {salesByDay.map((item) => {
                  const heightPercent = Math.round((item.sales / maxSalesVal) * 100);
                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${item.sales.toFixed(0)}
                      </span>
                      <div
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className="w-full max-w-[36px] bg-amber-900/90 group-hover:bg-amber-800 rounded-t-lg transition-all"
                      />
                      <span className="text-xs font-bold text-stone-600 mt-2">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-amber-900">
                  <Award className="w-5 h-5" />
                  <h2 className="font-bold text-stone-800">Most Popular Drinks</h2>
                </div>
                <div className="space-y-2.5">
                  {topItems.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">No drink items recorded yet.</p>
                  ) : (
                    topItems.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-700">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md text-xs">
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
                    <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500">Lowest Performing</h3>
                  </div>
                  <div className="space-y-2">
                    {bottomItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs text-stone-500">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold">{item.count} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-stone-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-stone-800">Daily Breakdown</h2>
                <p className="text-xs text-stone-500">Historical summary of daily transaction averages</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100/50 text-stone-500 text-xs font-bold uppercase border-b">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4 text-right">Sales ($)</th>
                    <th className="p-4 text-right">Avg Order ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailySummaries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-stone-400 italic">
                        No historical sales entries found.
                      </td>
                    </tr>
                  ) : (
                    dailySummaries.map((row) => (
                      <tr key={row.date} className="hover:bg-stone-50/50">
                        <td className="p-4 font-bold text-stone-800">{row.date}</td>
                        <td className="p-4 text-center font-mono">{row.orders}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-700">
                          ${row.sales.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-mono text-stone-600">
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
      )}
    </div>
  );
}