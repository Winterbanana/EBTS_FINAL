from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from pathlib import Path

ROOT = Path(r"c:\xampp\htdocs\EBTS")
PNG_PATH = ROOT / "EBTS_Real_ERD.png"
PDF_PATH = ROOT / "EBTS_Real_Database_Design_Final.pdf"

# Actual schema confirmed from current project database and SQL files.
# No explicit SQL FOREIGN KEY constraints were found; relationships are logical references by matching IDs.
TABLES = {
    "wcc_users": [
        ("id", "VARCHAR(50)", "PK"),
        ("password", "VARCHAR(255)", ""),
        ("role", "ENUM('student','admin','staff')", ""),
        ("name", "VARCHAR(150)", ""),
        ("email", "VARCHAR(150)", ""),
        ("course", "VARCHAR(50)", ""),
        ("section", "VARCHAR(20)", ""),
        ("contact", "VARCHAR(30)", ""),
        ("can_borrow", "TINYINT(1)", ""),
        ("missing_item_debt", "DECIMAL(10,2)", ""),
        ("metadata_json", "LONGTEXT", ""),
    ],
    "wcc_equipment": [
        ("id", "VARCHAR(20)", "PK"),
        ("name", "VARCHAR(100)", ""),
        ("category", "VARCHAR(100)", ""),
        ("qrcode", "VARCHAR(100)", ""),
        ("total_stock", "INT", ""),
        ("available_stock", "INT", ""),
        ("borrowed_stock", "INT", ""),
        ("status", "VARCHAR(20)", ""),
        ("borrowed_by", "VARCHAR(200)", ""),
        ("borrow_date", "DATE", ""),
        ("due_date", "DATE", ""),
        ("quality_condition", "VARCHAR(20)", ""),
        ("last_condition_update", "DATE", ""),
        ("condition_notes", "TEXT", ""),
        ("last_borrowed_by", "VARCHAR(200)", ""),
        ("metadata_json", "LONGTEXT", ""),
        ("brand", "VARCHAR(100)", ""),
        ("program", "VARCHAR(120)", ""),
        ("photo_url", "VARCHAR(255)", ""),
        ("marked_missing_date", "DATE", ""),
        ("marked_missing_by", "VARCHAR(100)", ""),
    ],
    "wcc_transactions": [
        ("id", "VARCHAR(20)", "PK"),
        ("student_id", "VARCHAR(50)", "FK"),
        ("student_name", "VARCHAR(150)", ""),
        ("student_course", "VARCHAR(50)", ""),
        ("student_contact", "VARCHAR(30)", ""),
        ("equipment_id", "VARCHAR(20)", "FK"),
        ("equipment_name", "VARCHAR(100)", ""),
        ("equipment_qrcode", "VARCHAR(100)", ""),
        ("request_date", "DATE", ""),
        ("due_date", "DATE", ""),
        ("borrow_time", "VARCHAR(10)", ""),
        ("due_time", "VARCHAR(10)", ""),
        ("return_date", "DATE", ""),
        ("return_time", "VARCHAR(10)", ""),
        ("status", "VARCHAR(20)", ""),
        ("approved_by", "VARCHAR(100)", ""),
        ("approved_date", "DATE", ""),
        ("condition_before", "VARCHAR(20)", ""),
        ("condition_after", "VARCHAR(20)", ""),
        ("condition_notes", "TEXT", ""),
        ("metadata_json", "LONGTEXT", ""),
        ("equipment_brand", "VARCHAR(100)", ""),
        ("equipment_program", "VARCHAR(120)", ""),
        ("resolution_status", "VARCHAR(20)", ""),
    ],
    "wcc_transaction_logs": [
        ("log_id", "INT AUTO_INCREMENT", "PK"),
        ("transaction_id", "VARCHAR(20)", "FK"),
        ("event", "VARCHAR(100)", ""),
        ("actor", "VARCHAR(150)", ""),
        ("event_date", "DATE", ""),
        ("detail", "TEXT", ""),
        ("created_at", "TIMESTAMP", ""),
    ],
    "wcc_penalty_records": [
        ("id", "INT AUTO_INCREMENT", "PK"),
        ("transaction_id", "VARCHAR(20)", "FK"),
        ("student_id", "VARCHAR(50)", "FK"),
        ("student_name", "VARCHAR(150)", ""),
        ("equipment_name", "VARCHAR(100)", ""),
        ("penalty_type", "VARCHAR(50)", ""),
        ("amount", "DECIMAL(10,2)", ""),
        ("overdue_hours", "INT", ""),
        ("penalty_paid", "TINYINT(1)", ""),
        ("payment_method", "VARCHAR(50)", ""),
        ("payment_date", "DATE", ""),
        ("return_date", "DATE", ""),
        ("created_at", "TIMESTAMP", ""),
        ("overdue_days", "INT", ""),
    ],
    "wcc_app_state": [
        ("id", "TINYINT UNSIGNED", "PK"),
        ("state_json", "LONGTEXT", ""),
        ("updated_at", "TIMESTAMP", ""),
    ],
}

