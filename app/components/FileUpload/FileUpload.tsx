"use client";

import { useState, useCallback, useRef } from "react";
import { useInventory } from "@/context/InventoryContext";
import { parseFile, generateSampleData } from "@/lib/fileParser";
import styles from "./FileUpload.module.css";

interface UploadState {
  status: "idle" | "dragging" | "parsing" | "success" | "error";
  message?: string;
  count?: number;
}

export default function FileUpload() {
  const { addItems } = useInventory();
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv",
        ".xlsx",
        ".xls",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
        setUploadState({
          status: "error",
          message: "Invalid file type. Please upload a .csv or .xlsx file.",
        });
        return;
      }

      setUploadState({ status: "parsing", message: `Parsing "${file.name}"...` });

      try {
        const items = await parseFile(file);
        if (items.length === 0) {
          setUploadState({
            status: "error",
            message: "No valid rows found. Check column headers match the schema.",
          });
          return;
        }
        addItems(items);
        setUploadState({
          status: "success",
          message: `Successfully imported`,
          count: items.length,
        });
        setTimeout(() => setUploadState({ status: "idle" }), 4000);
      } catch (err) {
        setUploadState({
          status: "error",
          message: (err as Error).message || "Failed to parse file.",
        });
      }
    },
    [addItems]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setUploadState({ status: "idle" });
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const loadSampleData = useCallback(() => {
    const samples = generateSampleData();
    addItems(samples);
    setUploadState({ status: "success", message: "Sample data loaded", count: samples.length });
    setTimeout(() => setUploadState({ status: "idle" }), 3000);
  }, [addItems]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div>
          <h2 className={styles.headerTitle}>Data Ingestion</h2>
          <p className={styles.headerSubtitle}>Upload inventory files to populate your database</p>
        </div>
      </div>

      <div className={styles.schemaInfo}>
        <span className={styles.schemaTitle}>Expected Schema:</span>
        {["SKU_ID", "Product_Name", "Category", "Stock_Level", "Price", "Barcode_Value"].map((col) => (
          <span key={col} className={styles.schemaTag}>{col}</span>
        ))}
      </div>

      <div
        id="file-drop-zone"
        className={`${styles.dropZone} ${styles[uploadState.status]}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setUploadState((s) => ({ ...s, status: "dragging" })); }}
        onDragLeave={() => setUploadState((s) => s.status === "dragging" ? { status: "idle" } : s)}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone"
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className={styles.hiddenInput}
          id="file-input"
        />

        {uploadState.status === "parsing" ? (
          <div className={styles.parsingState}>
            <div className={styles.spinner} />
            <span className={styles.parsingText}>{uploadState.message}</span>
          </div>
        ) : uploadState.status === "success" ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className={styles.successText}>{uploadState.message}</p>
            <p className={styles.successCount}>{uploadState.count} items imported</p>
          </div>
        ) : uploadState.status === "error" ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className={styles.errorText}>{uploadState.message}</p>
            <p className={styles.errorRetry}>Click to try again</p>
          </div>
        ) : (
          <div className={styles.idleState}>
            <div className={`${styles.uploadIcon} ${uploadState.status === "dragging" ? styles.draggingIcon : ""}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className={styles.dropText}>
              {uploadState.status === "dragging" ? "Drop your file here!" : "Drag & drop your file here"}
            </p>
            <p className={styles.dropSubtext}>or click to browse files</p>
            <div className={styles.supportedFormats}>
              <span className={styles.formatBadge}>CSV</span>
              <span className={styles.formatBadge}>XLSX</span>
              <span className={styles.formatBadge}>XLS</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button
        id="load-sample-data"
        className={styles.sampleButton}
        onClick={loadSampleData}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Load Sample Data (12 products)
      </button>

      <div className={styles.instructions}>
        <h3 className={styles.instructionTitle}>File Format Guidelines</h3>
        <ul className={styles.instructionList}>
          <li>First row must contain column headers</li>
          <li>Column names are case-insensitive (e.g., "SKU_ID", "sku id", "SKUID" all work)</li>
          <li>Duplicate SKU_IDs will update existing records</li>
          <li>Missing Price or Stock_Level defaults to 0</li>
        </ul>
      </div>
    </div>
  );
}
