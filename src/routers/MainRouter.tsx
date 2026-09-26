/** @format */

import { useState, useEffect } from "react";
import { Affix, Layout } from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { HeaderComponent, SiderComponent } from "../components";
import HomeScreen from "../pages/HomeScreen";
import AddProduct from "../pages/inventories/AddProduct";
import {
  Categories,
  Inventories,
  OrdersScreen,
  ProductDetail,
  PromotionScreen,
  Suppliers,
  MediaScreen,
  ShipmentsScreen,
  ReportScreen,
  FinanceScreen,
  AccountsScreen,
  SupportScreen,
} from "../pages";
import AdminRoute from "./AdminRoute";


ChartJS.register(
  CategoryScale,
  LinearScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { Content, Footer } = Layout;

const MainRouter = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 992 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SiderComponent
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />
      <Layout style={{ backgroundColor: "var(--bg-app, #f8fafc)", height: "100vh", overflow: "auto" }}>
        <HeaderComponent
          collapsed={collapsed}
          onToggleCollapse={handleToggle}
          isMobile={isMobile}
        />

        <Content
          style={{
            minHeight: "calc(100vh - 120px)",
            padding: isMobile ? "12px 8px" : "16px 20px",
          }}
        >
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/oauth-callback" element={<Navigate to="/" />} />

            {/* Inventory grouping */}
            <Route path="/inventory" element={<Outlet />}>
              <Route index element={<Inventories />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="detail/:slug" element={<ProductDetail />} />
            </Route>

            {/* Categories grouping */}
            <Route path="/categories" element={<Outlet />}>
              <Route index element={<Categories />} />
            </Route>

            {/* Other pages */}
            <Route path="/media" element={<MediaScreen />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/promotions" element={<PromotionScreen />} />
            <Route path="/report" element={<AdminRoute roles={["ADMIN", "MANAGER"]}><ReportScreen /></AdminRoute>} />
            <Route path="/support" element={<AdminRoute roles={["ADMIN", "MANAGER"]}><SupportScreen /></AdminRoute>} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/shipments" element={<ShipmentsScreen />} />
            <Route path="/finance" element={<AdminRoute><FinanceScreen /></AdminRoute>} />
            <Route
              path="/accounts"
              element={
                <AdminRoute>
                  <AccountsScreen />
                </AdminRoute>
              }
            />


            {/* Redirect auth routes if already authenticated */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/sign-up" element={<Navigate to="/" replace />} />

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>


      </Layout>
    </Layout>
  );
};

export default MainRouter;
