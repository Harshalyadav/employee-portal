"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose?: () => void;
}

export function ErrorAlert({
  isOpen = false,
  title = "Error",
  message,
  onClose,
}: ErrorAlertProps) {
  if (!isOpen) return null;

  return (
    <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-lg text-red-600 dark:text-red-400">
              {title}
            </CardTitle>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      </CardContent>
    </Card>
  );
}
