// Renders an AnalysisResult into a formatted .docx, so a report author can
// hand the accessibility findings to a client or stakeholder without asking
// them to read raw CLI/JSON output. Layout: title page, an overall summary,
// then one section per page  -  each with its own category breakdown and
// findings table, so a reviewer can jump straight to the page they're
// fixing rather than cross-referencing a single report-wide table.

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  ShadingType,
  BorderStyle,
} from "docx";
import { describeVisual, type AnalysisResult, type Category, type Issue, type PageReport, type Severity } from "./rulesEngine";

// Human-readable labels for the internal category keys (camelCase, meant for
// JSON/code) so the Word document never shows raw identifiers like "altText"
// or "tabOrder" to a non-technical reader.
const CATEGORY_LABELS: Record<Category, string> = {
  contrast: "Contrast",
  colourblind: "Colour blindness",
  altText: "Alternative text",
  clutter: "Clutter",
  pageTitles: "Page titles",
  visualTitles: "Visual titles",
  axisTitles: "Axis titles",
  fontScaling: "Font scaling",
  tabOrder: "Tab order",
  targetSize: "Target size",
  other: "Other",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  fail: "Fail",
  warn: "Warning",
  pass: "Pass",
  info: "Info",
};

// Light background fills so the table reads at a glance without relying on
// text colour alone (keeps the document itself accessible).
const SEVERITY_FILL: Record<Severity, string> = {
  fail: "F8D7DA",
  warn: "FFF3CD",
  pass: "D4EDDA",
  info: "E2E3E5",
};

const HEADER_FILL = "1F3864";

function cell(text: string, opts: { bold?: boolean; fill?: string; color?: string; width?: number } = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { type: ShadingType.SOLID, color: opts.fill, fill: opts.fill } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            color: opts.color,
          }),
        ],
      }),
    ],
  });
}

function headerRow(labels: string[], widths: number[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) => cell(l, { bold: true, fill: HEADER_FILL, color: "FFFFFF", width: widths[i] })),
  });
}

function noBorderTable(rows: TableRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    },
  });
}

function summaryTable(result: AnalysisResult): Table {
  const rows: TableRow[] = [headerRow(["Category", "Fails", "Warnings"], [50, 25, 25])];
  for (const [category, counts] of Object.entries(result.summary.byCategory)) {
    if (counts.fail === 0 && counts.warn === 0) continue;
    rows.push(
      new TableRow({
        children: [
          cell(CATEGORY_LABELS[category as Category] ?? category),
          cell(String(counts.fail), { fill: counts.fail > 0 ? SEVERITY_FILL.fail : undefined }),
          cell(String(counts.warn), { fill: counts.warn > 0 ? SEVERITY_FILL.warn : undefined }),
        ],
      }),
    );
  }
  if (rows.length === 1) {
    rows.push(
      new TableRow({
        children: [cell("No issues found", { fill: SEVERITY_FILL.pass }), cell("0"), cell("0")],
      }),
    );
  }
  return noBorderTable(rows);
}

// All issues on a page, whether authored at the page level (tab order,
// clutter, page titles) or on one of its visuals  -  the shared source list
// for both the per-page category breakdown and the detailed findings table
// below it, so the two always agree with each other.
function allPageIssues(page: PageReport): { issue: Issue; visualName: string | null }[] {
  const visualIssues = page.visuals.flatMap((v) =>
    v.issues.map((issue) => ({ issue, visualName: describeVisual(v.visual) })),
  );
  const pageLevel = page.issues.map((issue) => ({ issue, visualName: null as string | null }));
  return [...pageLevel, ...visualIssues];
}

// Small per-page category breakdown, shown directly above that page's
// findings table so a reviewer working through one page at a time doesn't
// need to cross-reference the single report-wide summary at the top.
function pageSummaryTable(all: { issue: Issue; visualName: string | null }[]): Table | null {
  if (all.length === 0) return null;
  const counts = new Map<Category, { fail: number; warn: number }>();
  for (const { issue } of all) {
    const c = counts.get(issue.category) ?? { fail: 0, warn: 0 };
    if (issue.severity === "fail") c.fail++;
    else if (issue.severity === "warn") c.warn++;
    counts.set(issue.category, c);
  }
  const rows: TableRow[] = [headerRow(["Category", "Fails", "Warnings"], [50, 25, 25])];
  for (const [category, c] of counts) {
    rows.push(
      new TableRow({
        children: [
          cell(CATEGORY_LABELS[category] ?? category),
          cell(String(c.fail), { fill: c.fail > 0 ? SEVERITY_FILL.fail : undefined }),
          cell(String(c.warn), { fill: c.warn > 0 ? SEVERITY_FILL.warn : undefined }),
        ],
      }),
    );
  }
  return noBorderTable(rows);
}

function pageFindingsTable(all: { issue: Issue; visualName: string | null }[]): Table | null {
  if (all.length === 0) return null;

  const rows: TableRow[] = [headerRow(["Severity", "Visual", "Issue", "Recommended fix"], [12, 20, 38, 30])];
  for (const { issue, visualName } of all) {
    rows.push(
      new TableRow({
        children: [
          cell(SEVERITY_LABEL[issue.severity], { fill: SEVERITY_FILL[issue.severity], bold: true }),
          cell(visualName ?? "Page"),
          cell(`${issue.title}\n${issue.detail}`),
          cell(issue.fix),
        ],
      }),
    );
  }
  return noBorderTable(rows);
}

export async function buildAccessibilityDocx(result: AnalysisResult, pages: PageReport[]): Promise<Buffer> {
  const generatedOn = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun("Power BI Accessibility Audit")],
    }),
    new Paragraph({
      children: [new TextRun({ text: result.fileName, bold: true, size: 28 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated ${generatedOn}`, italics: true, color: "666666" })],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "Overall accessibility score: ", bold: true }),
        new TextRun({ text: `${result.summary.overallScore} / 100`, bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(
          `${result.summary.pageCount} page(s) reviewed, ${result.summary.visualCount} visual(s), ${result.summary.issueCount} issue(s) found.`,
        ),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Overall summary by category")] }),
    summaryTable(result),
    new Paragraph({ text: "" }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Findings by page")] }),
  ];

  for (const page of pages) {
    const hiddenNote = page.page.hidden ? "  (hidden / drillthrough page)" : "";
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`${page.page.displayName}${hiddenNote}`)],
      }),
    );
    const all = allPageIssues(page);
    const pageSummary = pageSummaryTable(all);
    if (pageSummary) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Summary for this page")],
        }),
      );
      children.push(pageSummary);
      children.push(new Paragraph({ text: "" }));
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("Detailed findings")],
        }),
      );
    }
    const table = pageFindingsTable(all);
    if (table) {
      children.push(table);
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "No issues found on this page.", color: "2E7D32" })],
        }),
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated by pbir-a11y. Findings are automated heuristics and should be reviewed alongside a manual accessibility pass.",
          italics: true,
          size: 18,
          color: "999999",
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
