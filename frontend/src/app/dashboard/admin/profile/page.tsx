"use client";
import AdminProfileView from '@/features/profile/components/AdminProfileView';

export default function AdminProfilePage() {
    return (
        <AdminProfileView 
            mode="admin"
            themeColor="emerald-500"
            accentColor="emerald"
            identityTag="Identité_Admin_V1"
        />
    );
}
