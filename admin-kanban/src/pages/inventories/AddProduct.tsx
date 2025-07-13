/** @format */

import { Editor } from "@tinymce/tinymce-react";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  message,
  Select,
  Space,
  Spin,
  TreeSelect,
  Typography,
  Image,
  Upload,
  UploadProps,
} from "antd";
import { useEffect, useRef, useState } from "react";
import handleAPI from "../../apis/handleAPI";
import { SelectModel, TreeModel } from "../../models/FormModel";
import { replaceName } from "../../utils/replaceName";
import { Add } from "iconsax-react";
import { ModalCategory, ToogleSupplier } from "../../modals";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getTreeValues } from "../../utils/getTreeValues";
import { uploadFile } from "../../utils/uploadFile";

const { Text, Title, Paragraph } = Typography;

const AddProduct = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setcontent] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<SelectModel[]>([]);
  const [isVisibleAddCategory, setIsVisibleAddCategory] = useState(false);
  const [categories, setCategories] = useState<TreeModel[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [isVisibleAddSupplier, setIsVisibleAddSupplier] = useState(false);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const id = searchParams.get("id");
  const slug = location.state?.slug;

  const editorRef = useRef<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    getData();
  }, []);
  useEffect(() => {
    if (id) {
      getProductDetail(id);
    } else {
      form.resetFields();
    }
  }, [id]);

  const getData = async () => {
    setIsLoading(true);
    try {
      await getSuppliers();
      await getCategories();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductDetail = async (id: string) => {
    const api = `/products/${slug}/${id}`;
    try {
      const res: any = await handleAPI(api);
      const item = res.result;

      if (item) {
        form.setFieldsValue({
          ...item,
          categories:
            item.categories?.map((category: any) => category.id) || [],
          supplier: item.supplierId || null,
        });
        setcontent(item.content);
        setFileList(
          item.images?.map((image: any, index: number) => ({
            url: image,
            uid: index,
          }))
        );
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleAddNewProduct = async (values: any) => {
    const content = editorRef.current?.getContent() || "";
    const data: any = {};
    setIsCreating(true);

    for (const i in values) {
      data[`${i}`] = values[i] ?? "";
    }
    data.supplierId = values.supplier ? values.supplier : null;
    data.content = content;
    data.slug = replaceName(values.title);
    data.images = [];

    const fileListSafe = fileList || [];

    if (fileListSafe.length > 0) {
      try {
        const uploadPromises = fileListSafe.map(async (file) => {
          if (file.originFileObj) {
            return await uploadFile(file.originFileObj);
          } else {
            return file.url;
          }
        });

        const urls = await Promise.all(uploadPromises);
        data.images = urls.filter((url) => url); // Lọc bỏ giá trị null/undefined
      } catch (error) {
        console.error("Error uploading files:", error);
        setIsCreating(false);
        return;
      }
    }

    try {
      await handleAPI(
        `/products${id ? `/${slug}/${id}` : ""}`,
        data,
        id ? "put" : "post"
      );

      navigate("/inventory");
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreating(false);
    }
  };

  const getSuppliers = async () => {
    const api = `/suppliers/page`;
    const res: any = await handleAPI(api);

    const data = res.result.data;
    const options = data.map((item: any) => ({
      value: item.id,
      label: item.name,
    }));

    setSupplierOptions(options);
  };

  const getCategories = async () => {
    const res: any = await handleAPI(`/categories/all`);

    const datas = res.result;

    const data = datas.length > 0 ? getTreeValues(datas, true) : [];

    setCategories(data);
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
  // Add this handler function near other handlers
  const handleAddNewSupplier = async (val: any) => {
    await getSuppliers(); // Refresh the supplier list
    setIsVisibleAddSupplier(false);
  };

  return isLoading ? (
    <Spin />
  ) : (
    <div>
      <div className="container">
        <Title level={3}>Add new Product</Title>
        <Form
          disabled={isCreating}
          size="large"
          form={form}
          onFinish={handleAddNewProduct}
          layout="vertical"
        >
          <div className="row">
            <div className="col-8">
              <Form.Item
                name={"title"}
                label="Title"
                rules={[
                  {
                    required: true,
                    message: "Please enter product title",
                  },
                ]}
              >
                <Input allowClear maxLength={150} showCount />
              </Form.Item>
              <Form.Item name={"description"} label="Description">
                <Input.TextArea
                  maxLength={1000}
                  showCount
                  rows={4}
                  allowClear
                />
              </Form.Item>
              <Editor
                disabled={isLoading || isCreating}
                apiKey="ikfkh2oosyq8z4b77hhj1ssxu7js46chtdrcq9j5lqum494c"
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue={content !== "" ? content : ""}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "anchor",
                    "searchreplace",
                    "visualblocks",
                    "code",
                    "fullscreen",
                    "insertdatetime",
                    "media",
                    "table",
                    "code",
                    "help",
                    "wordcount",
                  ],
                  toolbar:
                    "undo redo | blocks | " +
                    "bold italic forecolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                }}
              />
            </div>
            <div className="col-4">
              <Card size="small" className="mt-4">
                <Space>
                  <Button
                    loading={isCreating}
                    size="middle"
                    onClick={() => navigate("/inventory")}
                  >
                    Cancel
                  </Button>
                  <Button
                    loading={isCreating}
                    type="primary"
                    size="middle"
                    onClick={() => form.submit()}
                  >
                    {id ? "Update" : "Submit"}
                  </Button>
                </Space>
              </Card>
              <Card size="small" className="mt-3" title="Categories">
                <Form.Item name={"categories"} initialValue={[]}>
                  <TreeSelect
                    treeData={categories}
                    multiple
                    dropdownRender={(menu) => (
                      <>
                        {menu}

                        <Divider className="m-0" />
                        <Button
                          onClick={() => setIsVisibleAddCategory(true)}
                          type="link"
                          icon={<Add size={20} />}
                          style={{
                            padding: "0 16px",
                          }}
                        >
                          Add new
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Card>
              <Card size="small" className="mt-3" title="Suppliers">
                <Form.Item
                  name={"supplier"}
                  rules={[
                    {
                      required: false,
                      message: "Required",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider className="m-0" />
                        <Button
                          onClick={() => setIsVisibleAddSupplier(true)}
                          type="link"
                          icon={<Add size={20} />}
                          style={{
                            padding: "0 16px",
                          }}
                        >
                          Add new
                        </Button>
                      </>
                    )}
                    filterOption={(input, option) =>
                      replaceName(option?.label ? option.label : "").includes(
                        replaceName(input)
                      )
                    }
                    options={supplierOptions}
                  />
                </Form.Item>
              </Card>
              <Card size="small" className="mt-3" title="Images">
                <Upload
                  multiple
                  fileList={fileList}
                  accept="image/*"
                  listType="picture-card"
                  onChange={handleChange}
                >
                  Upload
                </Upload>
              </Card>
              <Card className="mt-3">
                <Input
                  allowClear
                  value={fileUrl}
                  onChange={(val) => setFileUrl(val.target.value)}
                  className="mb-3"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (files: any) => {
                    const file = files.target.files[0];

                    if (file) {
                      const donwloadUrl = await uploadFile(file);
                      donwloadUrl && setFileUrl(donwloadUrl);
                    }
                  }}
                />
              </Card>
            </div>
          </div>
        </Form>
      </div>

      <ModalCategory
        visible={isVisibleAddCategory}
        onClose={() => setIsVisibleAddCategory(false)}
        onAddNew={async (val) => {
          await getCategories();
        }}
        values={categories}
      />
      <ToogleSupplier
        visible={isVisibleAddSupplier}
        onClose={() => setIsVisibleAddSupplier(false)}
        onAddNew={handleAddNewSupplier}
      />
    </div>
  );
};

export default AddProduct;
