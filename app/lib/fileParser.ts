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

  const skuId = String(find(["SKU_ID", "SKU ID", "SKUID", "sku_id", "sku", "SKU"]) ?? "").trim();
  const productName = String(find(["Product_Name", "Product Name", "ProductName", "Name", "product"]) ?? "").trim();
  const category = String(find(["Category", "category", "CATEGORY", "Cat"]) ?? "").trim();
  const stockRaw = find(["Stock_Level", "Stock Level", "StockLevel", "Stock", "Quantity", "Qty"]);
  const priceRaw = find(["Price", "price", "PRICE", "Unit Price", "UnitPrice"]);
  const barcodeValue = String(find(["Barcode_Value", "Barcode Value", "BarcodeValue", "Barcode", "barcode", "UPC", "EAN"]) ?? "").trim();

  if (!skuId && !productName) return null;

  const stock = typeof stockRaw === "number" ? stockRaw : parseFloat(String(stockRaw ?? "0")) || 0;
  const price = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw ?? "0")) || 0;

  return {
    id: generateId(),
    SKU_ID: skuId || `SKU-${generateId()}`,
    Product_Name: productName || "Unknown Product",
    Category: category || "Uncategorized",
    Stock_Level: Math.max(0, Math.round(stock)),
    Price: Math.max(0, price),
    Barcode_Value: barcodeValue || skuId || generateId(),
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
  const categories = ["Electronics", "Clothing", "Food & Beverage", "Home & Garden", "Sports"];
  const products = [
    { name: "Wireless Earbuds Pro", cat: "Electronics", barcode: "9781234567897" },
    { name: "Smart Watch Series 5", cat: "Electronics", barcode: "4006381333931" },
    { name: "USB-C Hub 7-in-1", cat: "Electronics", barcode: "5901234123457" },
    { name: "Premium Cotton Tee", cat: "Clothing", barcode: "0712345678906" },
    { name: "Running Shoes X1", cat: "Clothing", barcode: "5060168790001" },
    { name: "Denim Jacket Classic", cat: "Clothing", barcode: "4902001413694" },
    { name: "Organic Green Tea", cat: "Food & Beverage", barcode: "8901234567891" },
    { name: "Cold Brew Coffee Pack", cat: "Food & Beverage", barcode: "3614272049512" },
    { name: "Garden Hose 50ft", cat: "Home & Garden", barcode: "0028400064057" },
    { name: "Indoor Plant Set", cat: "Home & Garden", barcode: "8712566168949" },
    { name: "Yoga Mat Premium", cat: "Sports", barcode: "9780201379624" },
    { name: "Resistance Bands Set", cat: "Sports", barcode: "0885176179499" },
  ];

  return products.map((p, i) => ({
    id: generateId(),
    SKU_ID: `SKU-${String(1001 + i).padStart(4, "0")}`,
    Product_Name: p.name,
    Category: p.cat,
    Stock_Level: [0, 5, 8, 25, 42, 100, 3, 15, 0, 7, 200, 50][i] ?? 0,
    Price: [29.99, 199.99, 49.99, 24.99, 89.99, 129.99, 14.99, 32.99, 39.99, 54.99, 45.99, 22.99][i] ?? 9.99,
    Barcode_Value: p.barcode,
    selected: false,
  }));
}

export function exportToCSV(items: InventoryItem[]): void {
  const headers = ["SKU_ID", "Product_Name", "Category", "Stock_Level", "Price", "Barcode_Value"];
  const rows = items.map((item) =>
    [item.SKU_ID, item.Product_Name, item.Category, item.Stock_Level, item.Price, item.Barcode_Value].join(",")
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
