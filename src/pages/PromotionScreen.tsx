import { ColumnProps } from "antd/es/table";
import { useEffect, useState } from "react";
import { PromotionModel } from "../models/PromotionModel";
import { Avatar, Button, Card, Empty, Image, Modal, Space, Spin, Table, Tag, Typography } from "antd";
import { Edit2, Trash, TicketDiscount } from "iconsax-react";
import AddPromotion from "../modals/AddPromotion";
import { usePromotions } from "../hooks/usePromotions";

const { confirm } = Modal;
const { Text, Title } = Typography;

const PromotionScreen = () => {
  const { getPromotions, deletePromotion, loading, error } = usePromotions();
  const [isVisibleModalAddPromotion, setIsVisibleModalAddPromotion] =
    useState(false);
  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [promotionSelected, setPromotionSelected] = useState<PromotionModel>();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await getPromotions();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
        ? (response as any).data
        : [];
      setPromotions(list);
    } catch (error) {
      console.log(error);
      setPromotions([]);
    }
  };

  const handleRemovePromotion = async (id: string) => {
    try {
      await deletePromotion(id);
      await fetchPromotions();
    } catch (error) {
      console.log(error);
    }
  };

  const columns: ColumnProps<PromotionModel>[] = [
    {
      key: "image",
      dataIndex: "imageURL",
      title: "Image",
      render: (img: string) => <Avatar src={img} size={50} />,
    },
    {
      key: "title",
      dataIndex: "title",
      title: "Title",
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Description",
    },
    {
      key: "code",
      dataIndex: "code",
      title: "Code",
    },
    {
      key: "available",
      dataIndex: "numOfAvailable",
      title: "Available",
    },

    {
      key: "value",
      dataIndex: "value",
      title: "Value",
    },
    {
      key: "type",
      dataIndex: "type",
      title: "Type",
    },
    {
      key: "btn",
      title: "Actions",
      align: "right",
      fixed: "right",
      render: (_: any, item: PromotionModel) => (
        <Space>
          <Button
            onClick={() => {
              setPromotionSelected(item);
              setIsVisibleModalAddPromotion(true);
            }}
            type="text"
            icon={<Edit2 variant="Bold" size={20} className="text-info" />}
          />
          <Button
            onClick={() =>
              confirm({
                title: "Confirm",
                content: "Are you sure you want to remove this promotion?",
                onOk: () => item?.id && handleRemovePromotion(item.id),
              })
            }
            type="text"
            icon={<Trash variant="Bold" size={20} className="text-danger" />}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Quản lý Khuyến mãi & Voucher
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tạo và cấu hình các mã giảm giá cho khách hàng
          </Text>
        </div>
        <Button
          type="primary"
          onClick={() => setIsVisibleModalAddPromotion(true)}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          + Thêm khuyến mãi mới
        </Button>
      </div>

      {isMobile ? (
        <div className="d-flex flex-column gap-3">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", background: "#fff", borderRadius: 12 }}>
              <Spin size="large" tip="Đang tải danh sách khuyến mãi..." />
            </div>
          ) : promotions.length === 0 ? (
            <div style={{ padding: "40px 0", background: "#fff", borderRadius: 12 }}>
              <Empty description="Không có chương trình khuyến mãi nào" />
            </div>
          ) : (
            promotions.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Header Card: Ảnh + Tên + Mã Code */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Avatar
                    src={item.imageURL}
                    icon={<TicketDiscount size={24} color="#1570ef" />}
                    size={52}
                    shape="square"
                    style={{ borderRadius: 8, background: "#eff6ff", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </span>
                      <Tag color="magenta" style={{ margin: 0, fontWeight: 700, fontFamily: "monospace", letterSpacing: 0.5 }}>
                        {item.code}
                      </Tag>
                    </div>
                    {item.description && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chi tiết giá trị & số lượng */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Mức giảm:</span>
                    <span style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>
                      {item.type === "percent" || item.type === "percentage"
                        ? `${item.value}%`
                        : typeof item.value === "number"
                        ? `${item.value.toLocaleString("vi-VN")} ₫`
                        : item.value}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Lượt khả dụng:</span>
                    <Tag color={Number(item.numOfAvailable) > 0 ? "success" : "default"} style={{ margin: 0, fontWeight: 600 }}>
                      {item.numOfAvailable !== undefined ? `${item.numOfAvailable} lượt` : "Không giới hạn"}
                    </Tag>
                  </div>
                </div>

                {/* Nút thao tác */}
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <Button
                    size="middle"
                    icon={<Edit2 size={16} />}
                    onClick={() => {
                      setPromotionSelected(item);
                      setIsVisibleModalAddPromotion(true);
                    }}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      borderColor: "#e2e8f0",
                      color: "#334155",
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    size="middle"
                    danger
                    icon={<Trash size={16} />}
                    onClick={() =>
                      confirm({
                        title: "Xác nhận xóa",
                        content: `Bạn có chắc muốn xóa khuyến mãi "${item.title}"?`,
                        okText: "Xóa",
                        cancelText: "Hủy",
                        okType: "danger",
                        onOk: () => item?.id && handleRemovePromotion(item.id),
                      })
                    }
                    style={{
                      width: 44,
                      padding: 0,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderColor: "#fecaca",
                      background: "#fef2f2",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Card className="app-card" bordered={false}>
          <Table
            bordered
            rowKey={(record) => record.id}
            loading={loading}
            columns={columns}
            scroll={{ x: 950 }}
            dataSource={Array.isArray(promotions) ? promotions : []}
          />
        </Card>
      )}

      <AddPromotion
        promotion={promotionSelected}
        onAddNew={(newPromotion) => {
          if (promotionSelected) {
            // Update: thay thế promotion cũ
            setPromotions((prev) =>
              (prev || []).map((p) =>
                p.id === promotionSelected.id ? newPromotion : p
              )
            );
          } else {
            // Add: thêm promotion mới
            setPromotions((prev) => [...(prev || []), newPromotion]);
          }
          setPromotionSelected(undefined);
          setIsVisibleModalAddPromotion(false);
        }}
        visible={isVisibleModalAddPromotion}
        onClose={() => {
          setPromotionSelected(undefined);
          setIsVisibleModalAddPromotion(false);
        }}
      />
    </div>
  );
};

export default PromotionScreen;
