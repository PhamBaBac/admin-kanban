/** @format */

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Space,
  Typography,
} from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const { Title, Text, Paragraph } = Typography;

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "USER";
  mfaEnabled: boolean;
}

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, loading, error } = useAuth();
  const [form] = Form.useForm();

  const handleSignUp = async (values: SignUpFormValues) => {
    const submitData = {
      ...values,
      role: "USER",
    };

    try {
      const response = await signUp(submitData);

      if (response?.mfaEnabled && response?.secretImageUri) {
        // Nếu bật MFA, chuyển hướng người dùng sang trang scan QR
        message.success("MFA enabled! Please scan the QR code to continue.");
        navigate("/mfa-setup", {
          state: {
            secretImageUri: response.secretImageUri,
            email: submitData.email,
          },
        });
      } else {
        message.success("Account created successfully!");
        navigate("/");
      }
    } catch (error: any) {
      console.log(error);
      message.error(error.message || "Registration failed");
    }
  };

  return (
    <>
      <Card
        style={{
          width: "50%",
          margin: "0 auto",
        }}
      >
        <div className="text-center">
          <Title level={2}>Create an account</Title>
          <Paragraph type="secondary">Free trial 30 days</Paragraph>
        </div>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSignUp}
          disabled={loading}
          size="large"
        >
          <Form.Item
            name={"firstname"}
            label="First Name"
            rules={[
              {
                required: true,
                message: "Please enter your first name!",
              },
            ]}
            style={{ width: "100%" }}
          >
            <Input placeholder="Enter your first name" allowClear />
          </Form.Item>
          <Form.Item
            name={"lastname"}
            label="Last Name"
            rules={[
              {
                required: true,
                message: "Please enter your last name!",
              },
            ]}
            style={{ width: "100%" }}
          >
            <Input placeholder="Enter your last name" allowClear />
          </Form.Item>

          <Form.Item
            name={"email"}
            label="Email"
            rules={[
              {
                required: true,
                message: "Please enter your email!",
              },
              {
                type: "email",
                message: "Please enter a valid email!",
              },
            ]}
          >
            <Input
              placeholder="Enter your email"
              allowClear
              maxLength={100}
              type="email"
            />
          </Form.Item>

          <Form.Item
            name={"password"}
            label="Password"
            rules={[
              {
                required: true,
                message: "Please enter your password!",
              },
              {
                min: 6,
                message: "Password must be at least 6 characters!",
              },
            ]}
          >
            <Input.Password placeholder="Create password" maxLength={100} />
          </Form.Item>

          <Form.Item
            name={"mfaEnabled"}
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Enable Two-Factor Authentication</Checkbox>
          </Form.Item>
        </Form>

        <div className="mt-5 mb-3">
          <Button
            loading={loading}
            onClick={() => form.submit()}
            type="primary"
            style={{
              width: "100%",
            }}
            size="large"
          >
            Sign up
          </Button>
        </div>
        <div className="mt-3 text-center">
          <Space>
            <Text type="secondary">Already have an account? </Text>
            <Link to={"/login"}>Login</Link>
          </Space>
        </div>
      </Card>
    </>
  );
};

export default SignUp;
