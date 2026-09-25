import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { message } from "antd";
import { authSeletor } from "../redux/reducers/authReducer";

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

const AdminRoute: React.FC<Props> = ({ children, roles }) => {
  const auth = useSelector(authSeletor);
  const userRole = (auth?.role || "").toUpperCase();
  const allowedRoles = roles ? roles.map((r) => r.toUpperCase()) : ["ADMIN"];
  const isAllowed = allowedRoles.includes(userRole);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isAllowed && !warnedRef.current) {
      warnedRef.current = true;
      message.error("Truy cập bị từ chối: Bạn không có quyền truy cập trang này!");
    }
  }, [isAllowed]);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
