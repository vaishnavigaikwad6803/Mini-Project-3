import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import TrackComplaint from './pages/public/TrackComplaint';
import PublicMap from './pages/public/PublicMap';
import NotFound from './pages/NotFound';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetails from './pages/citizen/ComplaintDetails';

// Authority Pages
import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import AuthorityComplaints from './pages/authority/AuthorityComplaints';
import AuthorityEngineers from './pages/authority/AuthorityEngineers';

// Engineer Pages
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import EngineerAssignments from './pages/engineer/EngineerAssignments';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageAuthorities from './pages/admin/ManageAuthorities';
import ManageEngineers from './pages/admin/ManageEngineers';
import ManageComplaints from './pages/admin/ManageComplaints';

function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/map" element={<PublicMap />} />
        <Route path="/complaints/:id" element={<ComplaintDetails />} />
      </Route>

      {/* 2. Citizen Protected Routes */}
      <Route path="/citizen" element={<DashboardLayout allowedRoles={['CITIZEN', 'ADMIN']} />}>
        <Route index element={<CitizenDashboard />} />
        <Route path="report" element={<SubmitComplaint />} />
        <Route path="complaints" element={<MyComplaints />} />
      </Route>

      {/* 3. Authority Protected Routes */}
      <Route path="/authority" element={<DashboardLayout allowedRoles={['AUTHORITY', 'ADMIN']} />}>
        <Route index element={<AuthorityDashboard />} />
        <Route path="complaints" element={<AuthorityComplaints />} />
        <Route path="engineers" element={<AuthorityEngineers />} />
      </Route>

      {/* 4. Engineer Protected Routes */}
      <Route path="/engineer" element={<DashboardLayout allowedRoles={['ENGINEER', 'ADMIN']} />}>
        <Route index element={<EngineerDashboard />} />
        <Route path="assignments" element={<EngineerAssignments />} />
      </Route>

      {/* 5. Admin Protected Routes */}
      <Route path="/admin" element={<DashboardLayout allowedRoles={['ADMIN']} />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="authorities" element={<ManageAuthorities />} />
        <Route path="engineers" element={<ManageEngineers />} />
        <Route path="complaints" element={<ManageComplaints />} />
      </Route>

      {/* 404 Catch All */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
