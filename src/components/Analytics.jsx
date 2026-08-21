import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Analytics() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_summaries")
      .select("*")
      .order("summary_date", { ascending: false });

    if (!error && data) {
      setSummaries(data);
    }
    setLoading(false);
  };

  // Aggregate All-Time Stats
  const totalRevenue = summaries.reduce(
    (sum, s) => sum + Number(s.gross_sales || 0),
    0
  );
  const totalOrdersCount = summaries.reduce(
    (sum, s) => sum + Number(s.total_orders || 0),
    0
  );
  const avgOverallPrepTime = summaries.length
    ? (
        summaries.reduce(
          (sum, s) => sum + Number(s.avg_prep_time_minutes || 0),
          0
        ) / summaries.length
      ).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full p-6">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold text-stone-800">
          Store Analytics & Daily Snapshots
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historical record of closeout sales, order volume, and prep metrics.
        </p>
      </header>

      {/* Aggregate High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-800 text-white p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
            Total Revenue Recorded
          </p>
          <p className="text-3xl font-bold mt-1 text-emerald-400">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Orders Completed
          </p>
          <p className="text-3xl font-bold mt-1 text-stone-800">
            {totalOrdersCount}
          </p>
        </div>

        <div className="bg-white border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Average Prep Time
          </p>
          <p className="text-3xl font-bold mt-1 text-amber-800">
            {avgOverallPrepTime} <span className="text-sm font-normal text-gray-500">mins</span>
          </p>
        </div>
      </div>

      {/* Detailed Snapshots List */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-stone-800">Past Daily Summaries</h2>

        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading analytics history...
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center text-gray-400 italic py-8 border rounded-2xl bg-white">
            No daily closeout snapshots recorded yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {summaries.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-200 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Date
                  </span>
                  <h3 className="text-xl font-bold text-gray-800">
                    {s.summary_date}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Orders</p>
                    <p className="text-lg font-bold text-stone-800">
                      {s.total_orders}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Gross Sales</p>
                    <p className="text-lg font-bold text-emerald-700">
                      ${Number(s.gross_sales).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Avg Order</p>
                    <p className="text-lg font-bold text-stone-800">
                      ${Number(s.avg_order_value).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Avg Prep Time</p>
                    <p className="text-lg font-bold text-amber-800">
                      {Number(s.avg_prep_time_minutes).toFixed(1)} mins
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}