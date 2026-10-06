/** @format */

import React, { useEffect, useState } from "react";
import {
  Form,
  Image,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { ProductModel, SubProductModel } from "../../models/Products";
import MediaPickerModal from "../MediaPickerModal";
import { useSubProductForm } from "./hooks/useSubProductForm";
import { usePriceMarginCalc } from "./hooks/usePriceMarginCalc";
import { SubProductGeneralSection } from "./components/SubProductGeneralSection";
import { SubProductAttributesSection } from "./components/SubProductAttributesSection";
import { SubProductPricingSection } from "./components/SubProductPricingSection";
import { SubProductProfitPreview } from "./components/SubProductProfitPreview";
import { SubProductGallerySection } from "./components/SubProductGallerySection";

const { Text, Title } = Typography;

export interface AddSubProductModalProps {
  visible: boolean;
  onClose: () => void;
  product?: ProductModel;
  onAddNew: (val: SubProductModel) => void;
  subProduct?: SubProductModel;
  initialValues?: Partial<SubProductModel> | any;
}

export const AddSubProductModal: React.FC<AddSubProductModalProps> = (props) => {
  const { visible, onClose, product, subProduct, initialValues } = props;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    form,
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
    handleCancel,
    handleAutoGenerateSku,
    handleAddImageUrl,
    handleAddSubproduct,
  } = useSubProductForm(props);

  // Watch fields for live financial calculations
  const watchedPrice = Form.useWatch("price", form) || 0;
  const watchedCost = Form.useWatch("cost", form) || 0;
  const watchedDiscountType = Form.useWatch("discountType", form) || "NONE";
  const watchedDiscountValue = Form.useWatch("discountValue", form) || 0;

  const calcResult = usePriceMarginCalc(
    watchedPrice,
    watchedCost,
    watchedDiscountType,
    watchedDiscountValue
  );

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
        padding: isMobile ? "8px 12px" : "12px 24px 20px",
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
          .compact-variant-modal-form .ant-form-item {
            margin-bottom: 16px !important;
          }
          .compact-variant-modal-form .ant-form-item-label {
            display: block !important;
            width: 100% !important;
            padding-bottom: 6px !important;
          }
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
          .compact-variant-modal-form .ant-input-prefix,
          .compact-variant-modal-form .ant-input-affix-wrapper .ant-input-prefix {
            margin-inline-end: 8px !important;
          }
          .compact-variant-modal-form .ant-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .compact-variant-modal-form .ant-btn > .anticon + span {
            margin-inline-start: 6px !important;
          }
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
        <SubProductGeneralSection
          isMobile={isMobile}
          isLoading={isLoading}
          onAutoGenerateSku={handleAutoGenerateSku}
        />

        {/* SECTION 2: THUỘC TÍNH BỔ SUNG */}
        <SubProductAttributesSection isMobile={isMobile} isLoading={isLoading} />

        {/* SECTION 3: TỒN KHO & ĐỊNH GIÁ BÁN */}
        <SubProductPricingSection
          isMobile={isMobile}
          isLoading={isLoading}
          watchedPrice={watchedPrice}
          watchedDiscountType={watchedDiscountType}
          watchedDiscountValue={watchedDiscountValue}
          onSetDiscountType={(type) => {
            form.setFieldValue("discountType", type);
            if (type === "NONE") {
              form.setFieldValue("discountValue", 0);
            }
          }}
          onSetDiscountValue={(val) => form.setFieldValue("discountValue", val)}
        />

        {/* SECTION 4: THỐNG KÊ LỢI NHUẬN THỜI GIAN THỰC */}
        <SubProductProfitPreview
          isMobile={isMobile}
          watchedPrice={watchedPrice}
          calcResult={calcResult}
        />

        {/* SECTION 5: BỘ SƯU TẬP HÌNH ẢNH */}
        <SubProductGallerySection
          isMobile={isMobile}
          isLoading={isLoading}
          fileList={fileList}
          fileUrl={fileUrl}
          onFileListChange={({ fileList: newFileList }) => {
            const items = newFileList.map((item) =>
              item.originFileObj
                ? {
                    ...item,
                    url: URL.createObjectURL(item.originFileObj),
                    status: "done",
                  }
                : { ...item }
            );
            setFileList(items);
          }}
          onPreview={(file) => {
            setPreviewImage(file.url || file.preview || "");
            setPreviewOpen(true);
          }}
          onRemove={(file) => {
            setFileList((prev) => (prev || []).filter((item) => item.uid !== file.uid));
          }}
          onFileUrlChange={(val) => setFileUrl(val)}
          onAddImageUrl={handleAddImageUrl}
          onOpenMediaPicker={() => setMediaPickerOpen(true)}
        />
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
