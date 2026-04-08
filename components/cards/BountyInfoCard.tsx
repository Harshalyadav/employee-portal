"use client";

import React from "react";
import { Badge } from "@/components/ui";
import { Calendar, DollarSign, FileText, User, Percent } from "lucide-react";
import { format } from "date-fns";

interface BountyInfoCardProps {
  bounty: {
    id?: string;
    title: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    terms?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const BountyInfoCard: React.FC<BountyInfoCardProps> = ({ bounty }) => {
  const getDiscountDisplay = () => {
    if (bounty.discountType === "percent") {
      return `${bounty.discountValue || 0}%`;
    }
    return bounty.discountValue
      ? `$${bounty.discountValue.toLocaleString()}`
      : "-";
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {/* Title and Status Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {bounty.title}
            </h1>
            {bounty.status && (
              <Badge
                variant={
                  bounty.status === "active"
                    ? "success"
                    : bounty.status === "expired"
                    ? "destructive"
                    : bounty.status === "upcoming"
                    ? "warning"
                    : "secondary"
                }
              >
                {bounty.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {bounty.description && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-foreground">{bounty.description}</p>
          </div>
        )}

        {/* Offer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            {bounty.discountType === "percent" ? (
              <Percent className="h-5 w-5 text-muted-foreground mt-0.5" />
            ) : (
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Discount
              </p>
              <p className="text-sm font-medium text-foreground">
                {getDiscountDisplay()}
              </p>
            </div>
          </div>

          {bounty.startDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Start Date
                </p>
                <p className="text-sm text-foreground">
                  {format(new Date(bounty.startDate), "dd MMM, yyyy")}
                </p>
              </div>
            </div>
          )}

          {bounty.endDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  End Date
                </p>
                <p className="text-sm text-foreground">
                  {format(new Date(bounty.endDate), "dd MMM, yyyy")}
                </p>
              </div>
            </div>
          )}

          {(bounty.date || bounty.createdAt) && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {bounty.date
                    ? format(new Date(bounty.date), "dd MMM, yyyy")
                    : bounty.createdAt
                    ? format(new Date(bounty.createdAt), "dd MMM, yyyy")
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        {bounty.terms && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Terms & Conditions
                </p>
                <p className="text-sm text-foreground">{bounty.terms}</p>
              </div>
            </div>
          </div>
        )}

        {bounty.createdBy && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Created by:{" "}
              <span className="text-foreground font-medium">
                {bounty.createdBy}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BountyInfoCard;
