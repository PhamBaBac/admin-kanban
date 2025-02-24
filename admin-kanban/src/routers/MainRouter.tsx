/** @format */

import { Affix, Layout } from 'antd';
import HomeScreen from '../pages/HomeScreen';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HeaderComponent, SiderComponent } from '../components';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement,
} from 'chart.js';

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
const { Content, Footer, Header, Sider } = Layout;

const MainRouter = () => {
	return (
		<BrowserRouter>
			<Layout>
				<Affix offsetTop={0}>
					<SiderComponent />
				</Affix>
				<Layout
					style={{
						backgroundColor: 'white !important',
					}}>
					<Affix offsetTop={0}>
						<HeaderComponent />
					</Affix>
					<Content className='pt-3 container-fluid'>
						<Routes>
							<Route path='/home' element={<HomeScreen />} />
							
							
						</Routes>
					</Content>
					<Footer className='bg-white' />
				</Layout>
			</Layout>
		</BrowserRouter>
	);
};

export default MainRouter;