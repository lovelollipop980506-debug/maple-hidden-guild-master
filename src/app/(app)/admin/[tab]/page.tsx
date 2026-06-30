"use client";
import { useParams } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";

export default function AdminTabPage() {
  const tab = String(useParams().tab || "applications");
  return <AdminConsole tab={tab} />;
}
