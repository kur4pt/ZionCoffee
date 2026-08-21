import { NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, ReceiptText, Blender, ChartPie, UserStar } from "lucide-react";

const navItems = [
  { id: 'createOrder',     label: 'Create Order',      icon: ShoppingCart, path: '/CreateOrder' },
  { id: 'orderQueue',      label: 'Order Queue',       icon: Blender,      path: '/OrderQueue' },
  { id: 'previousOrders',  label: 'Previous Orders',   icon: ReceiptText,  path: '/PreviousOrder' },
];

export default function PillSideNav() {
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 h-screen p-4 flex items-center z-50 overflow-hidden">
      <nav className="flex flex-col items-center justify-between py-6 px-3 w-16 sm:w-20 bg-white rounded-full border border-gray-200 h-[85vh] shadow-sm">
        
        {/* Top Logo Pill */}
        <div className="w-10 h-10 rounded flex items-center justify-center">
          <img src="/coffee-bean.png" alt="Coffee Bean" className="w-8 h-8 object-contain" />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-4 w-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={item.label}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-orange-800 text-white shadow-lg shadow-gray-300 scale-105' 
                    : 'text-gray-400 hover:bg-amber-950/20 hover:text-gray-600'
                }`}
              >
                <Icon size={20} />
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Admin Pill */}
        <NavLink 
          to="/AdminPage"
          title="Admin Page"
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
            location.pathname.toLowerCase() === '/adminpage' 
              ? 'bg-orange-800 text-white shadow-lg shadow-gray-300 scale-105' 
              : 'text-gray-400 hover:bg-amber-950/20 hover:text-gray-600'
          }`}
        >
          <UserStar size={20} />
        </NavLink>
      </nav>
    </aside>
  );
}