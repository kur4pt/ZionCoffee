import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "preparing" | "completed"
  const [loading, setLoading] = useState(true);

  // PIN & Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const MASTER_PIN = "1234";

  const formatSequentialOrderId = (order, allOrders) => {
    if (!order?.created_at) return "#0000-0000";

    const date = new Date(order.created_at);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const sortedAll = [...allOrders].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const orderIndex = sortedAll.findIndex((o) => o.id === order.id);
    const sequenceNum = String(orderIndex + 1).padStart(4, "0");

    return `#${month}${day}-${sequenceNum}`;
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const { data: items } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", payload.new.id);

            const newOrderWithItems = {
              ...payload.new,
              order_items: items || [],
            };

            setOrders((prev) => [
              ...prev.filter((o) => o.id !== payload.new.id),
              newOrderWithItems,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updatePayload = { status: newStatus };

    if (newStatus === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatePayload } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      console.error(`Error updating order status:`, error.message);
      fetchOrders();
    }
  };

  const handleCloseDay = async () => {
    if (pin !== MASTER_PIN) {
      setPinError("Invalid PIN. Please try again.");
      return;
    }

    const completedOrders = orders.filter((o) => o.status === "completed");
    if (completedOrders.length === 0) {
      alert("No completed orders to clear.");
      setIsPinModalOpen(false);
      setPin("");
      return;
    }

    const totalOrders = completedOrders.length;
    const grossSales = completedOrders.reduce(
      (sum, o) => sum + Number(o.subtotal || 0),
      0
    );
    const avgOrderValue = grossSales / totalOrders;

    const totalPrepMinutes = completedOrders.reduce((sum, o) => {
      if (!o.completed_at || !o.created_at) return sum;
      const start = new Date(o.created_at);
      const end = new Date(o.completed_at);
      const diffMinutes = (end - start) / (1000 * 60);
      return sum + Math.max(0, diffMinutes);
    }, 0);

    const avgPrepTimeMinutes = totalPrepMinutes / totalOrders;
    const todayDate = new Date().toISOString().split("T")[0];

    try {
      const { error: summaryError } = await supabase
        .from("daily_summaries")
        .upsert(
          [
            {
              summary_date: todayDate,
              total_orders: totalOrders,
              gross_sales: grossSales,
              avg_order_value: avgOrderValue,
              avg_prep_time_minutes: avgPrepTimeMinutes,
            },
          ],
          { onConflict: "summary_date" }
        );

      if (summaryError) throw summaryError;

      const completedIds = completedOrders.map((o) => o.id);
      const { error: archiveError } = await supabase
        .from("orders")
        .update({ archived: true })
        .in("id", completedIds);

      if (archiveError) throw archiveError;

      setOrders((prev) => prev.filter((o) => o.status !== "completed"));
      setIsPinModalOpen(false);
      setPin("");
      setPinError("");
      alert("Daily snapshot created and completed orders archived!");
    } catch (err) {
      console.error("Error closing day:", err.message);
      alert("Failed to close day. Check console for details.");
    }
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-center pb-6 border-b mb-6 gap-4">
        <h1 className="text-3xl font-bold text-stone-800">Barista KDS</h1>

        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "pending"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            New ({orders.filter((o) => o.status === "pending").length})
          </button>

          <button
            onClick={() => setActiveTab("preparing")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "preparing"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Preparing ({orders.filter((o) => o.status === "preparing").length})
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "completed"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Ready Orders ({orders.filter((o) => o.status === "completed").length})
          </button>
        </div>
      </header>

      {activeTab === "completed" && filteredOrders.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setIsPinModalOpen(true);
              setPinError("");
            }}
            className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
             End of Day / Clear Completed
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading active orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic">
          No {activeTab} orders at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[260px]"
            >
              <div>
                <div className="flex justify-between items-start border-b pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        {formatSequentialOrderId(order, orders)}
                      </span>
                      <h2 className="text-xl font-bold text-stone-800">
                        {order.customer_name}
                      </h2>
                    </div>
                    <span className="text-xs text-gray-400 block mt-1">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md">
                    ${Number(order.subtotal).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      {item.customizations && (
                        <p className="text-xs text-gray-500">
                          {[
                            item.customizations.temp,
                            item.customizations.milk,
                            item.customizations.foam &&
                            item.customizations.foam !== "None"
                              ? `+ ${item.customizations.foam}`
                              : null,
                            item.customizations.sparklingType,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                {order.status === "pending" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    Start Preparing →
                  </button>
                )}

                {order.status === "preparing" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "completed")}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    Mark Ready ✓
                  </button>
                )}

                {order.status === "completed" && (
                  <div className="text-center text-xs font-semibold text-emerald-800 bg-emerald-50 py-2 rounded-lg border border-emerald-200">
                    Order Picked Up / Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* END OF DAY PIN MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              End of Day Authorization
            </h3>
            <p className="text-sm text-gray-500">
              Enter manager PIN to clear completed orders and save the daily summary snapshot.
            </p>

            <input
              type="password"
              maxLength={4}
              placeholder="Enter PIN..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-2xl tracking-widest px-4 py-3 border rounded-xl font-mono focus:ring-2 focus:ring-black outline-none"
            />

            {pinError && (
              <p className="text-xs text-red-600 font-bold text-center">
                {pinError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPin("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseDay}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Confirm & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}