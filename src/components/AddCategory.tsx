/** @format */

import { Button, Form, Input, message, Space, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import { replaceName } from "../utils/replaceName";
import { useCategories } from "../hooks/useCategories";
import { TreeModel } from "../models/FormModel";
import { CategoyModel } from "../models/Products";

interface Props {
  onAddNew: (val: any) => void;
  values: TreeModel[];
  seleted?: CategoyModel;
  onClose?: () => void;
}

const AddCategory = (props: Props) => {
  const { values, onAddNew, seleted, onClose } = props;
  const { createCategory, updateCategory, loading } = useCategories();

  useEffect(() => {
    if (seleted) {
      form.setFieldsValue(seleted);
    } else {
      form.resetFields();
    }
  }, [seleted]);

  // Reset parentId khi values (treeValues) thay đổi để TreeSelect nhận dữ liệu mới
  useEffect(() => {
    form.setFieldsValue({ parentId: undefined });
  }, [values]);

  const [form] = Form.useForm();

  const handleCategory = async (values: any) => {
    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

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

  return (
    <>
      <Form
        disabled={loading}
        form={form}
        layout="vertical"
        onFinish={handleCategory}
        size="large"
      >
        <Form.Item name={"parentId"} label="Parent category">
          <TreeSelect
            treeData={values}
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
              message: "Enter category title",
            },
          ]}
          label="Title"
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item name={"description"} label="Description">
          <Input.TextArea rows={4} />
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
              Cancel
            </Button>
          )}
          <Button
            loading={loading}
            disabled={loading}
            type="primary"
            onClick={() => form.submit()}
          >
            {seleted ? "Update" : "Submit"}
          </Button>
        </Space>
      </div>
    </>
  );
};

export default AddCategory;
