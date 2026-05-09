import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import { useToastContext } from "../context/ToastContext.jsx";
import Toast from "./ui/Toast.jsx";

const Layout = () => {
  const { toastsList } = useToastContext();

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <Navbar />

      <main className="flex-1 h-auto">
        <Outlet />
      </main>

      <Footer />

      <div className="fixed bottom-5 left-5 flex flex-col gap-2">
        {toastsList.map((toastItem) => (
          <Toast key={toastItem.id} {...toastItem} />
        ))}
      </div>
    </div>
  );
};

export default Layout;
