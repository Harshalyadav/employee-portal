"use client";

import { useUploadSingleVideo } from "@/hooks/query/upload.hook";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useRef, useCallback } from "react";
import { X, Loader2, Video } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface VideoUploadProps {
  folder: string;
  accept?: string;
  label?: string;
  onUploadSuccess?: (url: string, key: string) => void;
  onUploadError?: (error: Error) => void;
  defaultValue?: string;
  showPreview?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  folder,
  accept = "video/*",
  label = "Upload Video",
  onUploadSuccess,
  onUploadError,
  defaultValue,
  showPreview = true,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultValue || null,
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    defaultValue || null,
  );

  const { mutate: uploadVideo, isPending } = useUploadSingleVideo();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);

        // Create preview URL for video
        if (showPreview && file.type.startsWith("video/")) {
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
        }
      }
    },
    [showPreview],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".webm", ".ogg", ".mov", ".avi"],
    },
    maxFiles: 1,
    disabled: isPending || !!uploadedUrl,
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadVideo(
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
    if (previewUrl && !defaultValue) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(defaultValue || null);
    setUploadedUrl(defaultValue || null);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Preview */}
      {showPreview && previewUrl && (
        <div className="relative w-full border rounded-lg overflow-hidden bg-muted">
          <video src={previewUrl} controls className="w-full h-auto max-h-96">
            Your browser does not support the video tag.
          </video>
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
      {!uploadedUrl && (
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
            <Video className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm font-medium">Drop video here...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop video here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, OGG, MOV, or AVI
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadedUrl && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {selectedFile.name} (
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
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
                "Upload"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadedUrl && (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span>✓ Video uploaded successfully</span>
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
