"use client";

import { useCallback, useEffect, useState } from "react";

export function usePdfPreview() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("result.pdf");

  const setPdfBlob = useCallback((blob: Blob, nextFileName: string) => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(blob);
    });
    setFileName(nextFileName);
  }, []);

  const clearPdf = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return {
    previewUrl,
    fileName,
    setPdfBlob,
    clearPdf,
  };
}
