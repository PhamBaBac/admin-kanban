/** @format */

import { useLocation, useNavigate } from "react-router-dom";
import { Button, Form, Input, Typography, message } from "antd";
import { useState, useEffect } from "react";
import handleAPI from "../../../apis/handleAPI";
import { useDispatch } from "react-redux";
import { addAuth } from "../../../redux/reducers/authReducer";
import Cookies from "js-cookie";
import { localDataNames } from "../../../constants/appInfos";

const { Title, Paragraph } = Typography;

const MfaSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { secretImageUri, email } = location.state || {};

  useEffect(() => {
    if (!secretImageUri || !email) {
      message.warning("Missing 2FA setup information. Please register again.");
      navigate("/sign-up");
    }
  }, [secretImageUri, email, navigate]);

  const handleVerify = async (values: { code: string }) => {
    try {
      setLoading(true);

      // Gọi API xác thực 2FA
      const res: any = await handleAPI(
        "/auth/verify",
        {
          email,
          code: values.code.trim(),
        },
        "post"
      );

      const token = res?.result?.accessToken;
      if (!token) throw new Error("Missing access token from response");

      localStorage.setItem(localDataNames.authData, JSON.stringify({ token }));
      const userInfoResponse: any =  await handleAPI("/auth/me");
      dispatch(addAuth({ 
        firstName: userInfoResponse.result?.firstname,
        lastName: userInfoResponse.result?.lastname,
        email: userInfoResponse.result?.email,
        role: userInfoResponse.result?.role,
        token,
       }));

      message.success("2FA verification successful!");
      navigate("/"); // Chuyển tới dashboard
    } catch (error: any) {
      message.error(error?.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "0 auto",
        textAlign: "center",
        marginTop: 50,
      }}
    >
      <Title level={2}>Two-Factor Authentication Setup</Title>
      <Paragraph>
        Scan this QR code using an app like Google Authenticator or Authy.
      </Paragraph>
      <img
        src={secretImageUri}
        alt="2FA QR Code"
        style={{ width: "200px", marginBottom: "24px" }}
      />
      <Paragraph>Enter the 6-digit code from your authenticator app:</Paragraph>

      <Form form={form} onFinish={handleVerify} layout="vertical">
        <Form.Item
          name="code"
          rules={[
            {
              required: true,
              message: "Please enter the verification code",
            },
            {
              pattern: /^\d{6}$/,
              message: "The code must be exactly 6 digits",
            },
          ]}
        >
          <Input
            placeholder="Enter 6-digit code"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Verify Code
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default MfaSetup;
