"use client";

import { useParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id?: string }>();
  const eventId = params?.id;

  return (
    <div className="min-h-screen">
      <Sidebar eventId={eventId} />
      <div className="mr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
