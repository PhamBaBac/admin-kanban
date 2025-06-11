/** @format */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Typography } from "antd";
import { Login, SignUp } from "../pages";
import MfaSetup from "../pages/auth/components/MfaSetup";
import CodeVerify from "../pages/auth/components/CodeVerify";
import CodeEmail from "../pages/auth/components/CodeEmail";

const { Title } = Typography;

const AuthRouter = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div
          className="col d-none d-lg-block text-center"
          style={{ marginTop: "15%" }}
        >
          <div className="mb-4">
            <img
              style={{
                width: 256,
                objectFit: "cover",
              }}
              src="https://firebasestorage.googleapis.com/v0/b/kanban-c0323.appspot.com/o/kanban-logo.png?alt=media&token=a3e8c386-57da-49a3-b9a2-94b8fd93ff83"
              alt=""
            />
          </div>
          <div>
            <Title style={{ color: "#009ED8" }}>KANBAN</Title>
          </div>
        </div>

        <div className="col content-center">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/code-verify" element={<CodeVerify />} />
              <Route path="/code-email" element={<CodeEmail />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/mfa-setup" element={<MfaSetup />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
};

export default AuthRouter;
