import { Checkbox, Form, Input, Select, TreeSelect } from "antd";
import { FormItemModel } from "../models/FormModel";

interface Props {
  item: FormItemModel;
}

const FormItem = (props: Props) => {
  const { item } = props;

  const shouldHideInForm = item.key === "products";

  if (shouldHideInForm) {
    return null; 
  }

  const VIETNAMESE_LABELS: Record<string, { label: string; placeholder: string }> = {
    name: { label: "Tên nhà cung cấp", placeholder: "Nhập tên nhà cung cấp" },
    email: { label: "Email", placeholder: "Nhập địa chỉ email" },
    active: { label: "Kích hoạt", placeholder: "Nhập trạng thái kích hoạt" },
    products: { label: "Sản phẩm", placeholder: "Nhập thông tin sản phẩm" },
    categories: { label: "Danh mục", placeholder: "Chọn danh mục sản phẩm" },
    price: { label: "Giá nhập", placeholder: "Nhập đơn giá nhập hàng" },
    contact: { label: "Số điện thoại", placeholder: "Nhập số điện thoại liên hệ" },
    type: { label: "Đang hợp tác", placeholder: "" },
    isTaking: { label: "Đang hợp tác", placeholder: "" },
  };

  const viInfo = VIETNAMESE_LABELS[item.key] || VIETNAMESE_LABELS[item.value];
  const displayLabel = viInfo?.label || item.label;
  const displayPlaceholder = viInfo?.placeholder || item.placeholder;

  const renderInput = (item: FormItemModel) => {
    let content = <></>;

    switch (item.type) {
      case "checkbox":
        content = <Checkbox />;
        break;
      case "select":
        if (item.key === "categories") {
          content = (
            <TreeSelect
              multiple
              treeData={item.lockup_item ?? []}
              placeholder={displayPlaceholder || "Chọn danh mục sản phẩm"}
              allowClear
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="title"
              style={{ width: "100%" }}
            />
          );
        } else {
          content = <Select options={item.lockup_item ?? []} placeholder={displayPlaceholder} />;
        }
        break;
      default:
        content = (
          <Input type={item.type} placeholder={displayPlaceholder} allowClear />
        );
        break;
    }

    return content;
  };

  return (
    <Form.Item
      key={item.key}
      name={item.key}
      rules={[{ required: item.required, message: item.message || `Vui lòng nhập ${displayLabel.toLowerCase()}` }]}
      label={displayLabel}
    >
      {renderInput(item)}
    </Form.Item>
  );
};

export default FormItem;


