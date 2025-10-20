"use client";

import { getStatusColor, getStatusLabel, type InvoiceStatus } from "@/types/invoice";
import { CheckCircle2, Clock, XCircle, FileText, AlertCircle } from "lucide-react";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md" | "lg";
}

export function InvoiceStatusBadge({ status, size = "md" }: InvoiceStatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };
  
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
  };
  
  const Icon = {
    draft: FileText,
    sent: Clock,
    paid: CheckCircle2,
    overdue: AlertCircle,
    cancelled: XCircle,
  }[status];
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${sizeClasses[size]}
        ${colorClasses[color] || colorClasses.gray}
      `}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  );
}
