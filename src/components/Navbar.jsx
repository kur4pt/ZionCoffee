export default function Navbar() {
    return 
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-slate-950/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                <div>
                    <img
                     src="/coffee-bean.png" 
                     alt="coffee bean" 
                     className="w-6 sm:w-8 sm:h-8" 
                     />
                </div>
                <span className="text=lg sm:text-xl md:text-2xl font-medium">
                    <span className="text-white">Zion</span>
                    <span></span>
                </span>
            </div>
        </div>
    </nav>
}