/** @format */

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Segmented,
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
  CameraOutlined,
  EyeOutlined,
  CloseOutlined,
  InboxOutlined,
  WalletOutlined,
  TagOutlined,
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

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [options, setOptions] = useState<SelectModel[]>([]);

  const primaryImage =
    fileList && fileList.length > 0
      ? fileList[0].url ||
        fileList[0].preview ||
        (fileList[0].originFileObj
          ? URL.createObjectURL(fileList[0].originFileObj)
          : "")
      : "";

  const handleQuickImageUpload = (file: any) => {
    const newFileItem = {
      uid: `sub-img-primary-${Date.now()}`,
      name: file.name || "variant-primary.png",
      status: "done",
      originFileObj: file,
      url: URL.createObjectURL(file),
    };
    setFileList((prev) => [
      newFileItem,
      ...(prev || []).filter((item) => item.uid !== newFileItem.uid),
    ]);
    message.success("Đã chọn ảnh đại diện sản phẩm cho màu này!");
    return false;
  };

  const handleRemovePrimaryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileList((prev) => (prev || []).slice(1));
    message.info("Đã gỡ ảnh đại diện");
  };

  const handlePreviewPrimaryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryImage) {
      setPreviewImage(primaryImage);
      setPreviewOpen(true);
    }
  };

  const [form] = Form.useForm();

  const watchedPrice = Form.useWatch("price", form) || 0;
  const watchedCost = Form.useWatch("cost", form) || 0;
  const watchedDiscountType = Form.useWatch("discountType", form) || "NONE";
  const watchedDiscountValue = Form.useWatch("discountValue", form) || 0;

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
      form.resetFields();

      if (subProduct) {
        let rawAttrs: any = subProduct.attributes;
        if (typeof rawAttrs === "string") {
          try {
            rawAttrs = JSON.parse(rawAttrs);
          } catch {
            rawAttrs = {};
          }
        }
        if (!rawAttrs || typeof rawAttrs !== "object") {
          rawAttrs = {};
        }

        let customAttributes: { name: string; value: string }[] = [];
        if (Array.isArray(rawAttrs)) {
          customAttributes = rawAttrs
            .map((item: any) => ({
              name: String(item.name || item.key || "").trim(),
              value: String(item.value ?? "").trim(),
            }))
            .filter((item) => item.name);
        } else {
          customAttributes = Object.entries(rawAttrs)
            .filter(([k]) => {
              const lower = k.trim().toLowerCase();
              return (
                lower !== "color" &&
                lower !== "màu sắc" &&
                lower !== "mau sac" &&
                lower !== "màu" &&
                lower !== "mau" &&
                lower !== "discounttype" &&
                lower !== "discountvalue" &&
                lower !== "discountamount" &&
                lower !== "price" &&
                lower !== "cost" &&
                lower !== "stock" &&
                lower !== "qty"
              );
            })
            .map(([name, value]) => ({
              name: name.trim(),
              value: String(value ?? "").trim(),
            }));
        }

        if (
          subProduct.size &&
          !customAttributes.some((a) => a.name.toLowerCase() === "size")
        ) {
          customAttributes.unshift({
            name: "Size",
            value: String(subProduct.size).trim(),
          });
        }

        let initialDiscountType = "NONE";
        let initialDiscountValue = 0;

        if (rawAttrs?.discountType) {
          initialDiscountType = rawAttrs.discountType;
          initialDiscountValue = Number(rawAttrs.discountValue) || 0;
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

        const existingColor =
          subProduct.color ||
          rawAttrs?.["Màu sắc"] ||
          rawAttrs?.["Color"] ||
          rawAttrs?.["màu sắc"] ||
          rawAttrs?.["color"] ||
          rawAttrs?.["Mau sac"] ||
          rawAttrs?.["mau sac"] ||
          rawAttrs?.["Màu"] ||
          rawAttrs?.["màu"] ||
          "";

        const existingQty =
          subProduct.qty !== undefined && subProduct.qty !== null
            ? subProduct.qty
            : subProduct.stock !== undefined && subProduct.stock !== null
            ? subProduct.stock
            : (subProduct as any).quantity ?? 0;

        form.setFieldsValue({
          ...subProduct,
          productId: subProduct.productId || product?.id || id || undefined,
          sku: subProduct.sku || "",
          color: existingColor,
          qty: existingQty,
          cost: Number(subProduct.cost ?? 0),
          price: Number(subProduct.price ?? 0),
          discountType: initialDiscountType,
          discountValue: initialDiscountValue,
          customAttributes:
            customAttributes.length > 0
              ? customAttributes
              : [{ name: "", value: "" }],
        });

        let rawImages: any = subProduct.images;
        if (typeof rawImages === "string") {
          try {
            rawImages = JSON.parse(rawImages);
          } catch {
            if (rawImages.startsWith("http")) {
              rawImages = [rawImages];
            } else {
              rawImages = [];
            }
          }
        }

        if (Array.isArray(rawImages) && rawImages.length > 0) {
          const items = rawImages
            .map((item: any, index: number) => ({
              uid: `sub-img-${index}-${Date.now()}`,
              name: `image-${index + 1}.png`,
              url: typeof item === "string" ? item : item?.url || "",
              status: "done",
            }))
            .filter((item: any) => item.url);
          setFileList(items);
        } else if (
          (subProduct as any).image &&
          typeof (subProduct as any).image === "string"
        ) {
          setFileList([
            {
              uid: `sub-img-0-${Date.now()}`,
              name: `image-1.png`,
              url: (subProduct as any).image,
              status: "done",
            },
          ]);
        } else {
          setFileList([]);
        }
      } else if (initialValues) {
        let rawAttrs: any = initialValues.attributes;
        if (typeof rawAttrs === "string") {
          try {
            rawAttrs = JSON.parse(rawAttrs);
          } catch {
            rawAttrs = {};
          }
        }
        if (!rawAttrs || typeof rawAttrs !== "object") {
          rawAttrs = {};
        }

        let customAttributes: { name: string; value: string }[] = [];
        if (Array.isArray(rawAttrs)) {
          customAttributes = rawAttrs
            .map((item: any) => ({
              name: String(item.name || item.key || "").trim(),
              value: String(item.value ?? "").trim(),
            }))
            .filter((item) => item.name);
        } else {
          customAttributes = Object.entries(rawAttrs)
            .filter(([k]) => {
              const lower = k.trim().toLowerCase();
              return (
                lower !== "color" &&
                lower !== "màu sắc" &&
                lower !== "mau sac" &&
                lower !== "màu" &&
                lower !== "mau" &&
                lower !== "discounttype" &&
                lower !== "discountvalue" &&
                lower !== "discountamount" &&
                lower !== "price" &&
                lower !== "cost" &&
                lower !== "stock" &&
                lower !== "qty"
              );
            })
            .map(([name, value]) => ({
              name: name.trim(),
              value: String(value ?? "").trim(),
            }));
        }

        if (
          initialValues.size &&
          !customAttributes.some((a) => a.name.toLowerCase() === "size")
        ) {
          customAttributes.unshift({
            name: "Size",
            value: String(initialValues.size).trim(),
          });
        }

        const existingCloneColor =
          initialValues.color ||
          rawAttrs?.["Màu sắc"] ||
          rawAttrs?.["Color"] ||
          rawAttrs?.["màu sắc"] ||
          rawAttrs?.["color"] ||
          rawAttrs?.["Mau sac"] ||
          rawAttrs?.["mau sac"] ||
          rawAttrs?.["Màu"] ||
          rawAttrs?.["màu"] ||
          "";

        let cloneDiscountType = "NONE";
        let cloneDiscountValue = 0;
        if (rawAttrs?.discountType) {
          cloneDiscountType = rawAttrs.discountType;
          cloneDiscountValue = Number(rawAttrs.discountValue) || 0;
        } else if (
          initialValues.discount &&
          initialValues.discount < initialValues.price &&
          initialValues.discount > 0
        ) {
          const diff = initialValues.price - initialValues.discount;
          const pct = Math.round((diff / initialValues.price) * 100);
          if (pct > 0 && Math.abs((initialValues.price * pct) / 100 - diff) < 1) {
            cloneDiscountType = "PERCENT";
            cloneDiscountValue = pct;
          } else {
            cloneDiscountType = "DISCOUNT";
            cloneDiscountValue = diff;
          }
        }

        form.setFieldsValue({
          ...initialValues,
          productId: initialValues.productId || product?.id || id || undefined,
          sku: initialValues.sku ? `${initialValues.sku}-COPY` : "",
          color: existingCloneColor,
          price: Number(initialValues.price ?? 0),
          qty:
            initialValues.qty !== undefined && initialValues.qty !== null
              ? initialValues.qty
              : initialValues.stock ?? 10,
          cost: Number(initialValues.cost ?? 0),
          discountType: cloneDiscountType,
          discountValue: cloneDiscountValue,
          customAttributes:
            customAttributes.length > 0
              ? customAttributes
              : [{ name: "", value: "" }],
        });

        let rawImages: any = initialValues.images;
        if (typeof rawImages === "string") {
          try {
            rawImages = JSON.parse(rawImages);
          } catch {
            if (rawImages.startsWith("http")) {
              rawImages = [rawImages];
            } else {
              rawImages = [];
            }
          }
        }

        if (Array.isArray(rawImages) && rawImages.length > 0) {
          const items = rawImages
            .map((img: any, index: number) => ({
              uid: `init-img-${index}-${Date.now()}`,
              name: `image-${index + 1}.png`,
              url: typeof img === "string" ? img : img?.url || "",
              status: "done",
            }))
            .filter((item: any) => item.url);
          setFileList(items);
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        setFileList([]);
        form.setFieldsValue({
          color: "",
          qty: 10,
          price: 0,
          cost: 0,
          discountType: "NONE",
          discountValue: 0,
          customAttributes: [{ name: "", value: "" }],
        });
      }
    }
  }, [visible, subProduct, initialValues, form]);

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

    if (values.color && typeof values.color === "string" && values.color.trim()) {
      const cleanColor = values.color
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .substring(0, 6);
      if (cleanColor) {
        variantPart += `-${cleanColor}`;
      }
    }

    if (values.customAttributes && Array.isArray(values.customAttributes)) {
      const firstAttr = values.customAttributes.find((a: any) => a?.value);
      if (firstAttr) {
        variantPart += `-${firstAttr.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;
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
            ? data.color.trim()
            : String(data.color).trim();
      } else {
        data.color = "";
      }

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
      if (data.color) {
        attributesObj["Màu sắc"] = data.color;
      } else if (attributesObj["Màu sắc"]) {
        data.color = attributesObj["Màu sắc"];
      }

      const basePrice = Number(values.price ?? 0);
      let calculatedSalePrice = basePrice;
      let calculatedDiscountAmount = 0;

      if (values.discountType === "PERCENT") {
        const pct = Math.min(100, Math.max(0, Number(values.discountValue || 0)));
        calculatedDiscountAmount = Math.round((basePrice * pct) / 100);
        calculatedSalePrice = Math.max(0, basePrice - calculatedDiscountAmount);
        attributesObj["discountType"] = "PERCENT";
        attributesObj["discountValue"] = String(pct);
      } else if (values.discountType === "DISCOUNT") {
        calculatedDiscountAmount = Math.min(
          basePrice,
          Math.max(0, Number(values.discountValue || 0))
        );
        calculatedSalePrice = Math.max(0, basePrice - calculatedDiscountAmount);
        attributesObj["discountType"] = "DISCOUNT";
        attributesObj["discountValue"] = String(calculatedDiscountAmount);
      } else {
        delete attributesObj["discountType"];
        delete attributesObj["discountValue"];
      }

      delete attributesObj["discountAmount"];
      delete attributesObj["price"];
      delete attributesObj["cost"];
      delete attributesObj["stock"];
      delete attributesObj["qty"];

      data.attributes = attributesObj;
      data.price = basePrice;
      data.discount = calculatedDiscountAmount > 0 ? calculatedSalePrice : 0;

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
      width={isMobile ? "calc(100vw - 16px)" : 780}
      title={
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            paddingRight: isMobile ? 32 : 24,
            gap: isMobile ? 6 : 12,
          }}
        >
          <Space size={10} align="center">
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
                flexShrink: 0,
              }}
            >
              <AppstoreOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 600, fontSize: isMobile ? 15 : 16 }}>
                {subProduct
                  ? "Cập nhật biến thể sản phẩm"
                  : initialValues
                  ? "Nhân bản biến thể sản phẩm"
                  : "Thêm biến thể sản phẩm mới"}
              </Title>
              {!isMobile && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Thiết lập định danh, thuộc tính, giá bán và hình ảnh cho biến thể
                </Text>
              )}
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
                maxWidth: isMobile ? "100%" : 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
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
        style: { height: 38, borderRadius: 6, fontWeight: 500, minWidth: isMobile ? 100 : 120 },
      }}
      cancelButtonProps={{
        disabled: isLoading,
        style: { height: 38, borderRadius: 6, minWidth: isMobile ? 80 : 90 },
      }}
      closable={!isLoading}
      maskClosable={!isLoading}
      style={{
        top: isMobile ? 8 : 24,
        maxWidth: isMobile ? "calc(100vw - 16px)" : 780,
        margin: "0 auto",
      }}
      bodyStyle={{
        maxHeight: isMobile ? "calc(88vh - 110px)" : "calc(84vh - 130px)",
        overflowY: "auto",
        padding: isMobile ? "8px 12px 16px" : "12px 24px 20px",
      }}
    >
      <Form
        layout="vertical"
        className="compact-variant-modal-form"
        onFinish={handleAddSubproduct}
        form={form}
        disabled={isLoading}
        style={{ marginTop: 8 }}
      >
        <style>{`
          /* Tăng khoảng cách giữa các trường dữ liệu */
          .compact-variant-modal-form .ant-form-item {
            margin-bottom: 16px !important;
          }
          .compact-variant-modal-form .ant-form-item-label {
            display: block !important;
            width: 100% !important;
            padding-bottom: 6px !important;
          }
          /* Cho phép label chiếm 100% chiều ngang để dồn nút chức năng (Tạo tự động, Thư viện ảnh) sang lề phải */
          .compact-variant-modal-form .ant-form-item-label > label {
            display: flex !important;
            width: 100% !important;
            align-items: center !important;
            justify-content: space-between !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            color: #334155 !important;
          }
          .compact-variant-modal-form .ant-form-item-label > label > div {
            width: 100% !important;
          }
          .compact-variant-modal-form .form-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            gap: 12px;
          }
          .compact-variant-modal-form .ant-card-head {
            min-height: 40px !important;
          }
          .compact-variant-modal-form .ant-card-head-title {
            padding: 8px 0 !important;
            white-space: normal !important;
            overflow: visible !important;
          }
          /* Tiêu đề nhóm card */
          .compact-variant-modal-form .modal-card-title {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
          }
          .compact-variant-modal-form .modal-card-title .anticon {
            font-size: 15px;
            color: #1677ff;
          }
          /* Khoảng cách giữa prefix icon và text/placeholder trong ô nhập liệu */
          .compact-variant-modal-form .ant-input-prefix,
          .compact-variant-modal-form .ant-input-affix-wrapper .ant-input-prefix {
            margin-inline-end: 8px !important;
          }
          /* Khoảng cách giữa icon và chữ trong Button */
          .compact-variant-modal-form .ant-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .compact-variant-modal-form .ant-btn > .anticon + span {
            margin-inline-start: 6px !important;
          }
          /* Tối ưu Segmented trên mobile */
          .compact-variant-modal-form .ant-segmented {
            background-color: #f1f5f9;
            padding: 3px;
            border: 1px solid #e2e8f0;
          }
          .compact-variant-modal-form .ant-segmented-item {
            border-radius: 4px;
          }
          .compact-variant-modal-form .ant-segmented-item-label {
            font-size: 12px !important;
            font-weight: 500;
            padding: 0 6px !important;
            line-height: 28px !important;
            min-height: 28px !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
        `}</style>

        {!product && (
          <Form.Item
            name={"productId"}
            label="Sản phẩm chính"
            rules={[{ required: true, message: "Vui lòng chọn sản phẩm chính" }]}
            style={{ marginBottom: 16 }}
          >
            <Select
              allowClear
              options={options}
              showSearch
              placeholder="Chọn sản phẩm liên kết"
              style={{ height: 38 }}
            />
          </Form.Item>
        )}

        {/* SECTION 1: ĐỊNH DANH VÀ THUỘC TÍNH */}
        <Card
          size="small"
          title={
            <div className="modal-card-title">
              <BarcodeOutlined />
              <span>Định danh & Thuộc tính phân loại</span>
            </div>
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
            padding: isMobile ? "8px 12px" : "10px 16px",
          }}
          bodyStyle={{ padding: isMobile ? "12px 12px" : "16px 18px" }}
        >
          <Row gutter={[20, 16]}>
            <Col xs={24} sm={10}>
              <Form.Item
                name="sku"
                label={
                  <div className="form-item-header">
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
                style={{ marginBottom: isMobile ? 14 : 0 }}
              >
                <Input
                  prefix={<BarcodeOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Mã SKU (VD: IPHONE15-128G-BLK)"
                  style={{ textTransform: "uppercase", height: 38, borderRadius: 6 }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={14}>
              <Form.Item
                label={
                  <div className="form-item-header">
                    <span>Màu sắc & Ảnh đại diện</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<PictureOutlined />}
                      onClick={() => setMediaPickerOpen(true)}
                      disabled={isLoading}
                      style={{ padding: 0, height: "auto", fontSize: 12 }}
                    >
                      Thư viện ảnh
                    </Button>
                  </div>
                }
                style={{ marginBottom: isMobile ? 14 : 0 }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {/* Ô Ảnh đại diện sản phẩm thay cho ô màu cũ */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {primaryImage ? (
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 6,
                          border: "2px solid #1677ff",
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#f8fafc",
                          boxShadow: "0 2px 5px rgba(22, 119, 255, 0.15)",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={primaryImage}
                          alt="Ảnh màu sản phẩm"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onClick={handlePreviewPrimaryImage}
                        />
                        {/* Nút xem ảnh */}
                        <Tooltip title="Xem ảnh lớn">
                          <button
                            type="button"
                            onClick={handlePreviewPrimaryImage}
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              width: "50%",
                              height: 14,
                              background: "rgba(0, 0, 0, 0.65)",
                              border: "none",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <EyeOutlined style={{ fontSize: 9 }} />
                          </button>
                        </Tooltip>
                        {/* Nút đổi ảnh */}
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          beforeUpload={handleQuickImageUpload}
                          disabled={isLoading}
                        >
                          <Tooltip title="Đổi ảnh">
                            <button
                              type="button"
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "50%",
                                height: 14,
                                background: "rgba(22, 119, 255, 0.85)",
                                border: "none",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              <CameraOutlined style={{ fontSize: 9 }} />
                            </button>
                          </Tooltip>
                        </Upload>
                        {/* Nút gỡ ảnh ở góc trên */}
                        <Tooltip title="Gỡ ảnh">
                          <div
                            onClick={handleRemovePrimaryImage}
                            style={{
                              position: "absolute",
                              top: 1,
                              right: 1,
                              width: 13,
                              height: 13,
                              borderRadius: "50%",
                              backgroundColor: "rgba(239, 68, 68, 0.9)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: 8,
                              lineHeight: 1,
                            }}
                          >
                            <CloseOutlined />
                          </div>
                        </Tooltip>
                      </div>
                    ) : (
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleQuickImageUpload}
                        disabled={isLoading}
                      >
                        <Tooltip title="Tải ảnh sản phẩm thực tế cho màu này">
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 6,
                              border: "1.5px dashed #cbd5e1",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              backgroundColor: "#f8fafc",
                              transition: "all 0.2s",
                            }}
                          >
                            <CameraOutlined style={{ fontSize: 14, color: "#1677ff" }} />
                            <span style={{ fontSize: 8, color: "#64748b", fontWeight: 500 }}>
                              + Ảnh
                            </span>
                          </div>
                        </Tooltip>
                      </Upload>
                    )}
                  </div>

                  {/* Ô nhập tên màu sắc viết đè tự do - không trùng icon prefix vì đã có thumbnail ảnh */}
                  <Form.Item name="color" noStyle>
                    <Input
                      placeholder="Nhập tên màu (VD: Đen đỏ sọc, Xanh Navy, Trắng...)"
                      allowClear
                      style={{ height: 38, borderRadius: 6 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "18px 0 14px" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                  Thuộc tính bổ sung
                </Text>
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>
                  (Dung lượng, Size, RAM, Bộ nhớ, Phiên bản...)
                </span>
              </div>
            </div>

            <Form.List name="customAttributes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: isMobile ? "8px 10px" : "10px 12px",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        marginBottom: 8,
                      }}
                    >
                      <Row gutter={[10, 10]} align="middle">
                        <Col xs={11} sm={11}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            rules={[{ required: true, message: "Nhập tên thuộc tính" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              placeholder="Tên thuộc tính (VD: Size, RAM...)"
                              allowClear
                              style={{ borderRadius: 6, height: 36 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={11} sm={11}>
                          <Form.Item
                            {...restField}
                            name={[name, "value"]}
                            rules={[{ required: true, message: "Nhập giá trị" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              placeholder="Giá trị (VD: XL, 128GB...)"
                              allowClear
                              style={{ borderRadius: 6, height: 36 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={2} sm={2} style={{ textAlign: "right" }}>
                          {fields.length > 1 ? (
                            <Tooltip title="Xóa thuộc tính này">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                                style={{ borderRadius: 4, padding: 0 }}
                              />
                            </Tooltip>
                          ) : (
                            <div style={{ width: 24 }} />
                          )}
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 2, borderRadius: 6, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
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
            <div className="modal-card-title">
              <DollarOutlined />
              <span>Quản lý Tồn kho & Định giá bán</span>
            </div>
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
            padding: isMobile ? "8px 12px" : "10px 16px",
          }}
          bodyStyle={{ padding: isMobile ? "12px 12px" : "16px 18px" }}
        >
          <Row gutter={[20, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="qty"
                label="Tồn kho ban đầu"
                rules={[{ required: true, message: "Nhập số lượng tồn" }]}
                style={{ marginBottom: isMobile ? 14 : 0 }}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%", borderRadius: 6, height: 38 }}
                  placeholder="0"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="cost"
                label="Giá vốn (Nhập hàng)"
                rules={[{ required: true, message: "Nhập giá vốn" }]}
                style={{ marginBottom: isMobile ? 14 : 0 }}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%", borderRadius: 6, height: 38 }}
                  addonAfter="₫"
                  placeholder="0"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="price"
                label="Giá bán niêm yết (Gốc)"
                rules={[{ required: true, message: "Nhập giá bán" }]}
                style={{ marginBottom: isMobile ? 14 : 0 }}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: "100%", borderRadius: 6, height: 38 }}
                  addonAfter="₫"
                  placeholder="0"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "18px 0 14px" }} />

          {/* KHỐI CẤU HÌNH GIẢM GIÁ */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: isMobile ? "12px 14px" : "14px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                marginBottom: 12,
                gap: isMobile ? 10 : 12,
              }}
            >
              <div className="modal-card-title">
                <GiftOutlined />
                <span>Chương trình giảm giá riêng</span>
              </div>
              <div style={{ width: isMobile ? "100%" : "auto", minWidth: isMobile ? "100%" : 300 }}>
                <Form.Item name="discountType" initialValue="NONE" noStyle>
                  <Segmented
                    block
                    value={watchedDiscountType || "NONE"}
                    onChange={(val) => {
                      form.setFieldValue("discountType", val);
                      if (val === "NONE") {
                        form.setFieldValue("discountValue", 0);
                      }
                    }}
                    options={[
                      {
                        value: "NONE",
                        label: isMobile ? "Không" : "Không giảm",
                      },
                      {
                        value: "PERCENT",
                        label: "Giảm %",
                        icon: <PercentageOutlined />,
                      },
                      {
                        value: "DISCOUNT",
                        label: "Giảm tiền",
                        icon: <DollarOutlined />,
                      },
                    ]}
                  />
                </Form.Item>
              </div>
            </div>

            {watchedDiscountType === "PERCENT" && (
              <div style={{ marginTop: 10 }}>
                <Row gutter={[16, 10]} align="middle">
                  <Col xs={24} sm={10}>
                    <Form.Item
                      name="discountValue"
                      label="Mức giảm theo phần trăm (%)"
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: "Nhập % giảm (1-100)" }]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        style={{ width: "100%", borderRadius: 6, height: 36 }}
                        addonAfter="%"
                        placeholder="VD: 15, 20"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={14}>
                    <div style={{ marginTop: isMobile ? 8 : 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Gợi ý nhanh:</Text>
                        {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                          <Tag
                            key={pct}
                            color={watchedDiscountValue === pct ? "blue" : undefined}
                            style={{ cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4, margin: 0 }}
                            onClick={() => form.setFieldValue("discountValue", pct)}
                          >
                            -{pct}%
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {watchedDiscountType === "DISCOUNT" && (
              <div style={{ marginTop: 10 }}>
                <Row gutter={[16, 10]} align="middle">
                  <Col xs={24} sm={10}>
                    <Form.Item
                      name="discountValue"
                      label="Số tiền giảm trực tiếp (VND)"
                      style={{ marginBottom: 0 }}
                      rules={[{ required: true, message: "Nhập số tiền giảm" }]}
                    >
                      <InputNumber<number>
                        min={1000}
                        max={watchedPrice || undefined}
                        style={{ width: "100%", borderRadius: 6, height: 38 }}
                        addonAfter="₫"
                        placeholder="VD: 50,000"
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(v) => Number(v?.replace(/\$\s?|(,*)/g, "") || 0)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={14}>
                    <div style={{ marginTop: isMobile ? 8 : 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Gợi ý nhanh:</Text>
                        {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                          <Tag
                            key={amt}
                            color={watchedDiscountValue === amt ? "blue" : undefined}
                            style={{ cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4, margin: 0 }}
                            onClick={() => form.setFieldValue("discountValue", amt)}
                          >
                            -{VND.format(amt)}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {watchedDiscountType === "NONE" && (
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
                Biến thể sẽ bán theo đúng giá niêm yết (Không áp dụng chương trình giảm giá riêng).
              </div>
            )}
          </div>

          {/* REAL-TIME PROFIT MARGIN & UNIT ECONOMICS KPI BAR */}
          <div
            style={{
              padding: isMobile ? "10px 12px" : "12px 14px",
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
                style={{ marginBottom: 8, borderRadius: 6 }}
              />
            )}
            {isThinMargin && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="Biên lợi nhuận mỏng (< 15%)"
                description={`Biên lãi gộp hiện tại đạt ${marginPercent.toFixed(1)}%. Cân nhắc tối ưu giá vốn hoặc giá bán.`}
                style={{ marginBottom: 8, borderRadius: 6 }}
              />
            )}
            {isGoodMargin && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="Biên lợi nhuận an toàn"
                description={`Biên lãi gộp đạt ${marginPercent.toFixed(1)}%, tạo ra ${VND.format(profitPerUnit)} lợi nhuận trên mỗi đơn vị.`}
                style={{ marginBottom: 8, borderRadius: 6 }}
              />
            )}

            <Row gutter={[8, 8]} align="middle">
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Giá niêm yết</Text>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: isMobile ? 13 : 14,
                      textDecoration: discountAmount > 0 ? "line-through" : undefined,
                      color: discountAmount > 0 ? "#94a3b8" : "#1e293b",
                      marginTop: 1,
                    }}
                  >
                    {VND.format(watchedPrice)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Mức giảm</Text>
                  <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: discountAmount > 0 ? "#dc2626" : "#64748b", marginTop: 1 }}>
                    {discountAmount > 0 ? `-${VND.format(discountAmount)} (${discountPercent.toFixed(0)}%)` : "0₫"}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Khách trả thực tế</Text>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#1677ff", marginTop: 1 }}>
                    {VND.format(effectivePrice)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ backgroundColor: "#ffffff", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Lãi gộp</Text>
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
                      fontSize: isMobile ? 13 : 14,
                      color: profitPerUnit >= 0 ? "#16a34a" : "#dc2626",
                      marginTop: 1,
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
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                width: "100%",
                gap: isMobile ? 6 : 8,
              }}
            >
              <div className="modal-card-title">
                <PictureOutlined />
                <span>Bộ sưu tập hình ảnh</span>
              </div>
              <Button
                type="link"
                size="small"
                onClick={() => setMediaPickerOpen(true)}
                disabled={isLoading}
                style={{
                  padding: 0,
                  height: "auto",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Chọn từ thư viện ảnh
              </Button>
            </div>
          }
          style={{
            marginBottom: 0,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          headStyle={{
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            padding: isMobile ? "8px 12px" : "10px 16px",
          }}
          bodyStyle={{ padding: isMobile ? "12px 12px" : "16px 18px" }}
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
            style={{ width: "100%", marginBottom: 8 }}
          >
            <div>
              <PlusOutlined style={{ fontSize: 18, color: "#94a3b8" }} />
              <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Tải ảnh lên</div>
            </div>
          </Upload>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              Hoặc dán trực tiếp đường link ảnh (URL):
            </Text>
            <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
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
                style={{ flex: 1, borderRadius: 6, height: 38 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddImageUrlToSubProduct}
                disabled={isLoading}
                style={{
                  borderRadius: 6,
                  height: 38,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Nạp link ảnh
              </Button>
            </div>
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
