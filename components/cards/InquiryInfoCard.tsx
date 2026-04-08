"use client";

import React from "react";
import { Badge } from "@/components/ui";
import {
  Calendar,
  User,
  MessageSquare,
  AlertCircle,
  Target,
} from "lucide-react";
import { format } from "date-fns";

interface InquiryInfoCardProps {
  inquiry: {
    id?: string;
    subject: string;
    message?: string;
    priority?: string;
    status?: string;
    propertyTitle?: string;
    projectName?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const InquiryInfoCard: React.FC<InquiryInfoCardProps> = ({ inquiry }) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {/* Subject and Status Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {inquiry.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {inquiry.status && (
                <Badge
                  variant={
                    inquiry.status === "open"
                      ? "info"
                      : inquiry.status === "closed"
                      ? "destructive"
                      : inquiry.status === "pending"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {inquiry.status.toUpperCase()}
                </Badge>
              )}
              {inquiry.priority && (
                <Badge
                  variant={
                    inquiry.priority === "high"
                      ? "destructive"
                      : inquiry.priority === "medium"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {inquiry.priority.toUpperCase()} PRIORITY
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {inquiry.message && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Message
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {inquiry.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(inquiry.propertyTitle || inquiry.projectName) && (
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Target
                </p>
                <p className="text-sm text-foreground">
                  {inquiry.propertyTitle || inquiry.projectName}
                </p>
                <Badge
                  variant={inquiry.propertyTitle ? "success" : "info"}
                  className="mt-1"
                >
                  {inquiry.propertyTitle ? "Property" : "Project"}
                </Badge>
              </div>
            </div>
          )}

          {(inquiry.date || inquiry.createdAt) && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {inquiry.date
                    ? format(new Date(inquiry.date), "dd MMM, yyyy")
                    : inquiry.createdAt
                    ? format(new Date(inquiry.createdAt), "dd MMM, yyyy")
                    : "-"}
                </p>
              </div>
            </div>
          )}

          {inquiry.id && (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Inquiry ID
                </p>
                <p className="text-sm text-foreground font-mono">
                  {inquiry.id}
                </p>
              </div>
            </div>
          )}
        </div>

        {inquiry.createdBy && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Created by:{" "}
              <span className="text-foreground font-medium">
                {inquiry.createdBy}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryInfoCard;
