/** @format */

import { useState, useEffect, useCallback } from "react";
import { Form, message } from "antd";
import { useSearchParams } from "react-router-dom";
import mediaAPI from "../../../apis/mediaAPI";
import { ProductModel, SubProductModel } from "../../../models/Products";
import { SelectModel } from "../../../models/FormModel";
import { useProducts } from "../../../hooks/useProducts";
import { uploadFile } from "../../../utils/uploadFile";
import {
  parseVariantAttributes,
  extractVariantColor,
  extractDiscountInfo,
  parseRawImages,
  generateClonedSku,
} from "../utils";

interface UseSubProductFormParams {
  visible: boolean;
  onClose: () => void;
  product?: ProductModel;
  onAddNew: (val: SubProductModel) => void;
  subProduct?: SubProductModel;
  initialValues?: Partial<SubProductModel> | any;
}

export const useSubProductForm = ({
  visible,
  onClose,
  product,
  onAddNew,
  subProduct,
  initialValues,
}: UseSubProductFormParams) => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [options, setOptions] = useState<SelectModel[]>([]);

  const {
    createSubProduct: createSubProductHook,
    updateSubProduct: updateSubProductHook,
  } = useProducts();

  const primaryImage =
    fileList && fileList.length > 0
      ? fileList[0].url ||
        fileList[0].preview ||
        (fileList[0].originFileObj
          ? URL.createObjectURL(fileList[0].originFileObj)
          : "")
      : "";

  const handleResetForm = useCallback(() => {
    form.resetFields();
    setFileList([]);
    setFileUrl("");
  }, [form]);

  const handleCancel = useCallback(() => {
    handleResetForm();
    onClose();
  }, [handleResetForm, onClose]);

  // Sync Form when modal becomes visible or data changes
  useEffect(() => {
    if (!visible) return;

    setFileUrl("");
    form.resetFields();

    if (subProduct) {
      const customAttributes = parseVariantAttributes(
        subProduct.attributes || (subProduct as any).customAttributes,
        subProduct.color,
        subProduct.size
      );
      const existingColor = extractVariantColor(subProduct, subProduct.attributes);
      const { discountType, discountValue } = extractDiscountInfo(
        Number(subProduct.price ?? 0),
        subProduct.discount,
        subProduct.attributes
      );

      const existingQty =
        subProduct.qty !== undefined && subProduct.qty !== null
          ? subProduct.qty
          : subProduct.stock !== undefined && subProduct.stock !== null
          ? subProduct.stock
          : (subProduct as any).quantity ?? 0;

      // Exclude size from subProduct when setting form fields so size isn't stored in form state unless user defined it
      const { size: _unusedSize, ...cleanSubProduct } = subProduct as any;

      form.setFieldsValue({
        ...cleanSubProduct,
        productId: subProduct.productId || product?.id || id || undefined,
        sku: subProduct.sku || "",
        color: existingColor,
        qty: existingQty,
        cost: Number(subProduct.cost ?? 0),
        price: Number(subProduct.price ?? 0),
        discountType,
        discountValue,
        customAttributes:
          customAttributes.length > 0 ? customAttributes : [{ name: "", value: "" }],
      });

      setFileList(parseRawImages(subProduct.images, (subProduct as any).image));
    } else if (initialValues) {
      const customAttributes = parseVariantAttributes(
        initialValues.attributes || initialValues.customAttributes,
        initialValues.color,
        initialValues.size
      );
      const existingCloneColor = extractVariantColor(initialValues, initialValues.attributes);
      const { discountType, discountValue } = extractDiscountInfo(
        Number(initialValues.price ?? 0),
        initialValues.discount,
        initialValues.attributes
      );

      const { size: _unusedInitSize, ...cleanInitialValues } = initialValues as any;

      form.setFieldsValue({
        ...cleanInitialValues,
        productId: initialValues.productId || product?.id || id || undefined,
        sku: generateClonedSku(initialValues.sku),
        color: existingCloneColor,
        price: Number(initialValues.price ?? 0),
        qty:
          initialValues.qty !== undefined && initialValues.qty !== null
            ? initialValues.qty
            : initialValues.stock ?? 10,
        cost: Number(initialValues.cost ?? 0),
        discountType,
        discountValue,
        customAttributes:
          customAttributes.length > 0 ? customAttributes : [{ name: "", value: "" }],
      });

      setFileList(parseRawImages(initialValues.images, (initialValues as any).image));
    } else {
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
  }, [visible, subProduct, initialValues, form, product?.id, id]);

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
      const attrParts = values.customAttributes
        .filter((a: any) => a && a.value && String(a.value).trim())
        .map((a: any) =>
          String(a.value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .substring(0, 6)
        )
        .filter(Boolean);
      if (attrParts.length > 0) {
        variantPart += `-${attrParts.slice(0, 2).join("-")}`;
      }
    } else if (values.color && typeof values.color === "string" && values.color.trim()) {
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

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedSku = `${cleanTitle}${variantPart}-${randomSuffix}`;
    form.setFieldValue("sku", generatedSku);
    message.success(`Đã tạo mã SKU gợi ý: ${generatedSku}`);
  };

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

  const handleAddImageUrl = () => {
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
          i !== "discountValue" &&
          i !== "size"
        ) {
          data[i] = values[i] ?? "";
        }
      }
      data.productId = productId;
      data.color = data.color ? String(data.color).trim() : "";

      let explicitSize = "";
      let explicitColor = "";
      const attributesObj: Record<string, string> = {};
      if (values.customAttributes && Array.isArray(values.customAttributes)) {
        values.customAttributes.forEach((attr: any) => {
          if (attr && attr.name && attr.value) {
            const attrName = String(attr.name).trim();
            const attrVal = String(attr.value).trim();
            if (attrName && attrVal) {
              attributesObj[attrName] = attrVal;
              const lowerName = attrName.toLowerCase();
              if (
                lowerName === "size" ||
                lowerName === "kích thước" ||
                lowerName === "kich thuoc" ||
                lowerName === "kích cỡ" ||
                lowerName === "kich co"
              ) {
                explicitSize = attrVal;
              }
              if (
                lowerName === "màu sắc" ||
                lowerName === "mau sac" ||
                lowerName === "màu" ||
                lowerName === "mau" ||
                lowerName === "color"
              ) {
                explicitColor = attrVal;
              }
            }
          }
        });
      }
      data.size = explicitSize || (values.size ? String(values.size).trim() : "");
      data.color = explicitColor || (data.color ? String(data.color).trim() : "");

      if (data.color && !explicitColor) {
        attributesObj["Màu sắc"] = data.color;
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

      if (calculatedDiscountAmount > 0) {
        data.discount = calculatedSalePrice;
      } else if (subProduct && typeof subProduct.discount === "number" && subProduct.discount > 0) {
        data.discount = 0;
      } else {
        data.discount = null;
      }

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
        const uploadPromises = fileListSafe.map(async (file) => {
          if (file.originFileObj) {
            return await uploadFile(file.originFileObj);
          }
          return file.url;
        });

        const urls = await Promise.all(uploadPromises);
        data.images = urls.filter((url) => Boolean(url));
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
      }
    } catch (error: any) {
      console.error(error);
      message.error(error?.message || "Có lỗi xảy ra khi lưu phân loại sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    id,
    isLoading,
    fileList,
    setFileList,
    fileUrl,
    setFileUrl,
    previewOpen,
    setPreviewOpen,
    previewImage,
    setPreviewImage,
    mediaPickerOpen,
    setMediaPickerOpen,
    options,
    setOptions,
    primaryImage,
    handleCancel,
    handleAutoGenerateSku,
    handleQuickImageUpload,
    handleRemovePrimaryImage,
    handlePreviewPrimaryImage,
    handleAddImageUrl,
    handleAddSubproduct,
  };
};
