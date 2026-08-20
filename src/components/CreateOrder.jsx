import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function CreateOrder() {
  const menuItems = [
    { id: 1, name: "Spanish Latte", price: 6.00, category: "Coffee", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&q=80" },
    { id: 2, name: "Mazapan Latte", price: 7.00, category: "Coffee" },
    { id: 3, name: "Caramel Latte", price: 7.50, category: "Coffee" },
    { id: 4, name: "Mazapan Frap", price: 5.50, category: "Frappuccino" },
    { id: 5, name: "Caramel Frap", price: 8.00, category: "Frappuccino" },
    { id: 6, name: "Mango Lemonade", price: 5.00, category: "Lemonade & Sparkling" },
    { id: 7, name: "Strawberry Lemonade", price: 5.00, category: "Lemonade & Sparkling" },
    { id: 8, name: "Sunset Lemonade", price: 3.00, category: "Lemonade & Sparkling" },
    { id: 9, name: "Mango Dragonfruit", price: 2.00, category: "Lemonade & Sparkling" },
  ];

  // Dynamic Cart State
  const [cart, setCart] = useState([]);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [temp, setTemp] = useState("Iced");
  const [milk, setMilk] = useState("Whole Milk");
  const [foam, setFoam] = useState("None");

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  // Open Modal for selected drink
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setTemp(item.category === "Coffee" ? "Iced" : "Cold");
    setMilk(item.category === "Coffee" ? "Whole Milk" : "Oat Milk");
    setFoam("None");
  };

  // Close modal reset
  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  // Add to cart function
  const handleAddToCart = () => {
    // Fixed foam price logic
    const foamPrice = foam === "Sea Salt Cold Foam" ? 1.50 : foam === "Regular Cold Foam" ? 1.00 : 0;
    const finalPrice = selectedItem.price + foamPrice;

    const cartItem = {
      id: Date.now(),
      name: selectedItem.name,
      temp,
      milk: selectedItem.category === "Coffee" ? milk : null,
      foam,
      price: finalPrice,
    };

    setCart([...cart, cartItem]);
    handleCloseModal();
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen p-6 flex flex-col bg-gray-50">
      {/* HEADER SECTION */}
      <header className="relative flex items-center justify-between pb-6 mb-6">
        <NavLink
          to="/"
          className="text-sm font-semibold tracking-wider text-gray-500 uppercase hover:text-black transition-colors"
        >
          ← Home
        </NavLink>
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
                      onClick={() => handleOpenModal(item)}
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-600 transition-all text-left flex flex-col justify-between overflow-hidden min-h-[140px]"
                    >
                      {/* Optional Image check */}
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

            {/* Cart Items List */}
            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No items added yet.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-700">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.temp} {item.milk ? `• ${item.milk}` : ""}
                      </p>
                      {item.foam !== "None" && (
                        <p className="text-xs text-amber-700 font-medium"> + {item.foam}</p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-stone-800">
                      ${item.price.toFixed(2)}
                    </span>
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
              disabled={cart.length === 0}
              className="w-full bg-black hover:bg-stone-800 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
            >
              Place Order
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
                <h3 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h3>
                <p className="text-sm text-amber-800 font-semibold">${selectedItem.price.toFixed(2)}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-black font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Temp */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
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

            {/* Option 2: Milk (only if coffee) */}
            {selectedItem.category === "Coffee" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Milk Type
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
            )}

            {/* Option 3: Foam */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Cold Foam Top-off
              </label>

              <div className="flex flex-col gap-2">
                {[
                  { label: "None", add: 0 },
                  { label: "Regular Cold Foam", add: 1.00 },
                  { label: "Sea Salt Cold Foam", add: 1.00 },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setFoam(option.label)}
                    className={`py-2 px-4 rounded-lg font-medium border text-sm flex justify-between items-center transition-all ${
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

            {/* Modal Action */}
            <div className="pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full bg-amber-800 hover:bg-amber-950 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}