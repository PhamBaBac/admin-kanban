/** @format */

import {
  Button,
  ColorPicker,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { colors } from "../constants/colors";
import { ProductModel, SubProductModel } from "../models/Products";
import { useSelector } from "react-redux";
import { authSeletor } from "../redux/reducers/authReducer";
import { SelectModel } from "../models/FormModel";
import { uploadFile } from "../utils/uploadFile";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";

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
  console.log("subProduct", subProduct);

  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileUrl, setFileUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [options, setOptions] = useState<SelectModel[]>();

  const [form] = Form.useForm();

  const auth = useSelector(authSeletor);

  const {
    createSubProduct: createSubProductHook,
    updateSubProduct: updateSubProductHook,
  } = useProducts();

  useEffect(() => {
    form.setFieldValue("color", colors.primary500);
  }, []);

  useEffect(() => {
    if (visible) {
      setFileUrl("");
      if (subProduct) {
        let customAttributes: { name: string; value: string }[] = [];
        if (subProduct.attributes && typeof subProduct.attributes === "object") {
          customAttributes = Object.entries(subProduct.attributes)
            .filter(([k]) => k.toLowerCase() !== "color" && k.toLowerCase() !== "màu sắc")
            .map(([name, value]) => ({ name, value: String(value ?? "") }));
        } else if (subProduct.size) {
          customAttributes = [{ name: "Dung lượng / Size", value: subProduct.size }];
        }

        form.setFieldsValue({
          ...subProduct,
          customAttributes:
            customAttributes.length > 0
              ? customAttributes
              : [{ name: "Dung lượng / Size", value: "" }],
        });

        if (subProduct.images && subProduct.images.length > 0) {
          const items = subProduct.images.map((item, index) => ({
            uid: `sub-img-${index}-${Date.now()}`,
            name: `image-${index + 1}.png`,
            url: item,
            status: "done",
          }));
          setFileList(items);
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        if (initialValues) {
          let customAttributes: { name: string; value: string }[] = [];
          if (
            initialValues.attributes &&
            typeof initialValues.attributes === "object"
          ) {
            customAttributes = Object.entries(initialValues.attributes)
              .filter(
                ([k]) =>
                  k.toLowerCase() !== "color" && k.toLowerCase() !== "màu sắc"
              )
              .map(([name, value]) => ({ name, value: String(value ?? "") }));
          } else if (initialValues.size) {
            customAttributes = [
              { name: "Dung lượng / Size", value: initialValues.size },
            ];
          }

          form.setFieldsValue({
            ...initialValues,
            color: initialValues.color || colors.primary500,
            price: initialValues.price !== undefined ? initialValues.price : undefined,
            qty: initialValues.qty !== undefined ? initialValues.qty : undefined,
            cost: initialValues.cost !== undefined ? initialValues.cost : undefined,
            discount: initialValues.discount !== undefined ? initialValues.discount : undefined,
            customAttributes:
              customAttributes.length > 0
                ? customAttributes
                : [{ name: "Dung lượng / Size", value: "" }],
          });

          if (initialValues.images && initialValues.images.length > 0) {
            const items = initialValues.images.map((img: any, index: number) => ({
              uid: `init-img-${index}-${Date.now()}`,
              name: `image-${index + 1}.png`,
              url: typeof img === "string" ? img : img.url || "",
              status: "done",
            }));
            setFileList(items);
          } else {
            setFileList([]);
          }
        } else {
          setFileList([]);
          form.setFieldValue("color", colors.primary500);
          form.setFieldValue("customAttributes", [
            { name: "Dung lượng / Size", value: "" },
          ]);
        }
      }
    }
  }, [visible, subProduct, initialValues]);

  const handleAddSubproduct = async (values: any) => {
    if (isLoading) return;

    const productId = id ? id : product ? product.id : values.productId;

    if (!productId) {
      message.error("Please select product");
      return;
    }

    setIsLoading(true);

    try {
      const data: any = {};

      for (const i in values) {
        if (i !== "customAttributes") {
          data[i] = values[i] ?? "";
        }
      }
      data.productId = productId;

      if (data.color) {
        data.color =
          typeof data.color === "string"
            ? data.color
            : data.color.toHexString();
      }

      // Xử lý Dynamic Attributes
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
      if (data.color && !attributesObj["Màu sắc"] && !attributesObj["Color"]) {
        attributesObj["Màu sắc"] = data.color;
      }
      data.attributes = attributesObj;

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
          .filter((file) => file.originFileObj) // chỉ upload ảnh mới
          .map(async (file) => {
            const url = await uploadFile(file.originFileObj);
            return url;
          });

        const uploadedUrls = await Promise.all(promises);

        // lấy ảnh cũ đã có sẵn URL hoặc link dán trực tiếp
        const oldImageUrls = fileListSafe
          .filter((file) => !file.originFileObj && file.url)
          .map((file) => file.url);

        data.images = [...oldImageUrls, ...uploadedUrls]; // gộp lại
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
    } else {
      created = await createSubProductHook(data);
    }
    onAddNew(created); // Truyền object subProduct mới cho cha
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
            url: item.originFileObj
              ? URL.createObjectURL(item.originFileObj)
              : "",
            status: "done",
          }
        : { ...item }
    );

    setFileList(items);
  };

  return (
    <Modal
      title={
        subProduct
          ? "Update Sub product"
          : initialValues
          ? "Copy Sub product"
          : "Add Sub product"
      }
      open={visible}
      onCancel={isLoading ? undefined : handleCancel}
      onOk={() => {
        if (!isLoading) {
          form.submit();
        }
      }}
      okButtonProps={{
        loading: isLoading,
        disabled: isLoading,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      closable={!isLoading}
      maskClosable={!isLoading}
    >
      <Typography.Title level={5}>{product?.title}</Typography.Title>
      <Form
        layout="vertical"
        onFinish={handleAddSubproduct}
        size="large"
        form={form}
        disabled={isLoading}
      >
        {!product && (
          <Form.Item name={"productId"} label="Product">
            <Select allowClear options={options} showSearch />
          </Form.Item>
        )}

        <Form.Item name="color" label="Màu sắc (Color)">
          <ColorPicker format="hex" />
        </Form.Item>

        <div className="mb-3">
          <Typography.Text strong>Thuộc tính phân loại (Attributes / Biến thể)</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
            Thêm các thuộc tính cho phân loại (ví dụ: Dung lượng, Size, RAM, v.v.)
          </Typography.Paragraph>
          <Form.List name="customAttributes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Chọn hoặc nhập tên thuộc tính" }]}
                      style={{ minWidth: 160, marginBottom: 0 }}
                    >
                      <Select
                        placeholder="Tên thuộc tính"
                        options={[
                          { label: "Dung lượng", value: "Dung lượng" },
                          { label: "Size", value: "Size" },
                          { label: "RAM", value: "RAM" },
                          { label: "Dung tích", value: "Dung tích" },
                          { label: "Chất liệu", value: "Chất liệu" },
                          { label: "Phiên bản", value: "Phiên bản" },
                          { label: "Kích cỡ", value: "Kích cỡ" },
                      
                        ]}
                        allowClear
                        showSearch
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "value"]}
                      rules={[{ required: true, message: "Nhập giá trị cho thuộc tính" }]}
                      style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                    >
                      <Input placeholder="Giá trị cho thuộc tính" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        style={{ color: "#ff4d4f", fontSize: 18, cursor: "pointer", marginLeft: 4 }}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>
                ))}
                <Form.Item style={{ marginBottom: 12, marginTop: 4 }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm thuộc tính phân loại
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>

        <div className="row">
          <div className="col">
            <Form.Item name={"qty"} label="Quantity">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <div className="col">
            <Form.Item name={"price"} label="Price">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div className="col">
            <Form.Item name={"cost"} label="Cost">
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </div>
        <Form.Item name={"discount"} label="Discount">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
      <div className="mb-3">
        <Typography.Text strong>Hình ảnh phân loại (Images)</Typography.Text>
        <div style={{ marginTop: 8 }}>
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
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 4, fontSize: 13 }}>Tải ảnh lên</div>
            </div>
          </Upload>
        </div>
        <div className="mt-2">
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Hoặc dán trực tiếp đường link (URL) của ảnh:
          </Typography.Text>
          <Space.Compact style={{ width: "100%", marginTop: 6 }}>
            <Input
              placeholder="https://example.com/image.png"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                handleAddImageUrlToSubProduct();
              }}
              allowClear
              disabled={isLoading}
            />
            <Button
              type="primary"
              onClick={handleAddImageUrlToSubProduct}
              disabled={isLoading}
            >
              Dán link
            </Button>
          </Space.Compact>
        </div>
      </div>

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
    </Modal>
  );
};

export default AddSubProductModal;
