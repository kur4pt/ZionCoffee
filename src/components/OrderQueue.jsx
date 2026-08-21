import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"
  const [loading, setLoading] = useState(true);

  // Initial Fetch & Realtime Subscription setup
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Fetch items for the new order
            const { data: items } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", payload.new.id);

            const newOrderWithItems = { ...payload.new, order_items: items || [] };
            setOrders((prev) => [newOrderWithItems, ...prev]);
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
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const markOrderCompleted = async (orderId) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error.message);
    }
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col">
      <header className="flex justify-between items-center pb-6 border-b mb-6">
        <h1 className="text-3xl font-bold text-stone-800">Barista KDS</h1>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "pending"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Active Queue ({orders.filter((o) => o.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "completed"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Completed
          </button>
        </div>
      </header>

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
                    <h2 className="text-xl font-bold text-stone-800">
                      {order.customer_name}
                    </h2>
                    <span className="text-xs text-gray-400">
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

                {/* Items listing */}
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      {item.customizations && (
                        <p className="text-xs text-gray-500">
                          {[
                            item.customizations.temp,
                            item.customizations.milk,
                            item.customizations.foam && item.customizations.foam !== "None"
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

              {/* Action Button */}
              {order.status === "pending" && (
                <button
                  onClick={() => markOrderCompleted(order.id)}
                  className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Mark Complete ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}