import PillSideNav   from "./components/PillSideNav";
import Hero     from "./components/Hero";
import Features from "./components/Features";
import Pricing  from "./components/Pricing";
import Foooter  from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-cornsilk text-black overflow-hidden">
      <PillSideNav />
      <Hero />
      <Features />
      <Pricing />
      <Foooter />
    </div>
  );
}

export default App;
