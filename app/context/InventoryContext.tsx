"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { InventoryItem, FilterState, StockStatus, getStockStatus } from "@/types/inventory";

interface InventoryContextType {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  addItems: (newItems: InventoryItem[]) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  selectedItems: InventoryItem[];
  filter: FilterState;
  setFilter: (filter: Partial<FilterState>) => void;
  filteredItems: InventoryItem[];
  categories: string[];
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<InventoryItem[]>([]);
  const [filter, setFilterState] = useState<FilterState>({
    search: "",
    category: "all",
    stockStatus: "all",
  });

  const setItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState(newItems.map((item) => ({ ...item, selected: false })));
  }, []);

  const addItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState((prev) => {
      const existingIds = new Set(prev.map((i) => i.SKU_ID));
      const merged = [...prev];
      for (const item of newItems) {
        if (existingIds.has(item.SKU_ID)) {
          // Update existing
          const idx = merged.findIndex((i) => i.SKU_ID === item.SKU_ID);
          if (idx !== -1) merged[idx] = { ...merged[idx], ...item };
        } else {
          merged.push({ ...item, selected: false });
        }
      }
      return merged;
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItemsState((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setItemsState((prev) => {
      const allSelected = prev.every((item) => item.selected);
      return prev.map((item) => ({ ...item, selected: !allSelected }));
    });
  }, []);

  const setFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.Category).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const searchLower = filter.search.toLowerCase();
    const matchesSearch =
      !filter.search ||
      item.SKU_ID.toLowerCase().includes(searchLower) ||
      item.Product_Name.toLowerCase().includes(searchLower) ||
      item.Category.toLowerCase().includes(searchLower) ||
      item.Barcode_Value.toLowerCase().includes(searchLower);

    const matchesCategory =
      filter.category === "all" || item.Category === filter.category;

    const stockStatus = getStockStatus(item.Stock_Level);
    const matchesStock =
      filter.stockStatus === "all" || stockStatus === filter.stockStatus;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const selectedItems = items.filter((i) => i.selected);

  return (
    <InventoryContext.Provider
      value={{
        items,
        setItems,
        addItems,
        updateItem,
        deleteItem,
        toggleSelect,
        toggleSelectAll,
        selectedItems,
        filter,
        setFilter,
        filteredItems,
        categories,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
