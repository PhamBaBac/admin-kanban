/** @format */

import React from "react";
import {
  Card,
  Form,
  TreeSelect,
  Select,
  Divider,
  Button,
  Upload,
  Input,
  Space,
  Typography,
} from "antd";
import type { UploadProps } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { Add } from "iconsax-react";
import { TreeModel, SelectModel } from "../../../models/FormModel";
import { replaceName } from "../../../utils/replaceName";

const { Text } = Typography;

interface ProductSidebarSectionProps {
  categories: TreeModel[];
  supplierOptions: SelectModel[];
  fileList: any[];
  fileUrl: string;
  onFileUrlChange: (val: string) => void;
  onOpenAddCategory: () => void;
  onOpenAddSupplier: () => void;
  onOpenMediaPicker: () => void;
  onUploadChange: UploadProps["onChange"];
  onRemoveFile: (file: any) => void;
  onAddImageUrl: () => void;
}

export const ProductSidebarSection: React.FC<ProductSidebarSectionProps> = ({
  categories,
  supplierOptions,
  fileList,
  fileUrl,
  onFileUrlChange,
  onOpenAddCategory,
  onOpenAddSupplier,
  onOpenMediaPicker,
  onUploadChange,
  onRemoveFile,
  onAddImageUrl,
}) => {
  return (
    <div className="col-12 col-lg-4">
      {/* Danh mục ngành hàng */}
      <Card size="small" title="Danh mục ngành hàng">
        <Form.Item name="categories" initialValue={[]}>
          <TreeSelect
            treeData={categories}
            multiple
            placeholder="Chọn danh mục"
            popupRender={(menu) => (
              <>
                {menu}
                <Divider className="m-0" />
                <Button
                  htmlType="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenAddCategory();
                  }}
                  type="link"
                  icon={<Add size={20} />}
                  style={{ padding: "0 16px" }}
                >
                  Thêm danh mục mới
                </Button>
              </>
            )}
          />
        </Form.Item>
      </Card>

      {/* Nhà cung cấp */}
      <Card size="small" className="mt-3" title="Nhà cung cấp">
        <Form.Item
          name="supplier"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn nhà cung cấp",
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Chọn nhà cung cấp"
            popupRender={(menu) => (
              <>
                {menu}
                <Divider className="m-0" />
                <Button
                  htmlType="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenAddSupplier();
                  }}
                  type="link"
                  icon={<Add size={20} />}
                  style={{ padding: "0 16px" }}
                >
                  Thêm nhà cung cấp mới
                </Button>
              </>
            )}
            filterOption={(input, option) =>
              replaceName(option?.label ? String(option.label) : "").includes(
                replaceName(input)
              )
            }
            options={supplierOptions}
          />
        </Form.Item>
      </Card>

      {/* Hình ảnh đại diện sản phẩm */}
      <Card
        size="small"
        className="mt-3"
        title="Hình ảnh đại diện sản phẩm"
        extra={
          <Button
            type="link"
            icon={<PictureOutlined />}
            onClick={onOpenMediaPicker}
            style={{ padding: 0 }}
          >
            Thư viện ảnh
          </Button>
        }
      >
        <Upload
          multiple
          fileList={fileList}
          accept="image/*"
          listType="picture-card"
          onChange={onUploadChange}
          onRemove={onRemoveFile}
        >
          <div>
            <div style={{ fontSize: 20, lineHeight: 1 }}>+</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>Chọn ảnh</div>
          </div>
        </Upload>
        <div className="mt-3">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hoặc dán trực tiếp đường link ảnh (URL):
          </Text>
          <Space.Compact style={{ width: "100%", marginTop: 6 }}>
            <Input
              placeholder="https://example.com/image.png"
              value={fileUrl}
              onChange={(e) => onFileUrlChange(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                onAddImageUrl();
              }}
              allowClear
            />
            <Button type="primary" onClick={onAddImageUrl}>
              Dán link
            </Button>
          </Space.Compact>
        </div>
      </Card>
    </div>
  );
};
