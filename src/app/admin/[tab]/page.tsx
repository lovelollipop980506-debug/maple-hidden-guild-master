"use client";
import { useParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { AdminConsole } from "@/components/admin/AdminConsole";

export default function AdminTabPage() {
  const tab = String(useParams().tab || "applications");
  return (
    <Shell>
      <AdminConsole tab={tab} />
    </Shell>
  );
}
