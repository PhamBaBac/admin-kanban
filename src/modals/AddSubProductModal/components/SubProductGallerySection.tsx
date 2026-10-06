/** @format */

import React from "react";
import {
  Button,
  Card,
  Input,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import {
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface Props {
  isMobile: boolean;
  isLoading: boolean;
  fileList: any[];
  fileUrl: string;
  onFileListChange: UploadProps["onChange"];
  onPreview: (file: any) => void;
  onRemove: (file: any) => void;
  onFileUrlChange: (val: string) => void;
  onAddImageUrl: () => void;
  onOpenMediaPicker: () => void;
}

export const SubProductGallerySection: React.FC<Props> = ({
  isMobile,
  isLoading,
  fileList,
  fileUrl,
  onFileListChange,
  onPreview,
  onRemove,
  onFileUrlChange,
  onAddImageUrl,
  onOpenMediaPicker,
}) => {
  return (
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
            onClick={onOpenMediaPicker}
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
      styles={{
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #f1f5f9",
          padding: isMobile ? "8px 12px" : "10px 16px",
        },
        body: { padding: isMobile ? "12px 12px" : "16px 18px" },
      }}
    >
      <Upload
        multiple
        fileList={fileList}
        accept="image/*"
        listType="picture-card"
        onChange={onFileListChange}
        onPreview={onPreview}
        onRemove={onRemove}
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
            onChange={(e) => onFileUrlChange(e.target.value)}
            onPressEnter={(e) => {
              e.preventDefault();
              onAddImageUrl();
            }}
            allowClear
            disabled={isLoading}
            style={{ flex: 1, borderRadius: 6, height: 38 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddImageUrl}
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
  );
};
