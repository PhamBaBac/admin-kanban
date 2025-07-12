/** @format */

import { Affix, Layout } from 'antd';
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
} from 'chart.js';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HeaderComponent, SiderComponent } from '../components';
import HomeScreen from '../pages/HomeScreen';
import AddProduct from '../pages/inventories/AddProduct';
import { Categories, Inventories, OrdersScreen, ProductDetail, PromotionScreen, Suppliers } from '../pages';

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
      <Affix offsetTop={0}>
        <SiderComponent />
      </Affix>
      <Layout
        style={{
          backgroundColor: "white !important",
        }}
      >
        <Affix offsetTop={0}>
          <HeaderComponent />
        </Affix>
        <Content className="pt-3 container-fluid">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/oauth-callback" element={<Navigate to="/" />} />
            <Route>
              <Route path="/inventory" element={<Inventories />} />
              <Route path="/inventory/add-product" element={<AddProduct />} />
              <Route
                path="/inventory/detail/:slug"
                element={<ProductDetail />}
              />
            </Route>
            <Route>
              <Route path="/categories" element={<Categories />} />
            </Route>
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/promotions" element={<PromotionScreen />} />
            <Route path="/orders" element={<OrdersScreen />} />
          </Routes>
        </Content>
        <Footer className="bg-white" />
      </Layout>
    </Layout>
  );
};

export default MainRouter;