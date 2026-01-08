"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Link2,
  FileVideo,
  X,
} from "lucide-react";

interface MagicLinkInputProps {
  onJobCreated?: (jobId: string) => void;
}

type SubmitState = "idle" | "loading" | "success" | "error";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function MagicLinkInput({ onJobCreated }: MagicLinkInputProps) {
  // URL Input State
  const [url, setUrl] = useState("");
  const [urlState, setUrlState] = useState<SubmitState>("idle");
  const [urlMessage, setUrlMessage] = useState("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileState, setFileState] = useState<SubmitState>("idle");
  const [fileMessage, setFileMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // URL Submit Handler
  // ============================================================================
  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!url.trim()) {
        setUrlState("error");
        setUrlMessage("Please enter a URL");
        return;
      }

      setUrlState("loading");
      setUrlMessage("Analyzing video...");

      try {
        const response = await fetch("/api/upload/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process URL");
        }

        setUrlState("success");
        setUrlMessage(`Job created: ${data.jobId}`);

        if (onJobCreated) {
          onJobCreated(data.jobId);
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setUrlState("idle");
          setUrl("");
          setUrlMessage("");
        }, 3000);
      } catch (error) {
        setUrlState("error");
        setUrlMessage(error instanceof Error ? error.message : "Unknown error");

        setTimeout(() => {
          setUrlState("idle");
          setUrlMessage("");
        }, 5000);
      }
    },
    [url, onJobCreated]
  );

  // ============================================================================
  // File Upload Handlers
  // ============================================================================
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["mp4", "mov", "webm"].includes(ext || "")) {
        return "Invalid file type. Allowed: MP4, MOV, WebM";
      }
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setFileState("error");
      setFileMessage(error);
      setTimeout(() => {
        setFileState("idle");
        setFileMessage("");
      }, 5000);
      return;
    }

    setFile(selectedFile);
    setFileState("idle");
    setFileMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearFile = () => {
    setFile(null);
    setFileState("idle");
    setFileMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setFileState("loading");
    setFileMessage("Uploading video...");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
            if (progress < 100) {
              setFileMessage(`Uploading... ${progress}%`);
            } else {
              setFileMessage("Processing video...");
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", "/api/upload/file");
        xhr.send(formData);
      });

      const data = await uploadPromise;

      setFileState("success");
      setFileMessage(`Uploaded! Job: ${data.jobId}`);
      setUploadProgress(100);

      if (onJobCreated) {
        onJobCreated(data.jobId);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        clearFile();
      }, 3000);
    } catch (error) {
      setFileState("error");
      setFileMessage(error instanceof Error ? error.message : "Upload failed");
      setUploadProgress(0);

      setTimeout(() => {
        setFileState("idle");
        setFileMessage("");
      }, 5000);
    }
  };

  // ============================================================================
  // UI Helpers
  // ============================================================================
  const getUrlIcon = () => {
    switch (urlState) {
      case "loading":
        return <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />;
      default:
        return <Link2 className="w-5 h-5 text-industrial-dark/50" strokeWidth={1.5} />;
    }
  };

  const getUrlButtonText = () => {
    switch (urlState) {
      case "loading":
        return "Processing...";
      case "success":
        return "Done!";
      case "error":
        return "Try Again";
      default:
        return "Transform";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-velolume-500 mb-2">
          Add Your Video
        </h2>
        <p className="text-industrial-dark font-mono text-sm">
          Paste a URL or upload a video file directly
        </p>
      </div>

      {/* ====================================================================== */}
      {/* URL Input Section */}
      {/* ====================================================================== */}
      <form onSubmit={handleUrlSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {getUrlIcon()}
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            className={`
              magic-input pl-12 pr-36
              ${urlState === "error" ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}
              ${urlState === "success" ? "border-green-400 focus:border-green-500 focus:ring-green-500/10" : ""}
            `}
            disabled={urlState === "loading" || fileState === "loading"}
          />

          <button
            type="submit"
            disabled={urlState === "loading" || urlState === "success" || fileState === "loading"}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center gap-2 px-4 py-2
              font-mono text-sm uppercase tracking-wider
              transition-all duration-200
              ${urlState === "success"
                ? "bg-green-600 text-white"
                : urlState === "error"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-velolume-500 text-ivory-100 hover:bg-velolume-400"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {urlState === "idle" && <Upload className="w-4 h-4" strokeWidth={1.5} />}
            {getUrlButtonText()}
          </button>
        </div>

        {urlMessage && (
          <p
            className={`
            mt-3 font-mono text-sm text-center
            ${urlState === "error" ? "text-red-500" : ""}
            ${urlState === "success" ? "text-green-600" : ""}
            ${urlState === "loading" ? "text-industrial-dark animate-pulse-soft" : ""}
          `}
          >
            {urlMessage}
          </p>
        )}
      </form>

      {/* Supported Platforms */}
      <div className="mt-4 flex justify-center gap-6">
        {["TikTok", "Instagram", "YouTube", "Xiaohongshu"].map((platform) => (
          <span
            key={platform}
            className="text-industrial-dark/50 font-mono text-xs uppercase tracking-wider"
          >
            {platform}
          </span>
        ))}
      </div>

      {/* ====================================================================== */}
      {/* OR Divider */}
      {/* ====================================================================== */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-industrial-grey"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-industrial-dark font-mono text-sm uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* File Upload Section */}
      {/* ====================================================================== */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-200 cursor-pointer
          ${isDragOver
            ? "border-velolume-500 bg-velolume-500/5"
            : file
              ? "border-green-400 bg-green-50"
              : "border-industrial-grey hover:border-velolume-400 hover:bg-velolume-500/5"
          }
          ${fileState === "error" ? "border-red-400 bg-red-50" : ""}
        `}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          // File Selected State
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileVideo className="w-8 h-8 text-green-600" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-mono text-sm text-velolume-500 truncate max-w-xs">
                  {file.name}
                </p>
                <p className="font-mono text-xs text-industrial-dark">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {fileState === "idle" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-1 hover:bg-industrial-grey/50 rounded"
                >
                  <X className="w-4 h-4 text-industrial-dark" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {fileState === "loading" && (
              <div className="w-full bg-industrial-grey rounded-full h-2 overflow-hidden">
                <div
                  className="bg-velolume-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Upload Button */}
            {fileState === "idle" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileUpload();
                }}
                className="flex items-center gap-2 px-6 py-2 mx-auto bg-velolume-500 text-ivory-100 font-mono text-sm uppercase tracking-wider hover:bg-velolume-400 transition-colors"
              >
                <Upload className="w-4 h-4" strokeWidth={1.5} />
                Upload & Process
              </button>
            )}

            {/* Status Icons */}
            {fileState === "loading" && (
              <div className="flex items-center justify-center gap-2 text-velolume-500">
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                <span className="font-mono text-sm">{fileMessage}</span>
              </div>
            )}

            {fileState === "success" && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-mono text-sm">{fileMessage}</span>
              </div>
            )}

            {fileState === "error" && (
              <div className="flex items-center justify-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-mono text-sm">{fileMessage}</span>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-velolume-500/10 flex items-center justify-center">
                <FileVideo
                  className={`w-6 h-6 ${isDragOver ? "text-velolume-500" : "text-industrial-dark/50"}`}
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <div>
              <p className="font-mono text-sm text-velolume-500">
                {isDragOver ? "Drop your video here" : "Drag & drop a video file"}
              </p>
              <p className="font-mono text-xs text-industrial-dark mt-1">
                or click to browse
              </p>
            </div>
            <p className="font-mono text-xs text-industrial-dark/50">
              MP4, MOV, WebM up to {MAX_SIZE_MB}MB
            </p>
          </div>
        )}
      </div>

      {/* File Upload Error Message (when no file selected) */}
      {!file && fileMessage && fileState === "error" && (
        <p className="mt-3 font-mono text-sm text-center text-red-500">
          {fileMessage}
        </p>
      )}
    </div>
  );
}
