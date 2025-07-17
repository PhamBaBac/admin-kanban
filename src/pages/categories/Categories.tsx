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
import { colors } from "../../constants/colors";
import { TreeModel } from "../../models/FormModel";
import { CategoyModel } from "../../models/Products";
import { getTreeValues } from "../../utils/getTreeValues";
import { mapCategoriesToCategoyModels } from "../../utils/categoryMapper";
import { AddCategory } from "../../components";
import { useCategories } from "../../hooks/useCategories";

const { confirm } = Modal;

// Function để build tree structure từ flat data
const buildCategoryTree = (categories: CategoyModel[]): CategoyModel[] => {
  const categoryMap = new Map<string, CategoyModel>();
  const rootCategories: CategoyModel[] = [];

  // Tạo map để truy cập nhanh
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build tree structure
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (!category.parentId) {
      // Root category
      rootCategories.push(categoryWithChildren);
    } else {
      // Child category
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryWithChildren);
      }
    }
  });

  return rootCategories;
};

const Categories = () => {
  const { getCategories, getAllCategories, deleteCategory, loading, error } =
    useCategories();
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoyModel[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [treeValues, setTreeValues] = useState<TreeModel[]>([]);
  const [categorySelected, setCategorySelected] = useState<CategoyModel>();
  const [total, setTotal] = useState<number>(10);
  const [tableLoading, setTableLoading] = useState(false); // Loading riêng cho table
  const [initialLoad, setInitialLoad] = useState(false); // Track initial load
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchAllCategories();
    fetchCategories(); // Load data lần đầu
    setInitialLoad(true);
  }, []);

  useEffect(() => {
    // Chỉ fetch khi đã load lần đầu và page/pageSize thay đổi
    if (initialLoad) {
      fetchCategories();
    }
  }, [page, pageSize, initialLoad]);

  const fetchAllCategories = async () => {
    try {
      const res = await getAllCategories();
      setTreeValues(getTreeValues(res, true));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCategories = async () => {
    try {
      setTableLoading(true); // Chỉ set loading cho table
      console.log(
        "Fetching categories with page:",
        page,
        "pageSize:",
        pageSize
      );
      const res = await getCategories({ page, pageSize });
      console.log("Categories response:", res);
      // Map Category[] to CategoyModel[] format
      const mappedCategories = mapCategoriesToCategoyModels(res.data);
      setCategories(mappedCategories);

      // Build tree structure
      const treeData = buildCategoryTree(mappedCategories);
      setTreeCategories(treeData);

      setTotal(res.totalElements);
    } catch (error) {
      console.log(error);
    } finally {
      setTableLoading(false);
    }
  };

  const columns: ColumnProps<CategoyModel>[] = [
    {
      key: "title",
      title: "Name",
      dataIndex: "title",
      render: (title: string, record: CategoyModel) => {
        const isParent =
          Array.isArray(record.children) && record.children.length > 0;
        const isExpanded = expandedRowKeys.includes(record.id);
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            {isParent && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (isExpanded) {
                    setExpandedRowKeys(
                      expandedRowKeys.filter((k) => k !== record.id)
                    );
                  } else {
                    setExpandedRowKeys([...expandedRowKeys, record.id]);
                  }
                }}
                style={{
                  cursor: "pointer",
                  marginRight: 8,
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: colors.primary500,
                  userSelect: "none",
                }}
              >
                {isExpanded ? "-" : "+"}
              </span>
            )}
            <Link to={`/categories/detail/${record.slug}?id=${record.id}`}>
              {title}
            </Link>
            {isParent && (
              <span
                style={{
                  color: colors.gray600,
                  fontSize: "12px",
                  marginLeft: "8px",
                }}
              >
                ({isParent ? record.children!.length : 0} sub-categories)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      render: (description: string) => (
        <span style={{ color: colors.gray600 }}>
          {description || "No description"}
        </span>
      ),
    },
    {
      key: "parentId",
      title: "Parent Category",
      dataIndex: "parentId",
      render: (parentId: string) => (
        <span style={{ color: colors.gray600 }}>
          {parentId ? "Sub-category" : "Root Category"}
        </span>
      ),
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
    try {
      await deleteCategory(id);

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

      // Update both flat and tree data
      setCategories((prevCategories) =>
        removeCategoryRecursively(prevCategories, id)
      );

      setTreeCategories((prevTreeCategories) =>
        removeCategoryRecursively(prevTreeCategories, id)
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
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
                  await fetchAllCategories();
                  await fetchCategories();
                  // Reset selected category after add/update
                  setCategorySelected(undefined);
                }}
              />
            </Card>
          </div>
          <div className="col-md-8">
            <Card>
              <Table
                size="small"
                dataSource={treeCategories}
                columns={columns}
                rowKey={(record) => record.id}
                loading={tableLoading} // Chỉ loading cho table
                expandable={{
                  expandedRowKeys,
                  onExpandedRowsChange: (keys) =>
                    setExpandedRowKeys(keys as string[]),
                  expandIcon: () => null, // Ẩn icon mặc định
                  indentSize: 32, // Thụt vào 32px cho mỗi cấp con
                }}
                pagination={{
                  showSizeChanger: true,
                  onShowSizeChange: (current, size) => {
                    setPageSize(size);
                    setPage(1); // Reset về trang 1 khi thay đổi page size
                  },
                  total,
                  current: page,
                  pageSize: pageSize,
                  onChange(page, pageSize) {
                    setPage(page);
                    setPageSize(pageSize);
                  },
                  showQuickJumper: true,
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
