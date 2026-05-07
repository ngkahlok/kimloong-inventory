"use client";

import { useInventory } from "@/context/InventoryContext";
import { getStockStatus } from "@/types/inventory";
import styles from "./Header.module.css";

interface HeaderProps {
  activeTab: string;
}

const TAB_LABELS: Record<string, string> = {
  ingestion: "Data Ingestion",
  sku: "SKU Management",
  barcode: "Barcode Generator",
};

export default function Header({ activeTab }: HeaderProps) {
  const { items } = useInventory();

  const totalItems = items.length;
  const lowStock = items.filter((i) => getStockStatus(i.Stock_Level) === "low_stock").length;
  const outOfStock = items.filter((i) => getStockStatus(i.Stock_Level) === "out_of_stock").length;
  const totalValue = items.reduce((sum, item) => sum + item.Price * item.Stock_Level, 0);

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{TAB_LABELS[activeTab] ?? "Dashboard"}</h1>
        <p className={styles.breadcrumb}>Retail Inventory Command Center / {TAB_LABELS[activeTab]}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat} id="header-total-skus">
          <span className={styles.statValue}>{totalItems.toLocaleString()}</span>
          <span className={styles.statLabel}>Total SKUs</span>
        </div>

        <div className={`${styles.stat} ${lowStock > 0 ? styles.statWarning : ""}`} id="header-low-stock">
          <span className={styles.statValue}>{lowStock}</span>
          <span className={styles.statLabel}>Low Stock</span>
        </div>

        <div className={`${styles.stat} ${outOfStock > 0 ? styles.statDanger : ""}`} id="header-out-of-stock">
          <span className={styles.statValue}>{outOfStock}</span>
          <span className={styles.statLabel}>Out of Stock</span>
        </div>

        <div className={styles.stat} id="header-inventory-value">
          <span className={styles.statValue}>
            MYR {totalValue >= 1000
              ? (totalValue / 1000).toFixed(1) + "k"
              : totalValue.toFixed(0)}
          </span>
          <span className={styles.statLabel}>Inventory Value</span>
        </div>
      </div>
    </header>
  );
}
