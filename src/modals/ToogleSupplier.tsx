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
import { getTreeValues } from "../utils/getTreeValues";
import { mapCategoriesToCategoyModels } from "../utils/categoryMapper";

const { Paragraph } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddNew: (val?: any) => void;
  supplier?: SupplierModel;
}

const ToogleSupplier = (props: Props) => {
  const { visible, onAddNew, onClose, supplier } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isGetting, setIsGetting] = useState(false);
  const [isTaking, setIsTaking] = useState<boolean>();
  const [formData, setFormData] = useState<FormModel>();
  const [categories, setCategories] = useState<any[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
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
    if (supplier && flatCategories.length > 0) {
      const categoryIds = (supplier.categories || [])
        .map((catItem: string) => {
          // catItem có thể là ID hoặc là Title/Name
          const found = flatCategories.find(
            (c) => c.id === catItem || c.title === catItem || c.name === catItem
          );
          return found ? found.id : catItem;
        })
        .filter(Boolean);

      form.setFieldsValue({
        ...supplier,
        categories: categoryIds,
      });

      setIsTaking(supplier.isTaking === 1);
    }
  }, [supplier, flatCategories]);

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

    if (values.categories && Array.isArray(values.categories)) {
      data.categories = values.categories.map((c: any) =>
        typeof c === "object" && c !== null ? c.value || c.id : c
      ).filter(Boolean);
    } else {
      data.categories = [];
    }
    try {
      let res: any;
      if (supplier) {
        res = await updateSupplier({ ...data, id: supplier.id });
      } else {
        res = await createSupplier(data);
      }
      message.success(
        supplier ? "Cập nhật supplier thành công!" : "Thêm supplier thành công!"
      );
      onAddNew(res);
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
      const mapped = mapCategoriesToCategoyModels(response);
      setFlatCategories(mapped);
      const tree = mapped.length > 0 ? getTreeValues(mapped, true) : [];
      setCategories(tree);
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
      destroyOnClose
      onCancel={handleClose}
      onOk={() => form.submit()}
      okButtonProps={{
        loading: isLoading,
      }}
      title={supplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
      okText={supplier ? "Cập nhật" : "Thêm nhà cung cấp"}
      cancelText="Hủy bỏ"
    >
      <label htmlFor="inpFile" className="p-2 mb-3 row align-items-center">
        {file ? (
          <Avatar size={90} src={URL.createObjectURL(file)} />
        ) : supplier ? (
          <Avatar size={90} src={supplier.photoUrl} />
        ) : (
          <Avatar
            size={90}
            style={{
              backgroundColor: "white",
              border: "1px dashed #cbd5e1",
            }}
          >
            <User size={50} color={colors.gray600} />
          </Avatar>
        )}

        <div className="ml-3" style={{ paddingLeft: 16 }}>
          <Paragraph className="text-muted m-0" style={{ fontSize: 13 }}>Kéo thả ảnh đại diện vào đây</Paragraph>
          <Paragraph className="text-muted mb-1" style={{ fontSize: 12 }}>Hoặc</Paragraph>
          <Button onClick={() => inpRef.current.click()} type="link" style={{ padding: 0 }}>
            Tải ảnh từ máy tính
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
