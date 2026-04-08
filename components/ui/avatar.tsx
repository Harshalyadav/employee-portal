"use client";
import Image from "next/image";
import { isValidSrc } from "@/lib";

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: number; // px
  className?: string;
  fallback?: string; // initials/text fallback
};

export function Avatar({
  src,
  alt = "avatar",
  size = 32,
  className = "",
  fallback,
}: AvatarProps) {
  const dimension = { width: size, height: size };
  const validSrc = isValidSrc(src) ? src : undefined;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden border ${className}`}
      style={{ width: size, height: size }}
    >
      {validSrc ? (
        <Image
          src={validSrc}
          alt={alt}
          {...dimension}
          className="object-cover w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/logo.svg";
          }}
        />
      ) : (
        <span className="text-xs text-gray-600 bg-gray-100 w-full h-full flex items-center justify-center">
          {fallback ?? ""}
        </span>
      )}
    </div>
  );
}
