import React from "react";
import FinancialReports from "./report/FinancialReports"; // Adjust the import path as needed
import DashboardHome from "./report/DashboardHome";
import AnalyticsDashboard from "./report/AnalyticsDashboard";

const Dashboard = () => {
  return (
    <div className="bg-gray-100 min-h-screen text-right" dir="rtl">
      {/* Main Dashboard Title */}
      {/* <h1 className=" text-center md:text-right text-2xl lg:text-2xl font-bold text-gray-800 mb-6">
        داشبورد افغان کارگو
      </h1> */}

      {/* Render the FinancialReports component */}
      <div className="">
        <DashboardHome />
        {/* <AnalyticsDashboard /> */}
      </div>
    </div>
  );
};

export default Dashboard;