# logical relationships verified from actual project code (matching IDs in the app and SQL):
RELATIONSHIPS = [
    ("wcc_users.id", "wcc_transactions.student_id", "One-to-Many", "student_id → id"),
    ("wcc_equipment.id", "wcc_transactions.equipment_id", "One-to-Many", "equipment_id → id"),
    ("wcc_transactions.id", "wcc_transaction_logs.transaction_id", "One-to-Many", "transaction_id → id"),
    ("wcc_transactions.id", "wcc_penalty_records.transaction_id", "One-to-Many", "transaction_id → id"),
    ("wcc_users.id", "wcc_penalty_records.student_id", "One-to-Many", "student_id → id"),
]

# Layout
img_w, img_h = 2400, 1700
bg = "white"
box_fill = (245, 247, 252)
header_fill = (15, 23, 42)
line_color = (59, 130, 246)
text_color = (15, 23, 42)
muted = (71, 85, 105)
pk_color = (16, 185, 129)
fk_color = (245, 158, 11)
legend_box = (239, 246, 255)

img = Image.new("RGB", (img_w, img_h), bg)
draw = ImageDraw.Draw(img)

font_path = "C:/Windows/Fonts/calibri.ttf"
# Fall back to default if needed
try:
    title_font = ImageFont.truetype(font_path, 34)
    section_font = ImageFont.truetype(font_path, 20)
    table_font = ImageFont.truetype(font_path, 18)
    body_font = ImageFont.truetype(font_path, 15)
    small_font = ImageFont.truetype(font_path, 12)
except Exception:
    title_font = ImageFont.load_default()
    section_font = ImageFont.load_default()
    table_font = ImageFont.load_default()
    body_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# title and legend
header = "EBTS Real Database ERD (Current Project Schema)"
draw.text((60, 35), header, fill=text_color, font=title_font)

# legend block
legend_x, legend_y, legend_w, legend_h = 1650, 100, 600, 140
draw.rounded_rectangle((legend_x, legend_y, legend_x + legend_w, legend_y + legend_h), radius=12, fill=legend_box, outline=(148, 163, 184), width=2)
draw.text((legend_x + 22, legend_y + 18), "Legend", fill=text_color, font=section_font)

# PK and FK markers
pk_box = (legend_x + 24, legend_y + 54, legend_x + 120, legend_y + 78)
fk_box = (legend_x + 24, legend_y + 88, legend_x + 120, legend_y + 112)
draw.rectangle(pk_box, fill=pk_color)
draw.rectangle(fk_box, fill=fk_color)
draw.text((legend_x + 140, legend_y + 48), "PK = Primary Key", fill=text_color, font=small_font)
draw.text((legend_x + 140, legend_y + 82), "FK = Logical reference column", fill=text_color, font=small_font)

