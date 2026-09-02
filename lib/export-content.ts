import type { PlannerChat } from "./types";

const ACCENT = "7C3AED";
const INK = "1F2937";
const MUTED = "6B7280";
const EMERALD = "10B981";

export function buildExportMarkdown(chat: PlannerChat): string {
  const header = chat.title || "Контент-планнер";
  const lines: string[] = [
    "# Чат контент-планнера",
    ``,
    `Тема: ${header}`,
    `Дата: ${new Date(chat.updatedAt).toLocaleString("ru-RU")}`,
    ``,
    `=============================`,
    ``,
  ];
  for (const m of chat.messages) {
    lines.push(
      `### ${m.role === "user" ? "Пользователь" : "Агент"}`,
      ``,
      m.content,
      ``,
    );
    if (m.attachment) {
      lines.push(`Приложение: ${m.attachment.name}`, ``, m.attachment.text, ``);
    }
    lines.push(`---`, ``);
  }
  return lines.join("\n");
}

interface DocxKit {
  Paragraph: typeof import("docx").Paragraph;
  TextRun: typeof import("docx").TextRun;
  HeadingLevel: (typeof import("docx"))["HeadingLevel"];
}

type DynParagraph = InstanceType<typeof import("docx").Paragraph>;
type DynTextRun = InstanceType<typeof import("docx").TextRun>;

function parseInline(text: string, kit: DocxKit): DynTextRun[] {
  const { TextRun } = kit;
  const runs: DynTextRun[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index) }));
    }
    if (m[1]) runs.push(new TextRun({ text: m[1], bold: true }));
    else if (m[2]) runs.push(new TextRun({ text: m[2], italics: true }));
    else if (m[3])
      runs.push(new TextRun({ text: m[3], font: "Consolas", color: ACCENT }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs;
}

function contentToDocx(content: string, kit: DocxKit): DynParagraph[] {
  const { Paragraph, HeadingLevel } = kit;
  const out: DynParagraph[] = [];
  const lines = content.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^#{1,3}\s+/.test(line)) {
      const cnt = line.match(/^#+/)?.[0].length ?? 1;
      out.push(
        new Paragraph({
          heading: cnt === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: parseInline(line.replace(/^#+\s+/, ""), kit),
        }),
      );
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      out.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseInline(line.replace(/^[-*•]\s+/, ""), kit),
        }),
      );
      continue;
    }

    if (/^\*\*.+\*\*$/.test(line)) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [
            new kit.TextRun({
              text: line.replace(/\*+/g, ""),
              bold: true,
              color: ACCENT,
              size: 24,
            }),
          ],
        }),
      );
      continue;
    }

    out.push(
      new Paragraph({
        spacing: { after: 90 },
        children: parseInline(line, kit),
      }),
    );
  }
  return out;
}

export async function buildExportDocx(chat: PlannerChat): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Footer,
    PageNumber,
    BorderStyle,
  } = await import("docx");

  const kit: DocxKit = { Paragraph, TextRun, HeadingLevel };

  const title = chat.title || "Контент-план";
  const updated = new Date(chat.updatedAt);
  const dateStr = updated.toLocaleString("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const children: DynParagraph[] = [
    new Paragraph({ children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 52,
          color: ACCENT,
          font: "Segoe UI",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "Контент-план · In Motion",
          size: 24,
          color: MUTED,
          font: "Segoe UI",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Сформирован ${dateStr} · сообщений: ${chat.messages.length}`,
          size: 20,
          color: MUTED,
          font: "Segoe UI",
        }),
      ],
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
      },
      children: [],
    }),
    new Paragraph({ children: [] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 100, after: 160 },
      children: [new TextRun({ text: "Диалог", bold: true, color: ACCENT })],
    }),
  ];

  chat.messages.forEach((m) => {
    const isUser = m.role === "user";
    const when = new Date(m.createdAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    children.push(
      new Paragraph({
        spacing: { before: 260, after: 60 },
        border: {
          left: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: isUser ? EMERALD : ACCENT,
          },
        },
        children: [
          new TextRun({
            text: `${isUser ? "ВЫ" : "КОНТЕНТ-ПЛАННЕР"} · ${when}`,
            bold: true,
            color: isUser ? EMERALD : ACCENT,
            size: 20,
            font: "Segoe UI",
          }),
        ],
      }),
    );
    children.push(...contentToDocx(m.content, kit));
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Segoe UI", size: 22, color: INK },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 32, bold: true, color: ACCENT, font: "Segoe UI" },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 26, bold: true, color: "6D28D9", font: "Segoe UI" },
          paragraph: { spacing: { before: 200, after: 100 }, keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "In Motion · Контент-план · ",
                    size: 18,
                    color: MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: MUTED,
                  }),
                  new TextRun({ text: " из ", size: 18, color: MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
