"""frontend-team/0X-*.md görev dosyalarını kulübün görsel kimliğiyle PDF'e çevirir.

Çalıştırma (depo kökünden): python frontend-team/create_pdfs.py
Çıktı: frontend-team/pdf/Kisi-N-*.pdf. Yazı tipleri Windows'taki Arial/Consolas'tır.
Renkler app/globals.css :root değerleriyle aynıdır.
"""
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, KeepTogether, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "pdf"
LOGO = ROOT / "public" / "club-logo.png"
FILES = [
    ("01-design-system.md", "Kisi-1-Tasarim-Sistemi.pdf"),
    ("02-homepage-conversion.md", "Kisi-2-Ana-Sayfa.pdf"),
    ("03-information-architecture.md", "Kisi-3-Bilgi-Mimarisi.pdf"),
    ("04-responsive-accessibility.md", "Kisi-4-Responsive-Erisilebilirlik.pdf"),
    ("05-motion-performance.md", "Kisi-5-Hareket-Performans.pdf"),
    ("06-quality-release.md", "Kisi-6-Kalite-Test.pdf"),
]

FONTS = {
    "Arial": "C:/Windows/Fonts/arial.ttf",
    "Arial-Bold": "C:/Windows/Fonts/arialbd.ttf",
    "Consolas": "C:/Windows/Fonts/consola.ttf",
}
rl_config.useA85 = 0  # ikili akışlar ASCII85'siz, dosya küçük kalır
for name, path in FONTS.items():
    pdfmetrics.registerFont(TTFont(name, path))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial", boldItalic="Arial-Bold")

# Sitenin :root renkleri (app/globals.css).
BG = colors.HexColor("#03051a")
PANEL = colors.HexColor("#11153d")
PANEL_DEEP = colors.HexColor("#0c0f2f")
BORDER = colors.HexColor("#252050")
TEXT = colors.HexColor("#eeeef3")
MUTED = colors.HexColor("#a6a4bd")
ACTION = colors.HexColor("#b32c9c")
ACCENT = colors.HexColor("#e066bd")
LINK = "#f19cdb"
CODE_BG = "#202454"
CODE_FG = "#f6dff0"
TAG_BG = colors.HexColor("#2b225e")
TAG_FG = colors.HexColor("#e0a8d6")

PAGE_W, PAGE_H = 595.28, 841.89
MARGIN = 34
HEADER_H = 56
FOOTER_H = 30

style = {
    "body": ParagraphStyle("body", fontName="Arial", fontSize=8.4, leading=11.4, textColor=TEXT),
    "muted": ParagraphStyle("muted", fontName="Arial", fontSize=8.6, leading=12, textColor=MUTED),
    "lead": ParagraphStyle("lead", fontName="Arial", fontSize=8.8, leading=12.4, textColor=TEXT),
    "item": ParagraphStyle("item", fontName="Arial", fontSize=8.1, leading=10.9, textColor=TEXT),
    "note": ParagraphStyle("note", fontName="Arial", fontSize=7.8, leading=10.8, textColor=MUTED),
    "title": ParagraphStyle("title", fontName="Arial-Bold", fontSize=19.5, leading=23, textColor=TEXT),
    "kicker": ParagraphStyle("kicker", fontName="Arial-Bold", fontSize=7.4, leading=9, textColor=ACCENT, alignment=1),
    "section": ParagraphStyle("section", fontName="Arial-Bold", fontSize=10.2, leading=12.4, textColor=TEXT),
}


BASE_SIZES = {name: (st.fontSize, st.leading) for name, st in style.items()}


def set_scale(scale: float) -> None:
    for name, (size, leading) in BASE_SIZES.items():
        style[name].fontSize = size * scale
        style[name].leading = leading * scale


def tr_upper(text: str) -> str:
    """Türkçe büyük harf: i → İ, ı → I (str.upper bunu yapmaz)."""
    return text.replace("i", "İ").replace("ı", "I").upper()


