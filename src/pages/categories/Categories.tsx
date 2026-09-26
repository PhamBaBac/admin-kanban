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

// Function để build tree structure từ flat data, đảm bảo không làm mất danh mục nào
const buildCategoryTree = (categories: CategoyModel[]): CategoyModel[] => {
  const categoryMap = new Map<string, CategoyModel>();
  const idSet = new Set(categories.map((c) => c.id));
  const rootCategories: CategoyModel[] = [];

  // Tạo map để truy cập nhanh
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build tree structure
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    const pId = category.parentId ? String(category.parentId).trim() : "";

    // Nếu không có parentId (hoặc rỗng), HOẶC parentId trùng với chính nó, HOẶC parentId không tồn tại trong db:
    // Chắc chắn đây là Root Category!
    if (!pId || pId === "" || pId === category.id || !categoryMap.has(pId)) {
      rootCategories.push(categoryWithChildren);
    } else {
      const parent = categoryMap.get(pId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    }
  });

  // Dọn dẹp các mảng children rỗng để Ant Design Table không hiện icon expand thừa
  const cleanEmptyChildren = (items: CategoyModel[]) => {
    items.forEach((item) => {
      if (item.children && item.children.length === 0) {
        delete item.children;
      } else if (item.children && item.children.length > 0) {
        cleanEmptyChildren(item.children);
      }
    });
  };

  cleanEmptyChildren(rootCategories);
  return rootCategories;
};

const Categories = () => {
  const { getCategories, getAllCategories, deleteCategory, loading, error } =
    useCategories();
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoyModel[]>([]);
  const [treeValues, setTreeValues] = useState<TreeModel[]>([]);
  const [categorySelected, setCategorySelected] = useState<CategoyModel>();
  const [total, setTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [allCategoriesList, setAllCategoriesList] = useState<CategoyModel[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setTableLoading(true);
      const res = await getAllCategories();
      const mapped = mapCategoriesToCategoyModels(res);
      setAllCategoriesList(mapped);
      setTreeValues(getTreeValues(res, true));

      const fullTree = buildCategoryTree(mapped);
      setTreeCategories(fullTree);
      setTotal(mapped.length);
    } catch (error) {
      console.log(error);
    } finally {
      setTableLoading(false);
    }
  };

  // Map parentId sang tên danh mục cha thực tế
  const getParentName = (parentId: string) => {
    if (!parentId) return "None (Root)";
    const found = allCategoriesList.find((c) => c.id === parentId) || categories.find((c) => c.id === parentId);
    return found ? found.title : "Root Category";
  };

  const columns: ColumnProps<CategoyModel>[] = [
    {
      key: "title",
      title: "Tên danh mục",
      dataIndex: "title",
      render: (title: string, record: CategoyModel) => {
        const isParent =
          Array.isArray(record.children) && record.children.length > 0;
        return (
          <div style={{ display: "inline-flex", alignItems: "center" }}>
            <Link
              to={`/categories/detail/${record.slug}?id=${record.id}`}
              style={{ fontWeight: isParent ? 600 : 400, color: "#1e293b" }}
            >
              {title}
            </Link>
            {isParent && (
              <span
                style={{
                  color: "#64748b",
                  backgroundColor: "#f1f5f9",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: "11px",
                  marginLeft: "8px",
                  fontWeight: 500,
                }}
              >
                {record.children!.length} mục con
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "description",
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
      render: (description: string) => {
        if (!description) {
          return <span style={{ color: colors.gray600 }}>Chưa có mô tả</span>;
        }
        return (
          <Tooltip title={description} placement="topLeft">
            <div
              style={{
                color: colors.gray600,
                maxWidth: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {description}
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "btnContainer",
      title: "Thao tác",
      dataIndex: "",
      width: 100,
      align: "center" as const,
      render: (item: any) => (
        <Space size={2}>
          <Tooltip title="Chỉnh sửa danh mục" key={"btnEdit"}>
            <Button
              size="small"
              onClick={() => setCategorySelected(item)}
              icon={<Edit2 size={16} color={colors.gray600} />}
              type="text"
            />
          </Tooltip>
          <Tooltip title="Xoá danh mục" key={"btnDelete"}>
            <Button
              size="small"
              onClick={() =>
                confirm({
                  title: "Xác nhận xóa",
                  content: "Bạn có chắc chắn muốn xóa danh mục này?",
                  okText: "Xóa",
                  cancelText: "Hủy",
                  okType: "danger",
                  onOk: async () => handleRemove(item.id),
                })
              }
              icon={<Trash size={16} className="text-danger" />}
              type="text"
            />
          </Tooltip>
        </Space>
      ),
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
    <div className="pb-4">
      <div className="row g-4">
        <div className="col-lg-4 col-md-5">
          <Card
            className="app-card"
            bordered={false}
            title={
              <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
                {categorySelected ? "Cập nhật danh mục" : "Thêm danh mục mới"}
              </span>
            }
          >
            <AddCategory
              onClose={() => setCategorySelected(undefined)}
              seleted={categorySelected}
              values={treeValues}
              onAddNew={async (val) => {
                await fetchCategories();
                // Reset selected category after add/update
                setCategorySelected(undefined);
              }}
            />
          </Card>
        </div>
        <div className="col-lg-8 col-md-7">
          <Card
            className="app-card"
            bordered={false}
            title={
              <div className="d-flex align-items-center justify-content-between">
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
                  Cây phân cấp danh mục
                </span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>
                  Tổng cộng: <strong>{total}</strong> danh mục
                </span>
              </div>
            }
          >
            <Table
              bordered
              size="middle"
              dataSource={treeCategories}
              columns={columns}
              rowKey={(record) => record.id}
              loading={tableLoading}
              expandable={{
                indentSize: 20,
                defaultExpandAllRows: true,
              }}
              pagination={false}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Categories;
