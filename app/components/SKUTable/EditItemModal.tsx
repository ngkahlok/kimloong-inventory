"use client";

import { useState, useEffect } from "react";
import { InventoryItem } from "@/types/inventory";
import { useInventory } from "@/context/InventoryContext";
import styles from "./EditItemModal.module.css";

interface EditItemModalProps {
    item: InventoryItem;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
}

export default function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
    const { items, addItems } = useInventory();
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                ID: item.ID || 0,
                "Item Code": item["Item Code"] || "",
                Category: item.Category || "",
                Item: item.Item || "",
                UOM: item.UOM || "",
                Cost: item.Cost ?? 0,
                Price: item.Price ?? 0,
            });
        }
    }, [item]);

    if (!isOpen) return null;

    const isNew = !items.find(i => i.ID === item.ID && item.ID !== 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNew) {
                await addItems([formData as InventoryItem]);
            } else {
                await onSave(item.ID, formData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
        }));
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{isNew ? "Add New SKU" : "Edit Item Details"}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>ID</label>
                            <input
                                type="number"
                                className={styles.input}
                                name="ID"
                                value={formData.ID || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Item Code</label>
                            <input
                                className={styles.input}
                                name="Item Code"
                                value={formData["Item Code"] || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Item</label>
                            <input
                                className={styles.input}
                                name="Item"
                                value={formData.Item || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <input
                                className={styles.input}
                                name="Category"
                                value={formData.Category || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>UOM</label>
                            <input
                                className={styles.input}
                                name="UOM"
                                value={formData.UOM || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cost (MYR)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={styles.input}
                                name="Cost"
                                value={formData.Cost ?? 0}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Price (MYR)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={styles.input}
                                name="Price"
                                value={formData.Price ?? 0}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveButton} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
