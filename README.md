# 📦 Kim Loong Co. Admin Dashbaord

A web-based inventory management dashboard built for retail operations. Upload product data, manage stock levels, generate barcodes, and print labels — all in one place.

---

## ✨ What It Does

| Module | What you can do |
|---|---|
| **Data Ingestion** | Upload `.xlsx` or `.csv` files to import your product list |
| **SKU Management** | View, search, filter, and edit your inventory in a live table |
| **Barcode Generator** | Generate Code 128 barcode images for any product |
| **Print Labels** | Print individual or bulk barcode labels (50mm × 30mm thermal format) |
| **Export A4** | Print all barcodes onto A4 paper, grouped by category — one category per page, two columns per row |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
# http://localhost:3000
```

---

## 📁 Project Structure

```
kimloong-inventory/
├── app/
│   ├── components/
│   │   ├── BarcodeGenerator/   # Standalone barcode image generator
│   │   ├── BarcodeModal/       # Print modal for 50×30mm thermal labels
│   │   ├── Dashboard/          # Main layout — wires all modules together
│   │   ├── FileUpload/         # Drag-and-drop file uploader
│   │   ├── Header/             # Top bar with live KPI stats
│   │   ├── Sidebar/            # Left navigation between modules
│   │   └── SKUTable/           # Searchable, editable inventory table
│   ├── context/
│   │   └── InventoryContext.tsx  # Global state (all inventory data lives here)
│   ├── lib/
│   │   ├── fileParser.ts         # Parses uploaded .xlsx / .csv files
│   │   └── barcodeExport.ts      # Generates A4 print layout grouped by category
│   ├── types/
│   │   └── inventory.ts          # TypeScript types (InventoryItem, FilterState, etc.)
│   ├── globals.css               # Design system tokens (colours, spacing, fonts)
│   ├── layout.tsx                # Root HTML layout
│   └── page.tsx                  # Entry point → renders Dashboard
├── package.json
└── tsconfig.json
```

---

## 📋 Expected File Format

When uploading a `.csv` or `.xlsx` file, include these column headers (case-insensitive):

| Column | Description | Example |
|---|---|---|
| `SKU_ID` | Unique product code | `SKU-1001` |
| `Product_Name` | Product display name | `Wireless Earbuds Pro` |
| `Category` | Product category | `Electronics` |
| `Stock_Level` | Quantity in stock | `50` |
| `Price` | Unit selling price | `29.99` |
| `Barcode_Value` | Barcode number (Code 128 or EAN-13) | `9781234567897` |

> **Tip:** Don't have a file ready? Click **"Load Sample Data"** on the Data Ingestion page to populate 12 demo products instantly.

---

## 🖨 Printing Labels

### Single Label
1. Go to **SKU Management**
2. Click **Print** on any row
3. A preview modal opens — click **Print Label**

### Bulk Print (selected items)
1. Tick the checkboxes on the rows you want
2. Click **Bulk Print (N)** in the toolbar

### Export All to A4
1. Go to **SKU Management**
2. Click **Export A4** in the toolbar
3. All items are printed, grouped by category, 2 columns per row, new page per category

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Vanilla CSS Modules** | Component-scoped styling |
| **xlsx** | Parsing `.xlsx` and `.csv` files |
| **JsBarcode** | Generating Code 128 barcode images |

---

## 📌 Notes

- All data is stored **in-memory** only — refreshing the page will clear it. There is no database.
- The A4 export uses your browser's built-in print dialog — set your printer to **A4, no margins** for best results.
- Low stock threshold is ≤ 10 units; out of stock is 0 units.