draw.text((legend_x + 22, legend_y + 120), "Note: No explicit SQL FOREIGN KEY constraints were found in the current project schema.", fill=muted, font=small_font)

# table positions
positions = {
    "wcc_users": (80, 200, 500, 630),
    "wcc_equipment": (610, 200, 1030, 760),
    "wcc_transactions": (1100, 200, 1720, 980),
    "wcc_transaction_logs": (80, 760, 500, 1130),
    "wcc_penalty_records": (610, 820, 1080, 1360),
    "wcc_app_state": (1160, 1050, 1710, 1320),
}

def draw_box(x1, y1, x2, y2, title, rows):
    padding = 18
    title_h = 54
    draw.rounded_rectangle((x1, y1, x2, y2), radius=14, fill=box_fill, outline=(148, 163, 184), width=2)
    draw.rounded_rectangle((x1, y1, x2, y1 + title_h), radius=14, fill=header_fill, outline=(15, 23, 42), width=1)
    draw.text((x1 + 18, y1 + 16), title, fill="white", font=table_font)
    y = y1 + title_h + 12
    for name, dtype, kind in rows:
        if kind == "PK":
            color = pk_color
        elif kind == "FK":
            color = fk_color
        else:
            color = (71, 85, 105)
        draw.text((x1 + 12, y), f"{name}", fill=text_color, font=body_font)
        draw.text((x1 + 200, y), dtype, fill=muted, font=body_font)
        if kind:
            draw.rounded_rectangle((x1 + 420, y - 2, x1 + 470, y + 18), radius=4, fill=color)
            draw.text((x1 + 432, y), kind, fill="white", font=small_font)
        y += 30

for table_name, rows in TABLES.items():
    x1, y1, x2, y2 = positions[table_name]
    draw_box(x1, y1, x2, y2, table_name, rows)

# relationship drawing helpers

def arrow(start, end, label):
    x1, y1 = start
    x2, y2 = end
    draw.line((x1, y1, x2, y2), fill=line_color, width=3)
    # arrow head
    angle = 0.5 if x2 > x1 else -0.5
    dx = x2 - x1
    dy = y2 - y1
    length = (dx**2 + dy**2) ** 0.5
    if length == 0:
        return
    ux, uy = dx / length, dy / length
    px, py = x2 - 20 * ux, y2 - 20 * uy
    # arrow head points to end
    hx1 = px - 14 * (-uy) - 10 * ux
    hy1 = py - 14 * ux - 10 * uy
    hx2 = px + 14 * (-uy) - 10 * ux
    hy2 = py + 14 * ux - 10 * uy
    tri = [(x2, y2), (hx1, hy1), (hx2, hy2)]
    draw.polygon(tri, fill=line_color, outline=line_color)
    draw.text((min(x1, x2) + abs(x2 - x1) / 2 - 35, min(y1, y2) + abs(y2 - y1) / 2 - 18), label, fill=(30, 64, 175), font=small_font)

# relationship anchors
# wcc_users -> wcc_transactions
arrow((500, 455), (1100, 420), "1:N")
# wcc_equipment -> wcc_transactions
arrow((1030, 470), (1100, 470), "1:N")
# wcc_transactions -> wcc_transaction_logs
arrow((1450, 980), (1450, 1120), "1:N")
# wcc_transactions -> wcc_penalty_records
arrow((1720, 620), (1080, 880), "1:N")
# wcc_users -> wcc_penalty_records
arrow((500, 520), (610, 910), "1:N")

# Bottom note
note = "Verified current project schema: six tables; no explicit SQL FOREIGN KEY constraints found in the current implementation. Logical relationships are based on matching IDs used in code and persistence logic."
wrapped = []
for i in range(0, len(note), 120):
    wrapped.append(note[i:i+120])
for idx, line in enumerate(wrapped[:3]):
    draw.text((60, 1500 + idx * 26), line, fill=muted, font=small_font)

img.save(PNG_PATH)

