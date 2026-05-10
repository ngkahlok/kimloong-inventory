"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { InventoryItem, FilterState, StockStatus, getStockStatus } from "@/types/inventory";
import { createClient } from "@/utils/supabase/client";

interface EditingCell {
  id: number;
  field: keyof InventoryItem;
  value: string;
}

interface InventoryContextType {
  items: InventoryItem[];
  isLoading: boolean;
  refreshItems: () => Promise<void>;
  setItems: (items: InventoryItem[]) => void;
  addItems: (newItems: InventoryItem[]) => void;
  updateItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  toggleSelect: (id: number) => void;
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
  });

  const supabase = createClient();

  const refreshItems = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching items from Supabase...");
    try {
      const { data, error } = await supabase
        .from("sku")
        .select("*")
        .order("Item Code", { ascending: true })
        .range(0, 3500);

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
        .from("sku")
        .upsert(itemsToUpload, { onConflict: "ID" });

      if (error) throw error;

      // 2. Refresh local state from DB to ensure sync
      await refreshItems();
    } catch (error) {
      console.error("Error adding items to Supabase:", error);
      alert("Failed to save items to database.");
    }
  }, [supabase, refreshItems]);

  const updateItem = useCallback(async (id: number, updates: Partial<InventoryItem>) => {
    try {
      // Remove selected from updates if it exists
      const { selected, ...dbUpdates } = updates as any;

      const { error } = await supabase
        .from("sku")
        .update(dbUpdates)
        .eq("ID", id);

      if (error) throw error;

      await refreshItems();
    } catch (error) {
      console.error("Error updating item in Supabase:", error);
    }
  }, [supabase, refreshItems]);

  const deleteItem = useCallback(async (id: number) => {
    try {
      const { error } = await supabase
        .from("sku")
        .delete()
        .eq("ID", id);

      if (error) throw error;

      await refreshItems();
    } catch (error) {
      console.error("Error deleting item from Supabase:", error);
    }
  }, [supabase, refreshItems]);

  const toggleSelect = useCallback((id: number) => {
    setItemsState((prev) =>
      prev.map((item) =>
        item.ID === id ? { ...item, selected: !item.selected } : item
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

  const itemsToDisplay = items;
  const categories = Array.from(new Set(itemsToDisplay.map((i) => i.Category).filter((c): c is string => !!c)));

  const filteredItems = itemsToDisplay.filter((item) => {
    const searchLower = filter.search.toLowerCase();
    const matchesSearch =
      !filter.search ||
      String(item.ID || "").toLowerCase().includes(searchLower) ||
      String(item["Item Code"] || "").toLowerCase().includes(searchLower) ||
      String(item.Item || "").toLowerCase().includes(searchLower) ||
      String(item.Category || "").toLowerCase().includes(searchLower);

    const matchesCategory =
      filter.category === "all" || item.Category === filter.category;

    return matchesSearch && matchesCategory;
  });

  const selectedItems = itemsToDisplay.filter((item) => item.selected);

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
