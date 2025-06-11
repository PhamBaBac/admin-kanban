/** @format */

import { Button, Card, Form, Input, message, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import handleAPI from "../../../apis/handleAPI";
import { localDataNames } from "../../../constants/appInfos";
import { useDispatch } from "react-redux";
import { addAuth } from "../../../redux/reducers/authReducer";

const { Title, Text, Paragraph } = Typography;

interface CodeVerifyFormValues {
  email: string;
  code: string;
}

interface LocationState {
  email: string;
}

const CodeVerify = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds countdown

  // Get email from location state
  const { email } = (location.state as LocationState) || {};

  useEffect(() => {
    // Redirect if no email is provided
    if (!email) {
      message.error("No email provided for verification");
      navigate("/");
      return;
    }

    // Set initial form value for email
    form.setFieldsValue({ email });

    // Start countdown timer
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

  const handleVerifyCode = async (values: CodeVerifyFormValues) => {
    setIsLoading(true);
    try {
      const response: any = await handleAPI("/auth/verify", values, "post");
      const token = response?.result?.accessToken;

      if (!token) throw new Error("Missing access token from response");

      localStorage.setItem(localDataNames.authData, JSON.stringify({ token }));

      const userInfoResponse: any = await handleAPI("/auth/me");
      dispatch(
        addAuth({
          firstName: userInfoResponse.result?.firstname,
          lastName: userInfoResponse.result?.lastname,
          email: userInfoResponse.result?.email,
          role: userInfoResponse.result?.role,
          token,
        })
      );
      message.success("Verification successful!");
      navigate("/");
    } catch (error: any) {
      message.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) {
      message.warning(
        `Please wait ${timeLeft} seconds before requesting a new code`
      );
      return;
    }

    setIsLoading(true);
    try {
      await handleAPI("/auth/resend-code", { email }, "post");
      message.success("New verification code sent!");
      setTimeLeft(30); // Reset countdown
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
          Please enter the verification code sent to your email
        </Paragraph>
      </div>

      <Form
        form={form}
        onFinish={handleVerifyCode}
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
            Verify Code
          </Button>
        </div>

        <div className="text-center">
          <div style={{ marginTop: "8px" }}>
            <Text type="secondary">
              Forgot your code?{" "}
              <Link to="/code-email" state={{ email }}>
                Setup 2FA with new code
              </Link>
            </Text>
          </div>
        </div>
      </Form>
    </Card>
  );
};

export default CodeVerify;
