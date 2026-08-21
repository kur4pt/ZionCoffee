import { NavLink, useLocation } from "react-router-dom";
import { ShoppingCart, ReceiptText, Blender, UserStar } from "lucide-react";

const navItems = [
  { id: 'createOrder',     label: 'Create Order',      icon: ShoppingCart, path: '/CreateOrder' },
  { id: 'orderQueue',      label: 'Order Queue',       icon: Blender,      path: '/OrderQueue' },
  { id: 'previousOrders',  label: 'Previous Orders',   icon: ReceiptText,  path: '/PreviousOrder' },
];

export default function PillSideNav() {
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 w-full md:w-auto md:h-screen p-3 md:p-4 flex items-center justify-center md:justify-start z-50">
      <nav className="flex flex-row md:flex-col items-center justify-between px-4 py-2 md:py-6 md:px-3 w-full max-w-md md:w-20 bg-white/90 backdrop-blur-md md:bg-white rounded-full border border-gray-200/80 md:h-[85vh] shadow-lg md:shadow-sm">
        
        {/* Logo (Hidden on small screens to save header space) */}
        <div className="hidden md:flex w-10 h-10 rounded items-center justify-center">
          <img src="/coffee-bean.png" alt="Coffee Bean" className="w-8 h-8 object-contain" />
        </div>

        {/* Main Navigation Items */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-4 w-auto md:w-full items-center justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={item.label}
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-orange-800 text-white shadow-md scale-105' 
                    : 'text-gray-400 hover:bg-amber-950/10 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </NavLink>
            );
          })}
        </div>

        {/* Admin Link */}
        <NavLink 
          to="/AdminPage"
          title="Admin Page"
          className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
            location.pathname.toLowerCase() === '/adminpage' 
              ? 'bg-orange-800 text-white shadow-md scale-105' 
              : 'text-gray-400 hover:bg-amber-950/10 hover:text-gray-600'
          }`}
        >
          <UserStar className="w-5 h-5" />
        </NavLink>
      </nav>
    </aside>
  );
}