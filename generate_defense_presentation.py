from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

OUTPUT = r"c:\xampp\htdocs\EBTS\EBTS_Project_Defense_Presentation.pdf"

styles = getSampleStyleSheet()
base = ParagraphStyle(
    'Base',
    parent=styles['BodyText'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=HexColor('#1f2937'),
    spaceAfter=4,
)

title_style = ParagraphStyle(
    'SlideTitle',
    parent=styles['Title'],
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=22,
    textColor=HexColor('#0f172a'),
    spaceAfter=12,
)

subtitle_style = ParagraphStyle(
    'Subtitle',
    parent=base,
    fontName='Helvetica-Bold',
    fontSize=9,
    textColor=HexColor('#374151'),
    leading=11,
)

small_style = ParagraphStyle(
    'Small',
    parent=base,
    fontSize=8,
    leading=10,
    textColor=HexColor('#374151'),
)

slides = [
    {
        "title": "Equipment Borrowing and Tracking Return System",
        "bullets": [
            "Presented by: Go, Johnree Mathew; Rucio, Jenson; Samson, John Patrick; Toledo, Eliezer Jacob; Tugade, Mark Joseph; Yap, Jashzel",
            "Course/Program: BSIT",
            "Instructor: Mrs. Arlene Garcia",
            "Institution: Global Reciprocal Colleges",
            "Date: October 17, 2026",
        ],
        "defense": "Provide a short professional opening statement introducing the project and its purpose.",
        "qa": "Q: What is the purpose of this system? A: It manages equipment borrowing, return tracking, and accountability in an organized digital workflow.",
    },
    {
        "title": "Project Overview",
        "bullets": [
            "The system manages equipment borrowing and return transactions.",
            "It supports student, staff, and administrator roles.",
            "It is intended for an academic or institutional environment with equipment lending operations.",
            "The main workflow includes request, approval, borrowing, return, and monitoring.",
            "It improves accountability and reduces manual tracking problems.",
        ],
        "defense": "Explain the overall purpose in simple but technical terms.",
        "qa": "Q: What is the main purpose of your system? A: To centralize equipment borrowing and return processes while keeping records accurate and accessible to authorized users.",
    },
    {
        "title": "Background of the Project",
        "bullets": [
            "Borrowing records were handled manually or in fragmented ways.",
            "It was difficult to monitor borrower details and due dates.",
            "Overdue or unreturned equipment were harder to identify.",
            "Inventory accuracy was affected by inconsistent record updates.",
            "The system was developed to improve accountability and tracking.",
        ],
        "defense": "Explain the problem that motivated the development of the system.",
        "qa": "Q: Why did you develop this system? A: Because equipment tracking needed a more organized and accountable process.",
    },
    {
        "title": "Statement of the Problem",
        "bullets": [
            "General Problem: lack of a reliable and centralized equipment borrowing and return system.",
            "Borrowing transactions were not always properly recorded.",
            "Borrowed equipment was difficult to track in real time.",
            "Return status and due dates were not monitored effectively.",
            "Accurate equipment records were difficult to maintain.",
            "Missing or unaccounted equipment could go unnoticed.",
        ],
        "defense": "Explain the difference between the general and specific problems.",
        "qa": "Q: What is your biggest problem? A: The lack of centralized monitoring for equipment records, borrowing status, and returns.",
    },
    {
        "title": "Project Objectives",
        "bullets": [
            "Develop an easy-to-use equipment borrowing system.",
            "Manage equipment records efficiently.",
            "Track borrowing and return transactions.",
            "Monitor equipment availability and status.",
            "Reduce manual recording errors.",
            "Improve information retrieval and reporting.",
            "Improve accountability for borrowed equipment.",
        ],
        "defense": "Explain how each objective relates to the actual system functions.",
        "qa": "Q: What is the main objective? A: To create a system that makes borrowing and return management more organized, accurate, and accountable.",
    },
    {
        "title": "Scope and Limitations",
        "bullets": [
            "Scope: user registration and login, equipment management, borrowing transactions, return tracking, history, dashboard, reports, and administrative management.",
            "Access is limited to authorized accounts.",
            "The system is designed for the covered equipment and organization.",
            "It is not a full enterprise asset management platform.",
            "It depends on system and network availability.",
        ],
        "defense": "Explain what the system covers and what is outside its current scope.",
        "qa": "Q: What does the system cover? A: It covers borrowing, return tracking, equipment records, user roles, dashboards, and reports.",
    },
    {
        "title": "Target Users",
        "bullets": [
            "Student: borrow equipment, view request status, and process returns.",
            "Staff/Personnel: support the borrowing workflow and monitor equipment operations.",
            "Administrator: manage users, equipment records, requests, reports, and overall system oversight.",
            "Role-based access is implemented to protect data and correct actions.",
        ],
        "defense": "Explain why different users have different permissions and access.",
        "qa": "Q: Why do you need different user roles? A: To separate responsibilities and prevent unauthorized actions.",
    },
    {
        "title": "Existing Process",
        "bullets": [
            "Manual or fragmented borrowing processes were used before the system.",
            "Borrower information was often kept separately from equipment records.",
            "Equipment availability was not always checked efficiently.",
            "Returns and due dates required constant monitoring.",
            "Manual reporting increased the chance of inaccurate inventory data.",
            "Problem → Effect: manual recording → higher risk of errors; fragmented records → harder status monitoring.",
        ],
        "defense": "Explain the weaknesses of the existing process without exaggerating them.",
        "qa": "Q: What was the problem in the existing process? A: It lacked a centralized and reliable way to manage equipment borrowing and returns.",
    },
    {
        "title": "Proposed System",
        "bullets": [
            "Existing Process → Proposed System: manual records → centralized digital records.",
            "Separate tracking methods → unified equipment and transaction records.",
            "Unclear availability → status tracking for available, borrowed, and missing items.",
            "Delayed return monitoring → due date and return status control.",
            "Weak accountability → role-based access and history tracking.",
        ],
        "defense": "Explain exactly how the proposed system solves the problems identified earlier.",
        "qa": "Q: How does the proposed system solve the issue? A: It centralizes records and automates status tracking and monitoring.",
    },
    {
        "title": "Major System Features",
        "bullets": [
            "Login and Authentication: user-based access and role validation.",
            "Dashboard: quick summary of system activity and equipment status.",
            "Equipment Management: add, view, and maintain records and stock details.",
            "Borrowing Management: request and approval workflow.",
            "Return Tracking: status updates, due dates, penalties, and missing-item handling.",
            "Reports and Utilization Monitoring: summaries for admin and staff monitoring.",
        ],
        "defense": "Prepare a short explanation of how the major modules work together.",
        "qa": "Q: Which feature tracks returned equipment? A: Return tracking and transaction status management record the return and condition details.",
    },
    {
        "title": "Database Design",
        "bullets": [
            "Actual tables: wcc_users, wcc_equipment, wcc_transactions, wcc_transaction_logs, wcc_penalty_records, and wcc_app_state.",
            "Users store account and profile data.",
            "Equipment stores stock, condition, and assignment status.",
            "Transactions store borrowing and return activity.",
            "Logs and penalty records maintain operational accountability.",
            "Relationships are formed through student_id, equipment_id, and transaction_id references.",
        ],
        "defense": "Explain how the database connects equipment, users, borrowing activity, and return information.",
        "qa": "Q: Why use this database structure? A: It separates major entities and keeps the system organized, traceable, and manageable.",
    },
    {
        "title": "Development Tools and Technologies",
        "bullets": [
            "Programming Language: TypeScript, PHP, and MySQL.",
            "Frontend: React with Vite and TypeScript.",
            "Backend: PHP API under XAMPP environment.",
            "Database: MySQL.",
            "Development Environment: Visual Studio Code.",
            "Other tools: UI libraries, Recharts, jsPDF, QR/barcode support, and local persistence integration.",
        ],
        "defense": "Explain why the technologies were used and what role each technology plays.",
        "qa": "Q: What technologies did you use? A: React, TypeScript, PHP, Vite, and MySQL were used for the system interface, API, and database.",
    },
    {
        "title": "Benefits of the System",
        "bullets": [
            "Administrators: easier equipment management, monitoring, and reporting.",
            "Staff: faster processing, easier inventory checks, and better workflow support.",
            "Students: clearer request and return status, and more structured borrowing flow.",
            "Organization: better accountability, reduced paperwork, and more organized equipment records.",
        ],
        "defense": "Explain the observable improvements that the system actually supports.",
        "qa": "Q: How does it benefit the organization? A: It improves equipment accountability, record quality, and monitoring efficiency.",
    },
    {
        "title": "Software Project Demonstration",
        "bullets": [
            "1. Login: show proper role-based access and redirection.",
            "2. Dashboard: show summary information and equipment status.",
            "3. Equipment Records: display equipment list, inventory, and detail records.",
            "4. Availability: show available, borrowed, and missing item status.",
            "5. Borrowing: show request and approval flow.",
            "6. Return: show return processing, condition update, and penalty monitoring.",
            "7. History: show borrowing and return records.",
            "8. Reports: show summaries and admin monitoring details.",
            "9. Utilization: show equipment activity monitoring.",
            "10. Admin functions: show user and system management tasks.",
        ],
        "defense": "Walk through the core system flow in a concise demonstration.",
        "qa": "Q: What should the panel observe? A: The login flow, dashboard, equipment tracking, borrowing process, return status, and reporting system.",
    },
]


def add_slide(canvas, slide, page_no):
    width, height = landscape(A4)
    left = 0.45 * inch
    top = 0.55 * inch
    right = width - 0.45 * inch
    header_y = height - 0.4 * inch
    footer_y = 0.35 * inch

    # Background and border
    canvas.setFillColor(HexColor('#f8fafc'))
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(HexColor('#0f172a'))
    canvas.setLineWidth(1.2)
    canvas.rect(left, top, width - 2 * left, height - 2 * top, stroke=1, fill=0)

    # Accent bar
    canvas.setFillColor(HexColor('#0f172a'))
    canvas.rect(left + 12, height - 52, width - 2 * left - 24, 4, fill=1, stroke=0)

    # Title
    title_text = slide["title"]
    canvas.setFont('Helvetica-Bold', 22)
    canvas.setFillColor(HexColor('#0f172a'))
    canvas.drawString(left + 24, height - 62, title_text)

    # Body area
    body_left = left + 24
    body_top = height - 95

    # Draw bullets with wrapping manually
    bullet_lines = []
    for item in slide["bullets"]:
        bullet_lines.append('• ' + item)

    # Paragraph text sections
    text = '\n'.join(bullet_lines)
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(HexColor('#1f2937'))

    # split into lines for drawing with textwrap
    import textwrap
    lines = []
    for paragraph in bullet_lines:
        wrapped = textwrap.wrap(paragraph, width=110)
        lines.extend(wrapped)
    max_lines = 11
    for idx, line in enumerate(lines[:max_lines]):
        y = body_top - idx * 16
        canvas.drawString(body_left, y, line)

    # Defense and Q&A small text
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(HexColor('#1d4ed8'))
    canvas.drawString(body_left, 74, 'Defense Explanation:')
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#374151'))
    defense_lines = textwrap.wrap(slide['defense'], width=140)
    for i, line in enumerate(defense_lines[:2]):
        canvas.drawString(body_left + 110, 74 - i * 10, line)

    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(HexColor('#15803d'))
    canvas.drawString(body_left, 46, 'Panel Q&A:')
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(HexColor('#374151'))
    qa_lines = textwrap.wrap(slide['qa'], width=165)
    for i, line in enumerate(qa_lines[:2]):
        canvas.drawString(body_left + 80, 46 - i * 9, line)

    # Footer
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#475569'))
    canvas.drawRightString(width - left - 8, footer_y, f"Slide {page_no} | Equipment Borrowing and Tracking Return System")


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=landscape(A4),
        leftMargin=0.4 * inch,
        rightMargin=0.4 * inch,
        topMargin=0.3 * inch,
        bottomMargin=0.3 * inch,
    )
    story = []
    for index, slide in enumerate(slides, start=1):
        story.append(PageBreak())
        # We use a custom canvas drawing rather than flowables for consistent slide styling
    # The custom canvas method is handled below.

    # Build with custom canvas to keep all slides on single pages
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(OUTPUT, pagesize=landscape(A4))
    for index, slide in enumerate(slides, start=1):
        add_slide(c, slide, index)
        c.showPage()
    c.save()


if __name__ == '__main__':
    build_pdf()
    print(f"PDF generated: {OUTPUT}")
