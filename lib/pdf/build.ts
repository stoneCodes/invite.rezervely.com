import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import bidiFactory from "bidi-js";
import reshaper from "arabic-persian-reshaper";
import { LOCALE } from "@/lib/i18n";
import { dateParts } from "@/components/invitation/engine";
import { inviteDict } from "@/lib/i18n/invite";
import { PDF_THEMES } from "./themes";
import type { TemplateId } from "@/lib/types";

type Reply = { name: string; attending: boolean; guests: number; message: string | null; created_at: string };
export type PdfInput = {
  invitation: { template: TemplateId; data: { partner1: string; partner2: string; lang: "fr" | "en"; dateISO: string; venue: { name: string; address: string } } };
  replies: Reply[];
  generatedAt: string;
};
type FontShape = { hasGlyphForCodePoint(codePoint: number): boolean };
type Color = ReturnType<typeof rgb>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LEFT = 42;
const RIGHT = PAGE_W - 42;
const BOTTOM = 62;
const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u;
const bidi = bidiFactory();

function color(hex: string): Color {
  const value = hex.replace("#", "");
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
}
async function asset(path: string): Promise<Uint8Array> {
  const response = await fetch(new URL(path, window.location.origin));
  if (!response.ok) throw new Error("pdf_asset_unavailable");
  return new Uint8Array(await response.arrayBuffer());
}
async function rasterizeOrnament(svg: string): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("pdf_ornament_unavailable")); image.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 192;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("pdf_canvas_unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("pdf_ornament_unavailable")), "image/png"));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}
function fontHasText(font: FontShape, text: string): boolean {
  return Array.from(text).every((character) => font.hasGlyphForCodePoint(character.codePointAt(0) || 0));
}
function safeText(font: FontShape, text: string): string {
  return Array.from(text).map((character) => {
    if (font.hasGlyphForCodePoint(character.codePointAt(0) || 0)) return character;
    return font.hasGlyphForCodePoint(0x25a1) ? "□" : "?";
  }).join("");
}
function visualArabic(text: string): string {
  if (!ARABIC.test(text)) return text;
  const shaped = reshaper.ArabicShaper.convertArabic(text);
  const levels = bidi.getEmbeddingLevels(shaped);
  return bidi.getReorderedString(shaped, levels);
}
function wrapped(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    if (!paragraph) { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      line = "";
      for (const character of Array.from(word)) {
        const test = line + character;
        if (line && font.widthOfTextAtSize(test, size) > maxWidth) { lines.push(line); line = character; }
        else line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}
function truncate(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join("").trimEnd()}…`;
}
function centerX(font: PDFFont, text: string, size: number) {
  return (PAGE_W - font.widthOfTextAtSize(text, size)) / 2;
}

export async function buildGuestListPdf(input: PdfInput): Promise<Uint8Array> {
  const { invitation, replies, generatedAt } = input;
  const { data } = invitation;
  const theme = PDF_THEMES[invitation.template];
  const t = inviteDict(data.lang).pdf;
  const locale = LOCALE[data.lang];
  const titleBytes = await asset(theme.titleFont);
  const bodyBytes = await asset(theme.bodyFont);
  const scriptBytes = await asset(theme.scriptFont);
  const ornamentSvg = new TextDecoder().decode(await asset(theme.ornament));
  const fontResources = [fontkit.create(titleBytes), fontkit.create(bodyBytes), fontkit.create(scriptBytes)] as FontShape[];
  const visibleText = [data.partner1, data.partner2, data.dateISO, data.venue.name, data.venue.address, ...replies.flatMap((reply) => [reply.name, reply.message || ""])].join("\n");
  const hasArabic = ARABIC.test(visibleText);
  const nonArabic = Array.from(visibleText).filter((character) => !ARABIC.test(character)).join("");
  const needsWideFallback = !fontHasText(fontResources[0], nonArabic) && !fontHasText(fontResources[1], nonArabic);
  const arabicBytes = hasArabic ? await asset("/fonts/pdf/NotoNaskhArabic-VF.ttf") : null;
  const wideBytes = needsWideFallback ? await asset("/fonts/pdf/NotoSans-VF.ttf") : null;

  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle(`${t.title} · ${data.partner1} & ${data.partner2}`);
  document.setAuthor("joyeuxevent");
  document.setCreator("joyeuxevent");
  const titleFont = await document.embedFont(titleBytes, { subset: true });
  const bodyFont = await document.embedFont(bodyBytes, { subset: true });
  const scriptFont = await document.embedFont(scriptBytes, { subset: true });
  const arabicFont = arabicBytes ? await document.embedFont(arabicBytes, { subset: false }) : null; // subset casse les polices variables (glyphes arabes illisibles)
  const wideFont = wideBytes ? await document.embedFont(wideBytes, { subset: true }) : null;
  const titleShape = fontResources[0];
  const bodyShape = fontResources[1];
  const scriptShape = fontResources[2];
  const arabicShape = arabicBytes ? fontkit.create(arabicBytes) as FontShape : null;
  const wideShape = wideBytes ? fontkit.create(wideBytes) as FontShape : null;
  const ink = color(theme.text), muted = color(theme.muted), accent = color(theme.accent), rule = color(theme.rule), paper = color(theme.background);
  const ornament = await document.embedPng(await rasterizeOrnament(ornamentSvg));
  const pageBox = document.addPage([PAGE_W, PAGE_H]);
  let page: PDFPage = pageBox;
  let y = PAGE_H - 42;
  const pages: PDFPage[] = [page];

  const pageFill = (target: PDFPage) => target.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: paper });
  pageFill(page);
  function runningHeader(target: PDFPage) {
    const couple = `${data.partner1}${data.partner2 ? ` & ${data.partner2}` : ""}`;
    const clean = safeText(bodyShape, couple);
    target.drawText(clean, { x: LEFT, y: PAGE_H - 34, size: 9, font: bodyFont, color: muted });
    target.drawLine({ start: { x: LEFT, y: PAGE_H - 44 }, end: { x: RIGHT, y: PAGE_H - 44 }, color: rule, thickness: 0.7 });
  }
  function addPage() {
    page = document.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    pageFill(page);
    runningHeader(page);
    y = PAGE_H - 62;
  }
  function fontFor(text: string, preferred: PDFFont = bodyFont): { pdf: PDFFont; shape: FontShape } {
    const shape = preferred === titleFont ? titleShape : preferred === scriptFont ? scriptShape : bodyShape;
    if (fontHasText(shape, text)) return { pdf: preferred, shape };
    if (ARABIC.test(text) && arabicFont && arabicShape && fontHasText(arabicShape, visualArabic(text))) return { pdf: arabicFont, shape: arabicShape };
    if (wideFont && wideShape) return { pdf: wideFont, shape: wideShape };
    if (arabicFont && arabicShape) return { pdf: arabicFont, shape: arabicShape };
    if (fontHasText(bodyShape, text)) return { pdf: bodyFont, shape: bodyShape };
    if (fontHasText(titleShape, text)) return { pdf: titleFont, shape: titleShape };
    return { pdf: preferred, shape };
  }
  function drawTextLines(target: PDFPage, text: string, x: number, top: number, maxWidth: number, preferred: PDFFont, size: number, textColor: Color, leading: number, align: "left" | "center" | "right" = "left", maxLines = Number.POSITIVE_INFINITY) {
    const selected = fontFor(text, preferred);
    const lines = wrapped(text, selected.pdf, size, maxWidth).slice(0, maxLines);
    let currentTop = top;
    for (const logicalLine of lines) {
      const visual = visualArabic(logicalLine);
      const safe = safeText(selected.shape, visual);
      const width = selected.pdf.widthOfTextAtSize(safe, size);
      const rtl = ARABIC.test(logicalLine);
      const drawX = align === "center" ? x + (maxWidth - width) / 2 : (align === "right" || rtl) ? x + maxWidth - width : x;
      target.drawText(safe, { x: drawX, y: currentTop - size, size, font: selected.pdf, color: textColor, maxWidth });
      currentTop -= leading;
    }
    return { height: lines.length * leading, lines: lines.length };
  }
  function drawSection(title: string) {
    if (y - 34 < BOTTOM) addPage();
    y -= 8;
    const clean = safeText(bodyShape, title);
    page.drawText(clean, { x: LEFT, y: y - 17, size: 15, font: titleFont, color: accent });
    y -= 25;
    page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, color: rule, thickness: 0.8 });
    y -= 13;
  }
  function drawColumnHeader(columns: { text: string; x: number; width: number; align?: "left" | "center" | "right" }[]) {
    page.drawRectangle({ x: LEFT, y: y - 20, width: RIGHT - LEFT, height: 23, color: rule, opacity: 0.35 });
    for (const column of columns) drawTextLines(page, column.text, column.x, y - 3, column.width, bodyFont, 8.5, muted, 10, column.align || "left", 1);
    y -= 25;
  }
  function drawTableRowText(text: string, x: number, width: number, top: number, size: number, maxLines = Number.POSITIVE_INFINITY) {
    return drawTextLines(page, text, x, top, width, bodyFont, size, ink, size + 3, "left", maxLines);
  }
  const allReplies = [...replies].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
  const present = allReplies.filter((reply) => reply.attending);
  const absent = allReplies.filter((reply) => !reply.attending);
  const expected = present.reduce((sum, reply) => sum + Math.max(0, Number(reply.guests) || 0), 0);
  const messages = allReplies.filter((reply) => typeof reply.message === "string" && reply.message.trim());
  const eventDate = dateParts(data.dateISO, data.lang, "Europe/Paris")?.full || "";

  const couple = [data.partner1, data.partner2].filter(Boolean).join(" & ");
  const imageDims = { width: 94, height: 30 };
  page.drawImage(ornament, { x: (PAGE_W - imageDims.width) / 2, y: y - 38, width: imageDims.width, height: imageDims.height });
  y -= 60;
  const namesPreferred = fontHasText(scriptShape, couple) ? scriptFont : titleFont;
  const nameShape = namesPreferred === scriptFont ? scriptShape : titleShape;
  drawTextLines(page, couple, LEFT, y, RIGHT - LEFT, namesPreferred, 28, ink, 32, "center", 2);
  y -= 41;
  if (eventDate) {
    drawTextLines(page, eventDate, LEFT, y, RIGHT - LEFT, titleFont, 12, accent, 16, "center", 2);
    y -= 22;
  }
  if (data.venue.name || data.venue.address) {
    drawTextLines(page, [data.venue.name, data.venue.address].filter(Boolean).join(" · "), LEFT + 35, y, RIGHT - LEFT - 70, bodyFont, 9.5, muted, 13, "center", 3);
    y -= 42;
  }
  page.drawLine({ start: { x: LEFT + 55, y }, end: { x: RIGHT - 55, y }, color: accent, thickness: 1.2 });
  y -= 28;
  drawSection(t.summary);
  const statCells = [
    [t.replies(replies.length), String(replies.length)],
    [t.attending, String(present.length)],
    [t.absent, String(absent.length)],
    [t.expected, String(expected)],
  ];
  const statGap = 8;
  const statWidth = (RIGHT - LEFT - statGap * 3) / 4;
  for (let index = 0; index < statCells.length; index++) {
    const x = LEFT + index * (statWidth + statGap);
    page.drawRectangle({ x, y: y - 50, width: statWidth, height: 50, color: rgb(1, 1, 1), borderColor: rule, borderWidth: 0.8 });
    drawTextLines(page, statCells[index][0], x + 6, y - 8, statWidth - 12, bodyFont, 7, muted, 9, "center", 2);
    drawTextLines(page, statCells[index][1], x + 6, y - 27, statWidth - 12, titleFont, 16, ink, 19, "center", 1);
  }
  y -= 68;

  if (replies.length === 0) {
    drawTextLines(page, t.noReplies, LEFT, y, RIGHT - LEFT, bodyFont, 11, muted, 15);
    y -= 30;
  } else {
    const presentColumns = [
      { text: "", x: LEFT + 4, width: 20 },
      { text: t.name, x: LEFT + 32, width: 180 },
      { text: t.guests, x: LEFT + 220, width: 62, align: "center" as const },
      { text: t.message, x: LEFT + 292, width: 218 },
    ];
    drawSection(t.attending);
    drawColumnHeader(presentColumns);
    for (const reply of present) {
      const note = reply.message?.trim() ? truncate(reply.message.trim(), 150) : "—";
      const nameLines = wrapped(reply.name, bodyFont, 9, 180).length;
      const messageLines = wrapped(note, bodyFont, 8.5, 218).length;
      const rowHeight = Math.max(29, nameLines * 12 + 10, messageLines * 11 + 10);
      if (y - rowHeight < BOTTOM) { addPage(); drawSection(t.attending); drawColumnHeader(presentColumns); }
      page.drawLine({ start: { x: LEFT, y: y - rowHeight + 1 }, end: { x: RIGHT, y: y - rowHeight + 1 }, color: rule, thickness: 0.45 });
      page.drawRectangle({ x: LEFT + 6, y: y - 17, width: 9, height: 9, borderColor: accent, borderWidth: 0.8 });
      drawTableRowText(reply.name, LEFT + 32, 180, y - 5, 9, 3);
      drawTextLines(page, String(Math.max(0, Number(reply.guests) || 0)), LEFT + 220, y - 5, 62, bodyFont, 9, ink, 12, "center", 2);
      drawTableRowText(note, LEFT + 292, 218, y - 5, 8.5, 3);
      y -= rowHeight;
    }
    const absentColumns = [
      { text: t.name, x: LEFT + 8, width: 210 },
      { text: t.message, x: LEFT + 230, width: 270 },
    ];
    drawSection(t.absent);
    drawColumnHeader(absentColumns);
    for (const reply of absent) {
      const note = reply.message?.trim() || "—";
      const rowHeight = Math.max(29, wrapped(reply.name, bodyFont, 9, 210).length * 12 + 10, wrapped(note, bodyFont, 8.5, 270).length * 11 + 10);
      if (y - rowHeight < BOTTOM) { addPage(); drawSection(t.absent); drawColumnHeader(absentColumns); }
      page.drawLine({ start: { x: LEFT, y: y - rowHeight + 1 }, end: { x: RIGHT, y: y - rowHeight + 1 }, color: rule, thickness: 0.45 });
      drawTableRowText(reply.name, LEFT + 8, 210, y - 5, 9, 3);
      drawTableRowText(note, LEFT + 230, 270, y - 5, 8.5, 3);
      y -= rowHeight;
    }
  }

  drawSection(t.messages);
  if (messages.length === 0) {
    drawTextLines(page, t.noMessages, LEFT, y, RIGHT - LEFT, bodyFont, 10, muted, 14);
    y -= 26;
  }
  for (const reply of messages) {
    const label = `${t.from} ${reply.name}`;
    if (y - 34 < BOTTOM) { addPage(); drawSection(t.messages); }
    page.drawRectangle({ x: LEFT, y: y - 1, width: 3, height: 25, color: accent });
    drawTextLines(page, label, LEFT + 11, y - 2, RIGHT - LEFT - 20, bodyFont, 9, accent, 12, "left", 2);
    y -= 29;
    const arabicLine = ARABIC.test(reply.message || "");
    const preferredFont = arabicLine && arabicFont ? arabicFont : bodyFont;
    const preferredShape = arabicLine && arabicShape ? arabicShape : bodyShape;
    const safeMessage = safeText(preferredShape, reply.message || "");
    const contentLines = wrapped(safeMessage, preferredFont, 9, RIGHT - LEFT - 22);
    for (const logicalLine of contentLines) {
      if (y - 14 < BOTTOM) { addPage(); drawSection(t.messages); }
      const visual = visualArabic(logicalLine);
      const selected = fontFor(visual, preferredFont);
      const safe = safeText(selected.shape, visual);
      const width = selected.pdf.widthOfTextAtSize(safe, 9);
      const x = ARABIC.test(logicalLine) ? RIGHT - width - 11 : LEFT + 11;
      page.drawText(safe, { x, y: y - 10, size: 9, font: selected.pdf, color: ink, maxWidth: RIGHT - LEFT - 22 });
      y -= 14;
    }
    y -= 10;
  }

  const generated = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(generatedAt));
  pages.forEach((target, index) => {
    target.drawLine({ start: { x: LEFT, y: 44 }, end: { x: RIGHT, y: 44 }, color: rule, thickness: 0.7 });
    const footerLeft = safeText(bodyShape, t.stoppedAt(generated));
    const footerCenter = safeText(bodyShape, t.createdWith);
    target.drawText(footerLeft, { x: LEFT, y: 29, size: 7.2, font: bodyFont, color: muted, maxWidth: 220 });
    target.drawText(footerCenter, { x: centerX(bodyFont, footerCenter, 7.2), y: 29, size: 7.2, font: bodyFont, color: muted });
    const pageNo = safeText(bodyShape, t.page(index + 1, pages.length));
    target.drawText(pageNo, { x: RIGHT - bodyFont.widthOfTextAtSize(pageNo, 7.2), y: 29, size: 7.2, font: bodyFont, color: muted });
  });
  return document.save({ useObjectStreams: true });
}
