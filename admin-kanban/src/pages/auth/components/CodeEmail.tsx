/** @format */

import { Button, Card, Form, Input, message, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import handleAPI from "../../../apis/handleAPI";

const { Title, Text, Paragraph } = Typography;

interface CodeEmailFormValues {
  email: string;
  code: string;
}

interface LocationState {
  email: string;
}

const CodeEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const [timeLeft, setTimeLeft] = useState(30);

  // Lấy email từ location
  const { email } = (location.state as LocationState) || {};

  useEffect(() => {
    if (!email) {
      message.error("No email provided for verification");
      navigate("/");
      return;
    }

    form.setFieldsValue({ email });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, form, navigate]);

  const handleVerifyCodeEmail = async (values: CodeEmailFormValues) => {
    setIsLoading(true);
    try {
      // Gửi mã xác thực để xác minh ở backend
      await handleAPI(
        "/auth/verify-code-email",
        {
          email,
          code: values.code,
        },
        "post"
      );

      // Nếu xác minh thành công, lấy secret image để setup MFA
      const secretResponse: any = await handleAPI(
        "/auth/secret-image",
        { email },
        "put"
      );

      const secretImageUri = secretResponse?.result;

      if (secretImageUri) {
        navigate("/mfa-setup", {
          state: {
            email,
            secretImageUri,
          },
        });
      } else {
        throw new Error("Failed to get MFA setup information");
      }
    } catch (error: any) {
      message.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await handleAPI("/auth/send-code-email", { email }, "post");
      message.success("Verification code resent!");
    } catch (error: any) {
      message.error(error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: "50%",
        margin: "0 auto",
        marginTop: "50px",
      }}
    >
      <div className="text-center">
        <Title level={2}>Verify Your Email</Title>
        <Paragraph type="secondary">
          Please enter the verification code sent to your email to setup 2FA
        </Paragraph>
      </div>

      <Form
        form={form}
        onFinish={handleVerifyCodeEmail}
        layout="vertical"
        disabled={isLoading}
        size="large"
      >
        <Form.Item name="email" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="code"
          label="Verification Code"
          rules={[
            {
              required: true,
              message: "Please enter the verification code!",
            },
            {
              len: 6,
              message: "Verification code must be 6 digits!",
            },
          ]}
        >
          <Input
            placeholder="Enter 6-digit verification code"
            maxLength={6}
            style={{ letterSpacing: "8px", fontSize: "20px" }}
          />
        </Form.Item>

        <div className="mt-5 mb-3">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            style={{ width: "100%" }}
            size="large"
          >
            Verify & Setup 2FA
          </Button>
        </div>

        <div className="text-center">
          <Space direction="vertical" size="small">
            <Button
              type="link"
              onClick={handleResendCode}
            >
              Resend Code
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default CodeEmail;
