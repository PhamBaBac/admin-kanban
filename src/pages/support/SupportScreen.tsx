import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Card,
  Input,
  Button,
  Avatar,
  Badge,
  Typography,
  Tag,
  Space,
  Empty,
  Spin,
  Tooltip,
  Segmented,
  message,
} from "antd";
import {
  Messages1,
  SearchNormal1,
  Send2,
  Refresh,
  TickCircle,
  Clock,
  User,
  Bag2,
  Flash,
} from "iconsax-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { authSeletor } from "../../redux/reducers/authReducer";
import {
  supportService,
  SupportMessage,
  ConversationSummary,
} from "../../services/supportService";
import { initSocket } from "../../connect/SocketIO";
import { colors } from "../../constants/colors";
import { Socket } from "socket.io-client";

const { Text, Title } = Typography;
const { TextArea } = Input;

const QUICK_REPLIES = [
  "Chào bạn, Shop có thể hỗ trợ gì cho bạn ạ?",
  "Shop đã tiếp nhận thông tin và đang kiểm tra đơn hàng giúp bạn nhé!",
  "Bạn vui lòng cung cấp mã đơn hàng để Shop kiểm tra nhanh hơn nhé!",
  "Cảm ơn bạn đã phản hồi, chúc bạn một ngày tốt lành!",
];

// Ngưỡng thời gian (phút) để gom cụm chuỗi tin nhắn liên tục của cùng một người gửi
const MESSAGE_GROUP_TIME_WINDOW_MINUTES = 5;

