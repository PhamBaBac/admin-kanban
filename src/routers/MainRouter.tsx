/** @format */

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
  return (
    <Layout>
      <SiderComponent />
      <Layout style={{ backgroundColor: "#fff" }}>
        <HeaderComponent />

        <Content className="pt-3 container-fluid">
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
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/promotions" element={<PromotionScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />

            {/* Fallback 404 */}
            {/* <Route path="*" element={<Navigate to="/" />} /> */}
          </Routes>
        </Content>

        <Footer className="bg-white" />
      </Layout>
    </Layout>
  );
};

export default MainRouter;
