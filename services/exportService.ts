
import { Chapter, Book } from "../types";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export const exportToTxt = (chapters: Chapter[], title?: string) => {
    const content = chapters.map(c => c.content).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'book').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToPdf = (chapters: Chapter[], title?: string) => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.text(title || "Untitled Book", margin, y);
    y += 20;

    doc.setFontSize(12);
    chapters.forEach((ch, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(ch.content, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 7 + 10;
    });

    doc.save(`${(title || 'book').replace(/\s+/g, '_')}.pdf`);
};

export const exportToDocx = async (chapters: Chapter[], title?: string) => {
    const children = chapters.map(ch => {
        return new Paragraph({
            children: [new TextRun(ch.content)],
            heading: HeadingLevel.BODY,
        });
    });

    const doc = new Document({
        sections: [{ properties: {}, children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'book').replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToSsbf = (book: Book) => {
    const data = {
        format: 'storyspark-book-file',
        version: '1.0',
        ...book
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(book.title || 'book').replace(/\s+/g, '_')}.ssbf`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportToEpub = (chapters: Chapter[], title?: string) => {
    // Placeholder for EPUB generation (complex without a dedicated library)
    alert("EPUB export is coming soon!");
};

export const downloadDevLog = (prompt: string, response: string, provider: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = `--- STORYSPARK AI LOG ---\nDate: ${new Date().toLocaleString()}\nProvider: ${provider}\n\n--- INPUT PROMPT ---\n${prompt}\n\n--- AI RESPONSE ---\n${response}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_log_${provider.toLowerCase()}_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};
