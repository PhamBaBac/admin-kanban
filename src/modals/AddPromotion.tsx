/** @format */

import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Upload,
  UploadProps,
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import {
  GiftOutlined,
  BarcodeOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
  LinkOutlined,
  PlusOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { uploadFile } from "../utils/uploadFile";
import { PromotionModel } from "../models/PromotionModel";
import dayjs from "dayjs";
import { usePromotions } from "../hooks/usePromotions";
import { BsStars } from "react-icons/bs";
import { aiService } from "../services";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  promotion?: PromotionModel;
  onAddNew: (val: PromotionModel) => void;
}

const AddPromotion = (props: Props) => {
  const { visible, onClose, promotion, onAddNew } = props;

  const [imageUpload, setImageUpload] = useState<any[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [form] = Form.useForm();
  const watchedType = Form.useWatch("type", form) || "DISCOUNT";

  const {
    createPromotion,
    updatePromotion,
    loading: promotionLoading,
  } = usePromotions();

  useEffect(() => {
    if (visible && promotion) {
      form.setFieldsValue({
        ...promotion,
        startAt: promotion.startAt ? dayjs(promotion.startAt) : undefined,
        endAt: promotion.endAt ? dayjs(promotion.endAt) : undefined,
      });

      if (promotion.imageURL) {
        setImageUpload([
          { uid: "-1", name: "promotion-image.png", url: promotion.imageURL, status: "done" },
        ]);
        setImageUrlInput(promotion.imageURL);
      }
    } else if (visible && !promotion) {
      form.resetFields();
      setImageUpload([]);
      setImageUrlInput("");
    }
  }, [visible, promotion]);

  const handleClose = () => {
    form.resetFields();
    setImageUpload([]);
    setImageUrlInput("");
    onClose();
  };

  const handleAddImageFromUrl = () => {
    if (!imageUrlInput || !imageUrlInput.trim()) {
      message.warning("Vui lòng nhập đường link ảnh hợp lệ!");
      return;
    }
    const url = imageUrlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.warning("Đường link ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setImageUpload([
      {
        uid: "-1",
        name: "image-from-url.png",
        status: "done",
        url: url,
      },
    ]);
    message.success("Đã nạp ảnh từ đường link thành công!");
  };

  const handleAiGenerate = async () => {
    const title = form.getFieldValue("title");
    if (!title || !title.trim()) {
      message.warning("Vui lòng nhập tiêu đề khuyến mãi trước khi dùng AI viết mô tả!");
      return;
    }

    const code = form.getFieldValue("code");
    const value = form.getFieldValue("value");
    const type = form.getFieldValue("type");
    const contextParts: string[] = [];
    if (code) contextParts.push(`Mã code: ${code}`);
    if (value) contextParts.push(`Mức giảm: ${value}`);
    if (type) contextParts.push(`Loại: ${type}`);

    try {
      setIsGenerating(true);
      const res = await aiService.generateContent({
        type: "promotion_description",
        title: title.trim(),
        context: contextParts.length > 0 ? contextParts.join(", ") : undefined,
      });
      if (res) {
        form.setFieldValue("description", res);
        message.success("AI đã viết xong mô tả khuyến mãi!");
      }
    } catch (error: any) {
      console.error("AI generate promotion description error:", error);
      message.error(error?.message || "Lỗi khi AI tạo mô tả khuyến mãi");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    const items = newFileList.map((item) =>
      item.originFileObj
        ? {
            ...item,
            url: item.originFileObj
              ? URL.createObjectURL(item.originFileObj)
              : "",
            status: "done",
          }
        : { ...item }
    );

    setImageUpload(items);
  };

  const handleAddNewPromotion = async (values: any) => {
    let finalImageUrl = "";
    if (imageUpload.length > 0) {
      if (imageUpload[0].originFileObj) {
        finalImageUrl = await uploadFile(imageUpload[0].originFileObj);
      } else if (imageUpload[0].url) {
        finalImageUrl = imageUpload[0].url;
      }
    } else if (imageUrlInput && imageUrlInput.trim()) {
      finalImageUrl = imageUrlInput.trim();
    }

    if (!finalImageUrl) {
      message.error("Vui lòng tải lên hoặc dán link ảnh khuyến mãi!");
      return;
    }

    const start = values.startAt;
    const end = values.endAt;

    if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
      message.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu");
      return;
    }

    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    if (start) data.startAt = new Date(start);
    if (end) data.endAt = new Date(end);

    setIsLoading(true);

    try {
      data.imageURL = finalImageUrl;

      let res;
      if (promotion) {
        res = await updatePromotion({ ...data, id: promotion.id });
      } else {
        res = await createPromotion(data);
      }
      onAddNew(res);
      handleClose();
    } catch (error) {
      console.error("Save promotion error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      width={720}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: "#fdf2f8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#db2777",
            }}
          >
            <GiftOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              {promotion ? "Cập nhật chương trình khuyến mãi" : "Tạo chương trình khuyến mãi mới"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thiết lập mã giảm giá, mức ưu đãi và thời gian hiệu lực
            </Text>
          </div>
        </div>
      }
      open={visible}
      destroyOnClose
      onCancel={handleClose}
      okButtonProps={{
        loading: isLoading || promotionLoading,
      }}
      cancelButtonProps={{
        loading: isLoading || promotionLoading,
      }}
      okText={promotion ? "Lưu thay đổi" : "Tạo khuyến mãi"}
      cancelText="Hủy bỏ"
      onOk={() => form.submit()}
      style={{ top: 20 }}
    >
      <div style={{ marginTop: 12 }}>
        <Card
          size="small"
          title={
            <Space size={8}>
              <PictureOutlined style={{ color: "#db2777" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Banner / Hình ảnh khuyến mãi</span>
            </Space>
          }
          style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}
          headStyle={{ backgroundColor: "#f8fafc", padding: "8px 16px" }}
          bodyStyle={{ padding: "14px 16px" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <Upload
              accept="image/*"
              fileList={imageUpload}
              listType="picture-card"
              onChange={handleChange}
              onRemove={() => {
                setImageUpload([]);
                setImageUrlInput("");
              }}
            >
              {imageUpload.length === 0 ? (
                <div>
                  <PlusOutlined style={{ fontSize: 16, color: "#94a3b8" }} />
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Tải ảnh lên</div>
                </div>
              ) : null}
            </Upload>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hoặc dán trực tiếp đường link (URL) ảnh banner:
              </Text>
              <Space.Compact style={{ width: "100%", marginTop: 6 }}>
                <Input
                  prefix={<LinkOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="https://example.com/banner-khuyen-mai.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddImageFromUrl();
                  }}
                  allowClear
                />
                <Button type="primary" onClick={handleAddImageFromUrl}>
                  Nạp link ảnh
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Card>

        <Form
          form={form}
          disabled={isLoading || promotionLoading}
          onFinish={handleAddNewPromotion}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600 }}>Tên chương trình khuyến mãi</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên chương trình khuyến mãi" }]}
          >
            <Input placeholder="Ví dụ: Siêu hội săn sale 10/10, Giảm giá chào hè..." allowClear />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontWeight: 600 }}>Mô tả chi tiết</span>
                <Button
                  type="link"
                  size="small"
                  icon={<BsStars size={15} />}
                  loading={isGenerating}
                  onClick={handleAiGenerate}
                  style={{
                    padding: 0,
                    height: "auto",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#7928CA",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  AI viết mô tả
                </Button>
              </div>
            }
          >
            <Input.TextArea rows={3} placeholder="Nội dung điều kiện và chi tiết chương trình khuyến mãi..." allowClear />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span style={{ fontWeight: 600 }}>Mã Voucher / Khuyến mãi</span>}
                rules={[{ required: true, message: "Vui lòng nhập mã code" }]}
                extra={<Text type="secondary" style={{ fontSize: 11 }}>Khách hàng nhập mã này để nhận ưu đãi</Text>}
              >
                <Input
                  prefix={<BarcodeOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="VD: SALE10K, CHAOHANH..."
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label={<span style={{ fontWeight: 600 }}>Hình thức giảm giá</span>}
                initialValue="DISCOUNT"
              >
                <Select
                  options={[
                    {
                      label: (
                        <Space size={6}>
                          <DollarOutlined style={{ color: "#16a34a" }} />
                          <span>Giảm tiền mặt (VNĐ)</span>
                        </Space>
                      ),
                      value: "DISCOUNT",
                    },
                    {
                      label: (
                        <Space size={6}>
                          <PercentageOutlined style={{ color: "#1677ff" }} />
                          <span>Giảm theo phần trăm (%)</span>
                        </Space>
                      ),
                      value: "PERCENT",
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="value"
                label={<span style={{ fontWeight: 600 }}>Giá trị giảm</span>}
                rules={[{ required: true, message: "Vui lòng nhập giá trị giảm" }]}
              >
                <InputNumber<number>
                  style={{ width: "100%" }}
                  min={1}
                  max={watchedType === "PERCENT" ? 100 : undefined}
                  addonAfter={watchedType === "PERCENT" ? "%" : "₫"}
                  placeholder={watchedType === "PERCENT" ? "10, 20..." : "50,000"}
                  formatter={watchedType === "DISCOUNT" ? (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : undefined}
                  parser={watchedType === "DISCOUNT" ? (v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0) : undefined}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="numOfAvailable"
                label={<span style={{ fontWeight: 600 }}>Số lượt sử dụng tối đa</span>}
              >
                <InputNumber<number>
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="VD: 100 lượt"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startAt"
                label={<span style={{ fontWeight: 600 }}>Thời gian bắt đầu</span>}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm:ss"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời điểm bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endAt"
                label={<span style={{ fontWeight: 600 }}>Thời gian kết thúc</span>}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm:ss"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời điểm kết thúc"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default AddPromotion;
