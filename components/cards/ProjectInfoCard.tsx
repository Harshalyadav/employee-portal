"use client";

import React from "react";
import { Avatar, Badge } from "@/components/ui";
import { MapPin, Calendar, Building2, User, Layers } from "lucide-react";
import { format } from "date-fns";

interface ProjectInfoCardProps {
  project: {
    id?: string;
    name: string;
    logo?: string;
    location?: string;
    address?: string;
    status?: string;
    totalProperties?: number;
    builderId?: string;
    builderName?: string;
    builderLogo?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project }) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6">
      {/* Logo and Title Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Logo */}
        <div className="shrink-0">
          <Avatar
            src={project.logo || "/images/placeholder.png"}
            alt={project.name}
            size={120}
            className="rounded-lg"
          />
        </div>

        {/* Title, Status, Property Count */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {project.status && (
              <Badge
                variant={
                  project.status === "ongoing"
                    ? "info"
                    : project.status === "completed"
                    ? "success"
                    : "warning"
                }
              >
                {project.status.toUpperCase()}
              </Badge>
            )}
            {project.totalProperties !== undefined && (
              <Badge variant="secondary">
                {project.totalProperties} Properties
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Builder Info */}
      {(project.builderName || project.builderLogo) && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Builder
          </p>
          <div className="flex items-center gap-3">
            {project.builderLogo && (
              <Avatar
                src={project.builderLogo}
                alt={project.builderName || "Builder"}
                size={40}
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {project.builderName || "Unknown Builder"}
              </p>
              {project.builderId && (
                <p className="text-xs text-muted-foreground">
                  ID: {project.builderId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location */}
      {project.location && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{project.location}</span>
        </div>
      )}

      {/* Additional Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {project.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Address
              </p>
              <p className="text-sm text-foreground">{project.address}</p>
            </div>
          </div>
        )}

        {project.totalProperties !== undefined && (
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total Properties
              </p>
              <p className="text-sm text-foreground">
                {project.totalProperties} Units
              </p>
            </div>
          </div>
        )}

        {(project.date || project.createdAt) && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Created
              </p>
              <p className="text-sm text-foreground">
                {project.date
                  ? format(new Date(project.date), "dd MMM, yyyy")
                  : project.createdAt
                  ? format(new Date(project.createdAt), "dd MMM, yyyy")
                  : "-"}
              </p>
            </div>
          </div>
        )}

        {project.createdBy && (
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Created By
              </p>
              <p className="text-sm text-foreground">{project.createdBy}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectInfoCard;
