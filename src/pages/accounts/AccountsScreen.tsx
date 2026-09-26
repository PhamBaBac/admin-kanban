/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Tabs,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Avatar,
  Badge,
  Tooltip,
  message,
  Switch,
  Alert,
  Statistic,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ShieldSecurity,
  User,
  ProfileAdd,
  Clock,
  SearchNormal1,
  Refresh,
  Lock,
  Sms,
  TagUser,
  TickCircle,
  Eye,
} from "iconsax-react";
import { useSelector } from "react-redux";
import { authSeletor } from "../../redux/reducers/authReducer";
import {
  userService,
  User as UserModel,
  UserAuditLog,
} from "../../services/userService";
import { colors } from "../../constants/colors";

const { Title, Text, Paragraph } = Typography;

const AccountsScreen: React.FC = () => {
  const auth = useSelector(authSeletor);
  const currentAdminEmail = auth?.email || "";

  // Tabs state
  const [activeTab, setActiveTab] = useState<string>("list");

  // Tab 1: Danh sách tài khoản
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [searchUser, setSearchUser] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // Modal đổi vai trò (Role)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserModel | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Tab 2: Tạo tài khoản mới (Form)
  const [createForm] = Form.useForm();
  const [creatingUser, setCreatingUser] = useState(false);

  // Tab 3: Nhật ký hoạt động (Audit Logs)
  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);
  const [searchLog, setSearchLog] = useState("");

  // Statistics
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const managerCount = users.filter((u) => u.role === "MANAGER").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  // 1. Tải danh sách tài khoản
  const fetchUsers = useCallback(
    async (
      page = userPage,
      pageSize = userPageSize,
      search = searchUser,
      role = filterRole
    ) => {
      setLoadingUsers(true);
      try {
        const params: any = { page, pageSize };
        if (search.trim()) params.search = search.trim();
        if (role && role !== "ALL") params.role = role;

        const res = await userService.getAdminUsers(params);
        setUsers(res?.data || []);
        setTotalUsers(res?.totalElements || 0);
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách người dùng:", err);
        message.error(err?.response?.data?.message || err?.message || "Không thể tải danh sách tài khoản");
      } finally {
        setLoadingUsers(false);
      }
    },
    [userPage, userPageSize, searchUser, filterRole]
  );

  // 2. Tải nhật ký hoạt động (Audit Logs)
  const fetchLogs = useCallback(
    async (
      page = logPage,
      pageSize = logPageSize,
      search = searchLog
    ) => {
      setLoadingLogs(true);
      try {
        const params: any = { page, pageSize };
        if (search.trim()) params.search = search.trim();

        const res = await userService.getAuditLogs(params);
        setLogs(res?.data || []);
        setTotalLogs(res?.totalElements || 0);
      } catch (err: any) {
        console.error("Lỗi khi tải nhật ký hoạt động:", err);
        message.error(err?.response?.data?.message || err?.message || "Không thể tải nhật ký hoạt động");
      } finally {
        setLoadingLogs(false);
      }
    },
    [logPage, logPageSize, searchLog]
  );

  useEffect(() => {
    fetchUsers(userPage, userPageSize, searchUser, filterRole);
  }, [userPage, userPageSize, filterRole]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs(logPage, logPageSize, searchLog);
    }
  }, [activeTab, logPage, logPageSize]);

  // Xử lý tạo tài khoản mới
  const handleCreateUser = async (values: any) => {
    setCreatingUser(true);
    try {
      await userService.adminCreateUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        mfaEnabled: Boolean(values.mfaEnabled),
      });

      message.success(`Đã tạo thành công tài khoản [${values.email}] với vai trò [${values.role}]!`);
      createForm.resetFields();
      // Làm mới danh sách và chuyển về Tab 1
      fetchUsers(1, userPageSize, "", "ALL");
      setUserPage(1);
      setFilterRole("ALL");
      setSearchUser("");
      setActiveTab("list");
    } catch (err: any) {
      console.error("Lỗi tạo tài khoản:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Tạo tài khoản thất bại. Vui lòng kiểm tra lại thông tin!";
      message.error(errorMsg);
    } finally {
      setCreatingUser(false);
    }
  };

  // Mở modal đổi Role
  const handleOpenRoleModal = (record: UserModel) => {
    setSelectedUserForRole(record);
    setNewSelectedRole(record.role);
    setIsRoleModalOpen(true);
  };

  // Thực hiện đổi Role
  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole || !newSelectedRole) return;

    if (
      selectedUserForRole.email.toLowerCase() === currentAdminEmail.toLowerCase() &&
      newSelectedRole !== "ADMIN"
    ) {
      message.warning("Bạn không thể tự hạ quyền Admin của chính tài khoản đang đăng nhập!");
      return;
    }

    setUpdatingRole(true);
    try {
      await userService.updateUserRole(selectedUserForRole.id, newSelectedRole);
      message.success(
        `Đã cập nhật vai trò cho [${selectedUserForRole.email}] thành [${newSelectedRole}] thành công!`
      );
      setIsRoleModalOpen(false);
      setSelectedUserForRole(null);
      // Reload danh sách
      fetchUsers(userPage, userPageSize, searchUser, filterRole);
    } catch (err: any) {
      console.error("Lỗi cập nhật vai trò:", err);
      message.error(err?.response?.data?.message || err?.message || "Cập nhật vai trò thất bại");
    } finally {
      setUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Tag color="#dc2626" style={{ fontWeight: 600 }}>Quản trị viên (ADMIN)</Tag>;
      case "MANAGER":
        return <Tag color="#1570ef" style={{ fontWeight: 600 }}>Quản lý (MANAGER)</Tag>;
      case "USER":
      default:
        return <Tag color="#16a34a" style={{ fontWeight: 600 }}>Người dùng (USER)</Tag>;
    }
  };

  // Cột bảng Tài khoản
  const userColumns: ColumnsType<UserModel> = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => {
        const initials = `${record.firstname?.[0] || ""}${record.lastname?.[0] || ""}`.toUpperCase() || "U";
        const isCurrent = record.email.toLowerCase() === currentAdminEmail.toLowerCase();
        return (
          <Space>
            <Avatar
              src={record.avatarUrl}
              style={{
                backgroundColor: record.role === "ADMIN" ? "#ef4444" : record.role === "MANAGER" ? "#3b82f6" : "#10b981",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                {record.firstname} {record.lastname}
                {isCurrent && (
                  <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>
                    Bạn
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Vai trò & Phân quyền",
      dataIndex: "role",
      key: "role",
      render: (role: string) => getRoleBadge(role),
    },
    {
      title: "Bảo mật 2FA",
      key: "mfa",
      render: (_, record) => (
        <Badge
          status={record.mfaEnabled ? "success" : "default"}
          text={record.mfaEnabled ? "Đã kích hoạt" : "Chưa bật"}
        />
      ),
    },
    {
      title: "Loại đăng nhập",
      dataIndex: "provider",
      key: "provider",
      render: (provider: string) => (
        <Tag color={provider === "LOCAL" ? "default" : "cyan"} style={{ fontSize: 11 }}>
          {provider || "LOCAL"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt?: string) => {
        if (!createdAt) return <Text type="secondary">-</Text>;
        try {
          const d = new Date(createdAt);
          return (
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {d.toLocaleDateString("vi-VN")} {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        } catch {
          return createdAt;
        }
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => {
        const isCurrent = record.email.toLowerCase() === currentAdminEmail.toLowerCase();
        return (
          <Space size={2}>
            <Tooltip title="Cập nhật phân quyền / vai trò">
              <Button
                type="text"
                size="small"
                icon={<TagUser size={16} />}
                onClick={() => handleOpenRoleModal(record)}
              >
                Đổi vai trò
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // Cột bảng Nhật ký hoạt động
  const logColumns: ColumnsType<UserAuditLog> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (val: string) => {
        if (!val) return "-";
        const d = new Date(val);
        return (
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
            {d.toLocaleDateString("vi-VN")} {d.toLocaleTimeString("vi-VN")}
          </span>
        );
      },
    },
    {
      title: "Người thực hiện",
      key: "performedBy",
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
            {record.performedByEmail || "SYSTEM"}
          </div>
          <Tag color="volcano" style={{ fontSize: 10, padding: "0 4px" }}>
            {record.performedByRole || "ADMIN"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 150,
      render: (act: string) => {
        if (act === "CREATE_USER") {
          return <Tag color="#16a34a">Tạo tài khoản</Tag>;
        }
        if (act === "UPDATE_ROLE") {
          return <Tag color="#2563eb">Đổi vai trò</Tag>;
        }
        return <Tag color="#64748b">{act}</Tag>;
      },
    },
    {
      title: "Tài khoản đích",
      dataIndex: "targetUserEmail",
      key: "targetUserEmail",
      width: 220,
      render: (email: string) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{email}</span>,
    },
    {
      title: "Chi tiết nội dung",
      dataIndex: "details",
      key: "details",
      render: (details: string) => <span style={{ color: "#334155" }}>{details}</span>,
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Banner tiêu đề */}
      <Card
        className="app-card"
        style={{ marginBottom: 16, borderRadius: 12 }}
        bordered={false}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1570ef 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(21, 112, 239, 0.25)",
              }}
            >
              <ShieldSecurity size={26} color="#fff" variant="Bulk" />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Quản lý Tài khoản & Phân quyền
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Khu vực quản trị cấp cao dành riêng cho Quản trị viên (Admin)
              </Text>
            </div>
          </div>
          <Tag color="purple" style={{ padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
            Quyền hạn: ADMIN CHỈ ĐỊNH
          </Tag>
        </div>

        {/* Khối thống kê nhanh */}
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: "#64748b" }}>Tổng số tài khoản</span>}
                value={totalUsers}
                valueStyle={{ color: "#0f172a", fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: "#fef2f2", borderRadius: 8, border: "1px solid #fee2e2" }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: "#dc2626" }}>Quản trị viên (ADMIN)</span>}
                value={adminCount}
                valueStyle={{ color: "#dc2626", fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: "#eff6ff", borderRadius: 8, border: "1px solid #dbeafe" }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: "#1570ef" }}>Quản lý (MANAGER)</span>}
                value={managerCount}
                valueStyle={{ color: "#1570ef", fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: "#f0fdf4", borderRadius: 8, border: "1px solid #dcfce7" }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: "#16a34a" }}>Khách hàng (USER)</span>}
                value={userCount}
                valueStyle={{ color: "#16a34a", fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Tabs Chức năng chính */}
      <Card className="app-card" style={{ borderRadius: 12 }} bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: "list",
              label: (
                <Space>
                  <User size={18} />
                  <span>Danh sách tài khoản & Phân quyền</span>
                </Space>
              ),
              children: (
                <div>
                  {/* Thanh tìm kiếm & Bộ lọc */}
                  <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[12, 12]}>
                    <Col xs={24} md={16}>
                      <Space wrap style={{ width: "100%" }}>
                        <Input.Search
                          placeholder="Tìm theo tên, email tài khoản..."
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          onSearch={() => {
                            setUserPage(1);
                            fetchUsers(1, userPageSize, searchUser, filterRole);
                          }}
                          allowClear
                          style={{ width: 300 }}
                        />
                        <Select
                          value={filterRole}
                          onChange={(val) => {
                            setFilterRole(val);
                            setUserPage(1);
                            fetchUsers(1, userPageSize, searchUser, val);
                          }}
                          style={{ width: 180 }}
                          options={[
                            { value: "ALL", label: "Tất cả vai trò" },
                            { value: "ADMIN", label: "Quản trị viên (ADMIN)" },
                            { value: "MANAGER", label: "Quản lý (MANAGER)" },
                            { value: "USER", label: "Người dùng (USER)" },
                          ]}
                        />
                        <Button
                          icon={<Refresh size={16} />}
                          onClick={() => fetchUsers(userPage, userPageSize, searchUser, filterRole)}
                          loading={loadingUsers}
                        >
                          Làm mới
                        </Button>
                      </Space>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: "right" }}>
                      <Button
                        type="primary"
                        icon={<ProfileAdd size={18} />}
                        onClick={() => setActiveTab("create")}
                        style={{ borderRadius: 6 }}
                      >
                        Thêm tài khoản mới
                      </Button>
                    </Col>
                  </Row>

                  {/* Bảng danh sách tài khoản */}
                  <Table
                    bordered
                    rowKey="id"
                    columns={userColumns}
                    dataSource={users}
                    loading={loadingUsers}
                    pagination={{
                      current: userPage,
                      pageSize: userPageSize,
                      total: totalUsers,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                      onChange: (p, ps) => {
                        setUserPage(p);
                        setUserPageSize(ps);
                        fetchUsers(p, ps, searchUser, filterRole);
                      },
                      showTotal: (total) => `Tổng cộng ${total} tài khoản`,
                    }}
                  />
                </div>
              ),
            },
            {
              key: "create",
              label: (
                <Space>
                  <ProfileAdd size={18} />
                  <span>Tạo tài khoản & Phân quyền</span>
                </Space>
              ),
              children: (
                <div style={{ maxWidth: 760, margin: "20px auto" }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Quyền hạn của từng vai trò"
                    description={
                      <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
                        <div><strong>• ADMIN (Quản trị viên cao nhất):</strong> Toàn quyền truy cập tất cả module, quản lý tài khoản, phân quyền, cấu hình hệ thống.</div>
                        <div><strong>• MANAGER (Quản lý cửa hàng):</strong> Quản lý danh mục, sản phẩm, xử lý đơn hàng, xuất vận đơn và xem báo cáo. Không được quản lý tài khoản admin.</div>
                        <div><strong>• USER (Khách hàng / Nhân viên thường):</strong> Tài khoản khách hàng thông thường trên app shopping hoặc xem thông tin cơ bản.</div>
                      </div>
                    }
                    style={{ marginBottom: 24, borderRadius: 8 }}
                  />

                  <Form
                    layout="vertical"
                    form={createForm}
                    onFinish={handleCreateUser}
                    initialValues={{
                      role: "MANAGER",
                      mfaEnabled: false,
                    }}
                    size="large"
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="firstName"
                          label="Tên (First Name)"
                          rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
                        >
                          <Input placeholder="Ví dụ: Văn A" allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="lastName"
                          label="Họ & Tên đệm (Last Name)"
                          rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
                        >
                          <Input placeholder="Ví dụ: Nguyễn" allowClear />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="email"
                      label="Địa chỉ Email (Dùng để đăng nhập)"
                      rules={[
                        { required: true, message: "Vui lòng nhập email!" },
                        { type: "email", message: "Định dạng email không hợp lệ!" },
                      ]}
                    >
                      <Input
                        prefix={<Sms size={18} color="#94a3b8" />}
                        placeholder="admin.nhanvien@kanban.com"
                        allowClear
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label="Mật khẩu khởi tạo"
                      rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu!" },
                        { min: 6, message: "Mật khẩu tối thiểu 6 ký tự!" },
                      ]}
                    >
                      <Input.Password
                        prefix={<Lock size={18} color="#94a3b8" />}
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      />
                    </Form.Item>

                    <Form.Item
                      name="role"
                      label="Gán quyền / Vai trò (Role)"
                      rules={[{ required: true, message: "Vui lòng chọn vai trò cho tài khoản!" }]}
                    >
                      <Select
                        placeholder="Chọn vai trò"
                        options={[
                          { value: "ADMIN", label: "Quản trị viên (ADMIN) - Toàn quyền" },
                          { value: "MANAGER", label: "Quản lý (MANAGER) - Kho, Sản phẩm & Đơn hàng" },
                          { value: "USER", label: "Người dùng (USER) - Khách hàng thông thường" },
                        ]}
                      />
                    </Form.Item>

                    <Form.Item
                      name="mfaEnabled"
                      valuePropName="checked"
                      label="Bảo mật nâng cao"
                    >
                      <Space>
                        <Switch />
                        <span style={{ fontSize: 13, color: "#475569" }}>
                          Kích hoạt xác thực hai yếu tố (2FA) qua Google Authenticator khi đăng nhập
                        </span>
                      </Space>
                    </Form.Item>

                    <Divider style={{ margin: "20px 0" }} />

                    <div style={{ textAlign: "right" }}>
                      <Space>
                        <Button onClick={() => createForm.resetFields()}>
                          Đặt lại form
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={creatingUser}
                          icon={<ProfileAdd size={18} />}
                        >
                          Xác nhận tạo tài khoản
                        </Button>
                      </Space>
                    </div>
                  </Form>
                </div>
              ),
            },
            {
              key: "logs",
              label: (
                <Space>
                  <Clock size={18} />
                  <span>Log hoạt động (System Logs)</span>
                </Space>
              ),
              children: (
                <div>
                  <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Input.Search
                        placeholder="Tìm kiếm theo email người thực hiện, tài khoản đích, nội dung..."
                        value={searchLog}
                        onChange={(e) => setSearchLog(e.target.value)}
                        onSearch={() => {
                          setLogPage(1);
                          fetchLogs(1, logPageSize, searchLog);
                        }}
                        allowClear
                        style={{ width: 360 }}
                      />
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: "right" }}>
                      <Button
                        icon={<Refresh size={16} />}
                        onClick={() => fetchLogs(logPage, logPageSize, searchLog)}
                        loading={loadingLogs}
                      >
                        Làm mới nhật ký
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    bordered
                    rowKey="id"
                    columns={logColumns}
                    dataSource={logs}
                    loading={loadingLogs}
                    pagination={{
                      current: logPage,
                      pageSize: logPageSize,
                      total: totalLogs,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                      onChange: (p, ps) => {
                        setLogPage(p);
                        setLogPageSize(ps);
                        fetchLogs(p, ps, searchLog);
                      },
                      showTotal: (total) => `Tổng cộng ${total} bản ghi nhật ký kiểm toán`,
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal cập nhật vai trò (Role) */}
      <Modal
        title={
          <Space>
            <ShieldSecurity size={20} color="#1570ef" />
            <span style={{ fontWeight: 700 }}>Cập nhật phân quyền tài khoản</span>
          </Space>
        }
        open={isRoleModalOpen}
        onCancel={() => {
          if (!updatingRole) {
            setIsRoleModalOpen(false);
            setSelectedUserForRole(null);
          }
        }}
        onOk={handleConfirmRoleChange}
        confirmLoading={updatingRole}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        {selectedUserForRole && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Đang chỉnh sửa cho tài khoản:</Text>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginTop: 2 }}>
                {selectedUserForRole.firstname} {selectedUserForRole.lastname} ({selectedUserForRole.email})
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                Chọn vai trò mới:
              </label>
              <Select
                value={newSelectedRole}
                onChange={(val) => setNewSelectedRole(val)}
                style={{ width: "100%" }}
                options={[
                  { value: "ADMIN", label: "Quản trị viên (ADMIN) - Toàn quyền" },
                  { value: "MANAGER", label: "Quản lý (MANAGER) - Đơn hàng, Kho & Sản phẩm" },
                  { value: "USER", label: "Người dùng (USER) - Khách hàng thông thường" },
                ]}
              />
            </div>

            <Alert
              type="warning"
              showIcon
              message="Lưu ý quan trọng"
              description="Hành động thay đổi phân quyền sẽ được ghi lại trong Nhật ký hoạt động (Audit Logs) để đối soát bảo mật."
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountsScreen;
