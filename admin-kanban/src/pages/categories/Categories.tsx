/** @format */

import {
  Button,
  Card,
  message,
  Modal,
  Space,
  Spin,
  Tooltip,
  Table,
} from "antd";
import { ColumnProps } from "antd/es/table";
import { Edit2, Trash } from "iconsax-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import handleAPI from "../../apis/handleAPI";
import { colors } from "../../constants/colors";
import { TreeModel } from "../../models/FormModel";
import { CategoyModel } from "../../models/Products";
import { getTreeValues } from "../../utils/getTreeValues";
import { AddCategory } from "../../components";

const { confirm } = Modal;

const Categories = () => {
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  console.log("categories", categories);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [treeValues, setTreeValues] = useState<TreeModel[]>([]);
  const [categorySelected, setCategorySelected] = useState<CategoyModel>();
  const [total, setTotal] = useState<number>(10);

  useEffect(() => {
    getCategories(`/categories`, true);
  }, []);

  useEffect(() => {
    const api = `/categories/page?page=${page}&pageSize=${pageSize}`;
    getCategories(api);
  }, [page, pageSize]);

  const getCategories = async (api: string, isSelect?: boolean) => {
    try {
      const res: any = await handleAPI(api);

      if (isSelect) {
        setTreeValues(getTreeValues(res.result, true));
      } else {
        setCategories(res.result.data);
        setTotal(res.result.totalElements);
        
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnProps<CategoyModel>[] = [
    {
      key: "title",
      title: "Name",
      dataIndex: "",
      render: (item: CategoyModel) => (
        <Link to={`/categories/detail/${item.slug}?id=${item.id}`}>
          {item.title}
        </Link>
      ),
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
    },
    {
      key: "btnContainer",
      title: "Actions",
      dataIndex: "",
      render: (item: any) => (
        <Space>
          <Tooltip title="Edit categories" key={"btnEdit"}>
            <Button
              onClick={() => setCategorySelected(item)}
              icon={<Edit2 size={20} color={colors.gray600} />}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Xoá categories" key={"btnDelete"}>
            <Button
              onClick={() =>
                confirm({
                  title: "Confirm",
                  content: "What are you sure you want to remove this item?",
                  onOk: async () => handleRemove(item.id),
                })
              }
              icon={<Trash size={20} className="text-danger" />}
              type="text"
            />
          </Tooltip>
        </Space>
      ),
      align: "right",
    },
  ];

  const handleRemove = async (id: string) => {
    const api = `/categories/${id}`;

    try {
      await handleAPI(api, undefined, "delete");

      const removeCategoryRecursively = (
        categories: CategoyModel[],
        id: string
      ): CategoyModel[] => {
        return categories
          .filter((category) => category.id !== id)
          .map((category) => ({
            ...category,
            children: removeCategoryRecursively(category.children || [], id),
          }));
      };
      setCategories((prevCategories) =>
        removeCategoryRecursively(prevCategories, id)
      );

      setTreeValues((prevTreeValues) =>
        removeTreeValuesRecursively(prevTreeValues, id)
      );

      message.success("Deleted!!");
    } catch (error: any) {
      console.log(error);
      message.error(error.message);
    }
  };

  const removeTreeValuesRecursively = (
    treeValues: TreeModel[],
    id: string
  ): TreeModel[] => {
    return treeValues
      .filter((treeValue) => treeValue.value !== id)
      .map((treeValue) => ({
        ...treeValue,
        children: removeTreeValuesRecursively(treeValue.children || [], id),
      }));
  };

  return isLoading ? (
    <Spin />
  ) : (
    <div>
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <Card title={"Add new"}>
              <AddCategory
                onClose={() => setCategorySelected(undefined)}
                seleted={categorySelected}
                values={treeValues}
                onAddNew={async (val) => {
                  await getCategories(`/categories`, true);
                  await getCategories(
                    `/categories/page?page=${page}&pageSize=${pageSize}`
                  );
                }}
              />
            </Card>
          </div>
          <div className="col-md-8">
            <Card>
              <Table
                size="small"
                dataSource={categories}
                columns={columns}
                rowKey={(record) => record.id}
                pagination={{
                  showSizeChanger: true,
                  onShowSizeChange: (current, size) => {},
                  total,
                  onChange(page, pageSize) {
                    console.log(page, pageSize);
                    setPage(page);
                    setPageSize(pageSize);
                  },
                  showQuickJumper: false,
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
