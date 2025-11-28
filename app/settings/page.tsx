// app/settings/page.tsx
import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import UserSettings from "@/components/user-settings";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="py-8">
        <UserSettings />
      </div>
    </DashboardLayout>
  );
}
