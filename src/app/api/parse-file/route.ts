import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();
    let text = "";

    if (ext === "txt" || ext === "md" || ext === "markdown" || ext === "text") {
      text = await file.text();
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === "pdf") {
      const pdfModule = await import("pdf-parse");
      const pdfParse = (pdfModule as any).default || pdfModule;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .txt, .md, .docx, or .pdf" },
        { status: 400 },
      );
    }

    const title = fileName.replace(
      /\.(txt|md|markdown|text|docx|doc|pdf)$/i,
      "",
    );

    return NextResponse.json({ title, content: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to parse file";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
