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
  Drawer,
  Input,
  Tag,
  Empty,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  DownOutlined,
  RightOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import { ColumnProps } from "antd/es/table";
import { Edit2, Trash } from "iconsax-react";
import { useEffect, useState } from "react";
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
  const { getAllCategories, deleteCategory, error } = useCategories();
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoyModel[]>([]);
  const [treeValues, setTreeValues] = useState<TreeModel[]>([]);
  const [categorySelected, setCategorySelected] = useState<CategoyModel>();
  const [total, setTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [allCategoriesList, setAllCategoriesList] = useState<CategoyModel[]>([]);

  // Desktop / Laptop state
  const [showAddPanel, setShowAddPanel] = useState(true);

  // Mobile / Responsive state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [viewMode, setViewMode] = useState<"table" | "cards">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "cards" : "table"
  );
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Tự động nhảy qua dạng bảng hoặc thẻ tương ứng theo kích thước màn hình
      setViewMode(mobile ? "cards" : "table");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Tự động mở các nhánh có danh mục con khi nạp cây danh mục
  useEffect(() => {
    const keysWithChildren = new Set<string>();
    const collectKeys = (cats: CategoyModel[]) => {
      cats.forEach((c) => {
        if (c.children && c.children.length > 0) {
          keysWithChildren.add(c.id);
          collectKeys(c.children);
        }
      });
    };
    collectKeys(treeCategories);
    setExpandedKeys(keysWithChildren);
  }, [treeCategories]);

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

  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

      setCategories((prevCategories) =>
        removeCategoryRecursively(prevCategories, id)
      );

      setTreeCategories((prevTreeCategories) =>
        removeCategoryRecursively(prevTreeCategories, id)
      );

      setTreeValues((prevTreeValues) =>
        removeTreeValuesRecursively(prevTreeValues, id)
      );

      setTotal((prev) => Math.max(0, prev - 1));
      message.success("Đã xóa danh mục thành công!");
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

  // Lọc cây danh mục theo từ khóa tìm kiếm
  const filterCategoryTree = (
    cats: CategoyModel[],
    keyword: string
  ): CategoyModel[] => {
    if (!keyword.trim()) return cats;
    const lower = keyword.toLowerCase().trim();
    const result: CategoyModel[] = [];

    cats.forEach((cat) => {
      const matchesTitle = cat.title?.toLowerCase().includes(lower);
      const matchesDesc = cat.description?.toLowerCase().includes(lower);
      const filteredChildren = cat.children
        ? filterCategoryTree(cat.children, keyword)
        : [];

      if (matchesTitle || matchesDesc || filteredChildren.length > 0) {
        result.push({
          ...cat,
          children: filteredChildren.length > 0 ? filteredChildren : cat.children,
        });
      }
    });

    return result;
  };

  const displayedCategories = filterCategoryTree(treeCategories, searchKey);

  // Desktop Table Columns
  const columns: ColumnProps<CategoyModel>[] = [
    {
      key: "title",
      title: "Tên danh mục",
      dataIndex: "title",
      width: 190,
      render: (title: string, record: CategoyModel) => {
        const isParent =
          Array.isArray(record.children) && record.children.length > 0;
        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
              maxWidth: "100%",
            }}
          >
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
                  fontWeight: 500,
                  whiteSpace: "nowrap",
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
      width: 350,
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
      fixed: "right",
      align: "center" as const,
      render: (item: any) => (
        <Space size={2}>
          <Tooltip title="Chỉnh sửa danh mục" key={"btnEdit"}>
            <Button
              size="small"
              onClick={() => {
                setCategorySelected(item);
                if (isMobile) {
                  setIsMobileFormOpen(true);
                } else {
                  setShowAddPanel(true);
                }
              }}
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
                  content: `Bạn có chắc chắn muốn xóa danh mục "${item.title}"?`,
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

  // Mobile Render Item: Cây phân cấp dạng thẻ có đường nối nhánh
  const renderCategoryItem = (item: CategoyModel, depth = 0) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isExpanded = expandedKeys.has(item.id) || searchKey.trim() !== "";

    return (
      <div
        key={item.id}
        style={{
          marginBottom: 8,
          marginLeft: depth > 0 ? (depth === 1 ? 12 : 8) : 0,
          borderLeft: depth > 0 ? "2px solid #cbd5e1" : "none",
          paddingLeft: depth > 0 ? 10 : 0,
        }}
      >
        <div
          style={{
            background: depth === 0 ? "#ffffff" : "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: depth === 0 ? "0 1px 3px rgba(0,0,0,0.03)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to={`/categories/detail/${item.slug}?id=${item.id}`}
                  style={{
                    fontWeight: hasChildren || depth === 0 ? 600 : 500,
                    fontSize: 14,
                    color: "#0f172a",
                    wordBreak: "break-word",
                  }}
                >
                  {item.title}
                </Link>
                {hasChildren && (
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      fontSize: 11,
                      borderRadius: 4,
                      padding: "0 6px",
                      fontWeight: 500,
                    }}
                  >
                    {item.children!.length} mục con
                  </Tag>
                )}
              </div>
              {item.description ? (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 12,
                    color: "#64748b",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.description}
                </p>
              ) : null}
            </div>

            {/* Các nút thao tác thân thiện với cảm ứng */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <Button
                size="small"
                type="text"
                icon={<Edit2 size={16} color="#475569" />}
                onClick={() => {
                  setCategorySelected(item);
                  if (isMobile) {
                    setIsMobileFormOpen(true);
                  } else {
                    setShowAddPanel(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  backgroundColor: "#f1f5f9",
                }}
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<Trash size={16} />}
                onClick={() =>
                  confirm({
                    title: "Xác nhận xóa",
                    content: `Bạn có chắc muốn xóa danh mục "${item.title}"?`,
                    okText: "Xóa",
                    cancelText: "Hủy",
                    okType: "danger",
                    onOk: async () => handleRemove(item.id),
                  })
                }
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  backgroundColor: "#fef2f2",
                }}
              />
              {hasChildren && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => toggleExpand(item.id)}
                  icon={
                    isExpanded ? (
                      <DownOutlined style={{ fontSize: 12, color: "#64748b" }} />
                    ) : (
                      <RightOutlined style={{ fontSize: 12, color: "#64748b" }} />
                    )
                  }
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Đệ quy hiển thị danh mục con nếu đang mở rộng */}
        {hasChildren && isExpanded && (
          <div style={{ marginTop: 6 }}>
            {item.children!.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="pb-4" style={{ padding: isMobile ? "4px 0" : "0" }}>
      {viewMode === "cards" ? (
        /* GIAO DIỆN DẠNG THẺ (CARDS VIEW) - TỐI ƯU CHO MOBILE, TABLET & TREE DISPLAY */
        <div className={!isMobile && showAddPanel ? "row g-4" : ""}>
          {!isMobile && showAddPanel && (
            <div className="col-lg-4 col-md-5">
              <Card
                className="app-card"
                bordered={false}
                title={
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
                    {categorySelected ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                  </span>
                }
                extra={
                  <Tooltip title="Ẩn khung thêm danh mục">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: 12, color: "#94a3b8" }} />}
                      onClick={() => {
                        setCategorySelected(undefined);
                        setShowAddPanel(false);
                      }}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                }
              >
                <AddCategory
                  onClose={() => {
                    setCategorySelected(undefined);
                  }}
                  seleted={categorySelected}
                  values={treeValues}
                  onAddNew={async () => {
                    await fetchCategories();
                    setCategorySelected(undefined);
                  }}
                />
              </Card>
            </div>
          )}

          <div
            className={
              !isMobile && showAddPanel
                ? "col-lg-8 col-md-7 d-flex flex-column gap-3"
                : "d-flex flex-column gap-3"
            }
          >
            {/* Header: Tiêu đề + Nút chuyển chế độ Thẻ/Bảng + Thêm mới + Tìm kiếm */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                    Phân cấp danh mục
                  </h4>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Tổng cộng: <strong style={{ color: "#1677ff" }}>{total}</strong> danh mục
                  </div>
                </div>

                <Space wrap size={8}>
                  <Segmented
                    value={viewMode}
                    onChange={(val) => setViewMode(val as "table" | "cards")}
                    options={[
                      {
                        value: "cards",
                        icon: <AppstoreOutlined />,
                        label: isMobile ? undefined : "Dạng thẻ",
                      },
                      {
                        value: "table",
                        icon: <BarsOutlined />,
                        label: isMobile ? undefined : "Dạng bảng",
                      },
                    ]}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      if (isMobile) {
                        setCategorySelected(undefined);
                        setIsMobileFormOpen(true);
                      } else {
                        setCategorySelected(undefined);
                        setShowAddPanel(true);
                      }
                    }}
                    style={{
                      borderRadius: 8,
                      fontWeight: 500,
                      height: 36,
                    }}
                  >
                    {isMobile ? "Thêm mới" : showAddPanel ? "Thêm mới" : "Mở khung thêm mới"}
                  </Button>
                </Space>
              </div>

              {/* Ô tìm kiếm nhanh & Nút đóng/mở toàn bộ */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input
                  placeholder="Tìm danh mục..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8, height: 36, flex: 1 }}
                />
                <Button
                  size="middle"
                  onClick={() => {
                    if (expandedKeys.size > 0) {
                      setExpandedKeys(new Set());
                    } else {
                      const allKeys = new Set<string>();
                      const collect = (list: CategoyModel[]) => {
                        list.forEach((c) => {
                          if (c.children?.length) {
                            allKeys.add(c.id);
                            collect(c.children);
                          }
                        });
                      };
                      collect(treeCategories);
                      setExpandedKeys(allKeys);
                    }
                  }}
                  style={{ borderRadius: 8, height: 36, fontSize: 12, flexShrink: 0 }}
                >
                  {expandedKeys.size > 0 ? "Thu gọn" : "Mở hết"}
                </Button>
              </div>
            </div>

            {/* Danh sách danh mục mobile (Dạng thẻ phân cấp có nối nhánh) */}
            {tableLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <Spin tip="Đang tải danh mục..." />
              </div>
            ) : displayedCategories.length === 0 ? (
              <Card
                className="app-card"
                style={{ textAlign: "center", padding: "36px 0", borderRadius: 12 }}
                bordered={false}
              >
                <Empty
                  description={
                    searchKey ? "Không tìm thấy danh mục phù hợp" : "Chưa có danh mục nào"
                  }
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (isMobile) {
                      setCategorySelected(undefined);
                      setIsMobileFormOpen(true);
                    } else {
                      setCategorySelected(undefined);
                      setShowAddPanel(true);
                    }
                  }}
                  style={{ marginTop: 12, borderRadius: 8 }}
                >
                  Tạo danh mục đầu tiên
                </Button>
              </Card>
            ) : (
              <div className="d-flex flex-column gap-1">
                {displayedCategories.map((item) => renderCategoryItem(item, 0))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DẠNG BẢNG (TABLE VIEW) */
        <div className="row g-4">
          {!isMobile && showAddPanel && (
            <div className="col-lg-4 col-md-5">
              <Card
                className="app-card"
                bordered={false}
                title={
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
                    {categorySelected ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                  </span>
                }
                extra={
                  <Tooltip title="Ẩn khung thêm danh mục">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: 12, color: "#94a3b8" }} />}
                      onClick={() => {
                        setCategorySelected(undefined);
                        setShowAddPanel(false);
                      }}
                      style={{ borderRadius: 6 }}
                    />
                  </Tooltip>
                }
              >
                <AddCategory
                  onClose={() => {
                    setCategorySelected(undefined);
                  }}
                  seleted={categorySelected}
                  values={treeValues}
                  onAddNew={async () => {
                    await fetchCategories();
                    setCategorySelected(undefined);
                  }}
                />
              </Card>
            </div>
          )}

          <div className={!isMobile && showAddPanel ? "col-lg-8 col-md-7" : "col-12"}>
            <Card
              className="app-card"
              bordered={false}
              title={
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
                    Cây phân cấp danh mục
                  </span>
                  <Tag color="blue" style={{ fontWeight: 500, margin: 0, borderRadius: 6 }}>
                    Tổng: {total} danh mục
                  </Tag>
                </div>
              }
              extra={
                <Space wrap size={8}>
                  <Segmented
                    value={viewMode}
                    onChange={(val) => setViewMode(val as "table" | "cards")}
                    options={[
                      {
                        value: "cards",
                        icon: <AppstoreOutlined />,
                        label: isMobile ? undefined : "Dạng thẻ",
                      },
                      {
                        value: "table",
                        icon: <BarsOutlined />,
                        label: isMobile ? undefined : "Dạng bảng",
                      },
                    ]}
                  />
                  {!isMobile && (
                    <Button
                      type={showAddPanel ? "default" : "primary"}
                      icon={showAddPanel ? <CloseOutlined /> : <PlusOutlined />}
                      onClick={() => {
                        if (showAddPanel) {
                          setCategorySelected(undefined);
                          setShowAddPanel(false);
                        } else {
                          setShowAddPanel(true);
                        }
                      }}
                      style={{
                        borderRadius: 8,
                        fontWeight: 500,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {showAddPanel ? "Ẩn khung thêm mới" : "Thêm danh mục mới"}
                    </Button>
                  )}
                  {isMobile && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCategorySelected(undefined);
                        setIsMobileFormOpen(true);
                      }}
                      style={{
                        borderRadius: 8,
                        fontWeight: 500,
                        height: 36,
                      }}
                    >
                      Thêm mới
                    </Button>
                  )}
                </Space>
              }
            >
              <Table
                bordered
                size="middle"
                dataSource={treeCategories}
                columns={columns}
                rowKey={(record) => record.id}
                loading={tableLoading}
                scroll={{ x: 600 }}
                expandable={{
                  indentSize: 20,
                  defaultExpandAllRows: true,
                }}
                pagination={false}
              />
            </Card>
          </div>
        </div>
      )}

      {/* Drawer thêm/sửa danh mục trên Mobile (Slide từ dưới lên như App native) */}
      <Drawer
        open={isMobileFormOpen}
        onClose={() => {
          setIsMobileFormOpen(false);
          setCategorySelected(undefined);
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FolderOpenOutlined style={{ color: "#1677ff" }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {categorySelected ? "Cập nhật danh mục" : "Thêm danh mục mới"}
            </span>
          </div>
        }
        placement="bottom"
        height="85vh"
        destroyOnClose
        bodyStyle={{ padding: "16px 16px 24px" }}
      >
        <AddCategory
          onClose={() => {
            setIsMobileFormOpen(false);
            setCategorySelected(undefined);
          }}
          seleted={categorySelected}
          values={treeValues}
          onAddNew={async () => {
            await fetchCategories();
            setCategorySelected(undefined);
            setIsMobileFormOpen(false);
          }}
        />
      </Drawer>
    </div>
  );
};

export default Categories;
