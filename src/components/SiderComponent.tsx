/** @format */

import { Layout, Menu, MenuProps, Typography, Tooltip } from "antd";
import {
  Box,
  Chart,
  Gallery,
  Home2,
  PercentageSquare,
  ProfileCircle,
  Tag,
  Category,
  Messages1,
  TruckFast,
} from "iconsax-react";
import { Link, useLocation } from "react-router-dom";
import { appInfo } from "../constants/appInfos";
import { colors } from "../constants/colors";

const { Sider } = Layout;
const { Text } = Typography;
type MenuItem = Required<MenuProps>["items"][number];

interface Props {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const SiderComponent = ({ collapsed = false, onCollapse }: Props) => {
  const location = useLocation();

  // Xác định selectedKey dựa trên pathname
  const pathname = location.pathname;
  let selectedKey = "dashboard";
  if (pathname.startsWith("/inventory/add-product")) selectedKey = "inventory-add-product";
  else if (pathname.startsWith("/inventory")) selectedKey = "inventory-all";
  else if (pathname.startsWith("/categories")) selectedKey = "Categories";
  else if (pathname.startsWith("/media")) selectedKey = "Media";
  else if (pathname.startsWith("/report")) selectedKey = "Report";
  else if (pathname.startsWith("/suppliers")) selectedKey = "Suppliers";
  else if (pathname.startsWith("/orders")) selectedKey = "Orders";
  else if (pathname.startsWith("/shipments")) selectedKey = "Shipments";
  else if (pathname.startsWith("/promotions")) selectedKey = "Promotions";
  else if (pathname.startsWith("/support")) selectedKey = "Support";

  const items: MenuItem[] = [
    {
      key: "dashboard",
      label: <Link to={"/"}>Tổng quan</Link>,
      icon: <Home2 size={20} variant="Bulk" color={selectedKey === "dashboard" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Orders",
      label: <Link to={"/orders"}>Đơn hàng</Link>,
      icon: <Tag size={20} variant="Bulk" color={selectedKey === "Orders" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Shipments",
      label: <Link to={"/shipments"}>Vận đơn & Giao hàng</Link>,
      icon: <TruckFast size={20} variant="Bulk" color={selectedKey === "Shipments" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "inventory",
      label: "Quản lý sản phẩm",
      icon: <Box size={20} variant="Bulk" color={selectedKey.startsWith("inventory") ? colors.primary500 : "#64748b"} />,
      children: [
        {
          key: "inventory-all",
          label: <Link to={"/inventory"}>Tất cả sản phẩm</Link>,
        },
        {
          key: "inventory-add-product",
          label: <Link to={"/inventory/add-product"}>Thêm sản phẩm</Link>,
        },
      ],
    },
    {
      key: "Categories",
      label: <Link to={"/categories"}>Danh mục</Link>,
      icon: <Category size={20} variant="Bulk" color={selectedKey === "Categories" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Suppliers",
      label: <Link to={"/suppliers"}>Nhà cung cấp</Link>,
      icon: <ProfileCircle size={20} variant="Bulk" color={selectedKey === "Suppliers" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Promotions",
      label: <Link to={"/promotions"}>Khuyến mãi</Link>,
      icon: <PercentageSquare size={20} variant="Bulk" color={selectedKey === "Promotions" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Report",
      label: <Link to={"/report"}>Báo cáo & Thống kê</Link>,
      icon: <Chart size={20} variant="Bulk" color={selectedKey === "Report" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Media",
      label: <Link to={"/media"}>Thư viện hình ảnh</Link>,
      icon: <Gallery size={20} variant="Bulk" color={selectedKey === "Media" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "Support",
      label: <Link to={"/support"}>Hỗ trợ khách hàng</Link>,
      icon: <Messages1 size={20} variant="Bulk" color={selectedKey === "Support" ? colors.primary500 : "#64748b"} />,
    },
  ];

  return (
    <Sider
      width={260}
      collapsedWidth={80}
      collapsed={collapsed}
      onCollapse={onCollapse}
      theme="light"
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        overflowY: "auto",
        borderRight: "1px solid #f1f5f9",
        boxShadow: "1px 0 10px 0 rgba(0, 0, 0, 0.02)",
        zIndex: 10,
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="d-flex align-items-center"
        style={{
          height: 64,
          padding: collapsed ? "0 16px" : "0 24px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid #f8fafc",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #1570EF 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            boxShadow: "0 4px 10px rgba(21, 112, 239, 0.3)",
            flexShrink: 0,
          }}
        >
          K
        </div>
        {!collapsed && (
          <div style={{ marginLeft: 12, overflow: "hidden", whiteSpace: "nowrap" }}>
            <Text
              style={{
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "#0f172a",
                letterSpacing: "-0.02em",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {appInfo.title}
            </Text>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Admin Portal</span>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 4px" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["inventory"]}
          items={items}
          theme="light"
          style={{ borderRight: "none" }}
        />
      </div>
    </Sider>
  );
};

export default SiderComponent;