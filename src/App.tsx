/** @format */

import { ConfigProvider, message } from "antd";
import viVN from "antd/locale/vi_VN";
import Routers from "./routers/Router";
import { Provider } from "react-redux";
import store from "./redux/store";
import "./App.css";
import { BrowserRouter } from "react-router-dom"; // ✅ Thêm import này

message.config({
  top: 20,
  duration: 2,
  maxCount: 3,
  rtl: false,
  prefixCls: "my-message",
});

function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#1570EF",
          colorInfo: "#1570EF",
          colorSuccess: "#12B76A",
          colorWarning: "#F79009",
          colorError: "#F04438",
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: "#ffffff",
          colorBgLayout: "#f8fafc",
          wireframe: false,
        },
        components: {
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary: "0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px 0 rgba(16, 24, 40, 0.04)",
          },
          Button: {
            borderRadius: 8,
            controlHeight: 38,
            fontWeight: 500,
          },
          Table: {
            borderRadius: 10,
            headerBg: "#f8fafc",
            headerColor: "#475467",
            headerSplitColor: "transparent",
            rowHoverBg: "#f1f5f9",
          },
          Menu: {
            itemBorderRadius: 8,
            itemMarginInline: 8,
            activeBarBorderWidth: 0,
          },
        },
      }}
    >
      <Provider store={store}>
        <BrowserRouter>
          <Routers />
        </BrowserRouter>
      </Provider>
    </ConfigProvider>
  );
}

export default App;
