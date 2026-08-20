import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function CreateOrder() {
  const menuItems = [
    { id: 1, name: "Spanish Latte",         price: 6.00, category: "Coffee", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300&q=80"},
    { id: 2, name: "Mazapan Latte",         price: 7.00, category: "Coffee" },
    { id: 3, name: "Caramel Latte",         price: 7.50, category: "Coffee" },
    { id: 4, name: "Mazapan Frap",          price: 5.50, category: "Frappuccino" },
    { id: 5, name: "Caramel Frap",          price: 8.00, category: "Frappuccino" },
    { id: 6, name: "Mango Lemonade",        price: 5.00, category: "Lemonade & Sparkling" },
    { id: 7, name: "Strawberry Lemonade",   price: 5.00, category: "Lemonade & Sparkling" },
    { id: 8, name: "Sunset Lemonade",       price: 3.00, category: "Lemonade & Sparkling" },
    { id: 9, name: "Mango Dragonfruit",     price: 2.00, category: "Lemonade & Sparkling" },
  ];

  // Example hardcoded cart items (you can wire this to dynamic state)
  const cart = [
    { name: "Spanish Latte", qty: 2, price: 12.00 },
    { name: "Mango Lemonade", qty: 1, price: 5.00 },
  ];

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  return (
    <div className="min-h-screen p-6 flex flex-col">
        
      {/* HEADER SECTION */}
      <header className="relative flex items-center justify-between pb-6 mb-6">
        <NavLink
          to="/"
          className="text-sm font-semibold tracking-wider text-gray-500 uppercase hover:text-black transition-colors"
        >
        
        </NavLink>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-meddon text-4xl font-bold text-stone-800">
          Zion Coffee
        </h1>
        <div /> {/* Spacer for flex balance */}
      </header>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Menu Categories & Items (Takes 2/3 space) */}
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
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-600 transition-all text-left flex flex-col justify-between h-28"
                    >
                        {/* Item optional Image */}
                        <div className="w-full h-28 bg-gray-100 overflow-hidden">
                            <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                            />
                        </div>
                        <div className="p-3 flex flex-col justify-between flex-1">
                            <span className="font-semibold text-gray-800">{item.name}</span>
                            <span className="text-amber-800 font-bold">${item.price.toFixed(2)}</span>
                        </div>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* RIGHT COLUMN: Current Order Sidebar (Takes 1/3 space) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex flex-col justify-between h-fit sticky top-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-4 border-b pb-3">
              Current Order
            </h2>
            
            {/* Cart Items List */}
            <div className="space-y-3 mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-medium text-gray-700">
                  <span>{item.qty}x {item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Footer */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Subtotal</span>
              <span>$17.00</span>
            </div>
            <button className="w-full bg-black hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
              Place Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}