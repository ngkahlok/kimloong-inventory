"use client";

import { useInventory } from "@/context/InventoryContext";
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
  // Calculate total value as sum of Price (Inventory doesn't have stock levels in the new schema)
  const totalValue = items.reduce((sum, item) => sum + (item.Price || 0), 0);

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
