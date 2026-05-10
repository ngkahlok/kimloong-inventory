export interface InventoryItem {
  ID: number;
  "Item Code": string | null;
  "Category": string | null;
  "Item": string | null;
  "UOM": string | null;
  "Cost": number | null;
  "Price": number | null;
  selected?: boolean;
}

export type StockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

export interface FilterState {
  search: string;
  category: string;
}

export interface PrintJob {
  items: InventoryItem[];
  status: "idle" | "preparing" | "ready" | "printing";
}

export const STOCK_THRESHOLDS = {
  LOW_STOCK: 10,
  OUT_OF_STOCK: 0,
} as const;

export function getStockStatus(level: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (level <= STOCK_THRESHOLDS.OUT_OF_STOCK) return "out_of_stock";
  if (level <= STOCK_THRESHOLDS.LOW_STOCK) return "low_stock";
  return "in_stock";
}
