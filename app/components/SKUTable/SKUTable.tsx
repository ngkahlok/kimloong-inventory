"use client";

import { useState, useCallback, useRef } from "react";
import { useInventory } from "@/context/InventoryContext";
import { InventoryItem, getStockStatus, STOCK_THRESHOLDS } from "@/types/inventory";
import { exportToCSV } from "@/lib/fileParser";
import { exportAllBarcodesA4 } from "@/lib/barcodeExport";
import styles from "./SKUTable.module.css";

interface EditingCell {
  id: string;
  field: "Stock_Level" | "Price" | "Product_Name" | "Category";
  value: string;
}

interface SKUTableProps {
  onPrintItem: (item: InventoryItem) => void;
  onBulkPrint: (items: InventoryItem[]) => void;
}

export default function SKUTable({ onPrintItem, onBulkPrint }: SKUTableProps) {
  const {
    filteredItems,
    items,
    isLoading,
    refreshItems,
    filter,
    setFilter,
    categories,
    updateItem,
    deleteItem,
    toggleSelect,
    toggleSelectAll,
    selectedItems,
  } = useInventory();

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [exportingA4, setExportingA4] = useState<"idle" | "loading" | "done">("idle");
  const a4IframeRef = useRef<HTMLIFrameElement>(null);

  const handleExportA4 = useCallback(async () => {
    if (!a4IframeRef.current || items.length === 0) return;
    setExportingA4("loading");
    try {
      await exportAllBarcodesA4(items, a4IframeRef.current);
      setExportingA4("done");
      setTimeout(() => setExportingA4("idle"), 3000);
    } catch (err) {
      console.error("A4 export failed:", err);
      setExportingA4("idle");
    }
  }, [items]);

  const startEdit = useCallback((id: string, field: EditingCell["field"], value: string | number) => {
    setEditingCell({ id, field, value: String(value) });
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { id, field, value } = editingCell;
    let parsed: string | number = value;
    if (field === "Stock_Level") parsed = Math.max(0, Math.round(parseFloat(value) || 0));
    if (field === "Price") parsed = Math.max(0, parseFloat(value) || 0);
    updateItem(id, { [field]: parsed });
    setEditingCell(null);
  }, [editingCell, updateItem]);

  const cancelEdit = useCallback(() => setEditingCell(null), []);

  const stockStatusBadge = (level: number) => {
    const status = getStockStatus(level);
    return (
      <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
        {status === "in_stock" ? "In Stock" : status === "low_stock" ? "Low Stock" : "Out of Stock"}
      </span>
    );
  };

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => i.selected);
  const someSelected = filteredItems.some((i) => i.selected);

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.loaderSpinner} />
        <h3 className={styles.emptyTitle}>Loading Inventory...</h3>
        <p className={styles.emptySubtitle}>Connecting to Supabase database.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No Inventory Data</h3>
        <p className={styles.emptySubtitle}>Upload a file in the Data Ingestion tab to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="inventory-search"
              type="text"
              className={styles.searchInput}
              placeholder="Search SKU, name, category..."
              value={filter.search}
              onChange={(e) => setFilter({ search: e.target.value })}
            />
            {filter.search && (
              <button className={styles.searchClear} onClick={() => setFilter({ search: "" })} aria-label="Clear search">
                ×
              </button>
            )}
          </div>

          <select
            id="category-filter"
            className={styles.filterSelect}
            value={filter.category}
            onChange={(e) => setFilter({ category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            id="stock-status-filter"
            className={styles.filterSelect}
            value={filter.stockStatus}
            onChange={(e) => setFilter({ stockStatus: e.target.value as "all" | "in_stock" | "low_stock" | "out_of_stock" })}
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤{STOCK_THRESHOLDS.LOW_STOCK})</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <span className={styles.countLabel}>
            {filteredItems.length} / {items.length} items
          </span>

          {selectedItems.length > 0 && (
            <button
              id="bulk-print-btn"
              className={styles.bulkPrintBtn}
              onClick={() => onBulkPrint(selectedItems)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Bulk Print ({selectedItems.length})
            </button>
          )}

          {/* A4 Export button */}
          <button
            id="export-a4-btn"
            className={`${styles.exportA4Btn} ${exportingA4 === "loading" ? styles.exportA4Loading : exportingA4 === "done" ? styles.exportA4Done : ""}`}
            onClick={handleExportA4}
            disabled={exportingA4 === "loading" || items.length === 0}
            title="Export all barcodes to A4 — grouped by category"
          >
            {exportingA4 === "loading" ? (
              <>
                <div className={styles.btnSpinnerDark} />
                Generating...
              </>
            ) : exportingA4 === "done" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Printed!
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                Export A4
              </>
            )}
          </button>

          <button
            id="export-csv-btn"
            className={styles.exportBtn}
            onClick={() => exportToCSV(filteredItems)}
            title="Export to CSV"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  id="select-all-checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  className={styles.checkbox}
                  aria-label="Select all"
                />
              </th>
              <th>SKU ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Price (MYR)</th>
              <th>Barcode</th>
              <th className={styles.actionsCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.noResults}>
                  No items match your current filters
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.SKU_ID} className={`${styles.row} ${item.selected ? styles.rowSelected : ""}`}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      id={`select-${item.SKU_ID}`}
                      checked={!!item.selected}
                      onChange={() => toggleSelect(item.SKU_ID)}
                      className={styles.checkbox}
                      aria-label={`Select ${item.Product_Name}`}
                    />
                  </td>

                  <td>
                    <span className={styles.skuId}>{item.SKU_ID}</span>
                  </td>

                  <td>
                    {editingCell?.id === item.SKU_ID && editingCell?.field === "Product_Name" ? (
                      <input
                        autoFocus
                        className={styles.inlineInput}
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : (
                      <span
                        className={styles.editableCell}
                        onClick={() => startEdit(item.SKU_ID, "Product_Name", item.Product_Name)}
                        title="Click to edit"
                      >
                        {item.Product_Name}
                        <svg className={styles.editPencil} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </span>
                    )}
                  </td>

                  <td>
                    {editingCell?.id === item.SKU_ID && editingCell?.field === "Category" ? (
                      <input
                        autoFocus
                        className={styles.inlineInput}
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : (
                      <span
                        className={`${styles.editableCell} ${styles.categoryChip}`}
                        onClick={() => startEdit(item.SKU_ID, "Category", item.Category)}
                        title="Click to edit"
                      >
                        {item.Category}
                      </span>
                    )}
                  </td>

                  <td>
                    {editingCell?.id === item.SKU_ID && editingCell?.field === "Stock_Level" ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        className={`${styles.inlineInput} ${styles.numericInput}`}
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : (
                      <span
                        className={`${styles.editableCell} ${styles.stockValue} ${getStockStatus(item.Stock_Level) === "low_stock" ? styles.stockLow : getStockStatus(item.Stock_Level) === "out_of_stock" ? styles.stockOut : ""}`}
                        onClick={() => startEdit(item.SKU_ID, "Stock_Level", item.Stock_Level)}
                        title="Click to edit"
                      >
                        {item.Stock_Level.toLocaleString()}
                        <svg className={styles.editPencil} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </span>
                    )}
                  </td>

                  <td>{stockStatusBadge(item.Stock_Level)}</td>

                  <td>
                    {editingCell?.id === item.SKU_ID && editingCell?.field === "Price" ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${styles.inlineInput} ${styles.numericInput}`}
                        value={editingCell.value}
                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : (
                      <span
                        className={`${styles.editableCell} ${styles.priceValue}`}
                        onClick={() => startEdit(item.SKU_ID, "Price", item.Price)}
                        title="Click to edit"
                      >
                        {item.Price.toFixed(2)}
                        <svg className={styles.editPencil} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </span>
                    )}
                  </td>

                  <td>
                    <span className={styles.barcodeValue} title={item.Barcode_Value}>
                      {item.Barcode_Value}
                    </span>
                  </td>

                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <button
                        id={`print-btn-${item.SKU_ID}`}
                        className={styles.printBtn}
                        onClick={() => onPrintItem(item)}
                        title="Print barcode label"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print
                      </button>
                      <button
                        id={`delete-btn-${item.SKU_ID}`}
                        className={styles.deleteBtn}
                        onClick={() => deleteItem(item.SKU_ID)}
                        title="Delete item"
                        aria-label={`Delete ${item.Product_Name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.tableFooter}>
        <span className={styles.footerInfo}>
          Click any cell value to edit inline. Press Enter to save, Escape to cancel.
        </span>
        <span className={styles.footerStats}>
          {selectedItems.length > 0 && `${selectedItems.length} selected`}
        </span>
      </div>

      {/* Hidden iframe for A4 export printing */}
      <iframe
        ref={a4IframeRef}
        style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "210mm", height: "297mm", border: "none", opacity: 0, pointerEvents: "none" }}
        title="a4-print-frame"
        aria-hidden="true"
      />
    </div>
  );
}
