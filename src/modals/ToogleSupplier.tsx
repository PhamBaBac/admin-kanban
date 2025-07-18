import { Avatar, Button, Form, message, Modal, Typography } from "antd";
import { User } from "iconsax-react";
import { useEffect, useRef, useState } from "react";
import FormItem from "../components/FormItem";
import { colors } from "../constants/colors";
import { FormModel } from "../models/FormModel";
import { SupplierModel } from "../models/SupplierModel";
import { replaceName } from "../utils/replaceName";
import { uploadFile } from "../utils/uploadFile";
import { useSuppliers } from "../hooks/useSuppliers";
import { useCategories } from "../hooks/useCategories";

const { Paragraph } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddNew: () => void;
  supplier?: SupplierModel;
}

const ToogleSupplier = (props: Props) => {
  const { visible, onAddNew, onClose, supplier } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isGetting, setIsGetting] = useState(false);
  const [isTaking, setIsTaking] = useState<boolean>();
  const [formData, setFormData] = useState<FormModel>();
  const [categories, setCategories] = useState<any[]>([]);
  const [file, setFile] = useState<any>();

  const [form] = Form.useForm();
  const inpRef = useRef<any>(null);

  const {
    createSupplier,
    updateSupplier,
    getSupplierForm,
    loading: supplierLoading,
  } = useSuppliers();

  const { getAllCategories } = useCategories();

  useEffect(() => {
    getFormData();
    getCategories();
  }, []);

  useEffect(() => {
    if (supplier && categories.length > 0) {
      const categoryIds = supplier.categories
        .map((catLabel: string) => {
          const found = categories.find((c) => c.label === catLabel);
          return found ? found.value : null;
        })
        .filter(Boolean); // loại bỏ null

      form.setFieldsValue({
        ...supplier,
        categories: categoryIds,
      });

      setIsTaking(supplier.isTaking === 1);
    }
  }, [supplier, categories]);

  const addNewSupplier = async (values: any) => {
    setIsLoading(true);

    const data: any = {};

    for (const i in values) {
      data[i] = values[i] ?? "";
    }

    data.price = values.price ? parseInt(values.price) : 0;
    data.isTaking = isTaking ? 1 : 0;

    if (file) {
      data.photoUrl = await uploadFile(file);
    }

    data.slug = replaceName(values.name);

    data.categories = values.categories;
    try {
      if (supplier) {
        await updateSupplier({ ...data, id: supplier.id });
      } else {
        await createSupplier(data);
      }
      message.success(
        supplier ? "Cập nhật supplier thành công!" : "Thêm supplier thành công!"
      );
      onAddNew();
      handleClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFormData = async () => {
    setIsGetting(true);
    try {
      const res = await getSupplierForm();
      res && setFormData(res);
    } catch (error) {
      console.log(error);
    } finally {
      setIsGetting(false);
    }
  };

  const getCategories = async () => {
    try {
      const response = await getAllCategories();
      const options = response.map((cat: any) => ({
        label: cat.title,
        value: cat.id,
      }));
      setCategories(options);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFile(undefined);
    onClose();
  };

  return (
    <Modal
      loading={isGetting}
      closable={!isLoading}
      open={visible}
      onClose={handleClose}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okButtonProps={{
        loading: isLoading,
      }}
      title={supplier ? "Update" : "Add Supplier"}
      okText={supplier ? "Update" : `Add Supplier`}
      cancelText="Discard"
    >
      <label htmlFor="inpFile" className="p-2 mb-3 row">
        {file ? (
          <Avatar size={100} src={URL.createObjectURL(file)} />
        ) : supplier ? (
          <Avatar size={100} src={supplier.photoUrl} />
        ) : (
          <Avatar
            size={100}
            style={{
              backgroundColor: "white",
              border: "1px dashed #e0e0e0",
            }}
          >
            <User size={60} color={colors.gray600} />
          </Avatar>
        )}

        <div className="ml-3">
          <Paragraph className="text-muted m-0">Drag image here</Paragraph>
          <Paragraph className="text-muted mb-2">Or</Paragraph>
          <Button onClick={() => inpRef.current.click()} type="link">
            Browse image
          </Button>
        </div>
      </label>

      {formData && (
        <Form
          disabled={isLoading || supplierLoading}
          onFinish={addNewSupplier}
          layout={formData.layout}
          labelCol={{ span: formData.labelCol }}
          wrapperCol={{ span: formData.wrapperCol }}
          size="large"
          form={form}
        >
          {formData.formItems.map((item) => {
            const isCategoryField = item.key === "categories";
            return (
              <FormItem
                key={item.key}
                item={{
                  ...item,
                  lockup_item: isCategoryField ? categories : item.lockup_item,
                }}
              />
            );
          })}
        </Form>
      )}

      <div className="d-none">
        <input
          ref={inpRef}
          accept="image/*"
          type="file"
          id="inpFile"
          onChange={(val: any) => setFile(val.target.files[0])}
        />
      </div>
    </Modal>
  );
};

export default ToogleSupplier;
