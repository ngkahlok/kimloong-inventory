"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { InventoryItem, FilterState, StockStatus, getStockStatus } from "@/types/inventory";
import { createClient } from "@/utils/supabase/client";

interface InventoryContextType {
  items: InventoryItem[];
  isLoading: boolean;
  refreshItems: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilterState] = useState<FilterState>({
    search: "",
    category: "all",
    stockStatus: "all",
  });

  const supabase = createClient();

  const refreshItems = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching items from Supabase...");
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("SKU_ID", { ascending: true });

      if (error) {
        console.error("Supabase Error:", error.message, error.details, error.hint);
        throw error;
      }

      console.log("Data received:", data);
      setItemsState((data || []).map(item => ({ ...item, selected: false })));
    } catch (error) {
      console.error("Critical error in refreshItems:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const setItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState(newItems.map((item) => ({ ...item, selected: false })));
  }, []);

  const addItems = useCallback(async (newItems: InventoryItem[]) => {
    try {
      // 1. Prepare data for Supabase (remove the 'selected' UI state)
      const itemsToUpload = newItems.map(({ selected, ...rest }) => rest);

      const { error } = await supabase
        .from("inventory")
        .upsert(itemsToUpload, { onConflict: "SKU_ID" });

      if (error) throw error;

      // 2. Refresh local state from DB to ensure sync
      await refreshItems();
    } catch (error) {
      console.error("Error adding items to Supabase:", error);
      alert("Failed to save items to database.");
    }
  }, [supabase, refreshItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    try {
      // Remove selected from updates if it exists
      const { selected, ...dbUpdates } = updates as any;

      const { error } = await supabase
        .from("inventory")
        .update(dbUpdates)
        .eq("SKU_ID", id);

      if (error) throw error;

      await refreshItems();
    } catch (error) {
      console.error("Error updating item in Supabase:", error);
    }
  }, [supabase, refreshItems]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("SKU_ID", id);

      if (error) throw error;

      await refreshItems();
    } catch (error) {
      console.error("Error deleting item from Supabase:", error);
    }
  }, [supabase, refreshItems]);

  const toggleSelect = useCallback((id: string) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.SKU_ID === id ? { ...item, selected: !item.selected } : item
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
      String(item.SKU_ID || "").toLowerCase().includes(searchLower) ||
      String(item.Product_Name || "").toLowerCase().includes(searchLower) ||
      String(item.Category || "").toLowerCase().includes(searchLower) ||
      String(item.Barcode_Value || "").toLowerCase().includes(searchLower);

    const matchesCategory =
      filter.category === "all" || item.Category === filter.category;

    const stockStatus = getStockStatus(item.Stock_Level);
    const matchesStock =
      filter.stockStatus === "all" || stockStatus === filter.stockStatus;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const selectedItems = items.filter((item) => item.selected);

  return (
    <InventoryContext.Provider
      value={{
        items,
        isLoading,
        refreshItems,
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
