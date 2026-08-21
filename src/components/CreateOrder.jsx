import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ShoppingBag, ChevronUp, ChevronDown, Trash2, Edit3, X } from "lucide-react";

export default function CreateOrder() {
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [temp, setTemp] = useState("Iced");
  const [milk, setMilk] = useState("Whole Milk");
  const [foam, setFoam] = useState("None");
  const [sparklingType, setSparklingType] = useState("Regular");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoadingMenu(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("id", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.error("Error loading menu from Supabase:", err.message);
    } finally {
      setLoadingMenu(false);
    }
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  const handleOpenAddModal = (item) => {
    setSelectedItem(item);
    setEditingItemId(null);
    setTemp("Iced");
    setMilk("Whole Milk");
    setFoam("None");
    setSparklingType("Regular");
  };

  const handleOpenEditModal = (cartItem) => {
    const baseItem = menuItems.find((m) => m.name === cartItem.name);

    setSelectedItem(
      baseItem || { 
        name: cartItem.name, 
        price: cartItem.basePrice || cartItem.price, 
        category: cartItem.category || "Coffee",
        allowed_customizations: cartItem.allowed_customizations || [],
      }
    );

    setEditingItemId(cartItem.id);
    setTemp(cartItem.temp || "Iced");
    setMilk(cartItem.milk || "Whole Milk");
    setFoam(cartItem.temp === "Hot" ? "None" : cartItem.foam || "None");
    setSparklingType(cartItem.sparklingType || "Regular");
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setEditingItemId(null);
  };

  const handleSaveCartItem = () => {
    // Check dynamic customization options from Supabase array
    const allowed = selectedItem.allowed_customizations || [];
    const hasTemp = allowed.includes("temp");
    const hasMilk = allowed.includes("milk");
    const hasFoam = allowed.includes("foam");
    const hasSparkling = allowed.includes("sparklingType");

    const activeFoam = hasFoam && temp === "Iced" ? foam : "None";

    const basePrice = Number(selectedItem.price); 
    const foamPrice = activeFoam !== "None" ? 1.00 : 0;
    const finalPrice = basePrice + foamPrice;

    const payload = {
      name: selectedItem.name,
      category: selectedItem.category,
      allowed_customizations: allowed,
      temp: hasTemp ? temp : null,
      milk: hasMilk ? milk : null,
      foam: hasFoam && temp === "Iced" ? activeFoam : null,
      sparklingType: hasSparkling ? sparklingType : null,
      basePrice,
      price: parseFloat(finalPrice.toFixed(2)),
    };

    if (editingItemId) {
      setCart(
        cart.map((item) =>
          item.id === editingItemId ? { ...item, ...payload } : item
        )
      );
    } else {
      setCart([...cart, { id: Date.now(), ...payload }]);
    }
    handleCloseModal();
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || cart.length === 0) return;

    setIsSubmitting(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerName,
            subtotal: subTotal,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        name: item.name,
        category: item.category,
        price: item.price,
        customizations: {
          temp: item.temp,
          milk: item.milk,
          foam: item.foam,
          sparklingType: item.sparklingType,
        },
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setCart([]);
      setCustomerName("");
      setIsMobileCartOpen(false);
      alert("Order successfully placed!");
    } catch (error) {
      console.error("Error submitting order to Supabase:", error.message);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper check for modal customization array
  const allowedOpts = selectedItem?.allowed_customizations || [];

  return (
    <div className="min-h-screen pb-24 lg:pb-6 p-4 lg:p-6 flex flex-col bg-stone-100">

      {/* TOP MOBILE-FRIENDLY NAVBAR */}
      <header className="sticky top-0 z-30 bg-stone-100/90 backdrop-blur-md flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="text-xs lg:text-sm font-semibold tracking-wider text-stone-500 uppercase hover:text-black transition-colors cursor-pointer">
          Home
        </div>
        <h1 className="font-meddon text-2xl lg:text-4xl font-bold text-stone-800 tracking-tight">
          Zion Coffee
        </h1>
        <div className="w-8 lg:hidden flex justify-end">
          <span className="text-xs font-bold bg-amber-900 text-white px-2 py-1 rounded-full">
            {cart.length}
          </span>
        </div>
      </header>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Menu Categories & Items */}
        <div className="lg:col-span-2 space-y-6">
          {loadingMenu ? (
            <div className="text-center py-12 text-stone-500 font-semibold">
              Loading menu items...
            </div>
          ) : (
            categories.map((category) => (
              <section key={category}>
                <h2 className="text-lg lg:text-xl font-bold text-stone-800 mb-3 border-b border-stone-200 pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleOpenAddModal(item)}
                        className="group bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-amber-700 transition-all text-left flex flex-col justify-between overflow-hidden min-h-[130px]"
                      >
                        {item.image_url && (
                          <div className="w-full h-20 sm:h-24 bg-stone-100 overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        <div className="p-3 flex flex-col justify-between flex-1">
                          <span className="font-semibold text-xs sm:text-sm text-stone-800 leading-snug">
                            {item.name}
                          </span>
                          <span className="text-amber-900 font-bold mt-2 text-xs sm:text-sm">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* DESKTOP SIDEBAR CART */}
        <div className="hidden lg:flex bg-white p-6 rounded-2xl border border-stone-200 shadow-xl flex-col justify-between h-fit sticky top-20">
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-4 border-b pb-3">
              Current Order
            </h2>

            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                Customer Name
              </label>
              <input 
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 transition-all disabled:bg-stone-100" 
              />
            </div>

            {/* Cart Items List */}
            <div className="space-y-4 mb-6 max-h-[45vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-stone-400 text-sm italic">No items added yet.</p>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-start border-b border-stone-100 pb-3"
                  >
                    <div className="pr-2 flex-1">
                      <p className="font-semibold text-sm text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-500">
                        {[item.temp, item.milk, item.sparklingType].filter(Boolean).join(" • ")}
                      </p>
                      {item.foam && item.foam !== "None" && (
                        <p className="text-xs text-amber-800 font-medium">+ {item.foam}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mr-3">
                      <span className="font-bold text-sm text-stone-800">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(item)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-amber-900 hover:text-white text-stone-700 font-bold rounded-lg text-xs transition-colors"
                        title="Edit Item"
                      >
                        Edit
                      </button>

                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-800 hover:text-white text-rose-700 font-bold rounded-lg text-xs transition-colors"
                        title="Remove Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between text-lg font-bold text-stone-900">
              <span>Subtotal</span>
              <span>${subTotal.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0 || !customerName.trim() || isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full bg-stone-900 hover:bg-amber-900 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Submitting Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM DRAWER */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-2xl rounded-t-2xl transition-all duration-300">
        
        {/* Sticky Header Bar */}
        <button
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-stone-900 text-white rounded-t-2xl"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              Current Order ({cart.length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-400 text-base">
              ${subTotal.toFixed(2)}
            </span>
            {isMobileCartOpen ? (
              <ChevronDown className="w-5 h-5 text-stone-300" />
            ) : (
              <ChevronUp className="w-5 h-5 text-stone-300" />
            )}
          </div>
        </button>

        {/* Collapsible Content Area */}
        {isMobileCartOpen && (
          <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 bg-white animate-in slide-in-from-bottom duration-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                Customer Name
              </label>
              <input 
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 transition-all disabled:bg-stone-100" 
              />
            </div>

            <div className="space-y-3 max-h-[35vh] overflow-y-auto border-t border-stone-100 pt-3">
              {cart.length === 0 ? (
                <p className="text-stone-400 text-sm italic text-center py-4">No items in order yet.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-xs text-stone-800">{item.name}</p>
                      <p className="text-[11px] text-stone-500">
                        {[item.temp, item.milk, item.sparklingType].filter(Boolean).join(" • ")}
                      </p>
                      {item.foam && item.foam !== "None" && (
                        <p className="text-[11px] text-amber-800 font-semibold">+ {item.foam}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-stone-800">
                        ${item.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-stone-600 hover:text-amber-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex justify-between text-base font-bold text-stone-900">
                <span>Subtotal</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <button
                disabled={cart.length === 0 || !customerName.trim() || isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full bg-amber-900 hover:bg-amber-950 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? "Submitting Order..." : "Place Order"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC ITEM CUSTOMIZATION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-stone-800">
                  {selectedItem.name}
                </h3>
                <p className="text-xs lg:text-sm text-amber-800 font-semibold">
                  Base Price: ${Number(selectedItem.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-stone-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Default text if item requires no customizations */}
            {allowedOpts.length === 0 && (
              <p className="text-sm text-stone-500 italic py-2">
                This item is served with its signature standard recipe and does not require customization options.
              </p>
            )}

            {/* Dynamic Customization Options */}
            <div className="space-y-4">
              {/* Temperature */}
              {allowedOpts.includes("temp") && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                    Temperature
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Iced", "Hot"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setTemp(option);
                          if (option === "Hot") setFoam("None");
                        }}
                        className={`py-2 rounded-xl font-medium border text-sm transition-all ${
                          temp === option
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Milk */}
              {allowedOpts.includes("milk") && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Milk
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Whole Milk", "Oat Milk"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setMilk(option)}
                        className={`py-2 rounded-xl font-medium border text-sm transition-all ${
                          milk === option
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cold Foam (Only visible when Temp is Iced) */}
              {allowedOpts.includes("foam") && temp === "Iced" && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Cold Foam
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "None", add: 0.00 },
                      { label: "Vanilla Cold Foam", add: 1.00 },
                      { label: "Sea Salt Cold Foam", add: 1.00 },
                    ].map((option) => (
                      <button 
                        key={option.label}
                        onClick={() => setFoam(option.label)}
                        className={`py-2 px-4 rounded-xl font-medium border text-sm flex justify-between transition-all ${
                          foam === option.label
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs opacity-80">
                          {option.add > 0 ? `+$${option.add.toFixed(2)}` : "Free"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sparkling Style */}
              {allowedOpts.includes("sparklingType") && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Regular", "Sparkling"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSparklingType(option)}
                        className={`py-2 rounded-xl font-medium border text-sm transition-all ${
                          sparklingType === option
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveCartItem}
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm"
              >
                {editingItemId ? "Update Item" : "Add to Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}