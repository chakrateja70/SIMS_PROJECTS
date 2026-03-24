const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_MARGIN_X = 48;
const PDF_MARGIN_TOP = 792;
const PDF_LINE_HEIGHT = 15;
const MAX_LINE_LENGTH = 96;
const ENCODER = new TextEncoder();

type PdfSection = {
  label: string;
  value: string;
};

export type PdfDocumentPayload = {
  title: string;
  sections?: PdfSection[];
  content: string;
};

function sanitizeText(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .normalize("NFKD")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .replace(/\t/g, "    ");
}

function escapeForPdf(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(line: string, maxLength = MAX_LINE_LENGTH): string[] {
  if (!line.trim()) return [""];

  const words = line.split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      wrapped.push(current);
      current = "";
    }

    if (word.length <= maxLength) {
      current = word;
      continue;
    }

    let cursor = 0;
    while (cursor < word.length) {
      wrapped.push(word.slice(cursor, cursor + maxLength));
      cursor += maxLength;
    }
  }

  if (current) wrapped.push(current);

  return wrapped.length ? wrapped : [""];
}

function toWrappedLines(text: string): string[] {
  const lines = sanitizeText(text).split("\n");
  return lines.flatMap((line) => wrapLine(line));
}

function paginate(lines: string[], linesPerPage: number): string[][] {
  if (!lines.length) return [[""]];

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages;
}

function buildContentStream(pageLines: string[]): string {
  const safeLines = pageLines.map((line) => escapeForPdf(line));

  const commands: string[] = ["BT", "/F1 11 Tf", `${PDF_LINE_HEIGHT} TL`, `${PDF_MARGIN_X} ${PDF_MARGIN_TOP} Td`];

  safeLines.forEach((line, index) => {
    if (index > 0) commands.push("T*");
    commands.push(`(${line}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
}

export function createPdfBlob(payload: PdfDocumentPayload): Blob {
  const headerLines = [payload.title.toUpperCase()];

  if (payload.sections?.length) {
    payload.sections.forEach((section) => {
      headerLines.push(`${section.label}: ${section.value}`);
    });
  }

  headerLines.push("", "---", "");

  const bodyLines = toWrappedLines(payload.content);
  const allLines = [...headerLines, ...bodyLines];
  const linesPerPage = Math.floor((PDF_MARGIN_TOP - 56) / PDF_LINE_HEIGHT);
  const pages = paginate(allLines, linesPerPage);

  const pageObjectStart = 3;
  const fontObjectNumber = pageObjectStart + pages.length * 2;
  const maxObjectNumber = fontObjectNumber;
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  for (let index = 0; index < pages.length; index += 1) {
    const pageObjectNumber = pageObjectStart + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);

    const stream = buildContentStream(pages[index]);
    const streamLength = ENCODER.encode(stream).length;

    objects[contentObjectNumber] = `${contentObjectNumber} 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj`;
    objects[pageObjectNumber] = `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj`;
  }

  objects[fontObjectNumber] = `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`;
  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    offsets[objectNumber] = ENCODER.encode(pdf).length;
    pdf += `${objects[objectNumber]}\n`;
  }

  const xrefOffset = ENCODER.encode(pdf).length;
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    pdf += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function createTimestampedPdfName(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.pdf`;
}
