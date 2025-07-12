import { Checkbox, Form, Input, Select } from "antd";
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

  const renderInput = (item: FormItemModel) => {
    let content = <></>;

    switch (item.type) {
      case "checkbox":
        content = <Checkbox />;
        break;
      case "select":
        if (item.key === "categories") {
          content = (
            <Select
              mode="multiple"
              options={item.lockup_item ?? []}
              placeholder="Select categories"
            />
          );
        } else {
          content = <Select options={item.lockup_item ?? []} />;
        }
        break;
      default:
        content = (
          <Input type={item.type} placeholder={item.placeholder} allowClear />
        );
        break;
    }

    return content;
  };

  return (
    <Form.Item
      key={item.key}
      name={item.key}
      rules={[{ required: item.required, message: item.message }]}
      label={item.label}
    >
      {renderInput(item)}
    </Form.Item>
  );
};

export default FormItem;


