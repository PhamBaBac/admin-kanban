import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Segmented,
  Space,
  Spin,
  Tag,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  DollarCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Edit2, UserRemove } from "iconsax-react";
import { useEffect, useState } from "react";
import TableComponet from "../components/TableComponent";
import { ModalExportData, ToogleSupplier } from "../modals";
import { FormModel } from "../models/FormModel";
import { SupplierModel } from "../models/SupplierModel";
import { useSuppliers } from "../hooks/useSuppliers";

const { confirm } = Modal;

const FILTER_OPTIONS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Hoạt động" },
  { key: "taking", label: "Đang lấy hàng" },
  { key: "stopped", label: "Ngừng lấy" },
  { key: "inactive", label: "Khóa" },
];

const isSupplierActive = (active?: number | string | boolean | null) =>
  active === 1 || active === "1" || active === true;

const isSupplierTaking = (isTaking?: number | string | boolean | null) =>
  isTaking === 1 || isTaking === "1" || isTaking === true;

const Suppliers = () => {
  const {
    getSuppliers: fetchSuppliers,
    deleteSupplier,
    updateSupplier,
    loading,
    error,
    getSupplierForm,
  } = useSuppliers();
  const [isVisibleModalAddNew, setIsVisibleModalAddNew] = useState(false);
  const [isVisibleModalExport, setIsVisibleModalExport] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierModel[]>([]);
  const [supplierSelected, setSupplierSelected] = useState<SupplierModel>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>(10);
  const [forms, setForms] = useState<FormModel>();

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [viewMode, setViewMode] = useState<"table" | "cards">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );
  const [searchKey, setSearchKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "taking" | "stopped"
  >("all");

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuppliersData();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, pageSize, statusFilter, searchKey]);

  const getData = async () => {
    try {
      await getFroms();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const getFroms = async () => {
    const data = await getSupplierForm();
    data && setForms(data);
  };

  const fetchSuppliersData = async () => {
    try {
      const res = await fetchSuppliers({
        page,
        pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchKey.trim() || undefined,
      });

      if (res && res.data) {
        const updatedSuppliers = res.data.map((item: any, index: number) => ({
          index: (page - 1) * pageSize + (index + 1),
          ...item,
        }));
        setSuppliers(updatedSuppliers);
        setTotal(res.totalElements ?? 0);
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleStatusFilterChange = (key: any) => {
    setStatusFilter(key);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchKey(val);
    setPage(1);
  };

  const removeSuppiler = async (id: string) => {
    try {
      await deleteSupplier(id);
      await fetchSuppliersData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleTaking = async (item: SupplierModel) => {
    try {
      const currentTaking = isSupplierTaking(item.isTaking);
      const newTaking = currentTaking ? 0 : 1;
      await updateSupplier({
        ...item,
        isTaking: newTaking,
      } as any);
      message.success(
        `Đã chuyển sang "${newTaking === 1 ? "Đang lấy hàng" : "Ngừng lấy"}"`
      );
      await fetchSuppliersData();
    } catch (err: any) {
      message.error(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleToggleActive = async (item: SupplierModel) => {
    try {
      const currentActive = isSupplierActive(item.active);
      const newActive = currentActive ? 0 : 1;
      await updateSupplier({
        ...item,
        active: newActive,
      } as any);
      message.success(
        `Đã chuyển sang "${newActive === 1 ? "Hoạt động" : "Khóa"}"`
      );
      await fetchSuppliersData();
    } catch (err: any) {
      message.error(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const renderSupplierCard = (item: SupplierModel, index: number) => {
    const isActive = isSupplierActive(item.active);
    const isTaking = isSupplierTaking(item.isTaking);

    return (
      <div
        key={item.id || `supplier-${index}`}
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {item.photoUrl ? (
            <Avatar
              size={46}
              src={item.photoUrl}
              shape="square"
              style={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                flexShrink: 0,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0,
                border: "1px solid #bfdbfe",
              }}
            >
              {item.name ? item.name.charAt(0).toUpperCase() : <ShopOutlined />}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#0f172a",
                  lineHeight: "1.3",
                  wordBreak: "break-word",
                }}
              >
                {item.name}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#94a3b8",
                  backgroundColor: "#f1f5f9",
                  padding: "1px 6px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                #{item.index || (page - 1) * pageSize + index + 1}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 6,
              }}
            >
              <Tag
                color={isActive ? "processing" : "error"}
                style={{
                  margin: 0,
                  fontSize: 11,
                  borderRadius: 4,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                title="Bấm để đổi Hoạt động / Khóa"
                onClick={() => handleToggleActive(item)}
              >
                {isActive ? "Hoạt động" : "Khóa"}
              </Tag>

              <Tag
                color={isTaking ? "success" : "default"}
                style={{
                  margin: 0,
                  fontSize: 11,
                  borderRadius: 4,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                title="Bấm để đổi Đang lấy hàng / Ngừng lấy"
                onClick={() => handleToggleTaking(item)}
              >
                {isTaking ? "Đang lấy hàng" : "Ngừng lấy"}
              </Tag>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 8,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PhoneOutlined
              style={{ color: "#2563eb", fontSize: 13, flexShrink: 0 }}
            />
            <span style={{ color: "#64748b", fontSize: 12, minWidth: 60 }}>
              SĐT:
            </span>
            {item.contact ? (
              <a
                href={`tel:${item.contact}`}
                style={{ color: "#2563eb", fontWeight: 600, fontSize: 13 }}
              >
                {item.contact}
              </a>
            ) : (
              <span style={{ color: "#94a3b8" }}>—</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MailOutlined
              style={{ color: "#0284c7", fontSize: 13, flexShrink: 0 }}
            />
            <span style={{ color: "#64748b", fontSize: 12, minWidth: 60 }}>
              Email:
            </span>
            {item.email ? (
              <a
                href={`mailto:${item.email}`}
                style={{
                  color: "#334155",
                  wordBreak: "break-all",
                  fontSize: 13,
                }}
              >
                {item.email}
              </a>
            ) : (
              <span style={{ color: "#94a3b8" }}>—</span>
            )}
          </div>

          {item.price !== undefined &&
            item.price !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarCircleOutlined
                  style={{ color: "#16a34a", fontSize: 13, flexShrink: 0 }}
                />
                <span
                  style={{ color: "#64748b", fontSize: 12, minWidth: 60 }}
                >
                  Giá nhập:
                </span>
                <span
                  style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}
                >
                  {Number(item.price).toLocaleString("vi-VN")} đ
                </span>
              </div>
            )}

          {item.categories && item.categories.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  minWidth: 60,
                  marginTop: 2,
                }}
              >
                Danh mục:
              </span>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}
              >
                {(Array.isArray(item.categories)
                  ? item.categories
                  : [item.categories]
                ).map((cat: any, idx: number) => {
                  const label =
                    typeof cat === "string"
                      ? cat
                      : cat?.title || cat?.name || "";
                  if (!label) return null;
                  return (
                    <Tag
                      key={idx}
                      color="purple"
                      style={{
                        margin: 0,
                        fontSize: 11,
                        padding: "1px 6px",
                        borderRadius: 4,
                        maxWidth: "100%",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {label}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}

          {(item.product || (item as any).products) && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  minWidth: 60,
                  marginTop: 2,
                }}
              >
                Sản phẩm:
              </span>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}
              >
                {(Array.isArray(item.product || (item as any).products)
                  ? (item.product || (item as any).products)
                  : [item.product || (item as any).products]
                ).map((prod: any, idx: number) => {
                  const label =
                    typeof prod === "string"
                      ? prod
                      : prod?.title || prod?.name || "";
                  if (!label) return null;
                  return (
                    <Tag
                      key={idx}
                      color="blue"
                      style={{
                        margin: 0,
                        fontSize: 11,
                        padding: "1px 6px",
                        borderRadius: 4,
                        maxWidth: "100%",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {label}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 4,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Button
            type="default"
            icon={<Edit2 size={16} />}
            onClick={() => {
              setSupplierSelected(item);
              setIsVisibleModalAddNew(true);
            }}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              color: "#2563eb",
              borderColor: "#bfdbfe",
              backgroundColor: "#eff6ff",
              fontWeight: 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Chỉnh sửa
          </Button>

          <Button
            type="default"
            danger
            icon={<UserRemove size={16} />}
            onClick={() =>
              confirm({
                title: "Xác nhận xóa",
                content: `Bạn có chắc chắn muốn xóa nhà cung cấp "${item.name}"?`,
                okText: "Xóa",
                cancelText: "Hủy",
                okType: "danger",
                onOk: () => removeSuppiler(item.id),
              })
            }
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              color: "#dc2626",
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              fontWeight: 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Xóa
          </Button>
        </div>
      </div>
    );
  };

  if (!forms) {
    return <Empty />;
  }

  return (
    <div style={{ padding: isMobile ? "4px 0" : "0", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header Toolbar dùng chung cho cả Dạng thẻ và Dạng bảng */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: isMobile ? "12px 14px" : "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h4
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: isMobile ? 16 : 18,
                  color: "#0f172a",
                }}
              >
                Danh sách nhà cung cấp
              </h4>
              <Tag
                color="blue"
                style={{
                  borderRadius: 12,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {total}
              </Tag>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 2,
                display: isMobile ? "none" : "block",
              }}
            >
              Quản lý thông tin và trạng thái hợp tác các nhà cung ứng
            </div>
          </div>

          <Space wrap size={8} align="center">
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "table" | "cards")}
              options={[
                {
                  value: "cards",
                  icon: <AppstoreOutlined />,
                  label: isMobile ? undefined : "Dạng thẻ",
                },
                {
                  value: "table",
                  icon: <BarsOutlined />,
                  label: isMobile ? undefined : "Dạng bảng",
                },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSupplierSelected(undefined);
                setIsVisibleModalAddNew(true);
              }}
              style={{
                borderRadius: 6,
                fontWeight: 600,
                height: 32,
                background: "#1677ff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isMobile ? "Thêm" : "Thêm nhà cung cấp"}
            </Button>
          </Space>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input
            placeholder="Tìm theo tên, SĐT, email, danh mục..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchKey}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            style={{ borderRadius: 8, height: 36, flex: 1 }}
          />
          </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingTop: 10,
            scrollbarWidth: "none",
          }}
        >
          {FILTER_OPTIONS.map((f) => {
            const isSelected = statusFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleStatusFilterChange(f.key as any)}
                style={{
                  border: isSelected
                    ? "1px solid #1677ff"
                    : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#eff6ff" : "#f8fafc",
                  color: isSelected ? "#1677ff" : "#64748b",
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "cards" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>Đang tải dữ liệu nhà cung cấp...</div>
            </div>
          ) : suppliers.length === 0 ? (
            <Card
              style={{
                borderRadius: 12,
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Empty
                description={
                  searchKey || statusFilter !== "all"
                    ? "Không tìm thấy nhà cung cấp nào phù hợp với bộ lọc"
                    : "Chưa có nhà cung cấp nào"
                }
              />
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {suppliers.map((item, index) =>
                renderSupplierCard(item, index)
              )}
            </div>
          )}

          {/* Pagination */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "12px 16px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Hiển thị{" "}
              <strong style={{ color: "#0f172a" }}>
                {total > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
                {Math.min(page * pageSize, total)}
              </strong>{" "}
              trong tổng số{" "}
              <strong style={{ color: "#1677ff" }}>{total}</strong> nhà cung cấp
            </div>

            <Pagination
              size={isMobile ? "small" : "default"}
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger={!isMobile}
              pageSizeOptions={["10", "20", "50"]}
              onChange={(newPage, newPageSize) => {
                setPage(newPage);
                if (newPageSize !== pageSize) {
                  setPageSize(newPageSize);
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DẠNG BẢNG (TABLE VIEW) */
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <TableComponet
            api="supplier"
            hideTitle
            page={page}
            pageSize={pageSize}
            onPageChange={(val: any) => {
              setPage(val.page);
              setPageSize(val.pageSize);
            }}
            onAddNew={() => {
              setSupplierSelected(undefined);
              setIsVisibleModalAddNew(true);
            }}
            loading={loading}
            forms={forms}
            records={suppliers}
            total={total}
            extraColumn={(item: any) => (
              <Space>
                <Button
                  type="text"
                  onClick={() => {
                    setSupplierSelected(item);
                    setIsVisibleModalAddNew(true);
                  }}
                  icon={<Edit2 size={18} className="text-info" />}
                />
                <Button
                  onClick={() =>
                    confirm({
                      title: "Xác nhận xóa",
                      content: `Bạn có chắc chắn muốn xóa nhà cung cấp "${item.name}"?`,
                      okText: "Xóa",
                      cancelText: "Hủy",
                      okType: "danger",
                      onOk: () => removeSuppiler(item.id),
                    })
                  }
                  type="text"
                  icon={<UserRemove size={18} className="text-danger" />}
                />
              </Space>
            )}
          />
        </div>
      )}

      {/* Modal Thêm / Chỉnh sửa nhà cung cấp */}
      <ToogleSupplier
        visible={isVisibleModalAddNew}
        onClose={() => {
          setSupplierSelected(undefined);
          setIsVisibleModalAddNew(false);
        }}
        onAddNew={async () => {
          await fetchSuppliersData();
        }}
        supplier={supplierSelected}
      />

      {/* Modal Xuất dữ liệu Excel */}
      <ModalExportData
        visible={isVisibleModalExport}
        onClose={() => setIsVisibleModalExport(false)}
        api="supplier"
        name="supplier"
      />
    </div>
  );
};

export default Suppliers;
