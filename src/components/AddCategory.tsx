/** @format */

import { Button, Form, Input, message, Space, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import { replaceName } from "../utils/replaceName";
import { useCategories } from "../hooks/useCategories";
import { TreeModel } from "../models/FormModel";
import { CategoyModel } from "../models/Products";
import { BsStars } from "react-icons/bs";
import { aiService } from "../services";

interface Props {
  onAddNew: (val: any) => void;
  values: TreeModel[];
  seleted?: CategoyModel;
  onClose?: () => void;
}

const AddCategory = (props: Props) => {
  const { values, onAddNew, seleted, onClose } = props;
  const { createCategory, updateCategory, loading } = useCategories();
  const [isGenerating, setIsGenerating] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (seleted) {
      form.setFieldsValue(seleted);
    } else {
      form.resetFields();
    }
  }, [seleted, form]);

  useEffect(() => {
    if (!seleted) {
      form.setFieldsValue({ parentId: undefined });
    }
  }, [values, form, seleted]);

  const handleCategory = async (values: any) => {
    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    data.parentId = values.parentId ? String(values.parentId).trim() : "";
    data.slug = replaceName(values.title);

    try {
      let res: any;
      if (seleted) {
        res = await updateCategory({ ...data, id: seleted.id });
      } else {
        res = await createCategory(data);
      }

      message.success(
        seleted
          ? "Update category successfully!"
          : "Add new category successfully!"
      );
      onAddNew(res);

      form.resetFields();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleAiGenerate = async () => {
    const title = form.getFieldValue("title");
    if (!title || !title.trim()) {
      message.warning("Vui lòng nhập tên danh mục trước khi dùng AI viết mô tả!");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await aiService.generateContent({
        type: "category_description",
        title: title.trim(),
      });
      if (res) {
        form.setFieldValue("description", res);
        message.success("AI đã viết xong mô tả danh mục!");
      }
    } catch (error: any) {
      console.error("AI generate category description error:", error);
      message.error(error?.message || "Lỗi khi AI tạo mô tả danh mục");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Form
        disabled={loading}
        form={form}
        layout="vertical"
        onFinish={handleCategory}
        size="large"
      >
        <Form.Item name={"parentId"} label="Danh mục cha (để trống nếu là danh mục gốc)">
          <TreeSelect
            treeData={values}
            placeholder="Chọn danh mục cha hoặc để trống"
            allowClear
            showSearch
            treeDefaultExpandAll
          />
        </Form.Item>
        <Form.Item
          name={"title"}
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên danh mục",
            },
          ]}
          label="Tên danh mục"
        >
          <Input placeholder="Nhập tên danh mục..." allowClear />
        </Form.Item>
        <Form.Item
          name={"description"}
          label={
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <span>Mô tả chi tiết</span>
              <Button
                type="link"
                size="small"
                icon={<BsStars size={16} />}
                loading={isGenerating}
                onClick={handleAiGenerate}
                style={{
                  padding: 0,
                  height: "auto",
                  fontSize: 13,
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
          <Input.TextArea placeholder="Nhập mô tả danh mục..." rows={4} />
        </Form.Item>
      </Form>

      <div className="text-right">
        <Space>
          {onClose && (
            <Button
              loading={loading}
              disabled={loading}
              onClick={() => {
                form.resetFields();
                onClose();
              }}
            >
              Hủy bỏ
            </Button>
          )}
          <Button
            loading={loading}
            disabled={loading}
            type="primary"
            onClick={() => form.submit()}
          >
            {seleted ? "Cập nhật" : "Tạo mới"}
          </Button>
        </Space>
      </div>
    </>
  );
};

export default AddCategory;