PAD = '<font size="2.5"> </font>'  # kod kutusunun dar iç boşluğu; Türkçe ek kutuya yapışık kalır


def inline(text: str) -> str:
    """Markdown satır içi biçimini ReportLab Paragraph işaretlemesine çevirir."""
    codes: list[str] = []

    def keep_code(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", keep_code, text)
    text = escape(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)",
                  lambda m: f'<a href="{m.group(2)}" color="{LINK}"><u>{m.group(1)}</u></a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return re.sub(r"\x00(\d+)\x00", lambda m: (
        f'<font face="Consolas" size="7.8" color="{CODE_FG}" backColor="{CODE_BG}">{PAD}{escape(codes[int(m.group(1))])}{PAD}</font>'), text)


def parse(md: str):
    """# başlık ve ## bölümlerinden oluşan görev dosyasını ayrıştırır."""
    title, sections, current = "", [], None
    for raw in md.splitlines():
        line = raw.rstrip()
        if line.startswith("# "):
            title = line[2:].strip()
        elif line.startswith("## "):
            m = re.match(r"(\d+)\.\s+([^(]+?)\s*(\(.*\))?$", line[3:].strip())
            current = {"num": m.group(1), "name": m.group(2), "hint": (m.group(3) or "").strip("()"), "blocks": []}
            sections.append(current)
        elif current is None or not line.strip():
            continue
        elif line.startswith("- [ ] "):
            m = re.match(r"- \[ \] \*\*(P\d)\*\*\s+(.*)", line)
            current["blocks"].append(("task", m.group(1), m.group(2)))
        elif line.startswith("- "):
            current["blocks"].append(("item", line[2:]))
        elif line.startswith("> "):
            current["blocks"].append(("note", line[2:]))
        else:
            current["blocks"].append(("para", line))
    return title, sections


class NumberBadge(Flowable):
    """Ana sayfadaki "Çalışma Akışı" adımları gibi magenta daire içinde numara."""

    def __init__(self, num: str, size: float = 14):
        super().__init__()
        self.num, self.size = num, size

    def wrap(self, *_):
        return self.size, self.size

    def draw(self):
        c, r = self.canv, self.size / 2
        c.setFillColor(ACTION)
        c.circle(r, r, r, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Arial-Bold", 8.4)
        c.drawCentredString(r, r - 3, self.num)


class Pill(Flowable):
    """Öncelik etiketi: P0/P1 dolu magenta, P2 sitedeki kategori etiketi, P3 sönük."""

    def __init__(self, label: str):
        super().__init__()
        self.label = label

    def wrap(self, *_):
        return 22, 11

    def draw(self):
        c = self.canv
        fill, fg = {"P0": (ACCENT, colors.white), "P1": (ACTION, colors.white),
                    "P2": (TAG_BG, TAG_FG)}.get(self.label, (PANEL_DEEP, MUTED))
        c.setFillColor(fill)
        c.roundRect(0, 0, 22, 11, 3, stroke=0, fill=1)
        c.setFillColor(fg)
        c.setFont("Arial-Bold", 6.8)
        c.drawCentredString(11, 3.1, self.label)


class Checkbox(Flowable):
    def wrap(self, *_):
        return 9, 9

    def draw(self):
        self.canv.setStrokeColor(ACCENT)
        self.canv.setLineWidth(0.9)
        self.canv.roundRect(0, 0, 9, 9, 2, stroke=1, fill=0)


def panel(content, width, pad=8):
    """Sitedeki kart/panel görünümü: koyu zemin, ince mor kenarlık, yuvarlak köşe."""
    t = Table([[content]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), pad), ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad - 1), ("BOTTOMPADDING", (0, 0), (-1, -1), pad - 1),
    ]))
    return t


def section_heading(sec, width):
    hint = f'  <font name="Arial" size="7.8" color="#a6a4bd">{escape(sec["hint"])}</font>' if sec["hint"] else ""
    t = Table([[NumberBadge(sec["num"]), Paragraph(escape(sec["name"]) + hint, style["section"])]],
              colWidths=[21, width - 21])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]))
    return t


