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
import { Link } from "react-router-dom";
import handleAPI from "../../apis/handleAPI";
import { appInfo, localDataNames } from "../../constants/appInfos";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addAuth } from "../../redux/reducers/authReducer";
const { Title, Paragraph, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [isRemember, setIsRemember] = useState(false);

  const navigate = useNavigate();

  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // Bước 1: Gọi API để lấy token
      const tokenResponse: any = await handleAPI("/auth/token", values, "post");
      localStorage.setItem(
        localDataNames.authData,
        JSON.stringify(tokenResponse.result)
      );

      const token = tokenResponse.result.token;

      const userInfoResponse: any = await handleAPI("/users/my-info");

      dispatch(
        addAuth({
          id: userInfoResponse.result.id,
          name: userInfoResponse.result.username,
          roles: userInfoResponse.result.roles,
          token: token,
        })
      );

      navigate("/");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card
        style={{
          width: "50%",
        }}
      >
        <div className="text-center">
          <img
            className="mb-3"
            src={appInfo.logo}
            alt=""
            style={{
              width: 48,
              height: 48,
            }}
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
          disabled={isLoading}
          size="large"
        >
          <Form.Item
            name={"email"}
            label="Email"
            rules={[
              {
                required: true,
                message: "Please enter your email!!!",
              },
            ]}
          >
            <Input allowClear maxLength={100} type="email" />
          </Form.Item>
          <Form.Item
            name={"password"}
            label="Password"
            rules={[
              {
                required: true,
                message: "Please enter your password!!!",
              },
            ]}
          >
            <Input.Password maxLength={100} type="email" />
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
            <Link to={"/forgot-password"}>Forgot password?</Link>
          </div>
        </div>

        <div className="mt-4 mb-3">
          <Button
            loading={isLoading}
            onClick={() => form.submit()}
            type="primary"
            style={{
              width: "100%",
            }}
            size="large"
          >
            Login
          </Button>
        </div>
        {/* <SocialLogin isRemember={isRemember} /> */}
        <div className="mt-3 text-center">
          <Space>
            <Text>Don't have an acount? </Text>
            <Link to={"/sign-up"}>Sign up</Link>
          </Space>
        </div>
      </Card>
    </>
  );
};

export default Login;
