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
import handleAPI from "../../apis/handleAPI";
import { localDataNames } from "../../constants/appInfos";
import { useDispatch } from "react-redux";
import { addAuth } from "../../redux/reducers/authReducer";
import Cookies from "js-cookie";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSignUp = async (values: SignUpFormValues) => {
    const api = `/auth/register`;
    const submitData = {
      ...values,
      role: "USER",
    };

    setIsLoading(true);
    try {
      const res: any = await handleAPI(api, submitData, "post");
      const response = res.result;

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
        const token = response.accessToken;
        if (!token) throw new Error("Missing access token from response");

        localStorage.setItem(
          localDataNames.authData,
          JSON.stringify({ token })
        );
        
      const userInfoResponse: any = await handleAPI("/users/me");
      dispatch(
        addAuth({
          firstName: userInfoResponse.result?.firstname,
          lastName: userInfoResponse.result?.lastname,
          email: userInfoResponse.result?.email,
          role: userInfoResponse.result?.role,
          token,
        })
      );
        message.success("Account created successfully!");
        dispatch(addAuth({ token }));
        navigate("/");
      }
    } catch (error: any) {
      console.log(error);
      message.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
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
            loading={isLoading}
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
