import { Outlet } from "react-router-dom";
import Sidebar from "../../Sidebar/sidebar";
import DashboardHeader from "../../ui/dashboardHeader";
import Footer from "../../dashboardFooter/footer";
import "./layout.css";

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="mainWrapper">
        <DashboardHeader />
        <div className="contentWrapper">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}
