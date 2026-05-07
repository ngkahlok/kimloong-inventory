"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { InventoryItem } from "@/types/inventory";
import styles from "./BarcodeModal.module.css";

interface BarcodeModalProps {
  items: InventoryItem[];
  onClose: () => void;
}

type PrintStatus = "preparing" | "ready" | "printing" | "done";

export default function BarcodeModal({ items, onClose }: BarcodeModalProps) {
  const [printStatus, setPrintStatus] = useState<PrintStatus>("preparing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [barcodeErrors, setBarcodeErrors] = useState<Record<string, boolean>>({});
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateBarcodes = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const JsBarcode = (await import("jsbarcode")).default;
      const newErrors: Record<string, boolean> = {};

      for (let i = 0; i < items.length; i++) {
        const canvas = canvasRefs.current[i];
        const item = items[i];
        if (!canvas) continue;

        try {
          // Try Code128 first (accepts any alphanumeric)
          JsBarcode(canvas, item.Barcode_Value || item.SKU_ID, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 11,
            margin: 4,
            textMargin: 4,
            background: "#ffffff",
            lineColor: "#000000",
          });
        } catch {
          // Fallback to just displaying the value
          newErrors[item.id] = true;
        }
      }

      setBarcodeErrors(newErrors);
      setPrintStatus("ready");
    } catch (err) {
      console.error("Barcode generation failed:", err);
      setPrintStatus("ready");
    }
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateBarcodes();
    }, 400);
    return () => clearTimeout(timer);
  }, [generateBarcodes]);

  const handlePrint = useCallback(async () => {
    setPrintStatus("printing");

    try {
      const JsBarcode = (await import("jsbarcode")).default;

      // Build print HTML
      const labels = items.map((item) => {
        const tempCanvas = document.createElement("canvas");
        let barcodeDataUrl = "";
        try {
          JsBarcode(tempCanvas, item.Barcode_Value || item.SKU_ID, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 11,
            margin: 4,
            textMargin: 4,
            background: "#ffffff",
            lineColor: "#000000",
          });
          barcodeDataUrl = tempCanvas.toDataURL("image/png");
        } catch {
          barcodeDataUrl = "";
        }

        return `
          <div class="label">
            <div class="product-name">${escapeHtml(item.Product_Name)}</div>
            <div class="sku-id">${escapeHtml(item.SKU_ID)}</div>
            ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="barcode" class="barcode-img" />` : `<div class="barcode-fallback">${escapeHtml(item.Barcode_Value)}</div>`}
            <div class="price">$${item.Price.toFixed(2)}</div>
          </div>
        `;
      }).join("");

      const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Barcode Labels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: 50mm 30mm;
      margin: 0;
    }
    body {
      font-family: -apple-system, Arial, sans-serif;
      background: white;
    }
    .label {
      width: 50mm;
      height: 30mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2mm 3mm;
      page-break-after: always;
      overflow: hidden;
    }
    .label:last-child {
      page-break-after: auto;
    }
    .product-name {
      font-size: 7pt;
      font-weight: 700;
      text-align: center;
      color: #000;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sku-id {
      font-size: 5.5pt;
      color: #555;
      margin-top: 0.5mm;
      font-family: monospace;
    }
    .barcode-img {
      max-width: 44mm;
      height: auto;
      max-height: 14mm;
      margin: 1mm 0;
    }
    .barcode-fallback {
      font-family: monospace;
      font-size: 6pt;
      letter-spacing: 1px;
      margin: 2mm 0;
      color: #000;
    }
    .price {
      font-size: 7pt;
      font-weight: 700;
      color: #000;
    }
  </style>
</head>
<body>${labels}</body>
</html>`;

      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      iframeDoc.open();
      iframeDoc.write(printHTML);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setPrintStatus("done");
        setTimeout(() => setPrintStatus("ready"), 2000);
      }, 500);

    } catch (err) {
      console.error("Print failed:", err);
      setPrintStatus("ready");
    }
  }, [items]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isSingle = items.length === 1;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Barcode Print Modal">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
                <path d="M17 5v14" /><path d="M21 5v14" />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>
                {isSingle ? "Print Barcode Label" : `Print ${items.length} Labels`}
              </h2>
              <p className={styles.headerSubtitle}>50mm × 30mm thermal label format</p>
            </div>
          </div>
          <button id="close-modal-btn" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Status Bar */}
        <div className={`${styles.statusBar} ${styles[`status_${printStatus}`]}`}>
          {printStatus === "preparing" && (
            <>
              <div className={styles.statusSpinner} />
              <span>Preparing Label{items.length > 1 ? "s" : ""}...</span>
            </>
          )}
          {printStatus === "ready" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" />
              </svg>
              <span>Ready to print — {items.length} label{items.length > 1 ? "s" : ""}</span>
            </>
          )}
          {printStatus === "printing" && (
            <>
              <div className={styles.statusSpinner} />
              <span>Sending to printer...</span>
            </>
          )}
          {printStatus === "done" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Print job sent successfully!</span>
            </>
          )}
        </div>

        {/* Label Preview Area */}
        <div className={styles.previewArea}>
          {items.length > 1 && (
            <div className={styles.previewNav}>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                ‹ Prev
              </button>
              <span className={styles.navCount}>{currentIndex + 1} / {items.length}</span>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
                disabled={currentIndex === items.length - 1}
              >
                Next ›
              </button>
            </div>
          )}

          <div className={styles.labelPreview}>
            {/* Physical label simulation */}
            <div className={styles.labelFrame}>
              {printStatus === "preparing" ? (
                <div className={styles.labelLoading}>
                  <div className={styles.labelSpinner} />
                  <span>Generating barcode...</span>
                </div>
              ) : (
                <>
                  <p className={styles.labelProductName}>{items[currentIndex]?.Product_Name}</p>
                  <p className={styles.labelSkuId}>{items[currentIndex]?.SKU_ID}</p>

                  {barcodeErrors[items[currentIndex]?.id] ? (
                    <div className={styles.barcodeFallback}>
                      <div className={styles.barcodeLines}>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className={styles.barcodeLine} style={{ height: `${30 + Math.random() * 20}px`, width: `${1 + Math.floor(Math.random() * 2)}px` }} />
                        ))}
                      </div>
                      <span className={styles.barcodeText}>{items[currentIndex]?.Barcode_Value}</span>
                    </div>
                  ) : (
                    <canvas
                      ref={(el) => { canvasRefs.current[currentIndex] = el; }}
                      className={styles.barcodeCanvas}
                    />
                  )}

                  {/* Hidden canvases for all items */}
                  {items.map((_, i) => (
                    i !== currentIndex && (
                      <canvas
                        key={i}
                        ref={(el) => { canvasRefs.current[i] = el; }}
                        style={{ display: "none" }}
                      />
                    )
                  ))}

                  <p className={styles.labelPrice}>${items[currentIndex]?.Price.toFixed(2)}</p>
                </>
              )}
            </div>

            <div className={styles.labelDimensions}>
              <span>50mm × 30mm</span>
              <span>Thermal Label</span>
            </div>
          </div>
        </div>

        {/* Item list for bulk */}
        {items.length > 1 && (
          <div className={styles.itemList}>
            <p className={styles.itemListTitle}>Items to print ({items.length})</p>
            <div className={styles.itemListScroll}>
              {items.map((item, i) => (
                <button
                  key={item.id}
                  className={`${styles.itemChip} ${i === currentIndex ? styles.itemChipActive : ""}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  <span className={styles.itemChipSku}>{item.SKU_ID}</span>
                  <span className={styles.itemChipName}>{item.Product_Name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button id="cancel-print-btn" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            id="confirm-print-btn"
            className={styles.printBtn}
            onClick={handlePrint}
            disabled={printStatus === "preparing" || printStatus === "printing"}
          >
            {printStatus === "preparing" && (
              <>
                <div className={styles.btnSpinner} />
                Preparing...
              </>
            )}
            {printStatus === "ready" && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print {items.length > 1 ? `${items.length} Labels` : "Label"}
              </>
            )}
            {printStatus === "printing" && (
              <>
                <div className={styles.btnSpinner} />
                Printing...
              </>
            )}
            {printStatus === "done" && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Print Again
              </>
            )}
          </button>
        </div>

        {/* Hidden print iframe */}
        <iframe
          ref={iframeRef}
          className={styles.printIframe}
          title="print-frame"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
