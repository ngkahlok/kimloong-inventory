"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useInventory } from "@/context/InventoryContext";
import styles from "./BarcodeGenerator.module.css";

export default function BarcodeGenerator() {
  const { items } = useInventory();
  const [selectedId, setSelectedId] = useState<string>("");
  const [format, setFormat] = useState<"CODE128" | "CODE39" | "EAN13" | "UPC">("CODE128");
  const [scale, setScale] = useState<number>(2);
  const [showText, setShowText] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [customValue, setCustomValue] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId);
  const barcodeValue = useCustom ? customValue : (selectedItem?.Barcode_Value ?? "");

  const generateBarcode = useCallback(async () => {
    if (!barcodeValue.trim()) return;
    setGenerating(true);
    setGenerated(false);

    try {
      const JsBarcode = (await import("jsbarcode")).default;
      const canvas = canvasRef.current;
      if (!canvas) return;

      await new Promise((r) => setTimeout(r, 300)); // visual feedback

      JsBarcode(canvas, barcodeValue, {
        format,
        width: scale,
        height: 80,
        displayValue: showText,
        fontSize: 14,
        margin: 10,
        textMargin: 6,
        background: "#ffffff",
        lineColor: "#000000",
      });

      setGenerated(true);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [barcodeValue, format, scale, showText]);

  const downloadBarcode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${barcodeValue.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.click();
  }, [barcodeValue]);

  // Auto-generate when selection changes
  useEffect(() => {
    if (barcodeValue) {
      generateBarcode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, format, scale, showText]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
            <path d="M17 5v14" /><path d="M21 5v14" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No Items Available</h3>
        <p className={styles.emptySubtitle}>Upload inventory data or use custom value below to generate barcodes.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
            <path d="M17 5v14" /><path d="M21 5v14" />
          </svg>
        </div>
        <div>
          <h2 className={styles.headerTitle}>Barcode Generator</h2>
          <p className={styles.headerSubtitle}>Generate and download barcode images for any SKU</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Controls panel */}
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="barcode-source">Source</label>
            <div className={styles.toggleRow}>
              <button
                className={`${styles.toggleBtn} ${!useCustom ? styles.toggleActive : ""}`}
                onClick={() => setUseCustom(false)}
                id="use-inventory-btn"
              >
                From Inventory
              </button>
              <button
                className={`${styles.toggleBtn} ${useCustom ? styles.toggleActive : ""}`}
                onClick={() => setUseCustom(true)}
                id="use-custom-btn"
              >
                Custom Value
              </button>
            </div>
          </div>

          {!useCustom ? (
            <div className={styles.controlGroup}>
              <label className={styles.label} htmlFor="sku-select">Select SKU</label>
              <select
                id="sku-select"
                className={styles.select}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Choose an item —</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.SKU_ID}] {item.Product_Name}
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className={styles.skuDetails}>
                  <span className={styles.skuDetail}>
                    <span className={styles.skuDetailLabel}>Barcode:</span>
                    <span className={styles.skuDetailValue}>{selectedItem.Barcode_Value}</span>
                  </span>
                  <span className={styles.skuDetail}>
                    <span className={styles.skuDetailLabel}>Price:</span>
                    <span className={styles.skuDetailValue}>${selectedItem.Price.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.controlGroup}>
              <label className={styles.label} htmlFor="custom-value">Custom Barcode Value</label>
              <input
                id="custom-value"
                type="text"
                className={styles.input}
                placeholder="Enter barcode value..."
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateBarcode()}
              />
            </div>
          )}

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="barcode-format">Format</label>
            <select
              id="barcode-format"
              className={styles.select}
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
            >
              <option value="CODE128">Code 128 (Universal)</option>
              <option value="CODE39">Code 39 (Alphanumeric)</option>
              <option value="EAN13">EAN-13 (13 digits)</option>
              <option value="UPC">UPC (12 digits)</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="barcode-scale">
              Bar Width: {scale}px
            </label>
            <input
              id="barcode-scale"
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>Narrow</span>
              <span>Wide</span>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.checkboxLabel} htmlFor="show-text-toggle">
              <input
                id="show-text-toggle"
                type="checkbox"
                checked={showText}
                onChange={(e) => setShowText(e.target.checked)}
                className={styles.checkboxInput}
              />
              Show text below barcode
            </label>
          </div>

          <button
            id="generate-barcode-btn"
            className={styles.generateBtn}
            onClick={generateBarcode}
            disabled={!barcodeValue.trim() || generating}
          >
            {generating ? (
              <>
                <div className={styles.btnSpinner} />
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
                  <path d="M17 5v14" /><path d="M21 5v14" />
                </svg>
                Generate Barcode
              </>
            )}
          </button>

          {generated && (
            <button
              id="download-barcode-btn"
              className={styles.downloadBtn}
              onClick={downloadBarcode}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </button>
          )}
        </div>

        {/* Preview panel */}
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Preview</span>
            {selectedItem && <span className={styles.previewItem}>{selectedItem.Product_Name}</span>}
          </div>
          <div className={styles.previewCanvas}>
            {!barcodeValue && !generating ? (
              <div className={styles.previewPlaceholder}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
                  <path d="M17 5v14" /><path d="M21 5v14" />
                </svg>
                <span>Select an item or enter a value</span>
              </div>
            ) : generating ? (
              <div className={styles.previewGenerating}>
                <div className={styles.generatingSpinner} />
                <span>Generating barcode...</span>
              </div>
            ) : null}
            <canvas
              ref={canvasRef}
              className={`${styles.canvas} ${!generated || generating ? styles.canvasHidden : ""}`}
              id="barcode-canvas"
            />
          </div>
          <div className={styles.previewMeta}>
            <span>Format: <strong>{format}</strong></span>
            <span>Value: <strong className={styles.monoText}>{barcodeValue || "—"}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
