import { InventoryItem } from "@/types/inventory";
import * as XLSX from "xlsx";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeRow(row: Record<string, unknown>): InventoryItem | null {
  // Try to find columns case-insensitively
  const keys = Object.keys(row);
  const find = (names: string[]): unknown => {
    for (const name of names) {
      const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
      if (key !== undefined) return row[key];
    }
    return undefined;
  };

  const idRaw = find(["ID", "id", "Id"]);
  const itemCode = String(find(["Item Code", "ItemCode", "Item_Code", "SKU_ID", "SKU ID", "sku", "Code"]) ?? "").trim();
  const item = String(find(["Item", "Product_Name", "Product Name", "ProductName", "Name", "product"]) ?? "").trim();
  const category = String(find(["Category", "category", "CATEGORY", "Cat"]) ?? "").trim();
  const uom = String(find(["UOM", "uom", "Unit", "Unit of Measure"]) ?? "").trim();
  const costRaw = find(["Cost", "cost", "COST", "Unit Cost", "UnitCost"]);
  const priceRaw = find(["Price", "price", "PRICE", "Unit Price", "UnitPrice"]);

  if (!itemCode && !item) return null;

  const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw ?? Date.now())) || Date.now();
  const cost = typeof costRaw === "number" ? costRaw : parseFloat(String(costRaw ?? "0")) || 0;
  const price = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw ?? "0")) || 0;

  return {
    ID: id,
    "Item Code": itemCode || `CODE-${id}`,
    Item: item || "Unknown Item",
    Category: category || "Uncategorized",
    UOM: uom || "PCS",
    Cost: Math.max(0, cost),
    Price: Math.max(0, price),
    selected: false,
  };
}

export async function parseFile(file: File): Promise<InventoryItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
        });

        const items = rows
          .map((row) => normalizeRow(row))
          .filter((item): item is InventoryItem => item !== null);

        resolve(items);
      } catch (err) {
        reject(new Error("Failed to parse file: " + (err as Error).message));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleData(): InventoryItem[] {
  const products = [
    { code: "E-001", item: "Wireless Earbuds Pro", cat: "Electronics", price: 29.99, cost: 15.00 },
    { code: "E-002", item: "Smart Watch Series 5", cat: "Electronics", price: 199.99, cost: 120.00 },
    { code: "C-001", item: "Premium Cotton Tee", cat: "Clothing", price: 24.99, cost: 8.00 },
    { code: "F-001", item: "Organic Green Tea", cat: "Food & Beverage", price: 14.99, cost: 5.00 },
    { code: "H-001", item: "Garden Hose 50ft", cat: "Home & Garden", price: 39.99, cost: 20.00 },
  ];

  return products.map((p, i) => ({
    ID: 1000 + i,
    "Item Code": p.code,
    Item: p.item,
    Category: p.cat,
    UOM: "PCS",
    Cost: p.cost,
    Price: p.price,
    selected: false,
  }));
}

export function exportToCSV(items: InventoryItem[]): void {
  const headers = ["ID", "Item Code", "Item", "Category", "UOM", "Cost", "Price"];
  const rows = items.map((item) =>
    [
      item.ID,
      `"${item["Item Code"] || ""}"`,
      `"${item.Item || ""}"`,
      `"${item.Category || ""}"`,
      `"${item.UOM || ""}"`,
      item.Cost || 0,
      item.Price || 0,
    ].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
