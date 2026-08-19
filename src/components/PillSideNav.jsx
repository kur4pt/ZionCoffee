import { useState } from "react";
import {NavLink} from "react-router-dom";
import { Home, ShoppingCart, ReceiptText, Blender, ChartPie, UserStar } from "lucide-react";

const navItems = [
    {id: 'home',            label: 'Home',              icon: Home,         path: '/'},
    {id: 'cart',            label: 'Cart',              icon: ShoppingCart, path: '/cart'},
    {id: 'orderQueue',      label: 'Order Queue',       icon: Blender,      path: '/order-queue'},
    {id: 'previousOrders',  label: 'Previous Orders',   icon: ReceiptText,  path: '/previous-orders'},
    {id: 'analytics',       label: 'Analytics',         icon: ChartPie,     path: '/analytics'},
];

export default function PillSideNav() {
    const [active, setActive] = useState('home');

    return (
        <aside className="h-screen p-4 flex items-center bg-gray-50">
            <nav className="flex flex-col items-center justify-between py-6 px-3 w-12 sm:px-6 py-4 w-16 bg-white rounded-full border border-gray-200 h-[85vh]">
                
                {/* Top Logo Pill */ }
                <div className="w-10 h-10 rounded flex items-center justify-center">
                    <img src="/coffee-bean.png" alt="Coffee Bean" />
                </div>

                {/* Navigation Items */ }
                <div className="flex flex-col gap-4 w-full items-center">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.id;
                        
                        return (
                        <NavLink
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            title={item.label}
                            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                            isActive 
                                ? 'bg-orange-800 text-white shadow-lg shadow-grey-300 scale-105' 
                                : 'text-gray-400 hover:bg-amber-950/35 hover:text-gray-600'
                            }`}
                        >
                            <Icon size={20} />
                        </NavLink>
                        );
                    })}
                </div>

                {/* Bottom Admin Pill */ }
                <NavLink
                    onClick={() => setActive('admin')}
                    title="Admin"
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                        active === 'admin' 
                            ? 'bg-orange-800 text-white shadow-lg shadow-grey-300 scale-105' 
                            : 'text-gray-400 hover:bg-amber-950/35 hover:text-gray-600'
                    }`}
                >
                    <UserStar size={20} />
                </NavLink>
            </nav>
        </aside>
    );
}