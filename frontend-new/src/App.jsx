import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// MUI
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { Box } from "@mui/material";

// MUI context
import { useMaterialUIController } from "./context";

// MUI themes
import theme from "./assets/theme";
import themeDark from "./assets/theme-dark";

// Relevant page components
import Sidebar from "./Components/Sidebar";
import CompanyName from "./pages/onboarding/CompanyName";
import CompanyDetails from "./pages/onboarding/CompanyDetails";
import Dashboard from "./dashboard/Dashboard";
import CompanyList from "./pages/onboarding/CompanyList";
import Analytics from "./dashboard/Analytics";
import RoleList from "./pages/role_management/RoleList";
import RoleForm from "./pages/role_management/RoleForm";
import RoleUpdate from "./pages/role_management/RoleUpdate";
import ModuleList from "./pages/module_management/ModuleList";
import ModuleForm from "./pages/module_management/ModuleForm";
import AssignPermissions from "./pages/role_management/AssignPermissions";
import AssignPermissionstoRole from "./pages/role_management/AssignPermissionstoRole";
import CreateUser from "./pages/user_management/CreateUser";
import LoginPage from "./pages/auth/Login";
import ChangePassword from "./pages/user_management/changePassword";
import TaskList from "./pages/TaskManagement/TaskList";
import CreateTask from "./pages/TaskManagement/CreateTask";
import EditTask from "./pages/TaskManagement/EditTask";
import BulkTaskAssignment from "./pages/TaskManagement/BulkTaskAssignment";
import AssignedTaskPage from "./pages/TaskManagement/AssignedTaskPage";
import UserTaskAssignment from "./pages/TaskManagement/UserTaskAssignment";
import TaskUploadPage from "./pages/TaskManagement/TaskUploadPage";
import SelectCompany from "./pages/TaskManagement/SelectCompany";
import UserList from "./pages/user_management/UserList";
import UpdateUser from "./pages/user_management/UpdateUser";
import Header from "./Components/Header";
import DocumentManagementPage from "./pages/DocumentManagement/DocumentManagementPage";
import IterationList from "./pages/Iteration/IterationList";
import CreateIteration from "./pages/Iteration/CreateIteration";
import EditIteration from "./pages/Iteration/EditIteration";
import DepartmentList from "./pages/department/DepartmentList";
import DepartmentForm from "./pages/department/DepartmentForm";
import SelectStandard from './pages/standard/SelectStandard';
import SelectIterationPage from "./pages/Iteration/SelectIterationPage";

const AppLayout = () => {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/company-details", "/login"];
  const isSidebarHidden = hideSidebarRoutes.includes(location.pathname);
  const [, setSelectedCompany] = useState(null);

  const [controller, dispatch] = useMaterialUIController();
  const { darkMode, sidebarOpen } = controller;

  return (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />

      <Box sx={{ display: "flex", position: "relative" }}>
        {!isSidebarHidden && <Sidebar />}

        <Box
          sx={{
            flex: 1,
            padding: hideSidebarRoutes ? 0 : 2,
            width: "calc(100% - 250px)",
            // marginX: hideSidebarRoutes ? 0 : 2,
            ...(!hideSidebarRoutes && { marginLeft: sidebarOpen ? 4 : 2 }),
          }}
        >
          {!isSidebarHidden && <Header />}
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Onboarding */}
            <Route path="/company-details" element={<CompanyDetails />} />
            <Route path="/company-name" element={<CompanyName />} />

            {/* Dashboard */}
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/company-list" element={<CompanyList />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Role Management */}
            <Route path="/roles" element={<RoleList />} />
            <Route path="/roles/create" element={<RoleForm />} />
            <Route path="/roles/edit/:id" element={<RoleUpdate />} />
            <Route path="/assign-permissions" element={<AssignPermissions />} />
            <Route
              path="/assignpermissionstorole/:roleId"
              element={<AssignPermissionstoRole />}
            />

            {/* Module Management */}
            <Route path="/modules" element={<ModuleList />} />
            <Route path="/modules/new" element={<ModuleForm />} />
            <Route path="/modules/:id" element={<ModuleForm />} />

            {/* User Management */}
            <Route path="/users" element={<UserList />} />
            <Route path="/users/create" element={<CreateUser />} />
            <Route path="/changePassword" element={<ChangePassword />} />
            <Route path="/users/update/:id" element={<UpdateUser />} />

            {/* Task Management */}
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/create-task" element={<CreateTask />} />
            <Route path="/edit-task/:moduleId/:taskId" element={<EditTask />} />
            <Route
              path="/BulkTaskAssignment"
              element={<BulkTaskAssignment />}
            />
            <Route
              path="/UserTaskAssignment"
              element={<UserTaskAssignment />}
            />
            <Route path="/assigned-tasks" element={<AssignedTaskPage />} />
            <Route
              path="/upload-tasks/:moduleId"
              element={<TaskUploadPage />}
            />

            {/* Document Management */}
            <Route
              path="/document-management"
              element={<DocumentManagementPage />}
            />

            {/* Iteration Management */}
            <Route
              path="/iteration/:taskModuleId"
              element={<IterationList />}
            />
            <Route
              path="/iteration/create/:taskModuleId"
              element={<CreateIteration />}
            />
            <Route
              path="/iteration/edit/:taskModuleId/:iterationId"
              element={<EditIteration />}
            />
            <Route path="/select-iteration" element={<SelectIterationPage />} />


            <Route
              path="/SelectCompany"
              element={
                <SelectCompany setSelectedCompany={setSelectedCompany} />
              }
            />

            {/* Department Management */}
            <Route path="/departments" element={<DepartmentList />} />
            <Route
              path="/departments/new"
              element={<DepartmentForm />}
            />
            <Route
              path="/departments/edit/:id"
              element={<DepartmentForm />}
            />

            <Route path="/select-standard" element={<SelectStandard />} />

          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <AppLayout />
    </Router>
  );
}

export default App;
