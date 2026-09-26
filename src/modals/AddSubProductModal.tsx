/** @format */

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
  GiftOutlined,
  BarcodeOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  LinkOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import mediaAPI from "../apis/mediaAPI";
import { colors } from "../constants/colors";
import { ProductModel, SubProductModel } from "../models/Products";
import { SelectModel } from "../models/FormModel";
import { uploadFile } from "../utils/uploadFile";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { VND } from "../utils/handleCurrency";
import MediaPickerModal from "./MediaPickerModal";

const { Text, Title, Paragraph } = Typography;

const COLOR_PRESETS = [
  { label: "Đen", value: "#000000" },
  { label: "Trắng", value: "#ffffff" },
  { label: "Xám", value: "#808080" },
  { label: "Xanh Navy", value: "#001f3f" },
  { label: "Xanh Dương", value: "#1677ff" },
  { label: "Đỏ", value: "#ff4d4f" },
  { label: "Vàng Gold", value: "#faad14" },
  { label: "Xanh Lá", value: "#52c41a" },
  { label: "Hồng", value: "#eb2f96" },
  { label: "Tím", value: "#722ed1" },
];

const ATTRIBUTE_PRESETS: Record<string, string[]> = {
  "Dung lượng": ["64GB", "128GB", "256GB", "512GB", "1TB"],
  "Bộ nhớ": ["64GB", "128GB", "256GB", "512GB", "1TB"],
  "Size": ["S", "M", "L", "XL", "2XL", "3XL"],
  "Kích cỡ": ["38", "39", "40", "41", "42", "43"],
  "RAM": ["4GB", "8GB", "16GB", "32GB", "64GB"],
  "Chất liệu": ["Cotton", "Da thật", "Nhôm nguyên khối", "Thép không gỉ", "Nhựa ABS"],
  "Phiên bản": ["Tiêu chuẩn (Standard)", "Cao cấp (Pro)", "Đặc biệt (Limited)"],
};

interface Props {
  visible: boolean;
  onClose: () => void;
  product?: ProductModel;
  onAddNew: (val: SubProductModel) => void;
  subProduct?: SubProductModel;
  initialValues?: Partial<SubProductModel> | any;
}

