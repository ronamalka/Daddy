/** Color classes and Hebrew labels for each order status. */
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: {
    bg: "bg-[rgba(var(--color-accent-yellow),0.15)]",
    text: "text-[rgb(var(--color-warning))]",
    dot: "bg-[rgb(var(--color-accent-yellow))]",
  },
  IN_PROGRESS: {
    bg: "bg-[rgba(var(--color-primary),0.1)]",
    text: "text-[rgb(var(--color-primary))]",
    dot: "bg-[rgb(var(--color-primary))]",
  },
  DELIVERED: {
    bg: "bg-[rgba(var(--color-primary-light),0.15)]",
    text: "text-[rgb(var(--color-primary-hover))]",
    dot: "bg-[rgb(var(--color-primary-light))]",
  },
  COMPLETED: {
    bg: "bg-[rgba(var(--color-success),0.15)]",
    text: "text-[rgb(var(--color-success))]",
    dot: "bg-[rgb(var(--color-success))]",
  },
  CANCELLED: {
    bg: "bg-[rgba(var(--color-error),0.1)]",
    text: "text-[rgb(var(--color-error))]",
    dot: "bg-[rgb(var(--color-error))]",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  IN_PROGRESS: "בעבודה",
  DELIVERED: "נמסר",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
};
