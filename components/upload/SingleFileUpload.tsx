"use client";

import { useUploadSingleImage } from "@/hooks/query/upload.hook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import Image from "next/image";
import { X, Loader2, Upload as UploadIcon } from "lucide-react";
import { isValidSrc } from "@/lib";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface SingleFileUploadProps {
  folder: string;
  accept?: string;
  label?: string;
  onUploadSuccess?: (url: string, key: string) => void;
  onUploadError?: (error: Error) => void;
  defaultValue?: string;
  showPreview?: boolean;
  helperText?: string;
  dropzoneClassName?: string;
  previewClassName?: string;
}

const DEFAULT_IMAGE_ACCEPT = ".jpeg,.jpg,.png,.gif,.webp";

const buildDropzoneAccept = (accept: string) => {
  const values = accept
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (values.length === 0) {
    return {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    };
  }

  const mapped = values.reduce<Record<string, string[]>>((accumulator, value) => {
    const extension = value.startsWith(".") ? value : `.${value}`;

    switch (extension) {
      case ".jpg":
      case ".jpeg":
        accumulator["image/jpeg"] = [...(accumulator["image/jpeg"] || []), extension];
        break;
      case ".png":
        accumulator["image/png"] = [...(accumulator["image/png"] || []), extension];
        break;
      case ".gif":
        accumulator["image/gif"] = [...(accumulator["image/gif"] || []), extension];
        break;
      case ".webp":
        accumulator["image/webp"] = [...(accumulator["image/webp"] || []), extension];
        break;
      case ".pdf":
        accumulator["application/pdf"] = [...(accumulator["application/pdf"] || []), extension];
        break;
      default:
        accumulator["image/*"] = [...(accumulator["image/*"] || []), extension];
        break;
    }

    return accumulator;
  }, {});

  return Object.keys(mapped).length > 0
    ? mapped
    : {
        "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      };
};

export const SingleFileUpload: React.FC<SingleFileUploadProps> = ({
  folder,
  accept = DEFAULT_IMAGE_ACCEPT,
  label = "Upload Image",
  onUploadSuccess,
  onUploadError,
  defaultValue,
  showPreview = true,
  helperText,
  dropzoneClassName,
  previewClassName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultValue || null,
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    defaultValue || null,
  );

  const { mutate: uploadFile, isPending } = useUploadSingleImage();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);

        // Create preview URL
        if (showPreview && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [showPreview],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: buildDropzoneAccept(accept),
    maxFiles: 1,
    multiple: false,
    disabled: isPending || !!uploadedUrl,
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadFile(
      { file: selectedFile, folder },
      {
        onSuccess: (response) => {
          setUploadedUrl(response.url);
          onUploadSuccess?.(response.url, response.filename);
        },
        onError: (error) => {
          onUploadError?.(error);
        },
      },
    );
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(defaultValue || null);
    setUploadedUrl(defaultValue || null);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Preview */}
      {showPreview && previewUrl && (
        <div className={cn("relative w-full h-48 border rounded-lg overflow-hidden bg-muted", previewClassName)}>
          <Image
            src={isValidSrc(previewUrl) ? previewUrl : "/images/logo.svg"}
            alt="Preview"
            fill
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/logo.svg";
            }}
          />
          {!uploadedUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Dropzone */}
      {!uploadedUrl && !selectedFile && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isPending && "opacity-50 cursor-not-allowed",
            dropzoneClassName,
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm font-medium">Drop image here...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop image here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  {helperText || "JPEG, PNG, GIF, or WebP"}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadedUrl && (
        <div className="flex flex-col items-start justify-between p-3 bg-muted rounded-lg gap-2">
          <span className="text-sm">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </span>
          <div className="flex gap-2">
            {/* <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button> */}
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
                "Upload"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadedUrl && (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span>✓ File uploaded successfully</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );
};
