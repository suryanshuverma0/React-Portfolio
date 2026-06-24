import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className=" flex-1  overflow-y-auto px-6 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
