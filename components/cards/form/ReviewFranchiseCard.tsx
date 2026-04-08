"use client";

import * as React from "react";
import {
  CheckCircle2,
  Braces,
  Info,
  Building2,
  Users,
  Scale,
  UtensilsCrossed,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ReviewFranchiseCardProps {
  /**
   * Content to render in the review section (e.g., a summary of form fields)
   */
  children?: React.ReactNode;
  /**
   * The values object to display in the JSON debug view
   */
  values?: Record<string, any>;
  /**
   * Any validation errors to display
   */
  errors?: Record<string, any>;
  /**
   * Optional title for the card
   */
  title?: string;
  /**
   * Optional className for the card
   */
  className?: string;
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 tracking-tight">
        <Icon className="w-4 h-4 text-primary/70" />
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pl-6 border-l ml-2">
        {children}
      </div>
    </div>
  );
}

function ReviewItem({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "number" && isNaN(value))
  )
    return null;
  return (
    <div className={cn("space-y-1", fullWidth && "md:col-span-2")}>
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function ReviewFranchiseCard({
  children,
  values,
  errors,
  title = "Review & Submit Franchise",
  className,
}: ReviewFranchiseCardProps) {
  const [showJson, setShowJson] = React.useState(false);

  const hasErrors = errors && Object.keys(errors).length > 0;

  const getLocationAddress = () => {
    const loc = values?.locationInfrastructure;
    if (!loc) return null;
    const parts = [loc.location, loc.city, loc.state, loc.zipCode];
    return parts.filter(Boolean).join(", ");
  };

  const getEquipmentList = () => {
    const selectedEquipment = values?.selectedEquipment;
    if (!selectedEquipment || selectedEquipment.length === 0) return null;
    return selectedEquipment.join(", ");
  };

  return (
    <Card className={cn("overflow-hidden border-2", className)}>
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <div
              className={cn(
                "p-1.5 rounded-full",
                hasErrors
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            {title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-6 space-y-8">
          {values && (
            <div className="space-y-8">
              {/* Basic Information */}
              <ReviewSection title="Basic Information" icon={Info}>
                <ReviewItem label="Franchise Name" value={values.name} />
                <ReviewItem
                  label="Franchise Code"
                  value={values.franchiseCode}
                />
                <ReviewItem
                  label="Model Type"
                  value={values.franchiseOverview?.franchiseModel}
                />
                <ReviewItem label="Status" value={values.status} />
              </ReviewSection>

              {/* Location & Infrastructure */}
              <ReviewSection title="Location & Infrastructure" icon={Building2}>
                <ReviewItem
                  label="Address"
                  value={getLocationAddress()}
                  fullWidth
                />
                <ReviewItem
                  label="Total Area"
                  value={
                    values.locationInfrastructure?.minimumArea
                      ? `${values.locationInfrastructure.minimumArea} sq.ft`
                      : null
                  }
                />
                <ReviewItem
                  label="Seating Capacity"
                  value={values.locationInfrastructure?.seatingCapacity}
                />
                <ReviewItem
                  label="Equipment Available"
                  value={getEquipmentList()}
                  fullWidth
                />
              </ReviewSection>

              {/* Staff Details */}
              <ReviewSection title="Staff Details" icon={Users}>
                <ReviewItem
                  label="Franchise Manager"
                  value={values.staffInformation?.kitchenManager}
                />
                <ReviewItem
                  label="Total Staff Count"
                  value={values.staffInformation?.totalStaffCount}
                />
                <ReviewItem
                  label="Establishment Date"
                  value={
                    values.establishmentDate
                      ? new Date(values.establishmentDate).toLocaleDateString()
                      : null
                  }
                />
              </ReviewSection>

              {/* Menu Setup */}
              <ReviewSection title="Menu Setup" icon={UtensilsCrossed}>
                <ReviewItem
                  label="Menu Source"
                  value={
                    values.menuSource === "copy"
                      ? "Copy from Model"
                      : "Custom Menu"
                  }
                />
                <ReviewItem
                  label="Allow Hide Items"
                  value={values.allowHide ? "Yes" : "No"}
                />
                <ReviewItem
                  label="Allow Override Prices"
                  value={values.allowOverride ? "Yes" : "No"}
                />
                <ReviewItem
                  label="Allow Add Custom Items"
                  value={values.allowAddItems ? "Yes" : "No"}
                />
              </ReviewSection>

              {/* Legal & Policy */}
              <ReviewSection title="Legal & Policy" icon={Scale}>
                <ReviewItem
                  label="Agreement Validity"
                  value={
                    values.legalPolicyDocuments?.agreementValidity
                      ? `${values.legalPolicyDocuments.agreementValidity} Years`
                      : null
                  }
                />
                <ReviewItem
                  label="Renewal Policy"
                  value={values.legalPolicyDocuments?.renewalPolicy}
                  fullWidth
                />
                <ReviewItem
                  label="Exit Policy"
                  value={values.legalPolicyDocuments?.exitPolicy}
                  fullWidth
                />
                <ReviewItem
                  label="Licenses Required"
                  value={values.legalPolicyDocuments?.licensesRequired}
                  fullWidth
                />
                {values.legalPolicyDocuments?.franchiseAgreement && (
                  <ReviewItem
                    label="Legal Document"
                    fullWidth
                    value={
                      <a
                        href={values.legalPolicyDocuments.franchiseAgreement}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Franchise Agreement
                      </a>
                    }
                  />
                )}
              </ReviewSection>
            </div>
          )}

          {children && <div className="pt-6 border-t">{children}</div>}
        </div>

        <div className="bg-muted/30 p-6 pt-0 space-y-4">
          <Separator />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-json"
              checked={showJson}
              onCheckedChange={(checked) => setShowJson(checked as boolean)}
            />
            <Label
              htmlFor="show-json"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
            >
              <Braces className="w-3.5 h-3.5" />
              Developer JSON View
            </Label>
          </div>

          {hasErrors && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs font-mono text-destructive border border-destructive/20">
              <p className="font-bold mb-1 uppercase tracking-wider">
                Validation Errors:
              </p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(errors, null, 2)}
              </pre>
            </div>
          )}

          {showJson && values && (
            <div className="relative group">
              <pre className="bg-background p-4 rounded-lg text-[11px] font-mono overflow-x-auto border shadow-inner max-h-[300px] custom-scrollbar">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
