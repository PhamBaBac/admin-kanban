import { useEffect, useState } from "react";
import { Layout, Menu, MenuProps, Typography, Tooltip, Drawer, Button } from "antd";
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
  WalletMoney,
  ShieldSecurity,
} from "iconsax-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { authSeletor } from "../redux/reducers/authReducer";
import { appInfo } from "../constants/appInfos";
import { colors } from "../constants/colors";

const { Sider } = Layout;
const { Text } = Typography;
type MenuItem = Required<MenuProps>["items"][number];

interface Props {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SiderComponent = ({
  collapsed = false,
  onCollapse,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}: Props) => {
  const location = useLocation();

  const auth = useSelector(authSeletor);
  const userRole = (auth?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const canViewReport = userRole === "ADMIN" || userRole === "MANAGER";

  // Xác định selectedKey dựa trên pathname
  const pathname = location.pathname;
  let selectedKey = "dashboard";
  if (pathname.startsWith("/inventory/add-product")) selectedKey = "inventory-add-product";
  else if (pathname.startsWith("/inventory")) selectedKey = "inventory-all";
  else if (pathname.startsWith("/categories")) selectedKey = "Categories";
  else if (pathname.startsWith("/suppliers")) selectedKey = "Suppliers";
  else if (pathname.startsWith("/media")) selectedKey = "Media";
  else if (pathname.startsWith("/orders")) selectedKey = "Orders";
  else if (pathname.startsWith("/shipments")) selectedKey = "Shipments";
  else if (pathname.startsWith("/finance")) selectedKey = "Finance";
  else if (pathname.startsWith("/promotions")) selectedKey = "Promotions";
  else if (pathname.startsWith("/report")) selectedKey = "Report";
  else if (pathname.startsWith("/support")) selectedKey = "Support";
  else if (pathname.startsWith("/accounts")) selectedKey = "Accounts";

  const isInventoryActive =
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/suppliers") ||
    pathname.startsWith("/media");

  const isOrdersActive =
    pathname.startsWith("/orders") ||
    pathname.startsWith("/shipments") ||
    pathname.startsWith("/finance");

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const keys: string[] = [];
    if (
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/suppliers") ||
      pathname.startsWith("/media")
    ) {
      keys.push("inventory-group");
    }
    if (
      pathname.startsWith("/orders") ||
      pathname.startsWith("/shipments") ||
      pathname.startsWith("/finance")
    ) {
      keys.push("orders-group");
    }
    return keys.length > 0 ? keys : ["inventory-group", "orders-group"];
  });

  useEffect(() => {
    if (
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/suppliers") ||
      pathname.startsWith("/media")
    ) {
      setOpenKeys((prev) => (prev.includes("inventory-group") ? prev : [...prev, "inventory-group"]));
    } else if (
      pathname.startsWith("/orders") ||
      pathname.startsWith("/shipments") ||
      pathname.startsWith("/finance")
    ) {
      setOpenKeys((prev) => (prev.includes("orders-group") ? prev : [...prev, "orders-group"]));
    }
  }, [pathname]);

  const items: MenuItem[] = [
    {
      key: "dashboard",
      label: <Link to={"/"}>Tổng quan</Link>,
      icon: <Home2 size={20} variant="Bulk" color={selectedKey === "dashboard" ? colors.primary500 : "#64748b"} />,
    },
    {
      key: "inventory-group",
      label: "Quản lý sản phẩm",
      icon: <Box size={20} variant="Bulk" color={isInventoryActive ? colors.primary500 : "#64748b"} />,
      children: [
        {
          key: "inventory-all",
          label: <Link to={"/inventory"}>Tất cả sản phẩm</Link>,
        },
        {
          key: "inventory-add-product",
          label: <Link to={"/inventory/add-product"}>Thêm sản phẩm</Link>,
        },
        {
          key: "Categories",
          label: <Link to={"/categories"}>Danh mục sản phẩm</Link>,
        },
        {
          key: "Suppliers",
          label: <Link to={"/suppliers"}>Nhà cung cấp</Link>,
        },
        {
          key: "Media",
          label: <Link to={"/media"}>Thư viện hình ảnh</Link>,
        },
      ],
    },
    {
      key: "orders-group",
      label: "Đơn hàng & Giao vận",
      icon: <Tag size={20} variant="Bulk" color={isOrdersActive ? colors.primary500 : "#64748b"} />,
      children: [
        {
          key: "Orders",
          label: <Link to={"/orders"}>Danh sách đơn hàng</Link>,
        },
        {
          key: "Shipments",
          label: <Link to={"/shipments"}>Vận đơn & Giao hàng</Link>,
        },
        ...(isAdmin
          ? [
              {
                key: "Finance",
                label: <Link to={"/finance"}>Tài chính & Đối soát</Link>,
              },
            ]
          : []),
      ],
    },
    {
      key: "Promotions",
      label: <Link to={"/promotions"}>Khuyến mãi</Link>,
      icon: <PercentageSquare size={20} variant="Bulk" color={selectedKey === "Promotions" ? colors.primary500 : "#64748b"} />,
    },
    ...(canViewReport
      ? [
          {
            key: "Report",
            label: <Link to={"/report"}>Báo cáo & Thống kê</Link>,
            icon: <Chart size={20} variant="Bulk" color={selectedKey === "Report" ? colors.primary500 : "#64748b"} />,
          },
        ]
      : []),
    {
      key: "Support",
      label: <Link to={"/support"}>Hỗ trợ khách hàng</Link>,
      icon: <Messages1 size={20} variant="Bulk" color={selectedKey === "Support" ? colors.primary500 : "#64748b"} />,
    },
    ...(isAdmin
      ? [
          {
            key: "Accounts",
            label: <Link to={"/accounts"}>Quản lý tài khoản</Link>,
            icon: (
              <ShieldSecurity
                size={20}
                variant="Bulk"
                color={selectedKey === "Accounts" ? colors.primary500 : "#64748b"}
              />
            ),
          },
        ]
      : []),
  ];

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        closable={false}
        styles={{
          body: {
            padding: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
          },
        }}
        width={270}
      >
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            height: 64,
            padding: "0 20px",
            borderBottom: "1px solid #f1f5f9",
            flexShrink: 0,
          }}
        >
          <div className="d-flex align-items-center">
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
            <div style={{ marginLeft: 12 }}>
              <Text
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "#0f172a",
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                {appInfo.title}
              </Text>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Admin Portal</span>
            </div>
          </div>
          <Button
            type="text"
            shape="circle"
            onClick={onMobileClose}
            style={{ color: "#64748b", fontSize: 16 }}
          >
            ✕
          </Button>
        </div>

        <div style={{ padding: "12px 4px", flex: 1, overflowY: "auto" }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys)}
            onClick={() => onMobileClose?.()}
            items={items}
            theme="light"
            style={{ borderRight: "none" }}
          />
        </div>
      </Drawer>
    );
  }

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
          openKeys={collapsed ? undefined : openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={items}
          theme="light"
          style={{ borderRight: "none" }}
        />
      </div>
    </Sider>
  );
};

export default SiderComponent;