# Build final PDF with the ERD and summary pages
pdf = canvas.Canvas(str(PDF_PATH), pagesize=landscape(A4))
page_w, page_h = landscape(A4)

# Page 1: title and summary
pdf.setTitle("EBTS Real Database Design")
pdf.setFillColor(HexColor('#0f172a'))
pdf.setFont('Helvetica-Bold', 26)
pdf.drawString(52, page_h - 60, 'Equipment Borrowing and Tracking Return System')
pdf.setFont('Helvetica-Bold', 18)
pdf.setFillColor(HexColor('#1d4ed8'))
pdf.drawString(52, page_h - 100, 'Database Design and ERD')
pdf.setFillColor(HexColor('#334155'))
pdf.setFont('Helvetica', 12)
text_lines = [
    'Database Technology: MySQL (verified in api/index.php and the current database instance)',
    'Database Name: wcc_equipment_system',
    'Current Tables: wcc_users, wcc_equipment, wcc_transactions, wcc_transaction_logs, wcc_penalty_records, wcc_app_state',
    'Verification: Table names and columns were confirmed from the actual project SQL schema and live MySQL inspection.',
    'Important Note: No explicit SQL FOREIGN KEY constraints were found in the current implementation; logical relationships are based on matching primary and reference IDs used by the application.',
]
for i, line in enumerate(text_lines):
    pdf.drawString(52, page_h - 150 - i * 28, line)

# Page 2: actual ERD image
img_reader = ImageReader(str(PNG_PATH))
pdf.showPage()
pdf.drawImage(img_reader, 30, 30, width=page_w - 60, height=page_h - 80)

# Page 3: table summary
pdf.showPage()
pdf.setFillColor(HexColor('#0f172a'))
pdf.setFont('Helvetica-Bold', 20)
pdf.drawString(52, page_h - 60, 'Table and Relationship Summary')
pdf.setFont('Helvetica', 11)
summary_y = page_h - 110
for table_name, rows in TABLES.items():
    if summary_y < 120:
        pdf.showPage()
        summary_y = page_h - 80
        pdf.setFont('Helvetica-Bold', 18)
        pdf.drawString(52, page_h - 50, 'Table and Relationship Summary (continued)')
        pdf.setFont('Helvetica', 10)
    pdf.setFillColor(HexColor('#1d4ed8'))
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(52, summary_y, table_name)
    summary_y -= 18
    pdf.setFont('Helvetica', 10)
    pdf.setFillColor(HexColor('#334155'))
    pk_list = [r[0] for r in rows if r[2] == 'PK']
    fk_list = [r[0] for r in rows if r[2] == 'FK']
    pdf.drawString(72, summary_y, f"Primary Key: {', '.join(pk_list) if pk_list else 'NOT VERIFIED / none'}")
    summary_y -= 16
    pdf.drawString(72, summary_y, f"Logical Foreign Keys: {', '.join(fk_list) if fk_list else 'None found'}")
    summary_y -= 20
    for col in rows[:4]:
        pdf.drawString(72, summary_y, f"- {col[0]} : {col[1]} {('['+col[2]+']') if col[2] else ''}")
        summary_y -= 14
    summary_y -= 10

pdf.setFillColor(HexColor('#0f172a'))
pdf.setFont('Helvetica-Bold', 14)
pdf.drawString(52, 90, 'Verified Relationships')
pdf.setFont('Helvetica', 11)
rel_y = 68
for src, dst, kard, note in RELATIONSHIPS:
    rel_y -= 18
    if rel_y < 40:
        pdf.showPage(); rel_y = page_h - 70
        pdf.setFont('Helvetica-Bold', 14)
        pdf.drawString(52, page_h - 50, 'Verified Relationships (continued)')
        pdf.setFont('Helvetica', 11)
    pdf.drawString(52, rel_y, f"{src} -> {dst} | Relationship: {kard} | Logical reference: {note}")

pdf.save()
print(f"ERD PNG created: {PNG_PATH}")
print(f"Final PDF created: {PDF_PATH}")
