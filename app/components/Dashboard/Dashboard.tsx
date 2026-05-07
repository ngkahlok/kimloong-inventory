"use client";

import { useState, useCallback } from "react";
import { InventoryProvider, useInventory } from "@/context/InventoryContext";
import { InventoryItem } from "@/types/inventory";
import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header/Header";
import FileUpload from "@/components/FileUpload/FileUpload";
import SKUTable from "@/components/SKUTable/SKUTable";
import BarcodeGenerator from "@/components/BarcodeGenerator/BarcodeGenerator";
import BarcodeModal from "@/components/BarcodeModal/BarcodeModal";
import styles from "./Dashboard.module.css";

// Wrapper with context + stats connected to sidebar
function DashboardWithStats() {
  const [activeTab, setActiveTab] = useState("ingestion");
  const [printItems, setPrintItems] = useState<InventoryItem[] | null>(null);

  const handlePrintItem = useCallback((item: InventoryItem) => {
    setPrintItems([item]);
  }, []);

  const handleBulkPrint = useCallback((items: InventoryItem[]) => {
    setPrintItems(items);
  }, []);

  return (
    <InventoryProvider>
      <InnerDashboard
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        printItems={printItems}
        setPrintItems={setPrintItems}
        handlePrintItem={handlePrintItem}
        handleBulkPrint={handleBulkPrint}
      />
    </InventoryProvider>
  );
}

// Inner dashboard that can access inventory context for sidebar stats
function InnerDashboard({
  activeTab,
  setActiveTab,
  printItems,
  setPrintItems,
  handlePrintItem,
  handleBulkPrint,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  printItems: InventoryItem[] | null;
  setPrintItems: (items: InventoryItem[] | null) => void;
  handlePrintItem: (item: InventoryItem) => void;
  handleBulkPrint: (items: InventoryItem[]) => void;
}) {
  const { items, selectedItems } = useInventory();

  return (
    <div className={styles.app}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemCount={items.length}
        selectedCount={selectedItems.length}
      />

      <div className={styles.main}>
        <Header activeTab={activeTab} />

        <div className={styles.content}>
          {activeTab === "ingestion" && (
            <div className={styles.tabPane}>
              <FileUpload />
            </div>
          )}

          {activeTab === "sku" && (
            <div className={`${styles.tabPane} ${styles.tabPaneFull}`}>
              <SKUTable
                onPrintItem={handlePrintItem}
                onBulkPrint={handleBulkPrint}
              />
            </div>
          )}

          {activeTab === "barcode" && (
            <div className={styles.tabPane}>
              <BarcodeGenerator />
            </div>
          )}
        </div>
      </div>

      {printItems && (
        <BarcodeModal
          items={printItems}
          onClose={() => setPrintItems(null)}
        />
      )}
    </div>
  );
}

export default DashboardWithStats;
