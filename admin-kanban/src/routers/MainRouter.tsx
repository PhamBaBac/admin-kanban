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
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HeaderComponent, SiderComponent } from '../components';
import HomeScreen from '../pages/HomeScreen';
import AddProduct from '../pages/inventories/AddProduct';
import { Inventories, ProductDetail } from '../pages';

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
    <BrowserRouter>
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
              <Route>
                <Route path="/inventory" element={<Inventories />} />
                <Route path="/inventory/add-product" element={<AddProduct />} />
                <Route
                  path="/inventory/detail/:slug"
                  element={<ProductDetail />}
                />
              </Route>
            </Routes>
          </Content>
          <Footer className="bg-white" />
        </Layout>
      </Layout>
    </BrowserRouter>
  );
};

export default MainRouter;