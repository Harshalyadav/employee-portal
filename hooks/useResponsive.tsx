"use client";

import { useState, useEffect } from "react";

// You can customize these breakpoints
const breakpoints = {
  xs: 0, // mobile portrait
  sm: 640, // small devices
  md: 768, // tablets
  lg: 1024, // laptops
  xl: 1280, // desktops
  "2xl": 1536, // large screens
};

type BreakpointKey = keyof typeof breakpoints;

export function useResponsive() {
  const [width, setWidth] = useState<number | null>(null);

  // Set width on mount + resize
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // run once on mount

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helpers
  const greaterThan = (key: BreakpointKey) => (width ?? 0) >= breakpoints[key];
  const lessThan = (key: BreakpointKey) => (width ?? 0) < breakpoints[key];
  const between = (min: BreakpointKey, max: BreakpointKey) =>
    (width ?? 0) >= breakpoints[min] && (width ?? 0) < breakpoints[max];

  // Predefined flags
  const isXs = between("xs", "sm");
  const isSm = between("sm", "md");
  const isMd = between("md", "lg");
  const isLg = between("lg", "xl");
  const isXl = between("xl", "2xl");
  const is2xl = greaterThan("2xl");

  const isMobile = width !== null && width < breakpoints.md; // <768
  const isTablet = between("md", "lg"); // 768–1023
  const isDesktop = width !== null && width >= breakpoints.lg; // >=1024

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    greaterThan,
    lessThan,
    between,
  };
}
