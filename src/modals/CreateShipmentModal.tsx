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
} from "antd";
import { Box, TruckFast, Calculator } from "iconsax-react";
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

  useEffect(() => {
    if (visible && order) {
      // Khởi tạo số lượng đóng gói = số lượng trong đơn hàng
      const initialQtys: Record<string, number> = {};
      let calculatedWeight = 0;

      order.orderResponses.forEach((item, idx) => {
        const key = item.orderItemId || `item-${idx}`;
        initialQtys[key] = item.qty;
        calculatedWeight += 250 * item.qty; // Ước tính 250g / sản phẩm
      });

      setPackQuantities(initialQtys);

      const codValue = order.paymentType === "COD"
        ? order.orderResponses.reduce((sum, it) => sum + it.totalPrice, 0)
        : 0;

      form.setFieldsValue({
        weight: calculatedWeight > 0 ? calculatedWeight : 500,
        length: 20,
        width: 15,
        height: 10,
        codAmount: codValue,
        note: `Đơn hàng #${order.id.substring(0, 8)}`,
        requiredNote: "CHOXEMHANGKHONGTHU",
      });

      // Tự động tính cước ban đầu
      handleCalculateFee(calculatedWeight > 0 ? calculatedWeight : 500, 20, 15, 10);
    } else {
      form.resetFields();
      setEstimatedFee(null);
    }
  }, [visible, order]);

  const handleCalculateFee = async (weight?: number, length?: number, width?: number, height?: number) => {
    try {
      setCalculatingFee(true);
      const values = form.getFieldsValue();
      const fee = await shipmentService.calculateFee({
        orderId: order?.id,
        weight: weight ?? values.weight ?? 500,
        length: length ?? values.length ?? 20,
        width: width ?? values.width ?? 15,
        height: height ?? values.height ?? 10,
      });
      setEstimatedFee(fee);
    } catch (error) {
      console.error("Calculate fee error", error);
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleQuantityChange = (key: string, qty: number) => {
    const updated = { ...packQuantities, [key]: qty };
    setPackQuantities(updated);

    // Cập nhật lại cân nặng ước tính
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

      setLoading(true);
      await shipmentService.createShipment({
        orderId: order.id,
        weight: values.weight,
        length: values.length,
        width: values.width,
        height: values.height,
        codAmount: values.codAmount,
        note: values.note,
        requiredNote: values.requiredNote,
        items: itemsToPack,
      });

      message.success("Tạo vận đơn và xuất kho thành công! Đã gửi thông tin sang GHN.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Create shipment error", error);
      message.error(error?.response?.data?.message || error?.message || "Tạo vận đơn thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "title",
      key: "title",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.image && (
            <img
              src={record.image}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{record.title}</div>
            {(record.size || record.color) && (
              <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                {record.color && <ColorBadge color={record.color} size={12} />}
                {record.size && <span>Size: {record.size}</span>}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Số lượng đơn",
      dataIndex: "qty",
      key: "qty",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Số lượng đóng gói",
      key: "packQty",
      width: 140,
      align: "center" as const,
      render: (_: any, record: any, idx: number) => {
        const key = record.orderItemId || `item-${idx}`;
        return (
          <InputNumber
            min={0}
            max={record.qty}
            value={packQuantities[key] ?? record.qty}
            onChange={(val) => handleQuantityChange(key, val || 0)}
            style={{ width: 80 }}
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Box size={22} color="#1570ef" />
          <span style={{ fontWeight: 700 }}>Đóng gói & Kê khai vận đơn giao hàng</span>
          {order && <Text type="secondary">(Đơn #{order.id.substring(0, 8)})</Text>}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={760}
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
          style={{ background: "#1570ef" }}
        >
          Xác nhận xuất kho & Tạo đơn GHN
        </Button>,
      ]}
    >
      <Alert
        message="Kê khai thông số vận chuyển"
        description="Thông số cân nặng & kích thước sẽ được gửi trực tiếp đến đơn vị vận chuyển Giao Hàng Nhanh (GHN) để tính cước phí và in phiếu gửi hàng."
        type="info"
        showIcon
        icon={<InfoCircleOutlined style={{ fontSize: 20 }} />}
        style={{ marginBottom: 16 }}
      />

      <Card size="small" title="1. Danh sách sản phẩm đóng gói" style={{ marginBottom: 16 }}>
        <Table
          dataSource={order?.orderResponses || []}
          columns={itemColumns}
          rowKey={(r, idx) => r.orderItemId || `row-${idx}`}
          pagination={false}
          size="small"
        />
      </Card>

      <Card size="small" title="2. Kê khai cân nặng & kích thước đóng gói">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="weight"
                label="Cân nặng (gram)"
                rules={[{ required: true, message: "Vui lòng nhập cân nặng" }]}
                tooltip="Trọng lượng thực tế cả bao bì thùng carton"
              >
                <InputNumber
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
                label="Dài (cm)"
                rules={[{ required: true, message: "Nhập chiều dài" }]}
              >
                <InputNumber
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
                label="Rộng (cm)"
                rules={[{ required: true, message: "Nhập chiều rộng" }]}
              >
                <InputNumber
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
                label="Cao (cm)"
                rules={[{ required: true, message: "Nhập chiều cao" }]}
              >
                <InputNumber
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
                label="Tiền thu hộ COD (VNĐ)"
                tooltip="Số tiền shipper sẽ thu khi giao hàng (0đ nếu đã thanh toán online)"
              >
                <InputNumber
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
                label="Ghi chú xem hàng"
              >
                <Select>
                  <Select.Option value="CHOXEMHANGKHONGTHU">Cho xem hàng không cho thử</Select.Option>
                  <Select.Option value="CHOHANGXEM">Cho thử hàng</Select.Option>
                  <Select.Option value="KHONGCHOXEMHANG">Không cho xem hàng</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú cho shipper">
            <Input.TextArea rows={2} placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", padding: "12px 16px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <div>
              <Space>
                <Calculator size={20} color="#16a34a" />
                <span style={{ fontWeight: 600, color: "#166534" }}>Cước phí vận chuyển ước tính từ GHN:</span>
              </Space>
            </div>
            <div>
              {calculatingFee ? (
                <Text type="secondary">Đang tính toán cước...</Text>
              ) : estimatedFee !== null ? (
                <span style={{ fontSize: 18, fontWeight: 700, color: "#15803d" }}>
                  {estimatedFee.toLocaleString("vi-VN")} ₫
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
