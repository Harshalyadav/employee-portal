"use client";
// Visa Manager datatable column configurations
// Based on actual API shapes:
//   - GET /api/user-documents: userId = null | { _id, fullName, email }  (NO employeeId)
//   - GET /api/user:           full user with employeeId, fullName, email
//   - Document field is `docType` (not `documentType`)
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Column } from "@/types";
import { DocumentTypeLabels, UserDocumentTypeEnum } from "@/types/user-document.type";
import { formatDate } from "@/lib/utils";

/**
 * Get the populated userId object from the document directly.
 * The documents API populates userId with { _id, fullName, email }.
 */
function getDocUser(row: any) {
    const u = row?.userId;
    if (u && typeof u === "object") return u;
    return null;
}

/**
 * Get the full user joined from the /api/user endpoint (has employeeId).
 * Attached as __user by VisaManagerTable.
 */
function getFullUser(row: any) {
    const u = row?.__user;
    if (u && typeof u === "object") return u;
    return null;
}

function getBranchName(row: any) {
    const fullUser = getFullUser(row);
    const branch = fullUser?.branchId || fullUser?.branch;
    if (branch && typeof branch === "object") {
        return branch.branchName || branch.name || "-";
    }
    return row?.__branchName || "-";
}

function getDocumentTypeLabel(row: any) {
    const rawType = row?.docType || row?.documentType;
    if (!rawType) return "-";
    return DocumentTypeLabels[rawType as UserDocumentTypeEnum] || String(rawType).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const visaManagerColumns: Column[] = [
    // ── 1. Employee: name + email ─────────────────────────────────────────────
    {
        id: "empName",
        label: "Employee",
        align: "left",
        renderCell: (_value: any, row: any) => {
            const docUser = getDocUser(row);
            const fullUser = getFullUser(row);
            const name = docUser?.fullName || fullUser?.fullName || "-";
            const email = docUser?.email || fullUser?.email || "";
            return (
                <div className="leading-tight">
                    <div className="font-medium text-sm">{name}</div>
                    {email && (
                        <div className="text-xs text-muted-foreground">{email}</div>
                    )}
                </div>
            );
        },
    },

    // ── 2. Emp ID: separate column between Employee and Document ──────────────
    {
        id: "empId",
        label: "Emp ID",
        align: "left",
        renderCell: (_value: any, row: any) => {
            const fullUser = getFullUser(row);
            const docUser = getDocUser(row);
            const empId =
                fullUser?.employeeId ||
                fullUser?.uniqueWorkerId ||
                fullUser?.displayEmployeeId ||
                docUser?.employeeId ||
                docUser?.uniqueWorkerId ||
                docUser?.displayEmployeeId ||
                (fullUser?._id ? `EMP-${String(fullUser._id).slice(-6)}` : undefined) ||
                (docUser?._id ? `EMP-${String(docUser._id).slice(-6)}` : undefined) ||
                "-";
            return (
                <div className="font-mono text-sm font-medium">{empId}</div>
            );
        },
    },

    {
        id: "branchName",
        label: "Branch Name",
        align: "left",
        renderCell: (_value: any, row: any) => (
            <div className="text-sm font-medium">{getBranchName(row)}</div>
        ),
    },

    // ── 3. Document Type ───────────────────────────────────────────────────────

    {
        id: "docType",
        label: "Document Type",
        align: "left",
        renderCell: (_value: any, row: any) => (
            <div className="font-medium text-sm">{getDocumentTypeLabel(row)}</div>
        ),
    },

    // ── Status: based on expiryDate ──────────────────────────────────────────
    // Badge on top, days info below
    {
        id: "expiryDate",
        label: "Status",
        align: "left",
        renderCell: (value: any) => {
            if (!value) {
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <Badge variant="secondary" className="whitespace-nowrap">
                            No Expiry
                        </Badge>
                        <span className="text-xs text-muted-foreground">—</span>
                    </div>
                );
            }
            const today = new Date();
            const expiry = new Date(value);
            const diffDays = Math.ceil(
                (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays <= 0) {
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <Badge variant="destructive" className="whitespace-nowrap">
                            Employee Blocked
                        </Badge>
                        <span className="text-xs text-red-500 font-medium">Expired</span>
                    </div>
                );
            }
            if (diffDays <= 30) {
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <Badge className="bg-orange-600 text-white hover:bg-orange-700 whitespace-nowrap">
                            Critical
                        </Badge>
                        <span className="text-xs text-orange-500 font-medium">{diffDays} days left</span>
                    </div>
                );
            }
            if (diffDays <= 90) {
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <Badge variant="warning" className="whitespace-nowrap">
                            Warning
                        </Badge>
                        <span className="text-xs text-yellow-600 font-medium">{diffDays} days left</span>
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-start gap-0.5">
                    <Badge variant="success" className="whitespace-nowrap">
                        Valid
                    </Badge>
                    <span className="text-xs text-green-600 font-medium">{diffDays} days left</span>
                </div>
            );
        },
    },

    // ── Created Date ──────────────────────────────────────────────────────────
    {
        id: "createdAt",
        label: "Created",
        align: "center",
        sortable: true,
        renderCell: (v: any) => (v ? formatDate(v) : "-"),
    },

    // ── Expiry Date (display) ─────────────────────────────────────────────────
    {
        id: "expiryDateDisplay",
        label: "Expiry Date",
        align: "center",
        renderCell: (_value: any, row: any) => {
            const v = row?.expiryDate;
            return v ? formatDate(v) : "-";
        },
    },

    // ── Action: Renew Document ────────────────────────────────────────────────
    {
        id: "action",
        label: "Action",
        align: "center",
        renderCell: (_value: any, row: any) => {
            const docUser = getDocUser(row);
            const fullUser = getFullUser(row);
            const userId =
                fullUser?._id ||
                fullUser?.id ||
                docUser?._id ||
                docUser?.id ||
                (typeof row?.userId === "string" ? row.userId : "") ||
                "";
            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (typeof window !== "undefined" && userId) {
                            window.location.href = `/users/${userId}`;
                        }
                    }}
                >
                    Renew Document
                </Button>
            );
        },
    },
];
