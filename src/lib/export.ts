// Client-only export helpers — no external libraries.

const triggerDownload = (filename: string, mime: string, content: BlobPart) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const escapeCsv = (v: any) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

export function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return triggerDownload(filename, "text/csv", "");
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(",")),
  ];
  triggerDownload(filename, "text/csv;charset=utf-8", lines.join("\n"));
}

// Excel-compatible XML spreadsheet (SpreadsheetML 2003) — opens directly in Excel/Sheets/LibreOffice.
export function exportExcel(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return triggerDownload(filename, "application/vnd.ms-excel", "");
  const headers = Object.keys(rows[0]);

  const esc = (v: any) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const cell = (v: any) => {
    if (typeof v === "number")
      return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    return `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  };

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>
 <Worksheet ss:Name="Report">
  <Table>
   <Row>${headers.map((h) => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>
   ${rows
     .map((r) => `<Row>${headers.map((h) => cell(r[h])).join("")}</Row>`)
     .join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
  triggerDownload(
    filename.endsWith(".xls") ? filename : filename.replace(/\.[^.]+$/, "") + ".xls",
    "application/vnd.ms-excel",
    xml
  );
}

// Print-based PDF: opens a print-ready HTML window. The user picks "Save as PDF".
export function exportPDF(title: string, html: string) {
  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
<meta charset="utf-8"/>
<style>
  body{font-family:Inter,system-ui,-apple-system,sans-serif;padding:32px;color:#111;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb;}
  th{background:#f4f4f5;font-size:11px;text-transform:uppercase;letter-spacing:.1em;}
  h1,h2{font-family:'Playfair Display',Georgia,serif;}
  h1{font-size:28px;margin:0 0 4px;}
  h2{font-size:18px;margin:24px 0 8px;}
  .muted{color:#71717a;}
  .eyebrow{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#71717a;}
  .right{text-align:right;}
  .totals td{border:none;padding:4px 8px;}
  .totals tr.total td{border-top:1px solid #111;font-weight:700;font-size:15px;}
  .brand{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px;}
  .brand .logo{font-family:'Playfair Display',serif;font-size:26px;letter-spacing:.4em;font-weight:700;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:16px 0 24px;}
  .box{border:1px solid #e5e7eb;padding:14px;}
  .pill{display:inline-block;padding:2px 8px;border:1px solid #e5e7eb;font-size:10px;text-transform:uppercase;letter-spacing:.15em;}
  @page{margin:14mm;}
  @media print{.no-print{display:none}}
</style></head><body>${html}
<script>setTimeout(()=>{window.focus();window.print();},250);</script>
</body></html>`);
  w.document.close();
}
