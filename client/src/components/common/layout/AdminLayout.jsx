import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
    return (
        <div className="admin-layout" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <AdminHeader />
            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse">
                        <div className="position-sticky pt-3">
                            <AdminSidebar />
                        </div>
                    </div>
                    
                    {/* Main content */}
                    <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;