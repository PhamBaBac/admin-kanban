import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Table,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  message,
  Card,
  Row,
  Col,
  Tag,
  Radio,
} from "antd";
import { Box, TruckFast, Calculator, Shop, Buildings, Routing } from "iconsax-react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { BillModel } from "../models/BillModel";
import { shipmentService } from "../services/shipmentService";
import { ColorBadge } from "../utils/colorHelper";

interface Props {
  visible: boolean;
  order: BillModel | null;
  onClose: () => void;
  onSuccess: () => void;
}

const { Text } = Typography;

const CreateShipmentModal: React.FC<Props> = ({
  visible,
  order,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({});
  const [selectedCarrier, setSelectedCarrier] = useState<string>("GHN");
  const [customCarrierName, setCustomCarrierName] = useState<string>("VIETTEL_POST");
  const [customTrackingCode, setCustomTrackingCode] = useState<string>("");

  useEffect(() => {
    if (visible && order) {
      setSelectedCarrier("GHN");
      setCustomCarrierName("VIETTEL_POST");
      setCustomTrackingCode("");
      const initialQtys: Record<string, number> = {};
      let calculatedWeight = 0;

      order.orderResponses.forEach((item, idx) => {
        const key = item.orderItemId || `item-${idx}`;
        initialQtys[key] = item.qty;
        calculatedWeight += 250 * item.qty; 
      });

      setPackQuantities(initialQtys);

      const itemsSum = order.orderResponses.reduce((sum, it) => sum + it.totalPrice, 0);
      const effectiveShipFee = order.shippingFee !== undefined && order.shippingFee !== null
        ? order.shippingFee
        : (itemsSum >= 400000 ? 0 : 20000);
      const orderTotal = order.total !== undefined && order.total !== null
        ? order.total
        : Math.max(0, itemsSum - (order.discountAmount || 0)) + effectiveShipFee;

      const codValue = order.paymentType === "COD" ? orderTotal : 0;

      form.setFieldsValue({
        weight: calculatedWeight > 0 ? calculatedWeight : 500,
        length: 20,
        width: 15,
        height: 10,
        codAmount: codValue,
        note: `Đơn hàng #${order.id.substring(0, 8)}`,
        requiredNote: "CHOXEMHANGKHONGTHU",
      });

      handleCalculateFee(calculatedWeight > 0 ? calculatedWeight : 500, 20, 15, 10);
    } else {
      setEstimatedFee(null);
      setPackQuantities({});
    }
  }, [visible, order]);

  const handleCalculateFee = async (weight?: number, length?: number, width?: number, height?: number) => {
    try {
      setCalculatingFee(true);
      const values = form.getFieldsValue();
      if (order?.shippingFee !== undefined && order?.shippingFee !== null) {
        setEstimatedFee(order.shippingFee);
      } else {
        const fee = await shipmentService.calculateFee({
          orderId: order?.id,
          weight: weight ?? values.weight ?? 500,
          length: length ?? values.length ?? 20,
          width: width ?? values.width ?? 15,
          height: height ?? values.height ?? 10,
        });
        setEstimatedFee(fee);
      }
    } catch (error) {
      console.error("Calculate fee error", error);
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleQuantityChange = (key: string, qty: number) => {
    const updated = { ...packQuantities, [key]: qty };
    setPackQuantities(updated);

    let totalW = 0;
    order?.orderResponses.forEach((item, idx) => {
      const k = item.orderItemId || `item-${idx}`;
      totalW += (updated[k] || 0) * 250;
    });
    const finalW = Math.max(totalW, 200);
    form.setFieldsValue({ weight: finalW });
    handleCalculateFee(finalW);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!order) return;

      const itemsToPack = order.orderResponses
        .map((item, idx) => {
          const key = item.orderItemId || `item-${idx}`;
          const qty = packQuantities[key] || 0;
          return {
            orderItemId: item.orderItemId || item.image || `item-${idx}`,
            quantity: qty,
          };
        })
        .filter((it) => it.quantity > 0);

      if (itemsToPack.length === 0) {
        message.warning("Vui lòng chọn ít nhất 1 sản phẩm để đóng gói vào kiện hàng!");
        return;
      }

      if (selectedCarrier === "OTHER" && !customTrackingCode.trim()) {
        message.warning("Vui lòng nhập mã vận đơn của đối tác vận chuyển!");
        return;
      }

      setLoading(true);
      const carrierToSend = selectedCarrier === "OTHER" ? customCarrierName : selectedCarrier;
      await shipmentService.createShipment({
        orderId: order.id,
        carrier: carrierToSend,
        trackingCode: customTrackingCode.trim() || undefined,
        shippingFee: estimatedFee !== null ? estimatedFee : undefined,
        weight: values.weight,
        length: values.length,
        width: values.width,
        height: values.height,
        codAmount: values.codAmount,
        note: values.note,
        requiredNote: values.requiredNote,
        items: itemsToPack,
      });

      message.success(
        selectedCarrier === "GHN"
          ? "Tạo vận đơn và xuất kho thành công! Đã gửi thông tin sang GHN."
          : selectedCarrier === "SHOP_DELIVERY"
          ? "Xuất kho thành công! Đơn hàng được giao bởi cửa hàng."
          : "Xuất kho và lưu thông tin vận đơn đối tác thành công!"
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Create shipment error", error);
      message.error(error?.response?.data?.message || error?.message || "Tạo vận đơn thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const applyPresetSize = (w: number, l: number, wi: number, h: number) => {
    form.setFieldsValue({
      weight: w,
      length: l,
      width: wi,
      height: h,
    });
    handleCalculateFee(w, l, wi, h);
  };

  const handlePackAll = () => {
    if (!order) return;
    const allPacked: Record<string, number> = {};
    let totalW = 0;
    order.orderResponses.forEach((item, idx) => {
      const key = item.orderItemId || `item-${idx}`;
      allPacked[key] = item.qty;
      totalW += item.qty * 250;
    });
    setPackQuantities(allPacked);
    const finalW = Math.max(totalW, 200);
    form.setFieldsValue({ weight: finalW });
    handleCalculateFee(finalW);
    message.success("Đã chọn đóng gói toàn bộ sản phẩm!");
  };

  const totalSelectedQty = Object.values(packQuantities).reduce((acc, q) => acc + (q || 0), 0);
  const totalOrderQty = order?.orderResponses?.reduce((acc, it) => acc + (it.qty || 0), 0) || 0;

  const itemColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "title",
      key: "title",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {record.image ? (
            <img
              src={record.image}
              alt=""
              style={{ width: 42, height: 42, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0" }}
            />
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 6,
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box size={20} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{record.title}</div>
            {(record.size || record.color) && (
              <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                {record.color && <ColorBadge color={record.color} size={12} />}
                {record.size && (
                  <Tag color="cyan" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                    Size {record.size}
                  </Tag>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "SL Trong đơn",
      dataIndex: "qty",
      key: "qty",
      width: 110,
      align: "center" as const,
      render: (qty: number) => <span style={{ fontWeight: 600, color: "#475569" }}>{qty}</span>,
    },
    {
      title: "SL Đóng gói",
      key: "packQty",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any, idx: number) => {
        const key = record.orderItemId || `item-${idx}`;
        return (
          <InputNumber<number>
            min={0}
            max={record.qty}
            value={packQuantities[key] ?? record.qty}
            onChange={(val) => handleQuantityChange(key, val || 0)}
            style={{ width: 85 }}
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1677ff",
                flexShrink: 0,
              }}
            >
              <TruckFast size={22} color="#1677ff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                  Đóng gói & Tạo vận đơn giao hàng
                </span>
                {order && (
                  <Tag color="processing" style={{ borderRadius: 8, margin: 0, fontWeight: 600 }}>
                    #{order.id.substring(0, 8)}
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Kiểm tra sản phẩm xuất kho và gửi thông số kiện hàng sang Giao Hàng Nhanh (GHN)
              </Text>
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={820}
      style={{
        top: 20,
        maxWidth: "calc(100vw - 32px)",
        paddingBottom: 20,
      }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 210px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 8,
        },
      }}
      destroyOnHidden
      footer={[
        <Button key="back" onClick={onClose} disabled={loading}>
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<TruckFast size={18} />}
          loading={loading}
          onClick={handleSubmit}
          style={{ background: "#1677ff", fontWeight: 600 }}
        >
          {selectedCarrier === "GHN"
            ? "Xác nhận xuất kho & Bắn đơn GHN"
            : selectedCarrier === "SHOP_DELIVERY"
            ? "Xác nhận xuất kho & Tự giao hàng"
            : "Xác nhận xuất kho & Lưu vận đơn"}
        </Button>,
      ]}
    >
      {/* Carrier Selection Mode */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}
        styles={{ header: { backgroundColor: "#f8fafc", padding: "8px 16px" } }}
        title={
          <Space size={8}>
            <Routing size={16} color="#1677ff" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              Phương thức / Chế độ vận chuyển
            </span>
          </Space>
        }
      >
        <Radio.Group
          value={selectedCarrier}
          onChange={(e) => {
            const nextCarrier = e.target.value;
            setSelectedCarrier(nextCarrier);
            if (nextCarrier === "GHN") {
              handleCalculateFee();
            } else if (order?.shippingFee !== undefined && order?.shippingFee !== null) {
              setEstimatedFee(order.shippingFee);
            } else {
              setEstimatedFee(0);
            }
          }}
          style={{ width: "100%" }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="GHN"
                style={{
                  width: "100%",
                  height: "auto",
                  padding: "10px 12px",
                  borderRadius: 8,
                  textAlign: "left",
                  borderColor: selectedCarrier === "GHN" ? "#1677ff" : "#e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1677ff" }}>
                  <TruckFast size={18} color="#1677ff" />
                  <span>Giao Hàng Nhanh (GHN)</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Tự động đẩy đơn qua API GHN
                </div>
              </Radio.Button>
            </Col>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="SHOP_DELIVERY"
                style={{
                  width: "100%",
                  height: "auto",
                  padding: "10px 12px",
                  borderRadius: 8,
                  textAlign: "left",
                  borderColor: selectedCarrier === "SHOP_DELIVERY" ? "#16a34a" : "#e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#16a34a" }}>
                  <Shop size={18} color="#16a34a" />
                  <span>Cửa hàng tự giao</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Shipper nội bộ / Tự vận chuyển
                </div>
              </Radio.Button>
            </Col>
            <Col xs={24} sm={8}>
              <Radio.Button
                value="OTHER"
                style={{
                  width: "100%",
                  height: "auto",
                  padding: "10px 12px",
                  borderRadius: 8,
                  textAlign: "left",
                  borderColor: selectedCarrier === "OTHER" ? "#d97706" : "#e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#d97706" }}>
                  <Buildings size={18} color="#d97706" />
                  <span>Đơn vị ngoài</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  ViettelPost, GHTK, VNPost...
                </div>
              </Radio.Button>
            </Col>
          </Row>
        </Radio.Group>

        {selectedCarrier === "OTHER" && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              backgroundColor: "#fffbeb",
              borderRadius: 6,
              border: "1px solid #fde68a",
            }}
          >
            <Row gutter={12} align="middle">
              <Col xs={24} sm={10}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#92400e" }}>
                  Chọn hãng vận chuyển:
                </div>
                <Select
                  value={customCarrierName}
                  onChange={setCustomCarrierName}
                  style={{ width: "100%" }}
                >
                  <Select.Option value="VIETTEL_POST">Viettel Post</Select.Option>
                  <Select.Option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</Select.Option>
                  <Select.Option value="J_AND_T">J&T Express</Select.Option>
                  <Select.Option value="VNPOST">VNPost Bưu điện</Select.Option>
                  <Select.Option value="OTHER">Đối tác khác</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={14}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#92400e" }}>
                  Mã vận đơn thực tế: <span style={{ color: "#dc2626" }}>*</span>
                </div>
                <Input
                  placeholder="Ví dụ: VT123456789, S59123..."
                  value={customTrackingCode}
                  onChange={(e) => setCustomTrackingCode(e.target.value)}
                />
              </Col>
            </Row>
          </div>
        )}

        {selectedCarrier === "SHOP_DELIVERY" && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              backgroundColor: "#f0fdf4",
              borderRadius: 6,
              border: "1px solid #bbf7d0",
            }}
          >
            <Row gutter={12} align="middle">
              <Col xs={24} sm={14}>
                <div style={{ fontSize: 12, color: "#166534" }}>
                  Mã vận đơn nội bộ sẽ tự động sinh dạng <strong>SHOP-[MãĐơn]</strong> (hoặc bạn có thể tự nhập mã shipper bên dưới):
                </div>
              </Col>
              <Col xs={24} sm={10}>
                <Input
                  placeholder="Mã shipper / SĐT shipper (tùy chọn)"
                  value={customTrackingCode}
                  onChange={(e) => setCustomTrackingCode(e.target.value)}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <Card
        size="small"
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Space size={8}>
              <Box size={16} color="#1677ff" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Danh sách sản phẩm xuất kho</span>
              <Tag
                color={totalSelectedQty > 0 ? "processing" : "default"}
                style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}
              >
                Đã chọn: {totalSelectedQty}/{totalOrderQty} sản phẩm
              </Tag>
            </Space>
            <Button
              size="small"
              type="link"
              onClick={handlePackAll}
              style={{ padding: 0, fontWeight: 600, fontSize: 12, color: "#1677ff" }}
            >
              Đóng gói toàn bộ
            </Button>
          </div>
        }
        style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}
        styles={{ header: { backgroundColor: "#f8fafc", padding: "8px 16px" } }}
      >
        <Table
          dataSource={order?.orderResponses || []}
          columns={itemColumns}
          rowKey={(r, idx) => r.orderItemId || `row-${idx}`}
          pagination={false}
          size="small"
        />
      </Card>

      <Card
        size="small"
        title={
          <Space size={8}>
            <TruckFast size={16} color="#1677ff" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Thông số kiện hàng & Vận chuyển GHN</span>
          </Space>
        }
        style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
        styles={{ header: { backgroundColor: "#f8fafc", padding: "8px 16px" } }}
      >
        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            backgroundColor: "#f8fafc",
            borderRadius: 6,
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
            Chọn nhanh kích cỡ đóng gói chuẩn:
          </div>
          <Space wrap size={8}>
            <Button
              size="small"
              onClick={() => applyPresetSize(200, 25, 17, 3)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Túi S (1 áo • 200g • 25x17x3cm)
            </Button>
            <Button
              size="small"
              onClick={() => applyPresetSize(450, 30, 20, 5)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Túi M (2-3 áo/quần • 450g • 30x20x5cm)
            </Button>
            <Button
              size="small"
              onClick={() => applyPresetSize(700, 35, 25, 8)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Túi L (Áo khoác/combo • 700g • 35x25x8cm)
            </Button>
            <Button
              size="small"
              onClick={() => applyPresetSize(1000, 30, 20, 10)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Hộp Carton (Đơn lớn • 1kg • 30x20x10cm)
            </Button>
          </Space>
        </div>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="weight"
                label={<span style={{ fontWeight: 600 }}>Cân nặng (gram)</span>}
                rules={[{ required: true, message: "Vui lòng nhập cân nặng" }]}
                tooltip="Trọng lượng thực tế cả bao bì thùng carton"
              >
                <InputNumber<number>
                  min={10}
                  step={50}
                  style={{ width: "100%" }}
                  addonAfter="g"
                  onBlur={() => handleCalculateFee()}
                />
              </Form.Item>
            </Col>
            <Col xs={8} sm={4} md={6}>
              <Form.Item
                name="length"
                label={<span style={{ fontWeight: 600 }}>Dài (cm)</span>}
                rules={[{ required: true, message: "Nhập chiều dài" }]}
              >
                <InputNumber<number>
                  min={1}
                  style={{ width: "100%" }}
                  addonAfter="cm"
                  onBlur={() => handleCalculateFee()}
                />
              </Form.Item>
            </Col>
            <Col xs={8} sm={4} md={6}>
              <Form.Item
                name="width"
                label={<span style={{ fontWeight: 600 }}>Rộng (cm)</span>}
                rules={[{ required: true, message: "Nhập chiều rộng" }]}
              >
                <InputNumber<number>
                  min={1}
                  style={{ width: "100%" }}
                  addonAfter="cm"
                  onBlur={() => handleCalculateFee()}
                />
              </Form.Item>
            </Col>
            <Col xs={8} sm={4} md={6}>
              <Form.Item
                name="height"
                label={<span style={{ fontWeight: 600 }}>Cao (cm)</span>}
                rules={[{ required: true, message: "Nhập chiều cao" }]}
              >
                <InputNumber<number>
                  min={1}
                  style={{ width: "100%" }}
                  addonAfter="cm"
                  onBlur={() => handleCalculateFee()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="codAmount"
                label={<span style={{ fontWeight: 600 }}>Tiền thu hộ COD (VNĐ)</span>}
                tooltip="Số tiền shipper sẽ thu khi giao hàng (0đ nếu đã thanh toán online)"
              >
                <InputNumber<number>
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
                  addonAfter="₫"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="requiredNote"
                label={<span style={{ fontWeight: 600 }}>Ghi chú xem hàng</span>}
              >
                <Select>
                  <Select.Option value="CHOXEMHANGKHONGTHU">Cho xem hàng không cho thử</Select.Option>
                  <Select.Option value="CHOHANGXEM">Cho thử hàng</Select.Option>
                  <Select.Option value="KHONGCHOXEMHANG">Không cho xem hàng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label={<span style={{ fontWeight: 600 }}>Ghi chú cho shipper</span>}>
            <Input.TextArea rows={2} placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." />
          </Form.Item>

          <Divider style={{ margin: "14px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f0fdf4",
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid #bbf7d0",
            }}
          >
            <div>
              <Space size={8}>
                <Calculator size={20} color="#16a34a" />
                <span style={{ fontWeight: 600, color: "#166534" }}>Cước phí vận chuyển:</span>
              </Space>
              <div style={{ marginTop: 2, paddingLeft: 28 }}>
                <Button
                  size="small"
                  type="link"
                  loading={calculatingFee}
                  onClick={() => handleCalculateFee()}
                  style={{ padding: 0, height: "auto", fontSize: 12, color: "#15803d", fontWeight: 500 }}
                >
                  Tính lại cước
                </Button>
              </div>
            </div>
            <div>
              {calculatingFee ? (
                <Text type="secondary">Đang tính toán cước...</Text>
              ) : estimatedFee !== null ? (
                <span style={{ fontSize: 20, fontWeight: 700, color: "#15803d" }}>
                  {estimatedFee === 0 ? "Miễn phí (0 ₫)" : `${estimatedFee.toLocaleString("vi-VN")} ₫`}
                </span>
              ) : (
                <Text type="secondary">Chưa tính được cước</Text>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default CreateShipmentModal;
