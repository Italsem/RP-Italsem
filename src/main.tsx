import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import DashboardDay from "./pages/DashboardDay";
import DayCantiere from "./pages/DayCantiere";
import Admin from "./pages/Admin";
import ExportPage from "./pages/ExportPage";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardDay />} />

          <Route path="/day" element={<DashboardDay />} />
          <Route path="/day/edit" element={<DayCantiere />} />

          <Route path="/export" element={<ExportPage />} />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
