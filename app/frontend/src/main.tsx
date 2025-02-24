import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/Home";
import Register from "./routes/Register";
import Login from "./routes/Login";

const root = document.getElementById("root");

ReactDOM.createRoot(root!).render(
  <BrowserRouter>
    <Routes>
      <Route index element={<Home />} />

      {/* <Route element={<AuthLayout />}> */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      {/* </Route> */}
    </Routes>
  </BrowserRouter>
);
