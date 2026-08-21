import { Routes, Route } from "react-router-dom";
import PillSideNav from "./components/PillSideNav";
import CreateOrder from "./components/CreateOrder";
import OrderQueue from "./components/OrderQueue";
import PreviousOrder from "./components/PreviousOrder";
import Analytics from "./components/Analytics";
import AdminPage from "./components/AdminPage";

function App() {
  return (
    <div className="flex min-h-screen bg-orange-50 text-black overflow-hidden">

      <PillSideNav />

      <main className="flex-1 p-8 pl-26 min-w-0">
        <Routes>
          <Route path="/" element={<CreateOrder />} />
          <Route path="/CreateOrder" element={<CreateOrder />} />
          <Route path="/OrderQueue" element={<OrderQueue />} />
          <Route path="/PreviousOrder" element={<PreviousOrder />} />
          <Route path="/Analytics" element={<Analytics />} />
          <Route path="/AdminPage" element={<AdminPage />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;