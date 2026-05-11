"use client";
import AdminProfileView from '@/features/profile/components/AdminProfileView';

export default function ProfessionalProfilePage() {
    return (
        <AdminProfileView 
            mode="super-admin"
            themeColor="indigo-600"
            accentColor="indigo"
            identityTag="Identité_Alpha_V1"
        />
    );
}
