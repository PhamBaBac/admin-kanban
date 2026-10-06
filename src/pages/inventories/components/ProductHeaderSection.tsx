/** @format */

import React from "react";
import { Button, Space, Typography } from "antd";

const { Title } = Typography;

interface ProductHeaderSectionProps {
  isEditMode: boolean;
  isCreating: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export const ProductHeaderSection: React.FC<ProductHeaderSectionProps> = ({
  isEditMode,
  isCreating,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <Title level={3} style={{ margin: 0 }}>
        {isEditMode ? "Cập nhật sản phẩm" : "Thêm mới sản phẩm"}
      </Title>
      <Space>
        <Button loading={isCreating} size="middle" onClick={onCancel}>
          Hủy bỏ
        </Button>
        <Button
          loading={isCreating}
          type="primary"
          size="middle"
          onClick={onSubmit}
        >
          {isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm"}
        </Button>
      </Space>
    </div>
  );
};