const SupportScreen: React.FC = () => {
  const auth = useSelector(authSeletor);
  const currentUserId = auth?.userId || "";
  const currentUsername = `${auth?.firstName || ""} ${auth?.lastName || ""}`.trim() || "Quản trị viên";
  const currentUserRole = (auth?.role || "ADMIN").toUpperCase() as "ADMIN" | "MANAGER";

  // Data state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  // UI state
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  const processedMsgIdsRef = useRef<Set<string>>(new Set());

  // Luôn đồng bộ selectedConvId vào ref để các socket callback không bị dính stale closure
  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  // Cuộn xuống tin nhắn mới nhất (cuộn nội bộ container, không gây giật màn hình hoặc lệch ngang)
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCustomerTyping]);

  // 1. Tải danh sách các cuộc hội thoại
  const loadConversations = async () => {
    setLoadingList(true);
    try {
      const summaries = await supportService.getConversationSummaries();
      setConversations(summaries);
      // Nếu chưa chọn cuộc hội thoại nào và có danh sách, tự động chọn cuộc đầu tiên
      if (!selectedConvId && summaries.length > 0) {
        setSelectedConvId(summaries[0].conversationId);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách hội thoại:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Khởi tạo Socket.IO kết nối
  useEffect(() => {
    loadConversations();

    const socket = initSocket(auth?.accessToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      // Join vào phòng ban quản trị chung để nhận thông báo từ mọi khách hàng và quản trị viên khác
      socket.emit("join_admin_channel", {
        userId: currentUserId,
        username: currentUsername,
        role: currentUserRole,
      });

      // Nếu đã có cuộc hội thoại đang chọn, tự động join room tương ứng
      if (selectedConvIdRef.current) {
        socket.emit("join_conversation", {
          conversationId: selectedConvIdRef.current,
          userId: currentUserId,
        });
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Hàm dùng chung xử lý mọi tin nhắn mới (từ khách hàng, hoặc từ quản trị viên khác đang trực)
    const handleIncomingMessage = (newMsg: SupportMessage) => {
      // 0. Bỏ qua nếu tin nhắn này đã được nhận và xử lý qua kênh socket khác (deduplication)
      if (newMsg.id) {
        if (processedMsgIdsRef.current.has(newMsg.id)) return;
        processedMsgIdsRef.current.add(newMsg.id);
      }

      const isActiveConv = newMsg.conversationId === selectedConvIdRef.current;

      // 1. Nếu tin nhắn thuộc cuộc trò chuyện đang mở -> đẩy ngay vào khung chat
      if (isActiveConv) {
        setMessages((prev) => {
          // Tránh trùng lặp nếu ID tin nhắn đã tồn tại
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) return prev;
          // Tránh trùng lặp với tin nhắn optimistic do chính admin này gửi
          const optIndex = prev.findIndex(
            (m) =>
              !m.id &&
              m.content === newMsg.content &&
              m.senderId === newMsg.senderId
          );
          if (optIndex > -1) {
            const updated = [...prev];
            updated[optIndex] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });
        setIsCustomerTyping(false);

        // Đang mở cuộc hội thoại này nên coi như đã đọc ngay
        if (newMsg.role === "USER") {
          supportService.markAsRead(newMsg.conversationId).catch(() => {});
        }
      }

      // 2. Cập nhật danh sách hội thoại bên cột trái và đưa lên đầu
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.conversationId === newMsg.conversationId);
        if (existingIndex > -1) {
          const updated = [...prev];
          const item = { ...updated[existingIndex] };
          item.lastMessage = newMsg.content;
          item.lastMessageTime = newMsg.createdAt;
          item.lastSenderRole = newMsg.role;
          if (newMsg.role === "USER") {
            if (!isActiveConv) {
              item.unreadCount = (item.unreadCount || 0) + 1;
            } else {
              item.unreadCount = 0;
            }
          } else {
            // Khi quản trị viên đã phản hồi, reset unreadCount
            item.unreadCount = 0;
          }
          updated.splice(existingIndex, 1);
          return [item, ...updated];
        } else {
          // Hội thoại mới tinh
          const newItem: ConversationSummary = {
            conversationId: newMsg.conversationId,
            customerId: newMsg.senderId,
            customerName: newMsg.username || "Khách hàng mới",
            customerAvatar: newMsg.avatar,
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.createdAt,
            lastSenderRole: newMsg.role,
            unreadCount: newMsg.role === "USER" && !isActiveConv ? 1 : 0,
          };
          return [newItem, ...prev];
        }
      });
    };

    // Lắng nghe tin nhắn từ phòng trò chuyện đang mở
    socket.on("receive_message", handleIncomingMessage);

    // Lắng nghe tin nhắn từ kênh quản trị chung (tất cả tin nhắn giữa khách và admin)
    socket.on("admin_channel_message", handleIncomingMessage);

    // Lắng nghe trạng thái đang gõ phím
    socket.on("user_typing", (data: { conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === selectedConvIdRef.current) {
        setIsCustomerTyping(data.isTyping);
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // 3. Khi chuyển đổi cuộc hội thoại
  useEffect(() => {
    if (!selectedConvId) return;

    // Join room socket của cuộc hội thoại này
    if (socketRef.current) {
      socketRef.current.emit("join_conversation", {
        conversationId: selectedConvId,
        userId: currentUserId,
      });
    }

    // Đánh dấu đã đọc trên server và local state
    supportService.markAsRead(selectedConvId).catch(() => {});
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === selectedConvId ? { ...c, unreadCount: 0 } : c
      )
    );

    // Tải lịch sử tin nhắn của cuộc hội thoại này
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const history = await supportService.getHistory(selectedConvId);
        setMessages(history);
      } catch (err: any) {
        message.error("Không thể tải lịch sử tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistory();

    // Rời room khi unmount hoặc đổi cuộc hội thoại khác
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_conversation", {
          conversationId: selectedConvId,
        });
      }
    };
  }, [selectedConvId]);

  // 4. Gửi tin nhắn
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !selectedConvId) return;

    const currentConv = conversations.find((c) => c.conversationId === selectedConvId);
    const receiverId = currentConv?.customerId || selectedConvId.replace("user_", "");

    const newMsgPayload = {
      conversationId: selectedConvId,
      senderId: currentUserId,
      receiverId: receiverId,
      username: currentUsername,
      avatar: auth?.avatar || "",
      role: currentUserRole,
      content: content,
    };

    // Tạo tin nhắn tạm để hiển thị ngay trên UI (Optimistic UI)
    const optimisticMsg: SupportMessage = {
      ...newMsgPayload,
      status: "SENT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");

    // Bắn qua Socket
    if (socketRef.current && socketConnected) {
      socketRef.current.emit("send_message", newMsgPayload);
    } else {
      // Fallback qua REST API nếu socket chưa sẵn sàng
      try {
        await supportService.sendMessage(newMsgPayload);
      } catch (err) {
        console.error("Gửi tin nhắn qua REST thất bại:", err);
      }
    }

    // Cập nhật hiển thị tóm tắt tin nhắn cuối trong danh sách bên trái
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === selectedConvId
          ? {
              ...c,
              lastMessage: content,
              lastMessageTime: new Date().toISOString(),
              lastSenderRole: currentUserRole,
            }
          : c
      )
    );
  };

  // 5. Báo trạng thái đang gõ phím
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!socketRef.current || !selectedConvId) return;

    socketRef.current.emit("typing", {
      conversationId: selectedConvId,
      username: currentUsername,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", {
        conversationId: selectedConvId,
        username: currentUsername,
        isTyping: false,
      });
    }, 1500);
  };

  // Đếm số lượng cuộc hội thoại theo từng trạng thái
  const unreadOrPendingCount = useMemo(() => {
    return conversations.filter(
      (c) => (c.unreadCount || 0) > 0 || c.lastSenderRole === "USER"
    ).length;
  }, [conversations]);

  const answeredCount = useMemo(() => {
    return conversations.filter(
      (c) => c.lastSenderRole !== "USER" && (c.unreadCount || 0) === 0
    ).length;
  }, [conversations]);

  // Cuộc hội thoại đang chọn
  const activeConversation = conversations.find((c) => c.conversationId === selectedConvId);

  // Lọc danh sách hội thoại theo tìm kiếm và tab
  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.conversationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    // Tab "unread": Cuộc hội thoại có tin nhắn chưa đọc HOẶC khách hàng gửi tin cuối (chờ trả lời)
    if (filterType === "unread") {
      return (c.unreadCount || 0) > 0 || c.lastSenderRole === "USER";
    }
    // Tab "answered": Quản trị viên đã phản hồi và không còn tin chưa đọc
    if (filterType === "answered") {
      return c.lastSenderRole !== "USER" && (c.unreadCount || 0) === 0;
    }
    return true;
  });

  // Format thời gian hiển thị
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      style={{
        height: "calc(100vh - 135px)",
        maxHeight: "calc(100vh - 135px)",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Container 2 cột */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* CỘT TRÁI: Danh sách cuộc hội thoại (330px) */}
        <div
          style={{
            width: 330,
            minWidth: 330,
            maxWidth: 350,
            flexShrink: 0,
            borderRight: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            background: "#fafafa",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Header cột trái */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={5} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                  Hỗ trợ khách hàng
                </Title>
                <Badge
                  count={conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                  overflowCount={99}
                  style={{ backgroundColor: colors.primary500 }}
                />
              </div>
              <Tooltip title="Tải lại danh sách">
                <Button
                  type="text"
                  shape="circle"
                  icon={<Refresh size={18} color="#64748b" />}
                  onClick={loadConversations}
                  loading={loadingList}
                />
              </Tooltip>
            </div>

            {/* Ô tìm kiếm */}
            <Input
              prefix={<SearchNormal1 size={16} color="#94a3b8" />}
              placeholder="Tìm khách hàng hoặc tin nhắn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ borderRadius: 8, background: "#f8fafc" }}
            />

            {/* Phân loại tab */}
            <Segmented
              block
              value={filterType}
              onChange={(val) => setFilterType(val as string)}
              options={[
                {
                  label: `Tất cả (${conversations.length})`,
                  value: "all",
                },
                {
                  label: (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Chờ phản hồi
                      {unreadOrPendingCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 10,
                            padding: "0 6px",
                            lineHeight: "18px",
                            height: 18,
                          }}
                        >
                          {unreadOrPendingCount}
                        </span>
                      )}
                    </span>
                  ),
                  value: "unread",
                },
                {
                  label: `Đã phản hồi (${answeredCount})`,
                  value: "answered",
                },
              ]}
              style={{ marginTop: 12 }}
            />
          </div>

          {/* Danh sách các cuộc trò chuyện */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
            {loadingList ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin tip="Đang tải hội thoại..." />
              </div>
            ) : filteredConversations.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không tìm thấy cuộc hội thoại nào"
                style={{ marginTop: 40 }}
              />
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.conversationId === selectedConvId;
                const hasUnread = (conv.unreadCount || 0) > 0;
                const isWaitingReply = conv.lastSenderRole === "USER";

                return (
                  <div
                    key={conv.conversationId}
                    onClick={() => setSelectedConvId(conv.conversationId)}
                    style={{
                      padding: "12px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: isSelected ? "#eff6ff" : "transparent",
                      borderLeft: isSelected ? `4px solid ${colors.primary500}` : "4px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Avatar khách hàng */}
                    <Badge count={conv.unreadCount} size="small" offset={[-2, 2]}>
                      <Avatar
                        size={44}
                        src={conv.customerAvatar}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {conv.customerName ? conv.customerName[0].toUpperCase() : "U"}
                      </Avatar>
                    </Badge>

                    {/* Chi tiết tóm tắt */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text
                          strong={hasUnread || isWaitingReply}
                          style={{
                            fontSize: 14,
                            color: isSelected ? colors.primary500 : "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conv.customerName || "Khách hàng"}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                          {formatTime(conv.lastMessageTime)}
                        </Text>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: hasUnread ? "#0f172a" : "#64748b",
                          fontWeight: hasUnread ? 600 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {conv.lastSenderRole !== "USER" && (
                            <span style={{ color: colors.primary500, marginRight: 4 }}>Bạn:</span>
                          )}
                          {conv.lastMessage || "Chưa có tin nhắn"}
                        </span>
                        {isWaitingReply ? (
                          <Tag
                            color="warning"
                            style={{
                              fontSize: 10,
                              margin: 0,
                              padding: "0 5px",
                              lineHeight: "16px",
                              height: 16,
                              flexShrink: 0,
                            }}
                          >
                            Chờ trả lời
                          </Tag>
                        ) : (
                          <Tag
                            color="success"
                            style={{
                              fontSize: 10,
                              margin: 0,
                              padding: "0 5px",
                              lineHeight: "16px",
                              height: 16,
                              flexShrink: 0,
                            }}
                          >
                            Đã trả lời
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer trạng thái Socket */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid #f1f5f9",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: socketConnected ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              <Text type="secondary">
                {socketConnected ? "Realtime Socket kết nối" : "Đang kết nối lại..."}
              </Text>
            </div>
            <Tag color={currentUserRole === "ADMIN" ? "blue" : "purple"} style={{ margin: 0 }}>
              {currentUserRole}
            </Tag>
          </div>
        </div>

        {/* CỘT PHẢI: Khung trò chuyện chi tiết (Chat Area) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {selectedConvId && activeConversation ? (
            <>
              {/* Header khung chat */}
              <div
                style={{
                  padding: "14px 24px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar
                    size={40}
                    src={activeConversation.customerAvatar}
                    style={{ backgroundColor: "#1570ef", color: "#fff", fontWeight: 700 }}
                  >
                    {activeConversation.customerName ? activeConversation.customerName[0].toUpperCase() : "U"}
                  </Avatar>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                        {activeConversation.customerName || "Khách hàng"}
                      </Text>
                      <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
                        {activeConversation.conversationId}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {isCustomerTyping ? (
                        <span style={{ color: colors.primary500, fontWeight: 500 }}>
                          Khách hàng đang soạn tin nhắn...
                        </span>
                      ) : (
                        "Khách mua hàng"
                      )}
                    </Text>
                  </div>
                </div>

                {/* Các nút thao tác nhanh */}
                <Space>
                  <Link to={`/orders?search=${encodeURIComponent(activeConversation.customerName || "")}`}>
                    <Button icon={<Bag2 size={16} color="#1570ef" />} style={{ borderRadius: 8 }}>
                      Xem đơn hàng của khách
                    </Button>
                  </Link>
                </Space>
              </div>

              {/* Vùng hiển thị tin nhắn (Message Body) */}
              <div
                ref={messagesContainerRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  padding: "20px 24px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {loadingMessages ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin tip="Đang tải tin nhắn..." />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="Chưa có tin nhắn nào trong cuộc trò chuyện này" style={{ marginTop: 60 }} />
                ) : (
                  messages.map((msg, index) => {
                    const isStaff = msg.role === "ADMIN" || msg.role === "MANAGER";
                    const isMe = msg.senderId === currentUserId;

                    // Xác định tin nhắn trước đó để kiểm tra chuỗi liên tục (tin đầu chuỗi)
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const isSameSender = Boolean(
                      prevMsg &&
                      (prevMsg.senderId && msg.senderId
                        ? prevMsg.senderId === msg.senderId
                        : prevMsg.role === msg.role)
                    );

                    // Kiểm tra 2 tin nhắn gửi liền kề có trong vòng [X phút] hay không
                    let isWithinTimeThreshold = false;
                    if (isSameSender && prevMsg?.createdAt && msg.createdAt) {
                      const prevTime = new Date(prevMsg.createdAt).getTime();
                      const currTime = new Date(msg.createdAt).getTime();
                      if (!isNaN(prevTime) && !isNaN(currTime)) {
                        const diffMinutes = Math.abs(currTime - prevTime) / (1000 * 60);
                        isWithinTimeThreshold = diffMinutes <= MESSAGE_GROUP_TIME_WINDOW_MINUTES;
                      }
                    }

                    // Chỉ hiển thị Tên/Thời gian ở tin nhắn đầu tiên của chuỗi tin nhắn liên tục
                    const isFirstInChain = !isSameSender || !isWithinTimeThreshold;

                    // Xác định tin nhắn kế tiếp để kiểm tra tin cuối chuỗi (hiển thị Avatar ở tin nhắn cuối)
                    const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                    const isSameNextSender = Boolean(
                      nextMsg &&
                      (nextMsg.senderId && msg.senderId
                        ? nextMsg.senderId === msg.senderId
                        : nextMsg.role === msg.role)
                    );

                    let isNextWithinTimeThreshold = false;
                    if (isSameNextSender && nextMsg?.createdAt && msg.createdAt) {
                      const currTime = new Date(msg.createdAt).getTime();
                      const nextTime = new Date(nextMsg.createdAt).getTime();
                      if (!isNaN(currTime) && !isNaN(nextTime)) {
                        const diffMinutes = Math.abs(nextTime - currTime) / (1000 * 60);
                        isNextWithinTimeThreshold = diffMinutes <= MESSAGE_GROUP_TIME_WINDOW_MINUTES;
                      }
                    }

                    // Chỉ hiển thị Avatar ở tin nhắn cuối cùng của chuỗi tin nhắn liên tục
                    const isLastInChain = !isSameNextSender || !isNextWithinTimeThreshold;

                    return (
                      <div
                        key={msg.id || index}
                        style={{
                          display: "flex",
                          flexDirection: isStaff ? "row-reverse" : "row",
                          alignItems: "flex-end",
                          gap: 10,
                          marginTop: isFirstInChain ? (index === 0 ? 0 : 6) : -8,
                        }}
                      >
                        {/* Avatar: chỉ hiển thị cho khách hàng ở tin nhắn CUỐI CÙNG của chuỗi liên tục */}
                        {!isStaff && (
                          isLastInChain ? (
                            <Avatar
                              size={32}
                              src={msg.avatar}
                              style={{
                                backgroundColor: "#64748b",
                                color: "#fff",
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {msg.username ? msg.username[0].toUpperCase() : "U"}
                            </Avatar>
                          ) : (
                            <div style={{ width: 32, flexShrink: 0 }} />
                          )
                        )}

                        {/* Bong bóng chat */}
                        <div
                          style={{
                            maxWidth: "65%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isStaff ? "flex-end" : "flex-start",
                          }}
                        >
                          {/* Nội dung tin nhắn */}
                          <div
                            style={{
                              padding: "10px 16px",
                              borderRadius: isStaff ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              backgroundColor: isStaff ? colors.primary500 : "#fff",
                              color: isStaff ? "#fff" : "#1e293b",
                              border: isStaff ? "none" : "1px solid #e2e8f0",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                              fontSize: 14,
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.content}
                          </div>

                          {/* Tên người gửi và thời gian (chỉ hiển thị ở tin nhắn CUỐI CÙNG của chuỗi liên tục) */}
                          {isLastInChain && (
                            <div
                              style={{
                                marginTop: 4,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isStaff ? "flex-end" : "flex-start",
                                gap: 2,
                                padding: "0 2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: isStaff ? "#64748b" : "#475569",
                                }}
                              >
                                {msg.username || (isStaff ? "Quản trị viên" : "Khách hàng")}
                              </span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 10,
                                  color: "#94a3b8",
                                }}
                              >
                                <Clock size={11} color="#94a3b8" />
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Khách hàng đang gõ tin */}
                {isCustomerTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar size={28} style={{ backgroundColor: "#94a3b8", fontSize: 12 }}>
                      ...
                    </Avatar>
                    <div
                      style={{
                        padding: "8px 14px",
                        borderRadius: 14,
                        background: "#e2e8f0",
                        color: "#475569",
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      Khách hàng đang soạn tin...
                    </div>
                  </div>
                )}

              </div>

              {/* Thanh gợi ý phản hồi nhanh (Quick Replies) */}
              <div
                style={{
                  padding: "8px 24px",
                  background: "#fff",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <Flash size={14} color="#f59e0b" /> Mẫu nhanh:
                </span>
                {QUICK_REPLIES.map((reply, i) => (
                  <Button
                    key={i}
                    size="small"
                    style={{
                      borderRadius: 12,
                      fontSize: 12,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                    onClick={() => handleSendMessage(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </div>

              {/* Vùng nhập tin nhắn (Input Area) */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", background: "#fff", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <TextArea
                    value={inputText}
                    onChange={handleTyping}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập nội dung tin nhắn phản hồi (Nhấn Enter để gửi, Shift + Enter để xuống dòng)..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ borderRadius: 12, padding: "8px 12px" }}
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<Send2 size={20} color="#fff" />}
                    onClick={() => handleSendMessage()}
                    style={{
                      backgroundColor: colors.primary500,
                      boxShadow: "0 4px 12px rgba(21, 112, 239, 0.3)",
                      flexShrink: 0,
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            // Empty state khi chưa chọn cuộc hội thoại nào
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Messages1 size={36} color={colors.primary500} variant="Bulk" />
              </div>
              <Title level={4} style={{ color: "#1e293b", margin: "0 0 8px 0" }}>
                Hộp thư Hỗ trợ khách hàng
              </Title>
              <Text type="secondary" style={{ maxWidth: 360, textAlign: "center", fontSize: 13 }}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để xem tin nhắn và hỗ trợ giải đáp thắc mắc cho khách hàng.
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportScreen;
