"use client";

import React from "react";
import { Avatar, Badge } from "@/components/ui";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

interface AgentInfoCardProps {
  agent: {
    id?: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    address?: string;
    agency?: string;
    licenseNo?: string;
    status?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ agent }) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <div className="shrink-0">
          <Avatar
            src={agent.avatar || "/images/placeholder.png"}
            alt={agent.name}
            size={120}
            className="rounded-lg"
          />
        </div>

        {/* Info Section */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {agent.name}
              </h1>
              {agent.status && (
                <Badge
                  variant={
                    agent.status === "active"
                      ? "success"
                      : agent.status === "inactive"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {agent.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {agent.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm text-foreground">{agent.email}</p>
                </div>
              </div>
            )}

            {agent.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-foreground">{agent.phone}</p>
                </div>
              </div>
            )}

            {agent.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-sm text-foreground">{agent.address}</p>
                </div>
              </div>
            )}

            {agent.agency && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Agency
                  </p>
                  <p className="text-sm text-foreground">{agent.agency}</p>
                </div>
              </div>
            )}

            {agent.licenseNo && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    License No
                  </p>
                  <p className="text-sm text-foreground">{agent.licenseNo}</p>
                </div>
              </div>
            )}

            {(agent.date || agent.createdAt) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Created
                  </p>
                  <p className="text-sm text-foreground">
                    {agent.date
                      ? format(new Date(agent.date), "dd MMM, yyyy")
                      : agent.createdAt
                      ? format(new Date(agent.createdAt), "dd MMM, yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {agent.createdBy && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Created by:{" "}
                <span className="text-foreground font-medium">
                  {agent.createdBy}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentInfoCard;
