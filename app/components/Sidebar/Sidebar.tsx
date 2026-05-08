"use client";

import Image from "next/image";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  itemCount: number;
  selectedCount: number;
}

const NAV_ITEMS = [
  {
    id: "ingestion",
    label: "Data Ingestion",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: "sku",
    label: "SKU Management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: "barcode",
    label: "Barcode Generator",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5v14" />
        <path d="M8 5v14" />
        <path d="M12 5v14" />
        <path d="M17 5v14" />
        <path d="M21 5v14" />
      </svg>
    ),
  },
];

export default function Sidebar({ activeTab, onTabChange, itemCount, selectedCount }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandLogowrapper}>
          <Image
            src="/KimLoong_Logo(White-BG).png"
            alt="Kim Loong Logo"
            width={60}
            height={64}
            className={styles.brandLogo}
          />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Kim Loong Co.</span>
          <span className={styles.brandTagline}>Admin Dashboard</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navSection}>Modules</span>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.id === "sku" && itemCount > 0 && (
              <span className={styles.navBadge}>{itemCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{itemCount}</span>
          <span className={styles.statLabel}>Total SKUs</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{selectedCount}</span>
          <span className={styles.statLabel}>Selected</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span>v1.0.0</span>
        <span>Retail IMS</span>
      </div>
    </aside>
  );
}
