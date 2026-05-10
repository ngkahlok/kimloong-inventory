import { InventoryItem } from "@/types/inventory";

function generateBarcodeDataUrl(value: string, canvasEl: HTMLCanvasElement): string {
  try {
    // JsBarcode is imported dynamically, so this is called after it's loaded
    return canvasEl.toDataURL("image/png");
  } catch {
    return "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Groups items by Category and renders them into a print-ready A4 HTML document.
 * Layout: 2 columns, each label 95mm × 38mm, new page per category.
 */
export async function exportAllBarcodesA4(
  items: InventoryItem[],
  iframeEl: HTMLIFrameElement
): Promise<void> {
  const JsBarcode = (await import("jsbarcode")).default;

  // Group by category, sorted alphabetically
  const grouped = new Map<string, InventoryItem[]>();
  for (const item of items) {
    const cat = item.Category || "Uncategorized";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  // Sort categories
  const sortedCategories = Array.from(grouped.keys()).sort();

  // Pre-render all barcodes to canvas → base64 PNG
  const barcodeMap = new Map<string, string>();
  const tempCanvas = document.createElement("canvas");

  for (const item of items) {
    try {
      JsBarcode(tempCanvas, item["Item Code"] || String(item.ID), {
        format: "CODE128",
        width: 2,
        height: 56,
        displayValue: true,
        fontSize: 11,
        margin: 4,
        textMargin: 3,
        background: "#ffffff",
        lineColor: "#000000",
      });
      barcodeMap.set(String(item.ID), tempCanvas.toDataURL("image/png"));
    } catch {
      // If barcode generation fails (e.g. EAN requires specific length), skip image
      barcodeMap.set(String(item.ID), "");
    }
  }

  // Build label HTML for a single item
  function renderLabel(item: InventoryItem): string {
    const barcodeImg = barcodeMap.get(String(item.ID)) ?? "";
    const barcodeEl = barcodeImg
      ? `<img src="${barcodeImg}" alt="barcode" class="barcode-img" />`
      : `<div class="barcode-text-fallback">${escapeHtml(item["Item Code"] || String(item.ID))}</div>`;

    return `
      <div class="label">
        <div class="label-name">${escapeHtml(item.Item || "")}</div>
        <div class="label-sku">${escapeHtml(item["Item Code"] || "")}</div>
        ${barcodeEl}
        <div class="label-price">MYR ${item.Price?.toFixed(2) ?? "0.00"}</div>
      </div>
    `;
  }

  // Build pages: chunk items by category, then chunk category items into pages of 6 rows (12 items)
  const pagesHtml: string[] = [];

  for (const cat of sortedCategories) {
    const catItems = grouped.get(cat)!;
    const ITEMS_PER_PAGE = 12; // 6 rows * 2 columns

    for (let i = 0; i < catItems.length; i += ITEMS_PER_PAGE) {
      const pageItems = catItems.slice(i, i + ITEMS_PER_PAGE);

      // Pair items into rows of 2
      const rows: InventoryItem[][] = [];
      for (let j = 0; j < pageItems.length; j += 2) {
        rows.push(pageItems.slice(j, j + 2));
      }

      const rowsHtml = rows
        .map(
          (row) => `
          <div class="row">
            ${row.map(renderLabel).join("")}
            ${row.length === 1 ? `<div class="label label-empty"></div>` : ""}
          </div>
        `
        )
        .join("");

      const isFirstOfCategory = i === 0;
      const isLastOfAll = cat === sortedCategories[sortedCategories.length - 1] && (i + ITEMS_PER_PAGE >= catItems.length);
      const pageNum = Math.floor(i / ITEMS_PER_PAGE) + 1;
      const totalPageForCat = Math.ceil(catItems.length / ITEMS_PER_PAGE);

      pagesHtml.push(`
        <div class="page${isLastOfAll ? "" : " page-break"}">
          <div class="page-header">
            <div class="page-header-category">${escapeHtml(cat)} ${totalPageForCat > 1 ? `<span style="font-size: 0.7em; font-weight: normal;">(Part ${pageNum}/${totalPageForCat})</span>` : ""}</div>
            <div class="page-header-count">${pageItems.length} label${pageItems.length !== 1 ? "s" : ""} on this page</div>
          </div>
          <div class="labels-grid">${rowsHtml}</div>
        </div>
      `);
    }
  }

  const totalItems = items.length;
  const totalCategories = sortedCategories.length;
  const printDate = new Date().toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Inventory Barcodes — ${printDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 portrait;
      margin: 10mm 8mm;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: white;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page container ── */
    .page {
      width: 100%;
      min-height: 277mm; /* A4 height minus margins */
      display: flex;
      flex-direction: column;
    }

    .page-break {
      page-break-after: always;
    }

    /* ── Category header ── */
    .page-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 3mm 2mm 3mm 2mm;
      border-bottom: 2px solid #1e3a5f;
      margin-bottom: 4mm;
    }

    .page-header-category {
      font-size: 14pt;
      font-weight: 800;
      color: #1e3a5f;
      letter-spacing: -0.02em;
    }

    .page-header-count {
      font-size: 9pt;
      color: #666;
      font-weight: 500;
    }

    /* ── Grid layout ── */
    .labels-grid {
      display: flex;
      flex-direction: column;
      gap: 3mm;
    }

    .row {
      display: flex;
      gap: 4mm;
    }

    /* ── Individual label ── */
    .label {
      flex: 1;
      height: 38mm; /* Fixed height for 6 rows per page */
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 2.5mm 3mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.8mm;
      min-height: 36mm;
      max-height: 42mm;
      overflow: hidden;
      background: #fff;
    }

    .label-empty {
      border: 1px dashed #ddd;
      background: #fafafa;
    }

    .label-name {
      font-size: 8.5pt;
      font-weight: 700;
      text-align: center;
      color: #111;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label-sku {
      font-size: 7pt;
      color: #555;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }

    .barcode-img {
      max-width: 85mm;
      width: 100%;
      height: auto;
      max-height: 18mm;
      object-fit: contain;
    }

    .barcode-text-fallback {
      font-family: 'Courier New', monospace;
      font-size: 7pt;
      letter-spacing: 1.5px;
      padding: 3mm 0;
      color: #000;
    }

    .label-price {
      font-size: 8.5pt;
      font-weight: 800;
      color: #000;
    }

    /* ── Footer ── */
    @page {
      @bottom-center {
        content: "InvenTrack — Printed ${printDate} — ${totalItems} items across ${totalCategories} categories";
        font-size: 7pt;
        color: #999;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml.join("")}
</body>
</html>`;

  const iframeDoc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
  if (!iframeDoc) throw new Error("Cannot access print iframe");

  iframeDoc.open();
  iframeDoc.write(printHTML);
  iframeDoc.close();

  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  iframeEl.contentWindow?.focus();
  iframeEl.contentWindow?.print();
}
