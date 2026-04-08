"use client";

import { useEffect, useState } from "react";

interface DeviceInfo {
  userAgent: string;
  os: string;
  browser: string;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  screenWidth: number;
  screenHeight: number;
  deviceMemory: number | string;
  brand?: string;
  model?: string;
}

export function useDeviceInfo(): DeviceInfo | null {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || "Unknown";
    const uaData = (navigator as any).userAgentData;

    // OS detection
    const os = /Windows/i.test(ua)
      ? "Windows"
      : /Mac/i.test(ua)
      ? "MacOS"
      : /Linux/i.test(ua)
      ? "Linux"
      : /Android/i.test(ua)
      ? "Android"
      : /iOS|iPhone|iPad/i.test(ua)
      ? "iOS"
      : "Unknown";

    // Browser detection
    const browser = /Chrome/i.test(ua)
      ? "Chrome"
      : /Safari/i.test(ua)
      ? "Safari"
      : /Firefox/i.test(ua)
      ? "Firefox"
      : /Edge/i.test(ua)
      ? "Edge"
      : "Unknown";

    // Device type
    const deviceType = /Mobi|Android/i.test(ua)
      ? "mobile"
      : /Tablet|iPad/i.test(ua)
      ? "tablet"
      : "desktop";

    // Screen info
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const deviceMemory = (navigator as any).deviceMemory || "Unknown";

    setDeviceInfo({
      userAgent: ua,
      os,
      browser,
      deviceType,
      screenWidth,
      screenHeight,
      deviceMemory,
      brand: uaData?.brands?.[0]?.brand,
      model: uaData?.mobile ? "Mobile Device" : "Desktop/Laptop",
    });
  }, []);

  return deviceInfo;
}
