import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([
    "Coffee",
    "Lemonade & Sparkling",
    "Frappuccino",
  ]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Coffee");
  const [newItemImage, setNewItemImage] = useState(null);
  const [newItemImagePreview, setNewItemImagePreview] = useState("");

  // Customizations Form State
  const [customizations, setCustomizations] = useState({
    temp: false,
    milk: false,
    foam: false,
    sparklingType: false,
  });

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setMenuItems(data);

      const existingCats = Array.from(
        new Set(data.map((item) => item.category).filter(Boolean))
      );
      if (existingCats.length > 0) {
        setCategories((prev) =>
          Array.from(new Set([...prev, ...existingCats]))
        );
      }
    }
    setLoading(false);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItemImage(file);
      setNewItemImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCardImageUpload = async (itemId, file) => {
    if (!file) return;

    try {
      const base64Image = await convertFileToBase64(file);

      const { error } = await supabase
        .from("menu_items")
        .update({ image_url: base64Image })
        .eq("id", Number(itemId));

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, image_url: base64Image } : item
        )
      );
    } catch (err) {
      console.error("Failed to update image:", err.message);
      alert("Failed to save image.");
    }
  };

  const handleUpdatePrice = async (itemId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice)) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ price: parsedPrice })
        .eq("id", Number(itemId));

      if (error) {
        console.error("Supabase Error Details:", error.details || error.message);
        alert(`Update failed: ${error.message}`);
        return;
      }

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, price: parsedPrice } : item
        )
      );
    } catch (err) {
      console.error("Failed to update menu item:", err.message);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentStatus })
        .eq("id", Number(itemId));

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      );
    } catch (err) {
      console.error("Failed to update availability:", err.message);
    }
  };

  const handleRemoveMenuItem = async (itemId, itemName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${itemName}" from the menu?`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", Number(itemId));

      if (error) throw error;

      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err.message);
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const handleSaveNewCategory = (e) => {
    e.preventDefault();
    const trimmed = customCategory.trim();
    if (!trimmed) return;

    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setNewItemCategory(trimmed);
    setCustomCategory("");
    setIsAddingCategory(false);
  };

  const handleCustomizationToggle = (key) => {
    setCustomizations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    const price = parseFloat(newItemPrice);
    let imageUrl = null;

    if (newItemImage) {
      imageUrl = await convertFileToBase64(newItemImage);
    }

    const allowedCustomizations = Object.keys(customizations).filter(
      (key) => customizations[key]
    );

    const { data, error } = await supabase
      .from("menu_items")
      .insert([
        {
          name: newItemName.trim(),
          price: price,
          category: newItemCategory,
          image_url: imageUrl,
          is_available: true,
          allowed_customizations: allowedCustomizations,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding item:", error.message);
      alert(`Failed to add item: ${error.message}`);
      return;
    }

    if (data) {
      setMenuItems((prev) => [...prev, ...data]);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemImage(null);
      setNewItemImagePreview("");
      setCustomizations({
        temp: false,
        milk: false,
        foam: false,
        sparklingType: false,
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto p-3 sm:p-6 text-stone-800">
      <header className="border-b pb-3 sm:pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Menu & Price Management</h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Manage categories, upload photos, set pricing, or delete items from your menu.
        </p>
      </header>

      {/* Add New Item Form Card */}
      <form
        onSubmit={handleAddMenuItem}
        className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 sm:space-y-6"
      >
        <h2 className="text-base sm:text-lg font-bold">Add New Drink</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-stone-600 uppercase mb-1">
              Drink Name
            </label>
            <input
              type="text"
              placeholder="e.g. Vanilla Cold Brew"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-900 outline-none text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] sm:text-xs font-bold text-stone-600 uppercase">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[10px] sm:text-xs font-bold text-amber-900 hover:underline"
              >
                {isAddingCategory ? "Cancel" : "+ Add Category"}
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="New Category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-900 outline-none text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  className="bg-amber-900 text-white font-bold px-3 py-2 rounded-xl text-xs shrink-0"
                >
                  Save
                </button>
              </div>
            ) : (
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-900 outline-none bg-white text-xs sm:text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-stone-600 uppercase mb-1">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="5.50"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-900 outline-none text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-stone-600 uppercase mb-1">
              Drink Photo
            </label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors text-xs sm:text-sm text-stone-600 font-medium">
              <span className="truncate">{newItemImage ? "✓ Photo Selected" : "Choose Image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Customization Options Selection */}
        <div className="pt-2 border-t">
          <label className="block text-[10px] sm:text-xs font-bold text-stone-600 uppercase mb-2">
            Allowed Customizations
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { id: "temp", label: "Temperature (Iced/Hot)" },
              { id: "milk", label: "Milk Options" },
              { id: "foam", label: "Cold Foam Options" },
              { id: "sparklingType", label: "Sparkling Style" },
            ].map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 p-2 sm:p-2.5 border rounded-xl text-xs font-medium text-stone-700 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={customizations[opt.id]}
                  onChange={() => handleCustomizationToggle(opt.id)}
                  className="rounded border-stone-300 text-amber-900 focus:ring-amber-900"
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {newItemImagePreview && (
          <div className="flex items-center gap-3 pt-2">
            <img
              src={newItemImagePreview}
              alt="Preview"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border"
            />
            <span className="text-xs text-stone-500">Ready to save on submit</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto bg-amber-900 hover:bg-amber-800 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-xs sm:text-sm"
          >
            + Add Drink
          </button>
        </div>
      </form>

      {/* Item Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-stone-400 text-sm">Loading menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="p-8 text-center text-stone-400 italic bg-white rounded-2xl border text-xs sm:text-sm">
          No menu items found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-40 sm:h-48 bg-stone-100 flex items-center justify-center overflow-hidden border-b group">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-stone-400 text-xs font-medium text-center p-4">
                    <p>No photo uploaded</p>
                    <p className="text-[10px] text-stone-300">Tap image area to upload</p>
                  </div>
                )}

                {/* Upload Photo Hover / Tap Action Overlay */}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white font-bold text-xs gap-1.5 p-2 text-center">
                  <span>📷 {item.image_url ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleCardImageUpload(item.id, e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>

                {/* Status Toggle & Remove Item Controls */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAvailability(item.id, item.is_available)
                    }
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm transition-colors ${
                      item.is_available
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </button>

                  <button
                    type="button"
                    title="Remove Item"
                    onClick={() => handleRemoveMenuItem(item.id, item.name)}
                    className="bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 p-1 rounded-full shadow-sm border border-stone-200 transition-colors flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Card Details & Price Quick Edit */}
              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-bold text-stone-800 text-base sm:text-lg leading-snug">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="inline-block bg-stone-100 text-stone-600 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium">
                      {item.category}
                    </span>
                    {item.allowed_customizations?.map((cust) => (
                      <span
                        key={cust}
                        className="inline-block bg-amber-50 text-amber-900 border border-amber-200 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      >
                        {cust}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t flex items-center justify-between">
                  <label className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase">
                    Price ($)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 font-bold text-xs sm:text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={item.price}
                      onBlur={(e) => handleUpdatePrice(item.id, e.target.value)}
                      className="w-16 sm:w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-amber-900 outline-none font-mono text-xs sm:text-sm text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}