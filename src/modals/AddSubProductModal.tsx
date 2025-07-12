/** @format */

import {
  ColorPicker,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import { useEffect, useState } from "react";
import handleAPI from "../apis/handleAPI";
import { colors } from "../constants/colors";
import { ProductModel, SubProductModel } from "../models/Products";
// import { uploadFile } from "../utils/uploadFile";
import { useSelector } from "react-redux";
import { authSeletor } from "../redux/reducers/authReducer";
import { SelectModel } from "../models/FormModel";
import { get } from "http";
import { uploadFile } from "../utils/uploadFile";
import { useSearchParams } from "react-router-dom";

interface Props {
  visible: boolean;
  onClose: () => void;
  product?: ProductModel;
  onAddNew: (val: SubProductModel) => void;
  subProduct?: SubProductModel;
}

const AddSubProductModal = (props: Props) => {
  const { visible, onClose, product, onAddNew, subProduct } = props;
  console.log("subProduct", subProduct);

  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [options, setOptions] = useState<SelectModel[]>();

  const [form] = Form.useForm();

  const auth = useSelector(authSeletor);

  useEffect(() => {
    form.setFieldValue("color", colors.primary500);
  }, []);

  useEffect(() => {
    if (visible && subProduct) {
      form.setFieldsValue(subProduct);

      if (subProduct.images && subProduct.images.length > 0) {
        const items = subProduct.images.map((item) => ({
          url: item,
          status: "done",
        }));
        setFileList(items);
      }
    }
  }, [visible]); // chỉ phụ thuộc vào visible

  const handleAddSubproduct = async (values: any) => {
    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }
    data.productId = id ? id : product ? product.id : values.productId;

    if (!data.productId) {
      message.error("Please select product");
      return;
    } else {
      if (data.color) {
        data.color =
          typeof data.color === "string"
            ? data.color
            : data.color.toHexString();
      }

     if (fileList.length > 0) {
       const promises = fileList
         .filter((file) => file.originFileObj) // chỉ upload ảnh mới
         .map(async (file) => {
           const url = await uploadFile(file.originFileObj);
           return url;
         });

       const uploadedUrls = await Promise.all(promises);

       // lấy ảnh cũ đã có sẵn URL
       const oldImageUrls = fileList
         .filter((file) => !file.originFileObj && file.url)
         .map((file) => file.url);

       data.images = [...oldImageUrls, ...uploadedUrls]; // gộp lại
     }


      if (!product) {
        onAddNew({
          ...data,
          product: options?.find((item) => item.value === data.productId),
        });
        handleCancel();
      } else {
        setIsLoading(true);
        await createSubProduct(data);
      }
    }
  };

  const createSubProduct = async (data: any) => {
    const api = `/subProducts/${subProduct ? `update` : "create"}`;
    if (subProduct) {
      data.id = subProduct.id;
    }

    try {
      await handleAPI(api, data, subProduct ? "put" : "post");

      // await handleAddOrder({ ...data, subProduct_id: res?.data._id });
      handleCancel();
      //reload lai danh sach sub product bang cach goi lai api
      onClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
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
      title="Add Sub product"
      open={visible}
      onCancel={handleCancel}
      onClose={handleCancel}
      onOk={() => form.submit()}
      okButtonProps={{
        loading: isLoading,
      }}
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

        <Form.Item name="color" label="Color">
          <ColorPicker format="hex" />
        </Form.Item>
        <Form.Item
          rules={[
            {
              required: true,
              message: "type device size",
            },
          ]}
          name="size"
          label="Size"
        >
          <Input allowClear />
        </Form.Item>

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
      <Upload
        multiple
        fileList={fileList}
        accept="image/*"
        listType="picture-card"
        onChange={handleChange}
      >
        Upload
      </Upload>

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
