/** Uncompressed .xlsx (Office Open XML) writer. Formulas are A1-style. */

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 255;
  b[1] = (n >>> 8) & 255;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 255;
  b[1] = (n >>> 8) & 255;
  b[2] = (n >>> 16) & 255;
  b[3] = (n >>> 24) & 255;
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  parts.forEach(p => {
    out.set(p, o);
    o += p.length;
  });
  return out;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      name,
      file.data
    ]);
    locals.push(local);
    centrals.push(concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name
    ]));
    offset += local.length;
  }
  const central = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0)
  ]);
  return concat([...locals, central, end]);
}

function xmlEsc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function colLetter(col1: number): string {
  let n = col1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function a1(row: number, col: number, sheet?: string): string {
  const ref = `${colLetter(col)}${row}`;
  return sheet ? `${sheet}!${ref}` : ref;
}

export type XCell =
  | { t: 's'; v: string }
  | { t: 'n'; v: number }
  | { t: 'f'; v: string; cached?: number };

function cellXml(row: number, col: number, cell: XCell): string {
  const r = `${colLetter(col)}${row}`;
  if (cell.t === 's') {
    return `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(cell.v)}</t></is></c>`;
  }
  if (cell.t === 'f') {
    const cached = Number.isFinite(cell.cached) ? cell.cached : 0;
    return `<c r="${r}" t="n"><f>${xmlEsc(cell.v)}</f><v>${cached}</v></c>`;
  }
  const n = Number.isFinite(cell.v) ? cell.v : 0;
  return `<c r="${r}" t="n"><v>${n}</v></c>`;
}

export function sheetXml(rows: (XCell | null)[][]): string {
  const body = rows.map((cells, i) => {
    const row = i + 1;
    const cs = cells
      .map((cell, j) => (cell ? cellXml(row, j + 1, cell) : ''))
      .join('');
    return `<row r="${row}">${cs}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${body}</sheetData>
</worksheet>`;
}

export function buildXlsx(sheets: { name: string; rows: (XCell | null)[][] }[]): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  const files: { name: string; data: Uint8Array }[] = [];

  files.push({
    name: '[Content_Types].xml',
    data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('')}
</Types>`)
  });

  files.push({
    name: '_rels/.rels',
    data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
  });

  files.push({
    name: 'xl/_rels/workbook.xml.rels',
    data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  ).join('')}
</Relationships>`)
  });

  files.push({
    name: 'xl/workbook.xml',
    data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, i) =>
      `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    ).join('')}
  </sheets>
</workbook>`)
  });

  sheets.forEach((s, i) => {
    files.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc(sheetXml(s.rows))
    });
  });

  return zipStore(files);
}
