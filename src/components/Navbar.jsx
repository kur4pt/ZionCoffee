import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-slate-950/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
                    <div className="flex items-center space-x-1 group cursor-pointer">
                        <div>
                            <img
                            src="/coffee-bean.png" 
                            alt="coffee bean" 
                            className="w-6 h-6 sm:w-8 sm:h-8" 
                            />
                        </div>
                        <span className="text=lg sm:text-xl md:text-2xl font-bold">
                            <span className="text-white">Zion</span>
                            <span className="text-blue-400">Coffee</span>
                        </span>
                    </div>

                    {/* Nav Links*/}
                    <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                        <a href="#Features" className="text-gray-300 hover:text-white text-sm lg:text-base">
                            Features
                        </a>
                        <a href="#Pricing" className="text-gray-300 hover:text-white text-sm lg:text-base">
                            Pricing
                        </a>
                    </div>

                    <buton className= "md:hidden p-2 text-grey-300 hover:text-white" 
                        onClick={() => setMobileMenuIsOpen((prev)=> !prev)}>
                            { mobileMenuIsOpen ? (
                                <X className="w-5 h-5 sm:w-6 smh-6"/>
                            ) : (
                                <Menu className="w-5 h-5 sm:w-6 sm:h-6"/>
                            )}
                    </buton>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuIsOpen && (
            <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800">
                <div>
                    <a href="#Features" className="text-black-300 hover:text-white text-sm lg:text-base">
                        Features
                    </a>
                    <a href="#Pricing" className="text-black-300 hover:text-white text-sm lg:text-base">
                        Pricing
                    </a>
                </div>
            </div>
            )}
        </nav>
    );
}