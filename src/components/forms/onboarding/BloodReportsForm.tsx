"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import type { AssessmentData, BloodReportsData, BloodReportFile } from "@/types/onboarding";

interface BloodReportsFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  applicationId?: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function BloodReportsForm({
  data,
  onSave,
  onNext,
  applicationId,
}: BloodReportsFormProps) {
  const initialData: BloodReportsData = data.bloodReports || {
    hasRecentReports: false,
    reportDate: "",
    labName: "",
    uploadedReports: [],
  };

  // Ensure uploadedReports is always an array (for backward compatibility)
  if (!Array.isArray(initialData.uploadedReports)) {
    initialData.uploadedReports = [];
  }

  const [formData, setFormData] = useState<BloodReportsData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);

    // Check max files
    const totalFiles = formData.uploadedReports.length + files.length;
    if (totalFiles > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed. You already have ${formData.uploadedReports.length} file(s).`);
      return;
    }

    setIsUploading(true);

    const newReports: BloodReportFile[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setUploadError(`"${file.name}" is not a PDF file. Only PDF files are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" is too large. Maximum file size is 10MB.`);
        continue;
      }

      try {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        if (applicationId) {
          formDataUpload.append("applicationId", applicationId);
        }

        const response = await fetch("/api/upload/blood-report", {
          method: "POST",
          body: formDataUpload,
        });

        const result = await response.json();

        if (result.success) {
          newReports.push({
            url: result.url,
            path: result.path,
            filename: result.filename,
            uploadedAt: new Date().toISOString(),
            size: result.size,
          });
        } else {
          setUploadError(result.error || `Failed to upload "${file.name}"`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadError(`Failed to upload "${file.name}". Please try again.`);
      }
    }

    if (newReports.length > 0) {
      setFormData((prev) => ({
        ...prev,
        uploadedReports: [...prev.uploadedReports, ...newReports],
      }));
    }

    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeReport = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedReports: prev.uploadedReports.filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasRecentReports) {
      newErrors.hasRecentReports = "Blood reports are required. Please check the box and upload your reports.";
    } else {
      if (!formData.reportDate) {
        newErrors.reportDate = "Please enter the report date";
      }
      if (!formData.labName?.trim()) {
        newErrors.labName = "Please enter the lab name";
      }
      if (formData.uploadedReports.length === 0) {
        newErrors.uploadedReports = "Please upload at least one blood report PDF";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave("bloodReports", formData);
      onNext();
    }
  };

  return (
    <form id="form-blood_reports" onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Blood reports are required. Upload your recent blood test report PDFs (within the last 3 months).
          Your coach will review the reports and enter the values on your behalf.
        </p>
      </div>

      {/* Has Recent Reports */}
      <div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasRecentReports"
            checked={formData.hasRecentReports}
            onChange={(e) => setFormData((prev) => ({ ...prev, hasRecentReports: e.target.checked }))}
            className="w-5 h-5 rounded border-stone-300 text-brown-500 focus:ring-primary"
          />
          <label htmlFor="hasRecentReports" className="text-sm font-medium text-foreground">
            I have blood reports from the last 3 months
          </label>
        </div>
        {errors.hasRecentReports && (
          <p className="mt-2 text-sm text-red-500">{errors.hasRecentReports}</p>
        )}
      </div>

      {formData.hasRecentReports && (
        <>
          {/* Report Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Report Date
              </label>
              <input
                type="date"
                name="reportDate"
                value={formData.reportDate || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.reportDate ? "border-red-500" : "border-border"
                } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.reportDate && (
                <p className="mt-1 text-sm text-red-500">{errors.reportDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Lab Name
              </label>
              <input
                type="text"
                name="labName"
                value={formData.labName || ""}
                onChange={handleChange}
                placeholder="e.g., Dr. Lal PathLabs"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.labName ? "border-red-500" : "border-border"
                } bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.labName && (
                <p className="mt-1 text-sm text-red-500">{errors.labName}</p>
              )}
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Blood Report PDFs
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : errors.uploadedReports
                  ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF files up to 10MB each (max {MAX_FILES} files)
                  </p>
                </>
              )}
            </div>
            {errors.uploadedReports && (
              <p className="mt-2 text-sm text-red-500">{errors.uploadedReports}</p>
            )}
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Uploaded Files List */}
          {formData.uploadedReports.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Uploaded Reports ({formData.uploadedReports.length}/{MAX_FILES})
              </p>
              <div className="space-y-2">
                {formData.uploadedReports.map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {report.filename}
                        </p>
                        {report.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(report.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeReport(index);
                      }}
                      className="p-1 hover:bg-background rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!formData.hasRecentReports && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Please check the box above and upload your blood report PDFs. If you don&apos;t have
          recent reports, please get a blood test done and come back to complete your application.
        </p>
      )}
    </form>
  );
}
