"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { UploadCloud, File, Trash2, CheckCircle, AlertCircle, Loader2, Download, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useBulkImportUsers } from "@/hooks/query/user.hook";

// Expected columns (mapped to CreateUserRequest)
const EXPECTED_COLUMNS = [
    "fullName",
    "dob",
    "email",
    "phone",
    "phoneCountryCode",
    "emergencyContact",
    "emergencyContactCountryCode",
    "bloodGroup",
    "nationality",
    "gender",
    "maritalStatus",
    "baseSalary",
    "currency",
];

export function BulkUserUploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const { mutate: bulkImport, isPending: isSaving } = useBulkImportUsers();

    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const handleEditStart = (index: number) => {
        setEditingIdx(index);
        setEditForm({ ...parsedData[index] });
    };

    const handleEditSave = () => {
        setParsedData((prev) => {
            const next = [...prev];
            next[editingIdx!] = { ...editForm };
            return next;
        });
        setEditingIdx(null);
    };

    const handleEditCancel = () => {
        setEditingIdx(null);
    };

    const handleInputChange = (field: string, value: any) => {
        setEditForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "text/csv": [".csv"],
        },
        maxFiles: 1,
    });

    const parseFile = (file: File) => {
        setIsParsing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const json: any[] = XLSX.utils.sheet_to_json(sheet);

                // Map keys exactly or trim them
                const mappedData = json.map((row) => {
                    const mappedRow: any = {};
                    Object.keys(row).forEach((key) => {
                        const cleanKey = key.trim();
                        mappedRow[cleanKey] = row[key];
                    });
                    return mappedRow;
                });

                setParsedData(mappedData);
                if (mappedData.length > 0) {
                    toast.success(`Successfully parsed ${mappedData.length} records`);
                } else {
                    toast.error("The uploaded file is empty.");
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                toast.error("Failed to parse file. Please check the format.");
            } finally {
                setIsParsing(false);
            }
        };

        reader.onerror = () => {
            toast.error("Error reading file.");
            setIsParsing(false);
        };

        reader.readAsBinaryString(file);
    };

    const handleClear = () => {
        setFile(null);
        setParsedData([]);
    };

    const handleDownloadSample = () => {
        const ws = XLSX.utils.json_to_sheet([{
            fullName: "John Doe",
            dob: "1990-01-01",
            email: "john@example.com",
            phone: "1234567890",
            phoneCountryCode: "+1",
            gender: "Male",
            baseSalary: 5000,
            currency: "USD"
        }]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sample");
        XLSX.writeFile(wb, "Users_Bulk_Import_Template.xlsx");
    };

    const handleSubmit = () => {
        if (parsedData.length === 0) {
            toast.error("No data to submit");
            return;
        }

        bulkImport(parsedData, {
            onSuccess: () => {
                toast.success(`Successfully imported ${parsedData.length} users`);
                router.push("/users");
            },
            onError: (error: any) => {
                const msg = error?.response?.data?.message || "Failed to import users";
                toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
            },
        });
    };

    const handleDeleteRow = (index: number) => {
        setParsedData((prev) => prev.filter((_, i) => i !== index));
        setEditingIdx(null);
    };

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            {!file && (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={handleDownloadSample} className="gap-2">
                            <Download className="w-4 h-4" />
                            Download Sample Template
                        </Button>
                    </div>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex flex-col items-center justify-center mb-4 text-blue-500">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">XLSX, CSV up to 10MB</p>
                    </div>
                </div>
            )}

            {/* File Info & Parsing logic */}
            {file && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                            <File className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB • {parsedData.length} rows detected
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={handleClear} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Data Preview */}
            {parsedData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Valid Data Preview ({parsedData.length} rows)
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Full Name</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Phone</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">DOB</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Base Salary</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parsedData.map((row, idx) => {
                                    const isEditing = editingIdx === idx;
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded text-xs"
                                                        value={editForm.fullName || ""}
                                                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                                                    />
                                                ) : row.fullName || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded text-xs"
                                                        value={editForm.email || ""}
                                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                                    />
                                                ) : row.email || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded text-xs"
                                                        value={editForm.phone || ""}
                                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                                    />
                                                ) : row.phone || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded text-xs"
                                                        type="date"
                                                        value={editForm.dob || ""}
                                                        onChange={(e) => handleInputChange("dob", e.target.value)}
                                                    />
                                                ) : row.dob || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        className="w-full p-1 border rounded text-xs"
                                                        type="number"
                                                        value={editForm.baseSalary || ""}
                                                        onChange={(e) => handleInputChange("baseSalary", e.target.value)}
                                                    />
                                                ) : row.baseSalary || "-"} {row.currency || ""}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleEditSave}
                                                                className="text-green-500 hover:text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleEditCancel}
                                                                className="text-gray-400 hover:text-gray-500 hover:bg-gray-50 h-8 w-8 p-0"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditStart(idx)}
                                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteRow(idx)}
                                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Submit Action */}
            {parsedData.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#007aff] hover:bg-blue-600 text-white px-8 py-2 font-bold shadow-md shadow-blue-500/20"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            "Create Users"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
