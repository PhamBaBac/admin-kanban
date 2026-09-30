/** @format */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearSessionExpired, sessionSelector } from "../redux/reducers/sessionReducer";
import { removeAuth } from "../redux/reducers/authReducer";
import { localDataNames } from "../constants/appInfos";

const SessionExpiredModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isExpired } = useSelector(sessionSelector);

  useEffect(() => {
    if (isExpired) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpired]);

  if (!isExpired) return null;

  const handleLogin = () => {
    dispatch(clearSessionExpired());
    dispatch(removeAuth());
    localStorage.removeItem(localDataNames.authData);
    navigate("/login");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "sessionFadeIn 0.25s ease-out",
        }}
      >
        {/* Modal Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "0",
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            boxShadow:
              "0 25px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
            animation: "sessionSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden",
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              height: "5px",
              background: "linear-gradient(90deg, #ef4444, #f97316, #eab308)",
              borderRadius: "20px 20px 0 0",
            }}
          />

          {/* Content */}
          <div style={{ padding: "36px 36px 32px" }}>
            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                boxShadow: "0 4px 12px rgba(234,179,8,0.25)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"
                  fill="#d97706"
                />
              </svg>
            </div>

            {/* Title */}
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "20px",
                fontWeight: "700",
                color: "#0f172a",
                lineHeight: "1.3",
                fontFamily:
                  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Phiên đăng nhập đã hết hạn
            </h2>

            {/* Description */}
            <p
              style={{
                margin: "0 0 28px",
                fontSize: "14px",
                color: "#64748b",
                lineHeight: "1.6",
                fontFamily:
                  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Vì lý do bảo mật, phiên làm việc của bạn đã hết hạn. Vui lòng
              đăng nhập lại để tiếp tục sử dụng hệ thống quản trị.
            </p>

            {/* Session info badge */}
            <div
              style={{
                background: "#fef9f0",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "28px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
                  fill="#d97706"
                />
              </svg>
              <span
                style={{
                  fontSize: "13px",
                  color: "#92400e",
                  fontWeight: "500",
                  fontFamily:
                    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                Mọi thay đổi chưa lưu sẽ không bị mất
              </span>
            </div>

            {/* Button */}
            <button
              id="session-expired-login-btn"
              onClick={handleLogin}
              style={{
                width: "100%",
                height: "46px",
                background: "linear-gradient(135deg, #1570ef, #2563eb)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                fontFamily:
                  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                boxShadow: "0 4px 14px rgba(21,112,239,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 20px rgba(21,112,239,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 14px rgba(21,112,239,0.4)";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"
                  fill="white"
                />
              </svg>
              Đăng nhập lại ngay
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes sessionFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sessionSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default SessionExpiredModal;
