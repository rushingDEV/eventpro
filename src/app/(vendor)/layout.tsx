"use client";

import { useQuery } from "@tanstack/react-query";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";
import { Header } from "@/components/dashboard/header";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const categorySlug = profile?.category?.slug;
  const vendorSlug = profile?.slug;
  const profileUrl = categorySlug && vendorSlug ? `${categorySlug}/${vendorSlug}` : undefined;

  return (
    <div className="min-h-screen">
      <VendorSidebar slug={profileUrl} />
      <div className="mr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
