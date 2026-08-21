import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function CreateOrder() {
  const menuItems = [
    { id: 1, name: "Spanish Latte",         price: 6.00, category: "Coffee", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&q=80" },
    { id: 2, name: "Mazapan Latte",         price: 6.00, category: "Coffee" },
    { id: 3, name: "Caramel Latte",         price: 6.00, category: "Coffee" },
    { id: 4, name: "Mazapan Frap",          price: 6.00, category: "Frappuccino" },
    { id: 5, name: "Caramel Frap",          price: 6.00, category: "Frappuccino" },
    { id: 6, name: "Mango Lemonade",        price: 5.00, category: "Lemonade & Sparkling" },
    { id: 7, name: "Strawberry Lemonade",   price: 5.00, category: "Lemonade & Sparkling" },
    { id: 8, name: "Sunset Lemonade",       price: 5.00, category: "Lemonade & Sparkling" },
    { id: 9, name: "Mango Dragonfruit",     price: 5.00, category: "Lemonade & Sparkling" },
  ];

  // Dynamic Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [temp, setTemp] = useState("Iced");
  const [milk, setMilk] = useState("Whole Milk");
  const [foam, setFoam] = useState("None");
  const [sparklingType, setSparklingType] = useState("Regular");

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  // Open Modal to add New items
  const handleOpenAddModal = (item) => {
    setSelectedItem(item);
    setEditingItemId(null);
    setTemp("Iced");
    setMilk("Whole Milk");
    setFoam("None");
    setSparklingType("Regular");
  };

  // Open Modal to Edit Existing Item in cart
  const handleOpenEditModal = (cartItem) => {
    const baseItem = menuItems.find((m) => m.name === cartItem.name);

    setSelectedItem(
      baseItem || { 
        name: cartItem.name, 
        price: cartItem.basePrice || cartItem.price, 
        category: cartItem.category || "Coffee",
      }
    );

    setEditingItemId(cartItem.id);
    setTemp(cartItem.temp || "Iced");
    setMilk(cartItem.milk || "Whole Milk");
    setFoam(cartItem.foam || "None");
    setSparklingType(cartItem.sparklingType || "Regular");
  };

  // Close modal reset
  const handleCloseModal = () => {
    setSelectedItem(null);
    setEditingItemId(null);
  };

  // Handle Add or Update Cart Item
  const handleSaveCartItem = () => {
    const isCoffee = selectedItem.category === "Coffee";
    const isLemonade = selectedItem.category === "Lemonade & Sparkling";

    const foamPrice = foam === "Sea Salt Cold Foam" || foam === "Vanilla Cold Foam" ? 1.00 : 0;
    const basePrice = selectedItem.price;
    const finalPrice = basePrice + foamPrice;

    const payload = {
      name: selectedItem.name,
      category: selectedItem.category,
      temp: isCoffee ? temp : null,
      milk: isCoffee ? milk : null,
      foam: isCoffee ? foam : null,
      sparklingType: isLemonade ? sparklingType : null,
      basePrice,
      price: finalPrice,
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

  // SUPABASE ORDER SUBMISSION HANDLER
  const handlePlaceOrder = async () => {
    if (!customerName.trim() || cart.length === 0) return;

    setIsSubmitting(true);

    try {
      // 1. Insert Parent Order into `orders` table
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

      // 2. Format Items for `order_items` table
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

      // 3. Insert Items linked to order_id
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 4. Reset Cart and Input Form
      setCart([]);
      setCustomerName("");
      alert("Order successfully placed!");
    } catch (error) {
      console.error("Error submitting order to Supabase:", error.message);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col bg-gray-50">

      {/* HEADER SECTION */}
      <header className="relative flex items-center justify-between pb-6 mb-6">
        <div className="text-sm font-semibold tracking-wider text-gray-500 uppercase hover:text-black transition-colors cursor-pointer">
          Home
        </div>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-meddon text-4xl font-bold text-stone-800">
          Zion Coffee
        </h1>
        <div />
      </header>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Menu Categories & Items */}
        <div className="lg:col-span-2 space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-xl font-bold text-stone-800 mb-4 border-b pb-2">
                {category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleOpenAddModal(item)}
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-600 transition-all text-left flex flex-col justify-between overflow-hidden min-h-[140px]"
                    >
                      {item.image && (
                        <div className="w-full h-24 bg-gray-100 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <span className="text-amber-800 font-bold mt-2">${item.price.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT COLUMN: Current Order Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex flex-col justify-between h-fit sticky top-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-4 border-b pb-3">
              Current Order
            </h2>

            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Customer Name
              </label>
              <input 
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all disabled:bg-gray-100" 
              />
            </div>

            {/* Cart Items List */}
            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No items added yet.</p>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-start border-b border-gray-100 pb-3"
                  >
                    <div className="pr-2 flex-1">
                      <p className="font-semibold text-sm text-gray-700">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.temp ? `${item.temp} ` : ""}
                        {item.milk ? `• ${item.milk} ` : ""}
                        {item.sparklingType ? `• ${item.sparklingType}` : ""}
                      </p>
                      {item.foam && item.foam !== "None" && (
                        <p className="text-xs text-amber-700 font-medium">+ {item.foam}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mr-3">
                      <span className="font-bold text-sm text-stone-800">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(item)}
                        disabled={isSubmitting}
                        className="px-3 bg-gray-200 hover:bg-amber-800 hover:text-white disabled:opacity-50 text-gray-700 font-bold py-1 rounded-lg text-xs transition-colors shadow-sm"
                        title="Edit Item"
                      >
                        Edit
                      </button>

                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        disabled={isSubmitting}
                        className="px-3 bg-red-100 hover:bg-red-800 hover:text-white disabled:opacity-50 text-red-700 font-bold py-1 rounded-lg text-xs transition-colors shadow-sm"
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

          {/* Checkout Footer */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Subtotal</span>
              <span>${subTotal.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0 || !customerName.trim() || isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full bg-black hover:bg-amber-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Submitting Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FOR ITEM CUSTOMIZATION */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedItem.name}
                </h3>
                <p className="text-sm text-amber-800 font-semibold">
                  ${selectedItem.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-black font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Frap */}
            {selectedItem.category === "Frappuccino" && (
              <p className="text-sm text-gray-500 italic py-2">
                This item is served blended with its signature standard recipe and does not require customization options.
              </p>
            )}

            {/* Lemonade & Sparkling */}
            {selectedItem.category === "Lemonade & Sparkling" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Regular", "Sparkling"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setSparklingType(option)}
                      className={`py-2 rounded-lg font-medium border text-sm transition-all ${
                        sparklingType === option
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coffee Customizations */}
            {selectedItem.category === "Coffee" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-2">
                    Temperature
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Iced", "Hot"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setTemp(option)}
                        className={`py-2 rounded-lg font-medium border text-sm transition-all ${
                          temp === option
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Milk
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Whole Milk", "Oat Milk"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setMilk(option)}
                        className={`py-2 rounded-lg font-medium border text-sm transition-all ${
                          milk === option
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
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
                        className={`py-2 px-4 rounded-lg font-medium border text-sm flex justify-between transition-all ${
                          foam === option.label
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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
              </>
            )}

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                onClick={handleSaveCartItem}
                className="w-full bg-amber-800 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
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