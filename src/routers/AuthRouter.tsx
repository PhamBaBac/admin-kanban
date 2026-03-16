/** @format */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Typography } from "antd";
import { Login, SignUp } from "../pages";
import { appInfo } from "../constants/appInfos";

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
              src={appInfo.logo}
              alt={appInfo.title}
            />
          </div>
          <div>
            <Title style={{ color: "#009ED8" }}>KANBAN</Title>
          </div>
        </div>

        <div className="col content-center">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AuthRouter;
