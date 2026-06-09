"use client";
import AdminProfileView from '@/features/profile/components/AdminProfileView';

export default function AdminProfilePage() {
    return (
        <AdminProfileView 
            mode="admin"
            themeColor="manioco-terracotta-500"
            accentColor="manioco-terracotta"
            identityTag="Identité_Admin_V1"
        />
    );
}
