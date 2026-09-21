/** @format */

import { useState } from "react";
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
} from "../pages";

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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SiderComponent collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout style={{ backgroundColor: "var(--bg-app, #f8fafc)", height: "100vh", overflow: "auto" }}>
        <HeaderComponent collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

        <Content className="p-4" style={{ minHeight: "calc(100vh - 120px)" }}>
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
            <Route path="/report" element={<ReportScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/shipments" element={<ShipmentsScreen />} />

            {/* Redirect auth routes if already authenticated */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/sign-up" element={<Navigate to="/" replace />} />

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>

        <Footer className="bg-white" />
      </Layout>
    </Layout>
  );
};

export default MainRouter;
