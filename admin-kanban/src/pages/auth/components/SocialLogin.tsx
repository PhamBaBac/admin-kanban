/** @format */

import { Button, message } from "antd";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import handleAPI from "../../../apis/handleAPI";
import { addAuth } from "../../../redux/reducers/authReducer";

interface Props {
  provider: "google" | "github";
  isRemember?: boolean;
}

const SocialLogin = ({ provider, isRemember }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Xử lý OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const accessToken = urlParams.get("accessToken");

    if (accessToken) {
      handleOAuthCallback(accessToken);
    }
  }, [location]);

  const handleOAuthCallback = async (accessToken: string) => {
    try {
      setIsLoading(true);

      const userInfoResponse: any = await handleAPI("/auth/me");
      dispatch(
        addAuth({
          firstName: userInfoResponse.result?.firstname,
          lastName: userInfoResponse.result?.lastname,
          email: userInfoResponse.result?.email,
          role: userInfoResponse.result?.role,
          token: accessToken,
        })
      );

      message.success("Đăng nhập thành công!");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("OAuth callback error:", error);
      message.error("Đăng nhập thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl =
      provider === "google"
        ? "http://localhost:8080/oauth2/authorization/google"
        : "http://localhost:8080/oauth2/authorization/github";
    window.location.href = redirectUrl;
  };

  const getIcon = () => {
    if (provider === "google") {
      return (
        <img
          width={24}
          height={24}
          src="https://img.icons8.com/color/48/google-logo.png"
          alt="google-logo"
        />
      );
    } else {
      return (
        <img
          width={24}
          height={24}
          src="https://img.icons8.com/ios-filled/50/github.png"
          alt="github-logo"
        />
      );
    }
  };

  const getLabel = () => {
    return provider === "google" ? "Google" : "GitHub";
  };

  return (
    <Button
      loading={isLoading}
      onClick={handleLogin}
      style={{ width: "100%" }}
      size="large"
      icon={getIcon()}
    >
      {getLabel()}
    </Button>
  );
};

export default SocialLogin;
