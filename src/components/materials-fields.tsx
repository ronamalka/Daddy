/** Toggle for who buys parts, plus an optional materials estimate. */
export function MaterialsFields({
  name = "materials-who",
  buyerSuppliesMaterials,
  onBuyerSuppliesChange,
  materialsEstimate,
  onMaterialsChange,
}: {
  name?: string;
  buyerSuppliesMaterials: boolean;
  onBuyerSuppliesChange: (value: boolean) => void;
  materialsEstimate: string;
  onMaterialsChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="w-full text-[13px] font-medium text-[rgb(var(--color-text-secondary))]">מי מביא חומרים?</legend>
        <label className={`cursor-pointer rounded-xl border px-3 py-2 text-[13px] font-medium ${
          buyerSuppliesMaterials
            ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]"
            : "border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]"
        }`}>
          <input
            type="radio"
            className="sr-only"
            name={name}
            checked={buyerSuppliesMaterials}
            onChange={() => onBuyerSuppliesChange(true)}
          />
          הלקוח מביא
        </label>
        <label className={`cursor-pointer rounded-xl border px-3 py-2 text-[13px] font-medium ${
          !buyerSuppliesMaterials
            ? "border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] text-[rgb(var(--color-primary))]"
            : "border-[rgb(var(--color-border))] text-[rgb(var(--color-text-secondary))]"
        }`}>
          <input
            type="radio"
            className="sr-only"
            name={name}
            checked={!buyerSuppliesMaterials}
            onChange={() => onBuyerSuppliesChange(false)}
          />
          האבא מביא
        </label>
      </fieldset>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[rgb(var(--color-text-secondary))]">
          {buyerSuppliesMaterials ? "הערכת קנייה (אופציונלי):" : "הערכת חומרים:"}
        </span>
        <div className="flex items-center rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
          <span className="px-3 text-[14px] text-[rgb(var(--color-text-muted))]">₪</span>
          <input
            type="number"
            value={materialsEstimate}
            onChange={(e) => onMaterialsChange(e.target.value)}
            placeholder="0"
            className="w-24 rounded-r-xl bg-transparent py-2.5 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
