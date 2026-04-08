"use client";

import React from "react";
import { Avatar, Badge } from "@/components/ui";
import {
  MapPin,
  Calendar,
  DollarSign,
  Expand,
  BedDouble,
  Bath,
  User,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { isValidSrc } from "@/lib";

interface PropertyInfoCardProps {
  property: {
    id?: string;
    title: string;
    thumbnail?: string;
    propertyType?: string;
    price?: number;
    area?: number;
    location?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    status?: string;
    builderId?: string;
    builderName?: string;
    builderLogo?: string;
    createdBy?: string;
    date?: string;
    createdAt?: string;
  };
}

const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({ property }) => {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Thumbnail Section */}
      {property.thumbnail && (
        <div
          className="relative w-full bg-muted"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src={"/images/logo.svg"}
            alt={property.title || "Property Image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/logo.svg";
            }}
          />
          {property.status && (
            <div className="absolute top-4 left-4">
              <Badge
                variant={
                  property.status === "available"
                    ? "success"
                    : property.status === "sold"
                    ? "destructive"
                    : "warning"
                }
                className="shadow-sm"
              >
                {property.status.toUpperCase()}
              </Badge>
            </div>
          )}
          {property.propertyType && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="shadow-sm">
                {property.propertyType}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {property.title}
            </h1>
            {property.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{property.location}</span>
              </div>
            )}
          </div>
          {property.price && (
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <DollarSign className="h-6 w-6" />
              {property.price.toLocaleString()}
            </div>
          )}
        </div>

        {/* Property Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-border">
          {property.area && (
            <div className="flex items-center gap-3">
              <Expand className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Area
                </p>
                <p className="text-sm font-medium text-foreground">
                  {property.area.toLocaleString()} sq ft
                </p>
              </div>
            </div>
          )}

          {typeof property.bedrooms === "number" && (
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Bedrooms
                </p>
                <p className="text-sm font-medium text-foreground">
                  {property.bedrooms}
                </p>
              </div>
            </div>
          )}

          {typeof property.bathrooms === "number" && (
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Bathrooms
                </p>
                <p className="text-sm font-medium text-foreground">
                  {property.bathrooms}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {property.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-foreground">{property.address}</p>
              </div>
            </div>
          )}

          {(property.date || property.createdAt) && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {property.date
                    ? format(new Date(property.date), "dd MMM, yyyy")
                    : property.createdAt
                    ? format(new Date(property.createdAt), "dd MMM, yyyy")
                    : "-"}
                </p>
              </div>
            </div>
          )}

          {property.createdBy && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Created By
                </p>
                <p className="text-sm text-foreground">{property.createdBy}</p>
              </div>
            </div>
          )}
        </div>

        {/* Builder Info */}
        {(property.builderName || property.builderLogo) && (
          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Builder
            </p>
            <div className="flex items-center gap-3">
              {property.builderLogo && (
                <Avatar
                  src={property.builderLogo}
                  alt={property.builderName || "Builder"}
                  size={40}
                />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {property.builderName || "Unknown Builder"}
                </p>
                {property.builderId && (
                  <p className="text-xs text-muted-foreground">
                    ID: {property.builderId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyInfoCard;
