interface InvoiceData {
  invoiceNumber: number;
  issuedAt: string;
  sellerLegalName: string;
  sellerOsekNumber: string | null;
  sellerOsekType: string;
  sellerAddress: string | null;
  buyerName: string;
  serviceDescription: string;
  laborAmount: number;
  materialsAmount: number | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

/** Returns an HTML string for a printable Hebrew tax invoice. */
export function renderInvoiceHtml(invoice: InvoiceData): string {
  const date = new Date(invoice.issuedAt).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isMurshe = invoice.sellerOsekType === "murshe";
  const title = isMurshe ? "חשבונית מס / קבלה" : "חשבונית מס";
  const vatPercent = Math.round(invoice.vatRate * 100);

  const formatCurrency = (amount: number) =>
    `₪${amount.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} #${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      direction: rtl;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      color: #2563eb;
      font-weight: 700;
    }
    .invoice-meta {
      text-align: left;
      font-size: 14px;
      color: #555;
    }
    .invoice-meta .number {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .parties {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    .party {
      flex: 1;
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    .party h3 {
      font-size: 13px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }
    .party p {
      font-size: 15px;
      line-height: 1.6;
    }
    .party .name {
      font-weight: 700;
      font-size: 16px;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead th {
      background: #2563eb;
      color: #fff;
      padding: 12px 16px;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
    }
    thead th:last-child {
      text-align: left;
    }
    tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    tbody td:last-child {
      text-align: left;
      font-weight: 600;
    }
    .totals {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 30px;
    }
    .totals-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 24px;
      min-width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #2563eb;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="invoice-meta">
      <div class="number">מס׳ ${invoice.invoiceNumber}</div>
      <div>תאריך: ${date}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>נותן השירות</h3>
      <p class="name">${escapeHtml(invoice.sellerLegalName)}</p>
      ${invoice.sellerOsekNumber ? `<p>עוסק ${isMurshe ? "מורשה" : "פטור"} מס׳ ${escapeHtml(invoice.sellerOsekNumber)}</p>` : `<p>עוסק ${isMurshe ? "מורשה" : "פטור"}</p>`}
      ${invoice.sellerAddress ? `<p>${escapeHtml(invoice.sellerAddress)}</p>` : ""}
    </div>
    <div class="party">
      <h3>מקבל השירות</h3>
      <p class="name">${escapeHtml(invoice.buyerName)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>תיאור</th>
        <th>סכום</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(invoice.serviceDescription)} (עבודה)</td>
        <td>${formatCurrency(invoice.laborAmount)}</td>
      </tr>
      ${invoice.materialsAmount != null && invoice.materialsAmount > 0 ? `
      <tr>
        <td>חומרים</td>
        <td>${formatCurrency(invoice.materialsAmount)}</td>
      </tr>` : ""}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>סה״כ לפני מע״מ</span>
        <span>${formatCurrency(invoice.subtotal)}</span>
      </div>
      ${isMurshe ? `
      <div class="totals-row">
        <span>מע״מ (${vatPercent}%)</span>
        <span>${formatCurrency(invoice.vatAmount)}</span>
      </div>` : ""}
      <div class="totals-row total">
        <span>סה״כ לתשלום</span>
        <span>${formatCurrency(invoice.total)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>הונפק על ידי ${escapeHtml(invoice.sellerLegalName)} באמצעות פלטפורמת אבאל׳ה. אבאל׳ה אינה צד לעסקה.</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600;">
      הדפס / שמור כ-PDF
    </button>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