const AddSubProductModal = (props: Props) => {
  const { visible, onClose, product, onAddNew, subProduct, initialValues } = props;

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [options, setOptions] = useState<SelectModel[]>([]);

  const [form] = Form.useForm();

  // Watchers for calculations
  const watchedPrice = Form.useWatch("price", form) || 0;
  const watchedCost = Form.useWatch("cost", form) || 0;
  const watchedDiscountType = Form.useWatch("discountType", form) || "NONE";
  const watchedDiscountValue = Form.useWatch("discountValue", form) || 0;

  // Tính số tiền giảm và giá bán thực tế theo 2 loại PromotionType (PERCENT hoặc DISCOUNT)
  let discountAmount = 0;
  let discountPercent = 0;

  if (watchedDiscountType === "PERCENT") {
    discountPercent = Math.min(100, Math.max(0, watchedDiscountValue));
    discountAmount = Math.round((watchedPrice * discountPercent) / 100);
  } else if (watchedDiscountType === "DISCOUNT") {
    discountAmount = Math.min(watchedPrice, Math.max(0, watchedDiscountValue));
    discountPercent = watchedPrice > 0 ? (discountAmount / watchedPrice) * 100 : 0;
  }

  const effectivePrice = Math.max(0, watchedPrice - discountAmount);
  const profitPerUnit = effectivePrice - (watchedCost || 0);
  const marginPercent = effectivePrice > 0 ? (profitPerUnit / effectivePrice) * 100 : 0;

  const isLoss = (watchedCost || 0) > 0 && profitPerUnit < 0;
  const isThinMargin = (watchedCost || 0) > 0 && profitPerUnit >= 0 && marginPercent < 15;
  const isGoodMargin = (watchedCost || 0) > 0 && marginPercent >= 15;

  const {
    createSubProduct: createSubProductHook,
    updateSubProduct: updateSubProductHook,
  } = useProducts();

  useEffect(() => {
    if (visible) {
      setFileUrl("");
      if (subProduct) {
        let customAttributes: { name: string; value: string }[] = [];
        if (subProduct.attributes && typeof subProduct.attributes === "object") {
          customAttributes = Object.entries(subProduct.attributes)
            .filter(
              ([k]) =>
                k.toLowerCase() !== "color" &&
                k.toLowerCase() !== "màu sắc" &&
                k !== "discountType" &&
                k !== "discountValue" &&
                k !== "discountAmount"
            )
            .map(([name, value]) => ({ name, value: String(value ?? "") }));
        } else if (subProduct.size) {
          customAttributes = [{ name: "Size", value: subProduct.size }];
        }

        // Nhận diện loại giảm giá (2 loại: PERCENT hoặc DISCOUNT)
        let initialDiscountType = "NONE";
        let initialDiscountValue = 0;

        if (subProduct.attributes?.discountType) {
          initialDiscountType = subProduct.attributes.discountType;
          initialDiscountValue = Number(subProduct.attributes.discountValue) || 0;
        } else if (
          subProduct.discount &&
          subProduct.discount < subProduct.price &&
          subProduct.discount > 0
        ) {
          const diff = subProduct.price - subProduct.discount;
          const pct = Math.round((diff / subProduct.price) * 100);
          if (pct > 0 && Math.abs((subProduct.price * pct) / 100 - diff) < 1) {
            initialDiscountType = "PERCENT";
            initialDiscountValue = pct;
          } else {
            initialDiscountType = "DISCOUNT";
            initialDiscountValue = diff;
          }
        }

        form.setFieldsValue({
          ...subProduct,
          sku: subProduct.sku || "",
          qty:
            subProduct.qty !== undefined && subProduct.qty !== null
              ? subProduct.qty
              : subProduct.stock,
          cost: subProduct.cost ?? 0,
          price: subProduct.price ?? 0,
          discountType: initialDiscountType,
          discountValue: initialDiscountValue,
          customAttributes:
            customAttributes.length > 0
              ? customAttributes
              : [{ name: "Dung lượng", value: "" }],
        });

        if (subProduct.images && subProduct.images.length > 0) {
          const items = subProduct.images.map((item, index) => ({
            uid: `sub-img-${index}-${Date.now()}`,
            name: `image-${index + 1}.png`,
            url: typeof item === "string" ? item : item.url,
            status: "done",
          }));
          setFileList(items);
        } else {
          setFileList([]);
        }
      } else if (initialValues) {
        let customAttributes: { name: string; value: string }[] = [];
        if (
          initialValues.attributes &&
          typeof initialValues.attributes === "object"
        ) {
          customAttributes = Object.entries(initialValues.attributes)
            .filter(
              ([k]) =>
                k.toLowerCase() !== "color" &&
                k.toLowerCase() !== "màu sắc" &&
                k !== "discountType" &&
                k !== "discountValue" &&
                k !== "discountAmount"
            )
            .map(([name, value]) => ({ name, value: String(value ?? "") }));
        } else if (initialValues.size) {
          customAttributes = [{ name: "Size", value: initialValues.size }];
        }

        form.setFieldsValue({
          ...initialValues,
          sku: initialValues.sku ? `${initialValues.sku}-COPY` : "",
          color: initialValues.color || colors.primary500,
          price: initialValues.price !== undefined ? initialValues.price : 0,
          qty:
            initialValues.qty !== undefined
              ? initialValues.qty
              : initialValues.stock ?? 10,
          cost: initialValues.cost !== undefined ? initialValues.cost : 0,
          discountType: initialValues.attributes?.discountType || "NONE",
          discountValue: Number(initialValues.attributes?.discountValue) || 0,
          customAttributes:
            customAttributes.length > 0
              ? customAttributes
              : [{ name: "Dung lượng", value: "" }],
        });

        if (initialValues.images && initialValues.images.length > 0) {
          const items = initialValues.images.map((img: any, index: number) => ({
            uid: `init-img-${index}-${Date.now()}`,
            name: `image-${index + 1}.png`,
            url: typeof img === "string" ? img : img.url || "",
            status: "done",
          }));
          setFileList(items);
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        setFileList([]);
        form.setFieldsValue({
          color: "#000000",
          qty: 10,
          price: 0,
          cost: 0,
          discountType: "NONE",
          discountValue: 0,
          customAttributes: [{ name: "Dung lượng", value: "" }],
        });
      }
    }
  }, [visible, subProduct, initialValues, form]);

  // Auto-generate SKU helper
  const handleAutoGenerateSku = () => {
    const title = product?.title || "SP";
    const cleanTitle = title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .substring(0, 6);

    const values = form.getFieldsValue();
    let variantPart = "";

    if (values.customAttributes && Array.isArray(values.customAttributes)) {
      const firstAttr = values.customAttributes.find((a: any) => a?.value);
      if (firstAttr) {
        variantPart = `-${firstAttr.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;
      }
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedSku = `${cleanTitle}${variantPart}-${randomSuffix}`;
    form.setFieldValue("sku", generatedSku);
    message.success(`Đã tạo mã SKU gợi ý: ${generatedSku}`);
  };

  const handleAddSubproduct = async (values: any) => {
    if (isLoading) return;

    const productId = id ? id : product ? product.id : values.productId;

    if (!productId) {
      message.error("Vui lòng chọn hoặc liên kết sản phẩm chính!");
      return;
    }

    setIsLoading(true);

    try {
      const data: any = {};

      for (const i in values) {
        if (
          i !== "customAttributes" &&
          i !== "discountType" &&
          i !== "discountValue"
        ) {
          data[i] = values[i] ?? "";
        }
      }
      data.productId = productId;

      if (data.color) {
        data.color =
          typeof data.color === "string"
            ? data.color
            : data.color.toHexString();
      }

      // Xử lý Dynamic Attributes
      const attributesObj: Record<string, string> = {};
      if (values.customAttributes && Array.isArray(values.customAttributes)) {
        values.customAttributes.forEach((attr: any) => {
          if (attr && attr.name && attr.value) {
            const attrName = String(attr.name).trim();
            const attrVal = String(attr.value).trim();
            if (attrName && attrVal) {
              attributesObj[attrName] = attrVal;
              if (!data.size) {
                data.size = attrVal;
              }
            }
          }
        });
      }
      if (data.color && !attributesObj["Màu sắc"] && !attributesObj["Color"]) {
        attributesObj["Màu sắc"] = data.color;
      }

      // XỬ LÝ 2 LOẠI GIẢM GIÁ (PERCENT hoặc DISCOUNT)
      const basePrice = Number(values.price ?? 0);
      let calculatedSalePrice = basePrice;
      let calculatedDiscountAmount = 0;

      if (values.discountType === "PERCENT") {
        const pct = Math.min(100, Math.max(0, Number(values.discountValue || 0)));
        calculatedDiscountAmount = Math.round((basePrice * pct) / 100);
        calculatedSalePrice = Math.max(0, basePrice - calculatedDiscountAmount);
      } else if (values.discountType === "DISCOUNT") {
        calculatedDiscountAmount = Math.min(
          basePrice,
          Math.max(0, Number(values.discountValue || 0))
        );
        calculatedSalePrice = Math.max(0, basePrice - calculatedDiscountAmount);
      }

      // Đảm bảo không lưu các trường giá / giảm giá vào bảng thuộc tính phân loại (attributes)
      delete attributesObj["discountType"];
      delete attributesObj["discountValue"];
      delete attributesObj["discountAmount"];
      delete attributesObj["price"];
      delete attributesObj["cost"];
      delete attributesObj["stock"];
      delete attributesObj["qty"];

      data.attributes = attributesObj;
      data.price = basePrice;
      // Shopping app đọc subProduct.discount làm giá bán khuyến mãi (sale price)
      data.discount = calculatedDiscountAmount > 0 ? calculatedSalePrice : 0;

      // Đồng bộ stock & qty
      const finalQty = Number(values.qty ?? 0);
      data.qty = finalQty;
      data.stock = finalQty;
      data.cost = Number(values.cost ?? 0);
      data.sku = values.sku ? String(values.sku).trim().toUpperCase() : "";

      const fileListSafe = [...(fileList || [])];
      if (
        fileUrl &&
        fileUrl.trim() &&
        (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))
      ) {
        fileListSafe.push({
          uid: `${Date.now()}`,
          name: `image-${fileListSafe.length + 1}.png`,
          url: fileUrl.trim(),
          status: "done",
        });
      }

      if (fileListSafe.length > 0) {
        const promises = fileListSafe
          .filter((file) => file.originFileObj)
          .map(async (file) => {
            const url = await uploadFile(file.originFileObj);
            return url;
          });

        const uploadedUrls = await Promise.all(promises);

        const oldImageUrls = fileListSafe
          .filter((file) => !file.originFileObj && file.url)
          .map((file) => file.url);

        data.images = [...oldImageUrls, ...uploadedUrls];
      } else {
        data.images = [];
      }

      if (!product) {
        onAddNew({
          ...data,
          product: options?.find((item) => item.value === data.productId),
        });
        handleCancel();
      } else {
        await createSubProduct(data);
      }
    } catch (error: any) {
      console.error(error);
      message.error(error?.message || "Có lỗi xảy ra khi lưu phân loại sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const createSubProduct = async (data: any) => {
    if (subProduct) {
      data.id = subProduct.id;
    }
    let created;
    if (subProduct) {
      created = await updateSubProductHook(data);
      message.success("Cập nhật biến thể sản phẩm thành công!");
    } else {
      created = await createSubProductHook(data);
      message.success("Thêm mới biến thể sản phẩm thành công!");
    }
    onAddNew(created);
    handleCancel();
    onClose();
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setFileUrl("");
    onClose();
  };

  const handleAddImageUrlToSubProduct = () => {
    if (!fileUrl || !fileUrl.trim()) {
      message.warning("Vui lòng nhập đường link ảnh hợp lệ!");
      return;
    }
    const url = fileUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      message.warning("Đường link ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    const newItem = {
      uid: `${Date.now()}`,
      name: `image-${(fileList || []).length + 1}.png`,
      status: "done",
      url: url,
    };
    setFileList((prev) => [...(prev || []), newItem]);

    mediaAPI
      .saveMedia({
        url: url,
        fileName: `image-${(fileList || []).length + 1}.png`,
        fileType: "image/url",
      })
      .catch((err) => console.warn("Lưu media ngầm thất bại:", err));

    setFileUrl("");
    message.success("Đã nạp ảnh từ đường link thành công!");
  };

  const handlePreview = async (file: any) => {
    setPreviewImage(file.url || file.preview || "");
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    const items = newFileList.map((item) =>
      item.originFileObj
        ? {
            ...item,
            url: item.originFileObj ? URL.createObjectURL(item.originFileObj) : "",
            status: "done",
          }
        : { ...item }
    );
    setFileList(items);
  };

  return (
    <Modal
      width={800}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 24 }}>
          <Space size={10}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1677ff",
              }}
            >
              <AppstoreOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                {subProduct
                  ? "Cập nhật biến thể sản phẩm"
                  : initialValues
                  ? "Nhân bản biến thể sản phẩm"
                  : "Thêm biến thể sản phẩm mới"}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Thiết lập định danh, thuộc tính, giá bán và hình ảnh cho biến thể
              </Text>
            </div>
          </Space>
          {product?.title && (
            <Tag
              color="processing"
              style={{
                fontSize: 12,
                padding: "2px 10px",
                borderRadius: 12,
                border: "1px solid #bfdbfe",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 500,
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {product.title}
            </Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={isLoading ? undefined : handleCancel}
      onOk={() => {
        if (!isLoading) {
          form.submit();
        }
      }}
      okText={subProduct ? "Lưu thay đổi" : "Tạo biến thể"}
      cancelText="Hủy bỏ"
      okButtonProps={{
        loading: isLoading,
        disabled: isLoading,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      closable={!isLoading}
      maskClosable={!isLoading}
      style={{ top: 20 }}
    >
      <Form
        layout="vertical"
        onFinish={handleAddSubproduct}
        form={form}
        disabled={isLoading}
        style={{ marginTop: 16 }}
      >
        {!product && (
          <Form.Item
            name={"productId"}
            label="Sản phẩm chính"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm chính" }]}
          >
            <Select
              allowClear
              options={options}
              showSearch
              placeholder="Chọn sản phẩm liên kết"
            />
          </Form.Item>
        )}

        {/* SECTION 1: ĐỊNH DANH VÀ THUỘC TÍNH */}
        <Card
          size="small"
          title={
            <Space size={8}>
              <BarcodeOutlined style={{ color: "#1677ff", fontSize: 15 }} />
              <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                Định danh & Thuộc tính phân loại
              </Text>
            </Space>
          }
          style={{
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          headStyle={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            padding: "8px 16px",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="sku"
                label={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <span>Mã SKU phân loại</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<ThunderboltOutlined />}
                      onClick={handleAutoGenerateSku}
                      style={{ padding: 0, height: "auto", fontSize: 12 }}
                    >
                      Tạo tự động
                    </Button>
                  </div>
                }
                extra={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Mã định danh quản lý kho duy nhất (VD: IPHONE15-128G-BLK)
                  </Text>
                }
              >
                <Input
                  prefix={<BarcodeOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Nhập mã SKU hoặc bấm 'Tạo tự động'"
                  style={{ textTransform: "uppercase" }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="color"
                label={
                  <Space size={6}>
                    <BgColorsOutlined style={{ color: "#64748b" }} />
                    <span>Màu sắc đại diện</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: "100%" }} size={6}>
                  <ColorPicker
                    format="hex"
                    showText
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {COLOR_PRESETS.map((c) => {
                      const currentColor = form.getFieldValue("color");
                      const isSelected = currentColor?.toLowerCase() === c.value.toLowerCase();
                      return (
                        <Tooltip key={c.value} title={`${c.label} (${c.value})`}>
                          <div
                            onClick={() => form.setFieldValue("color", c.value)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              backgroundColor: c.value,
                              border: isSelected ? "2px solid #1677ff" : "1px solid #d1d5db",
                              boxShadow: isSelected ? "0 0 0 2px rgba(22, 119, 255, 0.2)" : undefined,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </div>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                  Thuộc tính bổ sung
                </Text>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Dung lượng, Size, RAM, Bộ nhớ, Phiên bản...
                </div>
              </div>
            </div>

            <Form.List name="customAttributes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => {
                    const currentAttrName = form.getFieldValue([
                      "customAttributes",
                      name,
                      "name",
                    ]);
                    const presets = ATTRIBUTE_PRESETS[currentAttrName] || [];

                    return (
                      <div
                        key={key}
                        style={{
                          backgroundColor: "#f8fafc",
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          marginBottom: 8,
                        }}
                      >
                        <Space style={{ display: "flex", width: "100%" }} align="center">
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            rules={[{ required: true, message: "Chọn thuộc tính" }]}
                            style={{ minWidth: 170, marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Tên thuộc tính"
                              options={[
                                { label: "Dung lượng", value: "Dung lượng" },
                                { label: "Size (Kích cỡ)", value: "Size" },
                                { label: "RAM", value: "RAM" },
                                { label: "Bộ nhớ", value: "Bộ nhớ" },
                                { label: "Chất liệu", value: "Chất liệu" },
                                { label: "Phiên bản", value: "Phiên bản" },
                              ]}
                              allowClear
                              showSearch
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "value"]}
                            rules={[{ required: true, message: "Nhập giá trị" }]}
                            style={{ flex: 1, minWidth: 240, marginBottom: 0 }}
                          >
                            <Input placeholder="Giá trị (VD: 128GB, XL, Đen bóng...)" />
                          </Form.Item>
                          {fields.length > 1 && (
                            <Tooltip title="Xóa thuộc tính này">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                                style={{ borderRadius: 4 }}
                              />
                            </Tooltip>
                          )}
                        </Space>

                        {/* Preset chips for fast input */}
                        {presets.length > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Gợi ý nhanh:
                            </Text>
                            {presets.map((presetVal) => (
                              <Tag
                                key={presetVal}
                                style={{
                                  cursor: "pointer",
                                  fontSize: 11,
                                  borderRadius: 4,
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                }}
                                onClick={() => {
                                  form.setFieldValue(
                                    ["customAttributes", name, "value"],
                                    presetVal
                                  );
                                }}
                              >
                                {presetVal}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 4, borderRadius: 6 }}
                  >
                    Thêm thuộc tính phân loại
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </Card>

        {/* SECTION 2: QUẢN LÝ TỒN KHO & ĐỊNH GIÁ BÁN */}
        <Card
          size="small"
          title={
            <Space size={8}>
              <DollarOutlined style={{ color: "#1677ff", fontSize: 15 }} />
              <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                Quản lý Tồn kho & Định giá bán
              </Text>
            </Space>
          }
          style={{
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          headStyle={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            padding: "8px 16px",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="qty"
                label="Tồn kho ban đầu"
                rules={[{ required: true, message: "Nhập số lượng tồn" }]}
                extra={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Số lượng nhập khởi tạo
                  </Text>
                }
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cost"
                label="Giá vốn (Nhập hàng)"
                rules={[{ required: true, message: "Nhập giá vốn" }]}
                extra={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Dùng để tính lãi gộp
                  </Text>
                }
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="₫"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Giá bán niêm yết (Gốc)"
                rules={[{ required: true, message: "Nhập giá bán" }]}
                extra={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Giá niêm yết trước giảm
                  </Text>
                }
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="₫"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          {/* KHỐI CẤU HÌNH GIẢM GIÁ */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Space size={8}>
                <GiftOutlined style={{ color: "#1677ff", fontSize: 16 }} />
                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                  Chương trình Giảm giá riêng cho biến thể
                </Text>
              </Space>
              <Form.Item name="discountType" initialValue="NONE" noStyle>
                <Radio.Group
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                  onChange={(e) => {
                    if (e.target.value === "NONE") {
                      form.setFieldValue("discountValue", 0);
                    }
                  }}
                >
                  <Radio.Button value="NONE">Không giảm</Radio.Button>
                  <Radio.Button value="PERCENT">
                    <Space size={4}>
                      <PercentageOutlined />
                      <span>Giảm theo %</span>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="DISCOUNT">
                    <Space size={4}>
                      <DollarOutlined />
                      <span>Giảm tiền mặt</span>
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>

            {watchedDiscountType === "PERCENT" && (
              <div>
                <Row gutter={16} align="middle">
                  <Col span={10}>
                    <Form.Item
                      name="discountValue"
                      label="Mức giảm theo phần trăm (%)"
                      style={{ marginBottom: 6 }}
                      rules={[{ required: true, message: "Nhập % giảm (1-100)" }]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        style={{ width: "100%" }}
                        addonAfter="%"
                        placeholder="VD: 15, 20"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <div style={{ marginTop: 12 }}>
                      <Space size={6} wrap>
                        <Text type="secondary" style={{ fontSize: 12 }}>Gợi ý % nhanh:</Text>
                        {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                          <Tag
                            key={pct}
                            color={watchedDiscountValue === pct ? "blue" : undefined}
                            style={{ cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}
                            onClick={() => form.setFieldValue("discountValue", pct)}
                          >
                            -{pct}%
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {watchedDiscountType === "DISCOUNT" && (
              <div>
                <Row gutter={16} align="middle">
                  <Col span={10}>
                    <Form.Item
                      name="discountValue"
                      label="Số tiền giảm trực tiếp (VND)"
                      style={{ marginBottom: 6 }}
                      rules={[{ required: true, message: "Nhập số tiền giảm" }]}
                    >
                      <InputNumber<number>
                        min={1000}
                        max={watchedPrice || undefined}
                        style={{ width: "100%" }}
                        addonAfter="₫"
                        placeholder="VD: 50,000"
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <div style={{ marginTop: 12 }}>
                      <Space size={6} wrap>
                        <Text type="secondary" style={{ fontSize: 12 }}>Gợi ý số tiền nhanh:</Text>
                        {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                          <Tag
                            key={amt}
                            color={watchedDiscountValue === amt ? "blue" : undefined}
                            style={{ cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}
                            onClick={() => form.setFieldValue("discountValue", amt)}
                          >
                            -{VND.format(amt)}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {watchedDiscountType === "NONE" && (
              <div style={{ color: "#64748b", fontSize: 12 }}>
                Biến thể sẽ bán theo đúng giá niêm yết (Không áp dụng chương trình giảm giá riêng).
              </div>
            )}
          </div>

          {/* REAL-TIME PROFIT MARGIN & UNIT ECONOMICS KPI BAR */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              backgroundColor: isLoss ? "#fff1f0" : isThinMargin ? "#fffbe6" : "#f6ffed",
              border: `1px solid ${isLoss ? "#ffa39e" : isThinMargin ? "#ffe58f" : "#b7eb8f"}`,
            }}
          >
            {/* Status alert message */}
            {isLoss && (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
                message="Cảnh báo: Bán dưới giá vốn"
                description={`Giá bán (${VND.format(effectivePrice)}) thấp hơn giá vốn (${VND.format(watchedCost)}). Mỗi sản phẩm bán ra sẽ lỗ ${VND.format(Math.abs(profitPerUnit))}.`}
                style={{ marginBottom: 12, borderRadius: 6 }}
              />
            )}
            {isThinMargin && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="Biên lợi nhuận mỏng (< 15%)"
                description={`Biên lãi gộp hiện tại đạt ${marginPercent.toFixed(1)}%. Cân nhắc tối ưu giá vốn hoặc giá bán.`}
                style={{ marginBottom: 12, borderRadius: 6 }}
              />
            )}
            {isGoodMargin && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="Biên lợi nhuận an toàn"
                description={`Biên lãi gộp đạt ${marginPercent.toFixed(1)}%, tạo ra ${VND.format(profitPerUnit)} lợi nhuận trên mỗi đơn vị.`}
                style={{ marginBottom: 12, borderRadius: 6 }}
              />
            )}

            <Row gutter={[12, 12]} align="middle">
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Giá niêm yết</Text>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: discountAmount > 0 ? "line-through" : undefined,
                      color: discountAmount > 0 ? "#94a3b8" : "#1e293b",
                    }}
                  >
                    {VND.format(watchedPrice)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Mức giảm</Text>
                  <div style={{ fontWeight: 600, fontSize: 14, color: discountAmount > 0 ? "#dc2626" : "#64748b" }}>
                    {discountAmount > 0 ? `-${VND.format(discountAmount)} (${discountPercent.toFixed(0)}%)` : "0₫"}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Khách trả thực tế</Text>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1677ff" }}>
                    {VND.format(effectivePrice)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Lãi gộp & Biên</Text>
                    <Tag
                      color={isLoss ? "error" : isThinMargin ? "warning" : "success"}
                      style={{ fontSize: 10, fontWeight: 700, margin: 0, padding: "0 4px", borderRadius: 4 }}
                    >
                      {marginPercent.toFixed(1)}%
                    </Tag>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: profitPerUnit >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {profitPerUnit >= 0 ? `+${VND.format(profitPerUnit)}` : VND.format(profitPerUnit)}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        {/* SECTION 3: HÌNH ẢNH BIẾN THỂ */}
        <Card
          size="small"
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space size={8}>
                <PictureOutlined style={{ color: "#1677ff", fontSize: 15 }} />
                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                  Hình ảnh riêng cho biến thể
                </Text>
              </Space>
              <Button
                type="link"
                icon={<PictureOutlined />}
                onClick={() => setMediaPickerOpen(true)}
                disabled={isLoading}
                style={{ padding: 0, fontSize: 12 }}
              >
                Chọn từ thư viện ảnh
              </Button>
            </div>
          }
          style={{
            marginBottom: 8,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          headStyle={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            padding: "8px 16px",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <Upload
            multiple
            fileList={fileList}
            accept="image/*"
            listType="picture-card"
            onChange={handleChange}
            onPreview={handlePreview}
            onRemove={(file) => {
              setFileList((prev) =>
                (prev || []).filter((item) => item.uid !== file.uid)
              );
            }}
            disabled={isLoading}
          >
            <div>
              <PlusOutlined style={{ fontSize: 18, color: "#94a3b8" }} />
              <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Tải ảnh lên</div>
            </div>
          </Upload>

          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hoặc dán trực tiếp đường link ảnh (URL):
            </Text>
            <Space.Compact style={{ width: "100%", marginTop: 6 }}>
              <Input
                prefix={<LinkOutlined style={{ color: "#94a3b8" }} />}
                placeholder="https://example.com/hinh-anh-san-pham.jpg"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleAddImageUrlToSubProduct();
                }}
                allowClear
                disabled={isLoading}
              />
              <Button
                type="primary"
                onClick={handleAddImageUrlToSubProduct}
                disabled={isLoading}
              >
                Nạp link ảnh
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </Form>

      {previewImage && (
        <Image
          wrapperStyle={{ display: "none" }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(""),
          }}
          src={previewImage}
        />
      )}

      {/* Modal chọn ảnh từ thư viện */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(media) => {
          const newItem = {
            uid: `media-${media.id || Date.now()}`,
            name: media.fileName || `image-${(fileList || []).length + 1}.png`,
            status: "done",
            url: media.url,
          };
          setFileList((prev) => [...(prev || []), newItem]);
          message.success("Đã thêm ảnh từ thư viện");
        }}
      />
    </Modal>
  );
};

export default AddSubProductModal;
