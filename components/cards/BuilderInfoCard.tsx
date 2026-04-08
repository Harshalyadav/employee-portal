"use client";

import React from "react";
import { Avatar, Badge } from "@/components/ui";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface BuilderInfoCardProps {
  builder: {
    id?: string;
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const BuilderInfoCard: React.FC<BuilderInfoCardProps> = ({ builder }) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <div className="shrink-0">
          <Avatar
            src={builder.logo || "/images/placeholder.png"}
            alt={builder.name}
            size={120}
            className="rounded-lg"
          />
        </div>

        {/* Info Section */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {builder.name}
              </h1>
              {builder.status && (
                <Badge
                  variant={
                    builder.status === "active" ? "success" : "destructive"
                  }
                >
                  {builder.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {builder.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm text-foreground">{builder.email}</p>
                </div>
              </div>
            )}

            {builder.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-foreground">{builder.phone}</p>
                </div>
              </div>
            )}

            {builder.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-sm text-foreground">{builder.address}</p>
                </div>
              </div>
            )}

            {(builder.date || builder.createdAt) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Created
                  </p>
                  <p className="text-sm text-foreground">
                    {builder.date
                      ? format(new Date(builder.date), "dd MMM, yyyy")
                      : builder.createdAt
                      ? format(new Date(builder.createdAt), "dd MMM, yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {builder.createdBy && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Created by:{" "}
                <span className="text-foreground font-medium">
                  {builder.createdBy}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderInfoCard;
