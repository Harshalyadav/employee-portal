"use client";

import { useUploadSinglePdf } from "@/hooks/query/upload.hook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import { X, Loader2, FileText, Upload as UploadIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface PdfUploadProps {
  folder: string;
  label?: string;
  onUploadSuccess?: (url: string, key: string) => void;
  onUploadError?: (error: Error) => void;
  defaultValue?: string;
  setSelectedFile?: (file: File | null) => void;
  setUploadedUrl?: (url: string | null) => void;
  selectedFile?: File | null;
  uploadedUrl?: string | null;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({
  folder,
  label = "Upload PDF",
  onUploadSuccess,
  onUploadError,
  defaultValue,
  setSelectedFile: setSelectedFileProp,
  setUploadedUrl: setUploadedUrlProp,
  selectedFile: selectedFileProp,
  uploadedUrl: uploadedUrlProp,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    defaultValue || null,
  );

  // Effective values (controlled if props provided, else internal state)
  const effectiveSelectedFile = selectedFileProp ?? selectedFile;
  const effectiveUploadedUrl = uploadedUrlProp ?? uploadedUrl;

  const { mutate: uploadPdf, isPending } = useUploadSinglePdf();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        // Uncontrolled internal state update
        if (selectedFileProp === undefined) {
          setSelectedFile(file);
        }
        // Notify parent if they provided a setter
        setSelectedFileProp?.(file);
      }
    },
    [selectedFileProp, setSelectedFileProp],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isPending || !!effectiveUploadedUrl,
  });

  const handleUpload = () => {
    if (!effectiveSelectedFile) return;

    uploadPdf(
      { file: effectiveSelectedFile, folder },
      {
        onSuccess: (response) => {
          // Uncontrolled internal state update
          if (uploadedUrlProp === undefined) {
            setUploadedUrl(response.url);
          }
          // Notify parent if they provided a setter
          setUploadedUrlProp?.(response.url);
          onUploadSuccess?.(response.url, response.filename);
        },
        onError: (error) => {
          onUploadError?.(error);
        },
      },
    );
  };

  const handleRemove = () => {
    // Uncontrolled internal state updates
    if (selectedFileProp === undefined) {
      setSelectedFile(null);
    }
    if (uploadedUrlProp === undefined) {
      setUploadedUrl(defaultValue || null);
    }
    // Notify parent via setters if provided
    setSelectedFileProp?.(null);
    setUploadedUrlProp?.(defaultValue || null);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Uploaded PDF Preview */}
      {effectiveUploadedUrl && (
        <div className="border rounded-lg p-4 bg-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium">PDF Document</p>
                <a
                  href={effectiveUploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View PDF
                </a>
              </div>
            </div>
            {!isPending && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dropzone */}
      {!effectiveUploadedUrl && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-red-600" />
            {isDragActive ? (
              <p className="text-sm font-medium">Drop PDF here...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop PDF here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">PDF files only</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {effectiveSelectedFile && !effectiveUploadedUrl && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-red-600" />
            <span className="text-sm">
              {effectiveSelectedFile.name} (
              {(effectiveSelectedFile.size / 1024).toFixed(2)} KB)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {effectiveUploadedUrl && (
        <div className="text-sm text-secondary">
          ✓ PDF uploaded successfully
        </div>
      )}
    </div>
  );
};
