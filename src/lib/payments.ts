/** Payment status labels and helpers for the frontend. */

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "ממתין לתשלום",
  PENDING: "בתהליך תשלום",
  HELD: "בנאמנות",
  RELEASED: "שוחרר למוכר",
  REFUNDED: "הוחזר",
  PARTIALLY_REFUNDED: "הוחזר חלקית",
  FAILED: "נכשל",
};

export const PAYMENT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  UNPAID: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]" },
  PENDING: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]" },
  HELD: { bg: "bg-[rgba(var(--color-primary),0.1)]", text: "text-[rgb(var(--color-primary))]" },
  RELEASED: { bg: "bg-[rgba(var(--color-success),0.15)]", text: "text-[rgb(var(--color-success))]" },
  REFUNDED: { bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
  PARTIALLY_REFUNDED: { bg: "bg-[rgba(var(--color-accent-yellow),0.15)]", text: "text-[rgb(var(--color-warning))]" },
  FAILED: { bg: "bg-[rgba(var(--color-error),0.1)]", text: "text-[rgb(var(--color-error))]" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "כרטיס אשראי",
  BIT: "Bit",
  CASH: "מזומן (ללא הגנה)",
};
