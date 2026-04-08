import { Avatar, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn, formatText, isValidSrc } from "@/lib";
import { Column, DeductionStatusEnum } from "@/types";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import Image from "next/image";
import { WINDOWS_EVENTS } from "./constants";
import { AdvanceStatusEnum, AdvanceStatusLabels } from "@/types";

// Utility to map generic statuses to badge variants
const mapStatusVariant = (status?: string) => {
  if (!status) return "secondary";
  const s = String(status).toLowerCase();
  if (["active", "available", "completed"].includes(s)) return "success";
  if (["sold", "expired", "closed"].includes(s)) return "destructive";
  if (["ongoing", "open"].includes(s)) return "info";
  if (["high"].includes(s)) return "destructive";
  if (["medium"].includes(s)) return "warning";
  return "warning";
};
const bountyColumns: Column[] = [
  {
    id: "title",
    label: "Bounty Title",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row.title}</div>
        {row.status && (
          <div className="mt-1">
            <Badge variant={mapStatusVariant(row.status)}>{row.status}</Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "discount",
    label: "Offer",
    align: "center",
    renderCell: (_value, row) =>
      row?.discountType === "percent"
        ? `${row?.discountValue ?? 0}%`
        : row?.discountValue
          ? `$${(Number(row.discountValue) || 0).toLocaleString()}`
          : "-",
  },
  {
    id: "target",
    label: "Target",
    align: "left",
    renderCell: (_value, row) => {
      const display = row?.propertyTitle
        ? row.propertyTitle
        : row?.projectName
          ? row.projectName
          : row?.propertyId
            ? "Property"
            : row?.projectId
              ? "Project"
              : "-";
      return (
        <span className="line-clamp-1" title={display}>
          {display}
        </span>
      );
    },
  },
  {
    id: "startDate",
    label: "Start",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "endDate",
    label: "End",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/bounty/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const userColumns: Column[] = [
  {
    id: "name",
    label: "Employee",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => {
      const displayName = row?.fullName || row?.email || "Unknown";
      const isExpiring = (row?.documentSummary?.expiring ?? 0) > 0;
      const isExpired = (row?.documentSummary?.expired ?? 0) > 0;
      return (
        <div className="flex items-center gap-3">
          {/* <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || row.email}`}
            alt={displayName}
            className="w-10 h-10 rounded-full"
          /> */}

          <div
            className={cn("h-10 w-1 bg-green-400", {
              "bg-orange-600": isExpiring,
              "bg-red-600": isExpired,
            })}
          ></div>
          <div className="leading-tight">
            <div className="font-medium">{displayName}</div>
            <div className="text-xs text-muted-foreground">
              {row?.email || "-"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "phone",
    label: "Phone",
    align: "left",
    renderCell: (v) => v || "-",
  },
  {
    id: "employeeId",
    label: "Employee ID",
    align: "center",
    renderCell: (v) => v || "-",
  },
  {
    id: "role",
    label: "Role",
    sortable: true,
    align: "center",
    renderCell: (_value, row) => {
      // let roleName = "-";
      // if (row.roleId) {
      //   roleName =
      //     typeof row.roleId === "string"
      //       ? row.roleId
      //       : row.roleName || row.roleId;
      // } else if (row.role_id) {
      //   roleName =
      //     typeof row.role_id === "string"
      //       ? row.role_id
      //       : row.roleName || row.role_id;
      // }
      return (
        <Badge variant="secondary">
          {row?.role?.roleName || row?.roleId || row?.role_id || "-"}
        </Badge>
      );
    },
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (_value, row) => {
      const statusValue = _value ? String(_value).toLowerCase() : "";
      return (
        <Badge
          variant={statusValue === "active" ? "success" : "destructive"}
          className="capitalize"
        >
          {_value || "-"}
        </Badge>
      );
    },
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && (row?._id || row?.id)) {
              window.location.href = `/users/${row._id || row.id}`;
            }
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && (row?._id || row?.id)) {
              const event = new CustomEvent(WINDOWS_EVENTS.USER.DELETE.ID, {
                detail: { id: row._id || row.id },
              });
              window.dispatchEvent(event);
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

const companyColumns: Column[] = [
  {
    id: "legalName",
    label: "Company",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div className="leading-tight">
        <div className="font-medium">{row?.legalName || "Unknown"}</div>
        <div className="text-xs text-muted-foreground">
          {row?.city ? `${row.city}, ` : ""}
          {row?.country || "-"}
        </div>
      </div>
    ),
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge
        variant={
          String(value).toLowerCase() === "active" ? "success" : "warning"
        }
      >
        {value || "-"}
      </Badge>
    ),
  },
  {
    id: "companyQuota",
    label: "Quota",
    sortable: true,
    align: "center",
    renderCell: (value) => value ?? "-",
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && (row?._id || row?.id)) {
              window.location.href = `/companies/${row._id || row.id}`;
            }
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && (row?._id || row?.id)) {
              const event = new CustomEvent(WINDOWS_EVENTS.COMPANY.DELETE.ID, {
                detail: { id: row._id || row.id },
              });
              window.dispatchEvent(event);
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

const branchColumns: Column[] = [
  {
    id: "branchCode",
    label: "Branch Code",
    sortable: true,
    align: "left",
    renderCell: (value) => <div className="font-medium">{value}</div>,
  },
  {
    id: "branchName",
    label: "Branch Name",
    sortable: true,
    align: "left",
    renderCell: (value) => <div className="font-medium">{value}</div>,
  },
  {
    id: "companyId",
    label: "Company",
    align: "left",
    renderCell: (_value, row) => {
      const company = row?.companyId;
      const name =
        typeof company === "object" && company ? company?.legalName : company;
      return <div className="text-sm text-muted-foreground">{name || "-"}</div>;
    },
  },
  {
    id: "branchAddress",
    label: "Address",
    align: "left",
    renderCell: (value) => {
      const formattedAddress =
        typeof value === "string"
          ? value
          : value && typeof value === "object"
            ? [
              value?.addressLine,
              value?.city,
              value?.state,
              value?.country,
              value?.pincode,
            ]
              .filter(Boolean)
              .join(", ")
            : "";

      return (
        <div className="text-sm text-muted-foreground line-clamp-2">
          {formattedAddress || "-"}
        </div>
      );
    },
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value || "-"}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_value, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && (row?._id || row?.id)) {
            window.location.href = `/branches/${row._id || row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const payrollColumns: Column[] = [
  {
    id: "payrollMonth",
    label: "Period",
    sortable: true,
    align: "center",
    renderCell: (_value, row) => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthIndex = (row?.payrollMonth ?? 1) - 1;
      const month = monthNames[monthIndex] || "Jan";
      const year = row?.payrollYear || "-";
      return (
        <div className="text-sm font-medium">
          {month}/{year}
        </div>
      );
    },
  },
  // {
  //   id: "startDate",
  //   label: "Start Date",
  //   sortable: true,
  //   align: "center",
  //   renderCell: (value) =>
  //     value ? format(new Date(value), "dd/MM/yyyy") : "-",
  // },
  // {
  //   id: "endDate",
  //   label: "End Date",
  //   sortable: true,
  //   align: "center",
  //   renderCell: (value) =>
  //     value ? format(new Date(value), "dd/MM/yyyy") : "-",
  // },
  {
    id: "lotCapAmount",
    label: "LOT Cap Amount",
    sortable: true,
    align: "right",
    renderCell: (value) => (
      <div className="text-sm font-medium">
        {value?.toLocaleString() || "-"}
      </div>
    ),
  },
  {
    id: "totalGrossAmount",
    label: "Total Gross",
    sortable: true,
    align: "right",
    renderCell: (value) => (
      <div className="text-sm font-medium">
        {value?.toLocaleString() || "-"}
      </div>
    ),
  },
  {
    id: "totalNetAmount",
    label: "Total Net",
    sortable: true,
    align: "right",
    renderCell: (value) => (
      <div className="text-sm font-medium">
        {value?.toLocaleString() || "-"}
      </div>
    ),
  },
  {
    id: "totalEmployee",
    label: "Employees",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant="secondary" className="text-xs">
        {value || "-"}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_value, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/payroll/${row._id || row.id}`;
          }
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];

const advancePayrollColumns: Column[] = [
  {
    id: "userId",
    label: "Employee",
    align: "left",
    renderCell: (_value, row) => {
      const user = row?.userId;
      const name = typeof user === "object" && user ? user?.fullName : user;
      return <div className="font-medium text-sm">{name || "-"}</div>;
    },
  },
  {
    id: "amount",
    label: "Amount",
    align: "right",
    renderCell: (value, row) => (
      <div className="text-sm font-medium">
        {row?.currency ? `${row.currency} ` : ""}
        {Number(value || 0).toLocaleString()}
      </div>
    ),
  },
  {
    id: "paymentMode",
    label: "Mode",
    align: "center",
    renderCell: (value) => <Badge variant="secondary">{value || "-"}</Badge>,
  },
  {
    id: "deductionStatus",
    label: "Deduction Status",
    align: "center",
    renderCell: (value) => {
      const valueLower = value ? String(value).toLowerCase() : "";
      const statusLabel =
        value && AdvanceStatusLabels[valueLower as DeductionStatusEnum]
          ? AdvanceStatusLabels[valueLower as DeductionStatusEnum]
          : value || "-";

      const variant =
        valueLower === DeductionStatusEnum.PENDING?.toLowerCase()
          ? "warning"
          : valueLower === DeductionStatusEnum.PARTIALLY_DEDUCTED?.toLowerCase()
            ? "success"
            : valueLower === DeductionStatusEnum.FULLY_DEDUCTED?.toLowerCase()
              ? "info"
              : valueLower === DeductionStatusEnum.CANCELLED?.toLowerCase()
                ? "destructive"
                : "secondary";

      return <Badge variant={variant}>{statusLabel}</Badge>;
    },
  },
  {
    id: "createdAt",
    label: "CreatedAt",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "updatedAt",
    label: "UpdatedAt",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_value, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && (row?._id || row?.id)) {
            window.location.href = `/advances/${row._id || row.id}`;
          }
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];

const bulkPayrollColumns: Column[] = [
  {
    id: "payrollMonth",
    label: "Month",
    sortable: true,
    align: "center",
    renderCell: (value, row) => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthIndex = (value ? Number(value) : 1) - 1;
      return (
        <div className="font-medium">{monthNames[monthIndex] || "Jan"}</div>
      );
    },
  },
  {
    id: "payrollYear",
    label: "Year",
    sortable: true,
    align: "center",
    renderCell: (value) => <div className="font-medium">{value || "-"}</div>,
  },
  {
    id: "lotCapId",
    label: "LOT Cap Master",
    align: "left",
    renderCell: (_value, row) => {
      const lotCap = row?.lotCapId;
      const name = typeof lotCap === "object" && lotCap ? lotCap?.name : lotCap;
      return <div className="text-sm">{name || "-"}</div>;
    },
  },
  {
    id: "itemCount",
    label: "Employees",
    sortable: true,
    align: "center",
    renderCell: (_value, row) => (
      <Badge variant="secondary">{row?.items?.length || 0}</Badge>
    ),
  },
  {
    id: "totalGross",
    label: "Total Gross",
    sortable: true,
    align: "right",
    renderCell: (_value, row) => {
      const total = (row?.items || []).reduce(
        (sum: number, item: any) => sum + (Number(item?.grossSalary) || 0),
        0,
      );
      return (
        <div className="text-sm font-medium">₹{total.toLocaleString()}</div>
      );
    },
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value || "-"}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_value, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && (row?._id || row?.id)) {
            window.location.href = `/payroll/${row._id || row.id}`;
          }
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];

const builderColumns: Column[] = [
  {
    id: "profile",
    label: "Company",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">
          {row?.profile?.companyName || row?.name || "N/A"}
        </div>
        <div className="text-xs text-muted-foreground">
          {row?.profile?.contactPerson || "-"}
        </div>
      </div>
    ),
  },
  {
    id: "email",
    label: "Email",
    align: "left",
    renderCell: (v) => v || "-",
  },
  {
    id: "phoneNumber",
    label: "Phone",
    align: "left",
    renderCell: (v) => v || "-",
  },
  {
    id: "location",
    label: "Location",
    align: "left",
    renderCell: (_value, row) => {
      const city = row?.profile?.address?.city;
      const state = row?.profile?.address?.state;
      return city || state
        ? `${city || ""}, ${state || ""}`.replace(/^, |, $/g, "")
        : "-";
    },
  },
  {
    id: "project",
    label: "Projects",
    align: "center",
    renderCell: (_value, row) => (
      <div className="text-sm">
        <div>{row?.profile?.totalProjects || 0} Total</div>
        <div className="text-xs text-muted-foreground">
          {row?.profile?.ongoingProjects || 0} Ongoing
        </div>
      </div>
    ),
  },
  {
    id: "isActive",
    label: "Status",
    align: "center",
    renderCell: (v) => (
      <Badge variant={v ? "success" : "destructive"}>
        {v ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Joined",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && (row?._id || row?.id)) {
            window.location.href = `/builders/${row._id || row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const propertyColumns: Column[] = [
  {
    id: "thumbnail",
    label: "Image",
    align: "center",
    renderCell: (value) =>
      isValidSrc(value) ? (
        <Image
          src={value}
          alt="property thumbnail"
          width={128}
          height={96}
          className="h-24 w-40 object-cover rounded border"
        />
      ) : (
        <Image
          src={"/images/logo.svg"}
          alt="property thumbnail"
          width={128}
          height={96}
          className="h-24 w-40 object-cover rounded border"
        />
      ),
  },
  {
    id: "title",
    label: "Property Title",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.propertyTitle || "Unknown"}</div>
        {row?.status && (
          <div className="mt-1">
            <Badge variant={mapStatusVariant(row.status)}>{row.status}</Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "propertyType",
    label: "Type",
    align: "center",
    renderCell: (value) => value || "-",
  },
  {
    id: "price",
    label: "Price",
    align: "right",
    renderCell: (value) => `$${value?.toLocaleString() || 0}`,
  },
  {
    id: "specs",
    label: "Specs",
    align: "left",
    renderCell: (_, row) => (
      <div className="text-xs text-muted-foreground">
        <span>
          {row?.area ? `${Number(row.area).toLocaleString()} sq ft` : "N/A"}
        </span>
        <span className="mx-2">•</span>
        <span>{row?.bedrooms != null ? `${row.bedrooms} Bed` : "-"}</span>
        <span className="mx-2">•</span>
        <span>{row?.bathrooms != null ? `${row.bathrooms} Bath` : "-"}</span>
      </div>
    ),
  },
  {
    id: "location",
    label: "Location",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "date",
    label: "Date",
    align: "center",
    renderCell: (v) => {
      return v ? JSON.stringify(v) : "-";
    },
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && row?._id) {
            window.location.href = `/property/${row._id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const projectColumns: Column[] = [
  {
    id: "logo",
    label: "Logo",
    align: "center",
    renderCell: (value) => (
      <Avatar
        src={value || "/images/placeholder.png"}
        alt="project logo"
        size={52}
      />
    ),
  },
  {
    id: "name",
    label: "Project Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.name || "Unknown"}</div>
        {row?.status && (
          <div className="mt-1">
            <Badge variant={mapStatusVariant(row.status)}>{row.status}</Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "location",
    label: "Location",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "address",
    label: "Address",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "totalProperties",
    label: "Properties",
    align: "center",
    renderCell: (value) => value ?? "-",
  },
  {
    id: "createdBy",
    label: "Created By",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "date",
    label: "Date",
    align: "center",
    renderCell: (v) => format(new Date(v), "dd/MM/yy"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && row?.id) {
            window.location.href = `/projects/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const agentColumns: Column[] = [
  {
    id: "avatar",
    label: "Avatar",
    align: "center",
    renderCell: (value) => (
      <Avatar
        src={value || "/images/placeholder.png"}
        alt="agent avatar"
        size={52}
      />
    ),
  },
  {
    id: "name",
    label: "Agent Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.name || "Unknown"}</div>
        {row?.status && (
          <div className="mt-1">
            <Badge variant={mapStatusVariant(row.status)}>{row.status}</Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "agency",
    label: "Agency",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "licenseNo",
    label: "License",
    align: "center",
    renderCell: (value) => value || "-",
  },
  {
    id: "phone",
    label: "Phone",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "email",
    label: "Email",
    align: "left",
    renderCell: (value) => value || "-",
  },
  {
    id: "date",
    label: "Date",
    align: "center",
    renderCell: (v) => format(new Date(v), "dd/MM/yy"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined" && row?.id) {
            window.location.href = `/agents/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const inquiryColumns: Column[] = [
  {
    id: "subject",
    label: "Subject",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium line-clamp-1" title={row?.subject || ""}>
          {row?.subject || "No Subject"}
        </div>
        {row?.status && (
          <div className="mt-1">
            <Badge variant={mapStatusVariant(row.status)}>{row.status}</Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "priority",
    label: "Priority",
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value || "-"}</Badge>
    ),
  },
  {
    id: "target",
    label: "Target",
    align: "left",
    renderCell: (_value, row) => {
      const isProperty = !!row?.propertyId || !!row?.propertyTitle;
      const isProject = !!row?.projectId || !!row?.projectName;
      const name = row?.propertyTitle
        ? row.propertyTitle
        : row?.projectName
          ? row.projectName
          : isProperty
            ? "Property"
            : isProject
              ? "Project"
              : "-";
      const typeLabel = isProperty ? "Property" : isProject ? "Project" : null;
      return (
        <div>
          <div className="font-medium line-clamp-1" title={name}>
            {name}
          </div>
          {typeLabel && (
            <div className="mt-1">
              <Badge variant={typeLabel === "Property" ? "success" : "info"}>
                {typeLabel}
              </Badge>
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "agentId",
    label: "Agent",
    align: "left",
  },
  {
    id: "date",
    label: "Date",
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/inquiry/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const amenityColumns: Column[] = [
  {
    id: "iconImage",
    label: "Icon",
    align: "center",
    renderCell: (value) => (
      <Avatar
        src={value || "/images/placeholder.png"}
        alt="amenity icon"
        size={52}
      />
    ),
  },
  {
    id: "name",
    label: "Amenity Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row.name}</div>
      </div>
    ),
  },
  {
    id: "createdBy",
    label: "Created By",
    align: "left",
  },
  {
    id: "updatedBy",
    label: "Updated By",
    align: "left",
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/amenities/${row._id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

const modelColumns: Column[] = [
  {
    id: "name",
    label: "Model Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.name || "Unknown"}</div>
        {row?.compactFormat && (
          <div className="text-xs text-muted-foreground">
            {row.compactFormat}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created At",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "updatedAt",
    label: "Updated At",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/models/${row.id}`;
            }
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              const event = new CustomEvent(WINDOWS_EVENTS.MODEL.DELETE.ID, {
                detail: { id: row.id },
              });
              window.dispatchEvent(event);
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

export {
  agentColumns,
  amenityColumns,
  bountyColumns,
  builderColumns,
  inquiryColumns,
  modelColumns,
  projectColumns,
  propertyColumns,
  companyColumns,
  branchColumns,
  payrollColumns,
  bulkPayrollColumns,
  userColumns,
  advancePayrollColumns,
};

export const franchiseColumns: Column[] = [
  {
    id: "franchiseCode",
    label: "Franchise Code",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.franchiseCode || "Unknown"}</div>
        <div className="text-xs text-muted-foreground">{row?.name || "-"}</div>
      </div>
    ),
  },
  {
    id: "ownerName",
    label: "Owner",
    sortable: true,
    align: "left",
  },
  {
    id: "modelName",
    label: "Model",
    align: "left",
  },
  {
    id: "location",
    label: "Location",
    align: "left",
    renderCell: (_value, row) => {
      const city = row?.locationInfrastructure?.city;
      const state = row?.locationInfrastructure?.state;
      return city && state ? `${city}, ${state}` : "-";
    },
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "establishmentDate",
    label: "Established",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/franchises/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

export const stockColumns: Column[] = [
  {
    id: "itemName",
    label: "Item Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row?.itemName || "Unknown"}</div>
        <div className="text-xs text-muted-foreground">
          {row?.category || "-"}
        </div>
      </div>
    ),
  },
  {
    id: "currentStock",
    label: "Stock",
    sortable: true,
    align: "center",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">
          {row?.currentStock ?? 0} {row?.unit || ""}
        </div>
        {(row?.currentStock ?? 0) <= (row?.reorderThreshold ?? 0) &&
          row?.currentStock !== undefined && (
            <div className="text-xs text-orange-600">Low Stock</div>
          )}
      </div>
    ),
  },
  {
    id: "location",
    label: "Location",
    sortable: true,
    align: "left",
  },
  {
    id: "unitPrice",
    label: "Unit Price",
    sortable: true,
    align: "right",
    renderCell: (value) => `₹${value?.toLocaleString() || 0}`,
  },
  {
    id: "totalValue",
    label: "Total Value",
    sortable: true,
    align: "right",
    renderCell: (value) => `₹${value?.toLocaleString() || 0}`,
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "lastRestocked",
    label: "Last Restocked",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/stocks/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

export const recipeColumns: Column[] = [
  {
    id: "name",
    label: "Recipe Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {row.description}
        </div>
      </div>
    ),
  },
  {
    id: "cuisine",
    label: "Cuisine",
    sortable: true,
    align: "center",
  },
  {
    id: "difficulty",
    label: "Difficulty",
    sortable: true,
    align: "center",
  },
  {
    id: "prepTimeMinutes",
    label: "Prep Time",
    sortable: true,
    align: "center",
    renderCell: (value, row) => `${row?.prepTimeMinutes ?? 0} mins`,
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/recipes/${row._id || row.id}`;
            }
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              const event = new CustomEvent("deleteRecipe", {
                detail: { id: row._id || row.id },
              });
              window.dispatchEvent(event);
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

export const recipeCategoryColumns: Column[] = [
  {
    id: "name",
    label: "Category Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {row.description}
        </div>
      </div>
    ),
  },
  {
    id: "slug",
    label: "Slug",
    sortable: true,
    align: "center",
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/recipe-categories/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

export const menuColumns: Column[] = [
  {
    id: "menuName",
    label: "Menu Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">{row.menuName}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {row.description}
        </div>
      </div>
    ),
  },
  {
    id: "menuType",
    label: "Type",
    sortable: true,
    align: "center",
  },
  {
    id: "category",
    label: "Category",
    sortable: true,
    align: "left",
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "linkedFranchises",
    label: "Franchises",
    align: "center",
    renderCell: (_value, row) => (
      <span className="text-sm font-medium">
        {row.linkedFranchises?.length || 0}
      </span>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/menus/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

export const warehouseColumns: Column[] = [
  {
    id: "code",
    label: "Code",
    align: "left",
    renderCell: (_value, row) => (
      <div className="font-semibold">{row?.code || "-"}</div>
    ),
  },
  {
    id: "name",
    label: "Warehouse Name",
    align: "left",
    renderCell: (_value, row) => <div className="font-medium">{row.name}</div>,
  },
  {
    id: "location",
    label: "Location",
    align: "left",
    renderCell: (_value, row) => <div>{row.location}</div>,
  },
  {
    id: "manager",
    label: "Manager",
    align: "left",
    renderCell: (_value, row) => <div>{row.manager}</div>,
  },
  {
    id: "phone",
    label: "Phone",
    align: "left",
    renderCell: (_value, row) => <div className="text-sm">{row.phone}</div>,
  },
  {
    id: "capacity",
    label: "Capacity",
    align: "left",
    renderCell: (_value, row) => <div className="text-sm">{row.capacity}</div>,
  },
  {
    id: "utilization",
    label: "Utilization",
    align: "center",
    renderCell: (_value, row) => {
      const utilization = row?.utilization ? String(row.utilization) : "0";
      const percent = parseInt(utilization) || 0;
      let bgColor = "bg-secondary/20 text-secondary";
      if (percent > 80) bgColor = "bg-destructive/20 text-destructive";
      else if (percent > 60) bgColor = "bg-accent/20 text-accent";
      return (
        <div
          className={`px-2 py-1 rounded text-xs font-semibold ${bgColor}`}
          title={`${utilization}%`}
        >
          {utilization}
        </div>
      );
    },
  },
  {
    id: "status",
    label: "Status",
    align: "center",
    renderCell: (_value, row) => {
      const status = row?.status ? String(row.status) : "Unknown";
      const color = status === "Active" ? "text-secondary" : "text-destructive";
      return <div className={`font-medium ${color}`}>{status}</div>;
    },
  },
  {
    id: "actions",
    label: "Action",
    align: "center",
    renderCell: (_, row) => {
      const warehouse = row.original;
      return (
        <div className="flex gap-2">
          {/* <Button size="sm" variant="ghost" asChild> */}
          {/* <Link href={`/warehouse/${warehouse.id || " "}`}> */}
          <Eye className="w-4 h-4" />
          {/* </Link> */}
          {JSON.stringify(warehouse)}
          {/* </Button> */}
          {/* <Button size="sm" variant="ghost" asChild> */}
          {/* <Link href={`/warehouse/${warehouse.id}/edit`}>
            <Edit2 className="w-4 h-4" />
          </Link> */}
          {/* </Button> */}
          {/* <Button size="sm" variant="ghost">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button> */}
        </div>
      );
    },
  },
];
export const offerColumns: Column[] = [
  {
    id: "name",
    label: "Offer Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-semibold">{row?.name || "Unknown"}</div>
      </div>
    ),
  },
  {
    id: "type",
    label: "Type",
    sortable: true,
    align: "center",
    renderCell: (value) => <span className="text-sm">{value}</span>,
  },
  {
    id: "discountValue",
    label: "Discount",
    align: "center",
    renderCell: (_value, row) => {
      const type = row?.type ? String(row.type) : "";
      const value = row?.discountValue ?? 0;
      return (
        <span className="font-medium">
          {type === "Flat" ? `₹${value}` : `${value}%`}
        </span>
      );
    },
  },
  {
    id: "applicableScope",
    label: "Scope",
    align: "center",
    renderCell: (value) => <span className="text-sm">{value}</span>,
  },
  {
    id: "startDate",
    label: "Start Date",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "endDate",
    label: "End Date",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/offer/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];

export const roleColumns: Column[] = [
  {
    id: "name",
    label: "Role Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-semibold">
          {formatText(row?.name || row?.roleName || "Unknown", "sentence")}
        </div>
        {row?.roleType && (
          <Badge className="mt-1 text-xs">
            {row.roleType === "emp" ? "Employee" : "Non-Employee"}
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "description",
    label: "Description",
    align: "left",
    renderCell: (_value, row) => (
      <span
        className="text-sm truncate max-w-[200px]"
        title={row?.description || ""}
      >
        {row?.description || "-"}
      </span>
    ),
  },
  {
    id: "permissions",
    label: "Permissions",
    align: "center",
    renderCell: (value, row) => {
      const permCount =
        row?.permissions?.length || row?.permissionMatrix?.length || 0;
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium text-primary">{permCount}</span>
          <span className="text-xs text-muted-foreground">modules</span>
        </div>
      );
    },
  },
  // {
  //   id: "assignedUsers",
  //   label: "Assigned Users",
  //   align: "center",
  //   renderCell: (value) => <span className="font-medium">{value || 0}</span>,
  // },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge className="capitalize" variant={mapStatusVariant(value)}>
        {value || "active"}
      </Badge>
    ),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/roles/${row._id}/edit`;
            }
          }}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/roles/${row._id}`;
            }
          }}
        >
          View
        </Button>
      </div>
    ),
  },
];

export const rawMaterialColumns: Column[] = [
  {
    id: "name",
    label: "Material Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div>
        <div className="font-medium">
          {row?.name || row?.materialName || "Unknown"}
        </div>
        <div className="text-xs text-muted-foreground">
          {row?.description || "-"}
        </div>
      </div>
    ),
  },
  {
    id: "category",
    label: "Category",
    sortable: true,
    align: "center",
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    renderCell: (value) => (
      <Badge variant={mapStatusVariant(value)}>{value}</Badge>
    ),
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = `/raw-materials/${row._id || row.id}`;
            }
          }}
        >
          View
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              const event = new CustomEvent(
                WINDOWS_EVENTS.RAW_MATERIAL.DELETE.ID,
                {
                  detail: { id: row._id || row.id },
                },
              );
              window.dispatchEvent(event);
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

export const permissionColumns: Column[] = [
  {
    id: "module",
    label: "Permission Name",
    sortable: true,
    align: "left",
    renderCell: (_value, row) => (
      <div className="font-medium">
        {formatText(row?.module || "Unknown", "capitalizeWords")}
      </div>
    ),
  },
  {
    id: "description",
    label: "Description",
    sortable: false,
    align: "left",
    renderCell: (_value, row) => (
      <span className="text-sm text-muted-foreground line-clamp-2">
        {formatText(row.description || "-", "paragraph")}
      </span>
    ),
  },
  {
    id: "createdBy",
    label: "Created By",
    sortable: true,
    align: "left",
    renderCell: (_, row) => {
      const name = row?.createdBy?.username;
      return (
        <span className="text-sm capitalize">
          {formatText(name || "-", "capitalizeWords")}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    label: "Created",
    sortable: true,
    align: "center",
    renderCell: (v) => (v ? format(new Date(v), "dd/MM/yy") : "-"),
  },
  {
    id: "action",
    label: "Action",
    align: "center",
    renderCell: (_, row) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = `/permission/${row.id}`;
          }
        }}
      >
        View
      </Button>
    ),
  },
];
export const lotMasterColumns: Column[] = [
  {
    id: "name",
    label: "LOT Cap Name",
    align: "left",
    sortable: true,
    renderCell: (_value, row) => (
      <div className="font-semibold">{row.name}</div>
    ),
  },
  {
    id: "lotCapAmount",
    label: "Cap Amount (₹)",
    align: "right",
    sortable: true,
    renderCell: (_value, row) => (
      <div className="text-right font-medium">
        ₹{row?.lotCapAmount != null ? row.lotCapAmount.toLocaleString() : "0"}
      </div>
    ),
  },
  {
    id: "effectiveFrom",
    label: "Effective From",
    align: "center",
    sortable: true,
    renderCell: (_value, row) => (
      <div>
        {row?.effectiveFrom
          ? format(new Date(row.effectiveFrom), "dd MMM, yyyy")
          : "-"}
      </div>
    ),
  },
  {
    id: "effectiveTo",
    label: "Effective To",
    align: "center",
    renderCell: (_value, row) => (
      <div>
        {row?.effectiveTo
          ? format(new Date(row.effectiveTo), "dd MMM, yyyy")
          : "No Expiry"}
      </div>
    ),
  },
  {
    id: "isActive",
    label: "Status",
    align: "center",
    renderCell: (_value, row) => (
      <Badge variant={row?.isActive ? "success" : "secondary"}>
        {row?.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "createdBy",
    label: "Created By",
    align: "left",
    renderCell: (_value, row) => (
      <div className="text-sm">
        {typeof row?.createdBy === "object" && row.createdBy
          ? row.createdBy?.fullName || "Unknown"
          : "Unknown"}
      </div>
    ),
  },
];
// VISA_MANAGER_COLUMNS_PLACEHOLDER
