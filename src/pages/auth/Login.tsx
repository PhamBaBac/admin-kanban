/** @format */

import {
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  message,
  Space,
  Typography,
} from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appInfo } from "../../constants/appInfos";
import { useAuth } from "../../hooks/useAuth";
import TurnstileWidget from "../../components/TurnstileWidget";

const { Title, Paragraph, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [isRemember, setIsRemember] = useState(false);
  const [form] = Form.useForm();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const user = await login({
        ...values,
        captchaToken: captchaToken || undefined,
      });
      if (user.role !== "ADMIN" && user.role !== "MANAGER") {
        message.error("Chỉ ADMIN hoặc MANAGER mới được đăng nhập!");
        return;
      }
      message.success("Login successful");
      navigate("/");
    } catch (error: any) {
      setShowCaptcha(true);
      message.error(error.message || "Login failed");
    }
  };

  return (
    <Card style={{ width: "50%" }}>
      <div className="text-center">
        <img
          className="mb-3"
          src={appInfo.logo}
          alt=""
          style={{ width: 48, height: 48 }}
        />
        <Title level={2}>Log in to your account</Title>
        <Paragraph type="secondary">
          Welcome back! please enter your details
        </Paragraph>
      </div>

              <Form
        layout="vertical"
        form={form}
        onFinish={handleLogin}
        disabled={loading}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: "Please enter your email!" }]}
        >
          <Input allowClear maxLength={100} type="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter your password!" }]}
        >
          <Input.Password maxLength={100} />
        </Form.Item>
      </Form>

      <div className="row">
        <div className="col">
          <Checkbox
            checked={isRemember}
            onChange={(val) => setIsRemember(val.target.checked)}
          >
            Remember for 30 days
          </Checkbox>
        </div>
        <div className="col text-right">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>

      {showCaptcha && (
        <div className="my-3 text-center">
          <Text type="danger" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
            Vui lòng hoàn thành xác thực bảo mật trước khi đăng nhập:
          </Text>
          <TurnstileWidget
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken("")}
          />
        </div>
      )}

      <div className="mt-4 mb-3">
        <Button
          loading={loading}
          onClick={() => form.submit()}
          type="primary"
          style={{ width: "100%" }}
          size="large"
        >
          Login
        </Button>
      </div>

      <div className="mt-3 text-center">
        <Space>
          <Text>Don't have an account?</Text>
          <Link to="/sign-up">Sign up</Link>
        </Space>
      </div>
    </Card>
  );
};

export default Login;
