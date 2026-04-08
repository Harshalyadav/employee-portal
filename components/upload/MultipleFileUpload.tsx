"use client";

import { useUploadMultipleFiles } from "@/hooks/query/upload.hook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useCallback } from "react";
import Image from "next/image";
import { X, Loader2, Upload as UploadIcon } from "lucide-react";
import { UploadedFile } from "@/types/upload.type";
import { isValidSrc } from "@/lib";
import { useDropzone } from "react-dropzone";

interface MultipleFileUploadProps {
  folder: string;
  accept?: string;
  label?: string;
  maxFiles?: number;
  onUploadSuccess?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  showPreview?: boolean;
}

export const MultipleFileUpload: React.FC<MultipleFileUploadProps> = ({
  folder,
  accept = "image/*",
  label = "Upload Images",
  maxFiles = 10,
  onUploadSuccess,
  onUploadError,
  showPreview = true,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { mutate: uploadFiles, isPending } = useUploadMultipleFiles();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const totalFiles = selectedFiles.length + acceptedFiles.length;

      if (totalFiles > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);

      // Create preview URLs
      if (showPreview) {
        acceptedFiles.forEach((file) => {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewUrls((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
          }
        });
      }
    },
    [selectedFiles, maxFiles, showPreview],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: maxFiles - selectedFiles.length,
    disabled: isPending || uploadedFiles.length > 0,
  });

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    uploadFiles(
      { files: selectedFiles, folder },
      {
        onSuccess: (response) => {
          console.log("Upload response:", response);
          setUploadedFiles(response);
          onUploadSuccess?.(response);
        },
        onError: (error) => {
          onUploadError?.(error);
        },
      },
    );
  };

  const handleRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadedFiles([]);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Preview Grid */}
      {showPreview && previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square border rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={isValidSrc(url) ? url : "/images/logo.svg"}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/logo.svg";
                }}
              />
              {uploadedFiles.length === 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {uploadedFiles.length === 0 && (
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
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm font-medium">Drop images here...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Up to {maxFiles} images, JPEG, PNG, GIF, or WebP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && uploadedFiles.length === 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedFiles.length} file(s) selected
            {selectedFiles.length > 0 && (
              <span className="ml-2">
                (
                {(
                  selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024
                ).toFixed(2)}{" "}
                KB total)
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(selectedFiles.length - 1)}
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
                  Upload ({selectedFiles.length})
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span>✓ {uploadedFiles.length} file(s) uploaded successfully</span>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Upload More
          </Button>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Uploaded Files:</Label>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground truncate p-2 bg-muted rounded"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {file.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