def bullet_rows(items, width, marker="•"):
    rows = [[Paragraph(f'<font color="#e066bd">{marker}</font>', style["item"]), Paragraph(inline(i), style["item"])]
            for i in items]
    t = Table(rows, colWidths=[10, width - 10])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0.8),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0.8)]))
    return t


def section_body(sec, width):
    flow, items = [], []

    def flush():
        if items:
            flow.append(bullet_rows(items, width))
            items.clear()

    tasks = [b for b in sec["blocks"] if b[0] == "task"]
    if tasks:
        rows = [[Checkbox(), Pill(p), Paragraph(inline(text), style["item"])] for _, p, text in tasks]
        t = Table(rows, colWidths=[14, 28, width - 42])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 2.6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.6),
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
        ]))
        return [t]
    for block in sec["blocks"]:
        kind = block[0]
        if kind == "item":
            items.append(block[1])
            continue
        flush()
        if kind == "para":
            flow.append(Paragraph(inline(block[1]), style["lead"] if sec["num"] == "1" else style["body"]))
        elif kind == "note":
            flow.append(Spacer(1, 3))
            flow.append(Paragraph(inline(block[1]), style["note"]))
    flush()
    return flow


def build_section(sec, width):
    inner = width - 20
    return KeepTogether([panel([section_heading(sec, inner), *section_body(sec, inner)], width), Spacer(1, 5)])


def two_up(left, right, width, gap=8):
    half = (width - gap) / 2
    t = Table([[panel([section_heading(left, half - 20), *section_body(left, half - 20)], half), "",
                panel([section_heading(right, half - 20), *section_body(right, half - 20)], half)]],
              colWidths=[half, gap, half])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return t


_LOGO = None


def logo_image() -> ImageReader:
    """Logo 38 pt'de çizilir; 200 px'e küçültmek baskı kalitesini korur, dosyayı küçültür."""
    global _LOGO
    if _LOGO is None:
        from PIL import Image
        img = Image.open(LOGO).convert("RGBA")
        img.thumbnail((200, 200), Image.LANCZOS)
        _LOGO = ImageReader(img)
    return _LOGO


def draw_page(canvas, doc):
    c = canvas
    c.saveState()
    # Zemin, sol üstte mor ışıma ve sitedeki noktalı doku.
    c.setFillColor(BG)
    c.rect(-2, -2, PAGE_W + 4, PAGE_H + 4, stroke=0, fill=1)  # kesirli A4 kenarında beyaz çizgi kalmasın
    c.radialGradient(70, PAGE_H - 40, 340, [colors.HexColor("#2a0f3d"), BG], extend=False)
    c.radialGradient(PAGE_W - 40, 120, 300, [colors.HexColor("#0f1440"), BG], extend=False)
    dots = c.beginPath()
    for x in range(14, int(PAGE_W), 18):
        for y in range(14, int(PAGE_H), 18):
            dots.rect(x - 0.5, y - 0.5, 1, 1)
    c.setFillColor(colors.HexColor("#0d1035"))
    c.drawPath(dots, stroke=0, fill=1)
    # Üst bilgi: sitedeki marka bloğu.
    top = PAGE_H - MARGIN
    logo = logo_image()
    c.drawImage(logo, MARGIN, top - 38, width=38, height=38, mask="auto", preserveAspectRatio=True)
    c.setFillColor(TEXT)
    c.setFont("Arial-Bold", 11)
    c.drawString(MARGIN + 46, top - 16, "YAZILIM ATÖLYESİ")
    c.setFillColor(MUTED)
    c.setFont("Arial", 6.8)
    c.drawString(MARGIN + 46, top - 28, "GÖNÜLLÜ YAZILIM KULÜBÜ")
    label = "FRONTEND SPRİNTİ · BİR HAFTALIK GÖREV KARTI"
    c.setFont("Arial-Bold", 6.8)
    w = c.stringWidth(label, "Arial-Bold", 6.8) + 18
    c.setStrokeColor(BORDER)
    c.setFillColor(PANEL_DEEP)
    c.roundRect(PAGE_W - MARGIN - w, top - 27, w, 17, 8.5, stroke=1, fill=1)
    c.setFillColor(TEXT)
    c.drawCentredString(PAGE_W - MARGIN - w / 2, top - 21, label)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(MARGIN, top - HEADER_H + 10, PAGE_W - MARGIN, top - HEADER_H + 10)
    # Alt bilgi.
    c.line(MARGIN, MARGIN + FOOTER_H - 10, PAGE_W - MARGIN, MARGIN + FOOTER_H - 10)
    c.setFillColor(ACTION)
    c.roundRect(MARGIN, MARGIN + FOOTER_H - 12.5, 60, 5, 2.5, stroke=0, fill=1)
    c.setFillColor(MUTED)
    c.setFont("Arial", 6.8)
    c.drawString(MARGIN, MARGIN + 4, "İstanbul Gedik Üniversitesi Yazılım Atölyesi · Frontend sprinti · Ekim 2026")
    c.drawRightString(PAGE_W - MARGIN, MARGIN + 4, f"frontend-team/{doc.source}  ·  {doc.page}")
    c.restoreState()


