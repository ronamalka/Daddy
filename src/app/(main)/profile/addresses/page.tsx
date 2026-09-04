"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, PencilSimple, Trash, Check, House } from "@phosphor-icons/react";
import { LocationPicker } from "@/components/location-picker";

interface SavedAddress {
  id: string;
  label: string;
  cityCode: number | null;
  cityName: string | null;
  districtCode: number | null;
  districtName: string | null;
  street: string | null;
  floor: string | null;
  accessNotes: string | null;
}

type FormData = Omit<SavedAddress, "id">;

const EMPTY_FORM: FormData = {
  label: "",
  cityCode: null,
  cityName: null,
  districtCode: null,
  districtName: null,
  street: null,
  floor: null,
  accessNotes: null,
};

const MAX_ADDRESSES = 5;

/** Shows the user's saved addresses with add/edit/delete. */
export default function AddressesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddresses(data);
      }
    } catch {
      // keep existing state
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(address: SavedAddress) {
    setForm({
      label: address.label,
      cityCode: address.cityCode,
      cityName: address.cityName,
      districtCode: address.districtCode,
      districtName: address.districtName,
      street: address.street,
      floor: address.floor,
      accessNotes: address.accessNotes,
    });
    setEditingId(address.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.label.trim()) {
      setError("יש להזין שם לכתובת");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchAddresses();
        closeForm();
        setSuccess(editingId ? "הכתובת עודכנה" : "הכתובת נשמרה");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError((errData as { error?: string }).error || "שגיאה בשמירה");
      }
    } catch {
      setError("שגיאה בשמירה, נסה שנית");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק כתובת זו?")) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAddresses();
        setSuccess("הכתובת נמחקה");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError((errData as { error?: string }).error || "שגיאה במחיקה");
      }
    } catch {
      setError("שגיאה במחיקה, נסה שנית");
    }
    setSaving(false);
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[16px] text-[rgb(var(--color-text-secondary))]">התחבר כדי לנהל כתובות שמורות.</p>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-4 py-3 text-[14px] text-[rgb(var(--color-text))] placeholder-[rgb(var(--color-text-muted))] transition-all focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary),0.2)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[rgb(var(--color-text))]">כתובות שמורות</h1>
          <p className="mt-1 text-[14px] text-[rgb(var(--color-text-secondary))]">
            שמור כתובות מועדפות כדי למלא מהר בקשות שירות
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-[rgb(var(--color-border))] px-4 py-2 text-[13px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-all"
        >
          חזרה
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-[rgba(var(--color-error),0.1)] px-4 py-3">
          <p className="text-[14px] font-medium text-[rgb(var(--color-error))]">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[rgba(var(--color-success),0.1)] px-4 py-3">
          <Check className="h-4 w-4 text-[rgb(var(--color-success))]" />
          <p className="text-[14px] font-medium text-[rgb(var(--color-success))]">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgba(var(--color-primary),0.1)] border-t-[rgb(var(--color-primary))]" />
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[rgba(var(--color-primary),0.1)] p-2 mt-0.5">
                    <House className="h-5 w-5 text-[rgb(var(--color-primary))]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[rgb(var(--color-text))]">{addr.label}</h3>
                    <div className="mt-1 space-y-0.5 text-[13px] text-[rgb(var(--color-text-secondary))]">
                      {addr.cityName && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {addr.cityName}
                          {addr.districtName && `, ${addr.districtName}`}
                        </p>
                      )}
                      {addr.street && <p>רחוב: {addr.street}</p>}
                      {addr.floor && <p>קומה: {addr.floor}</p>}
                      {addr.accessNotes && (
                        <p className="mt-1 text-[12px] text-[rgb(var(--color-text-muted))]">
                          {addr.accessNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(addr)}
                    disabled={saving}
                    className="rounded-lg p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-elevated))] hover:text-[rgb(var(--color-primary))] transition-all"
                    title="ערוך"
                  >
                    <PencilSimple className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={saving}
                    className="rounded-lg p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgba(var(--color-error),0.1)] hover:text-[rgb(var(--color-error))] transition-all"
                    title="מחק"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {addresses.length === 0 && !showForm && (
            <div className="rounded-2xl border border-dashed border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.1)]">
                <MapPin className="h-6 w-6 text-[rgb(var(--color-primary))]" />
              </div>
              <p className="text-[15px] font-semibold text-[rgb(var(--color-text))]">אין כתובות שמורות</p>
              <p className="mt-1 text-[13px] text-[rgb(var(--color-text-secondary))]">
                הוסף כתובת כדי למלא בקשות שירות במהירות
              </p>
            </div>
          )}

          {showForm && (
            <div className="rounded-2xl border border-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface))] p-6 shadow-md">
              <h2 className="mb-5 text-[16px] font-bold text-[rgb(var(--color-text))]">
                {editingId ? "עריכת כתובת" : "הוסף כתובת"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                    שם הכתובת <span className="text-[rgb(var(--color-error))]">*</span>
                  </label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder={'לדוגמה: הבית, ההורים, המשרד'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <LocationPicker
                    mode="single"
                    label="עיר"
                    value={form.cityCode ? { cityCode: form.cityCode, districtCode: form.districtCode ?? undefined } : undefined}
                    onChange={(val) =>
                      setForm((f) => ({
                        ...f,
                        cityCode: val.cityCode,
                        cityName: val.cityName,
                        districtCode: val.districtCode,
                        districtName: val.districtName,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                    רחוב
                  </label>
                  <input
                    value={form.street ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value || null }))}
                    placeholder="לדוגמה: הרצל 12"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                    קומה
                  </label>
                  <input
                    value={form.floor ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value || null }))}
                    placeholder="לדוגמה: 3"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[rgb(var(--color-text-secondary))]">
                    הערות גישה
                  </label>
                  <input
                    value={form.accessNotes ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, accessNotes: e.target.value || null }))}
                    placeholder="לדוגמה: קוד 1234, אין חניה"
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[rgb(var(--color-primary))] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-40"
                  >
                    {saving ? "שומר..." : editingId ? "עדכן כתובת" : "שמור כתובת"}
                  </button>
                  <button
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-[rgb(var(--color-border))] px-6 py-3 text-[14px] font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-elevated))] transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showForm && addresses.length < MAX_ADDRESSES && (
            <button
              onClick={openAdd}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] py-4 text-[14px] font-semibold text-[rgb(var(--color-primary))] transition-all hover:border-[rgb(var(--color-primary))] hover:bg-[rgba(var(--color-primary),0.05)]"
            >
              <Plus className="h-5 w-5" />
              הוסף כתובת
            </button>
          )}

          {!showForm && addresses.length >= MAX_ADDRESSES && (
            <p className="text-center text-[13px] text-[rgb(var(--color-text-muted))]">
              הגעת למקסימום {MAX_ADDRESSES} כתובות שמורות
            </p>
          )}
        </div>
      )}
    </div>
  );
}