def build(md_name: str, pdf_name: str) -> int:
    title, sections = parse((HERE / md_name).read_text(encoding="utf-8"))
    person, _, heading = title.partition(" — ")
    width = PAGE_W - 2 * MARGIN
    doc = BaseDocTemplate(str(OUT / pdf_name), pagesize=(PAGE_W, PAGE_H), title=f"{person}: {heading}",
                          author="Yazılım Atölyesi", subject="Frontend sprinti görev kartı", pageCompression=1,
                          leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN + HEADER_H,
                          bottomMargin=MARGIN + FOOTER_H)
    doc.source = md_name
    frame = Frame(MARGIN, MARGIN + FOOTER_H, width, PAGE_H - 2 * MARGIN - HEADER_H - FOOTER_H,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="card", frames=[frame], onPage=draw_page)])
    kicker = Table([[Paragraph(f"{escape(tr_upper(person))} / {len(FILES)}", style["kicker"])]], colWidths=[64])
    kicker.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.7, ACTION), ("ROUNDEDCORNERS", [9, 9, 9, 9]),
                                ("BACKGROUND", (0, 0), (-1, -1), PANEL_DEEP), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    kicker.hAlign = "LEFT"
    story = [kicker, Spacer(1, 5), Paragraph(escape(heading), style["title"]), Spacer(1, 6)]
    by_num = {s["num"]: s for s in sections}
    for num in ("1", "2", "3", "4"):
        story.append(build_section(by_num[num], width))
    story.append(two_up(by_num["5"], by_num["6"], width))
    doc.build(story)
    return doc.page


def missing_glyphs() -> set[str]:
    """Kullanılan tüm karakterlerin Arial'da bulunduğunu doğrular (kutu görünmesin)."""
    from fontTools.ttLib import TTFont as FT
    cmap = FT(FONTS["Arial"]).getBestCmap()
    used = set("".join((HERE / md).read_text(encoding="utf-8") for md, _ in FILES))
    return {ch for ch in used if ch not in "\n\r\t" and ord(ch) not in cmap}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    missing = missing_glyphs()
    if missing:
        sys.exit(f"Arial'da olmayan karakterler: {sorted(missing)}")
    OUT.mkdir(exist_ok=True)
    for md, pdf in FILES:
        # Her kart tek sayfa olmalı; sığmazsa yazı ölçeği %3'lük adımlarla küçülür.
        for scale in (1.0, 0.97, 0.94, 0.91):
            set_scale(scale)
            pages = build(md, pdf)
            if pages == 1:
                break
        print(f"{pdf}: {pages} sayfa (ölçek {scale:.2f})")
