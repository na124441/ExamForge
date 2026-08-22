import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

# Color Palette Definitions (ExamForge Brand Theme)
DARK_PINE = colors.HexColor("#132D28")
TEAL_PINE = colors.HexColor("#408576")
MINT_GREEN = colors.HexColor("#8AD8B8")
LIGHT_CREAM = colors.HexColor("#FFF4E2")
BG_CARD = colors.HexColor("#F2F8F5")
DARK_TEXT = colors.HexColor("#11221D")
MUTED_TEXT = colors.HexColor("#4A6158")
BORDER_COLOR = colors.HexColor("#C0DECF")
AMBER_ALERT = colors.HexColor("#D97706")
CRITICAL_RED = colors.HexColor("#DC2626")
SUCCESS_GREEN = colors.HexColor("#16A34A")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED_TEXT)

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "ExamForge™ Enterprise Architecture Whitepaper")
            self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "Zero-Trust Assessment Infrastructure")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.75)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.75)
        self.line(54, 46, 8.5 * 72 - 54, 46)

        self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY · EXAMFORGE PLATFORM SPECIFICATION")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 32, page_str)
        self.restoreState()


def generate_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=DARK_PINE,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=18,
        textColor=TEAL_PINE,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=22,
        textColor=DARK_PINE,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=TEAL_PINE,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "StandardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=DARK_TEXT,
        spaceAfter=7
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=LIGHT_CREAM
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=DARK_TEXT
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=table_cell_style,
        fontName="Helvetica-Bold"
    )

    callout_text_style = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=DARK_PINE
    )

    story = []

    # =========================================================================
    # COVER / HEADER BLOCK
    # =========================================================================
    story.append(Spacer(1, 10))

    # Badge
    badge_data = [[
        Paragraph("<font color='#132D28'><b>EXAMFORGE TECHNICAL WHITEPAPER · ARCHITECTURE BLUEPRINT</b></font>", callout_text_style)
    ]]
    badge_table = Table(badge_data, colWidths=[504])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#E0F2E9")),
        ('BOX', (0,0), (-1,-1), 1, MINT_GREEN),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("ExamForge™ System Architecture", title_style))
    story.append(Paragraph("Zero-Trust, Anti-Collusion Examination Infrastructure &amp; Enterprise EaaS Platform", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=DARK_PINE, spaceBefore=0, spaceAfter=14))

    # Document Meta Box
    meta_data = [
        [
            Paragraph("<b>Target Audience:</b> Technical Architects, C-Suite, Examination Boards", table_cell_style),
            Paragraph("<b>Release Version:</b> v2.0 Enterprise Release", table_cell_style),
        ],
        [
            Paragraph("<b>Security Model:</b> Cryptographic Zero-Trust &amp; Shamir Secret Sharing", table_cell_style),
            Paragraph("<b>Date:</b> August 2026", table_cell_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("1. Executive Overview &amp; Industry Challenge", h1_style))
    story.append(Paragraph(
        "Modern high-stakes national and institutional examinations face unprecedented vulnerabilities: physical question paper leaks, "
        "impersonation at test centers, candidate collusion through seating manipulations, catastrophic operational batch errors, "
        "and black-box evaluation opacity. ExamForge was engineered from the ground up as a <b>Zero-Trust Examination Infrastructure</b> "
        "that eliminates single points of trust across every lifecycle touchpoint.",
        body_style
    ))

    # Comparison Grid (Problems vs ExamForge Pillars)
    prob_data = [
        [Paragraph("<b>Industry Vulnerability</b>", table_header_style), Paragraph("<b>ExamForge Zero-Trust Architecture Solution</b>", table_header_style)],
        [
            Paragraph("<b>1. Paper Leaks &amp; Premature Access:</b> Vulnerable custody storage and unencrypted paper delivery.", table_cell_style),
            Paragraph("<b>Dual-Custody Key Ceremony:</b> Split keys via <i>(m-of-n)</i> Shamir Secret Sharing. Papers unseal only at T-15 min with supervisor quorum.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Impersonation &amp; Ghost Candidates:</b> Manual gate check-in vulnerable to forged admit cards.", table_cell_style),
            Paragraph("<b>Offline UIDAI Biometric Verification:</b> Cryptographic QR signatures and facial biometric matching without cloud latency.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Spatial Collusion &amp; Seating Fraud:</b> Predictable alphabetical seating allows neighboring peer cheating.", table_cell_style),
            Paragraph("<b>Anti-Collusion Graph Seating:</b> Graph-theoretic spatial dispersion ensuring zero cohort proximity.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Catastrophic Bulk Errors:</b> Dangerous all-or-nothing operations with no blast-radius previews.", table_cell_style),
            Paragraph("<b>ExamForge SafeBatch:</b> Impact preview, resilient exception isolation, and automated operational handoffs.", table_cell_style)
        ],
        [
            Paragraph("<b>5. Opaque Grading &amp; Disputes:</b> Black-box score modifications without public verifiability.", table_cell_style),
            Paragraph("<b>Merkle Tree Forensic Ledger:</b> Mathematically provable, tamper-evident audit receipts for all events.", table_cell_style)
        ],
    ]
    prob_table = Table(prob_data, colWidths=[240, 264])
    prob_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_PINE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, DARK_PINE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(prob_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 2: 4-TIER SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("2. Multi-Tiered System Architecture", h1_style))
    story.append(Paragraph(
        "ExamForge employs a high-throughput, horizontally scalable 4-tier architecture with strictly defined boundaries, "
        "cryptographic telemetry tracing, and tenancy isolation.",
        body_style
    ))

    arch_data = [
        [Paragraph("<b>Architectural Layer</b>", table_header_style), Paragraph("<b>Components &amp; Technologies</b>", table_header_style), Paragraph("<b>Primary Responsibilities</b>", table_header_style)],
        [
            Paragraph("<b>Tier 1: Presentation &amp; Portals</b>", table_cell_bold),
            Paragraph("Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Glass UI, PWA Service Worker", table_cell_style),
            Paragraph("10 dedicated persona workspaces, sub-50ms glass interactions, offline CBT exam renderer, real-time telemetry widgets.", table_cell_style)
        ],
        [
            Paragraph("<b>Tier 2: API Gateway &amp; Middleware</b>", table_cell_bold),
            Paragraph("FastAPI, Pydantic v2, TenantMiddleware, RequestIDMiddleware, SecurityHeadersMiddleware", table_cell_style),
            Paragraph("Multi-tenant context isolation, cryptographic trace correlation, RBAC enforcement across 25+ domain routers, rate-limiting.", table_cell_style)
        ],
        [
            Paragraph("<b>Tier 3: Core Domain &amp; Crypto Engines</b>", table_cell_bold),
            Paragraph("Key Ceremony Engine, Anti-Collusion Graph, SafeBatch Studio, Dual-Blind Evaluator, AI Blueprinting, Merkle Prover", table_cell_style),
            Paragraph("Secret sharing orchestration, pre-flight blast radius simulation, spatial seating optimization, automated score conflict arbitration.", table_cell_style)
        ],
        [
            Paragraph("<b>Tier 4: Persistence &amp; Event Stream</b>", table_cell_bold),
            Paragraph("PostgreSQL / SQLite, SQLAlchemy ORM (40+ models), Encrypted S3 Artifact Store, WebSockets / SSE", table_cell_style),
            Paragraph("Authoritative state storage, tamper-evident Merkle hash tree links, biometric archive, live incident event stream.", table_cell_style)
        ],
    ]
    arch_table = Table(arch_data, colWidths=[120, 194, 190])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_PINE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, DARK_PINE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 3: 10 PERSONA-BASED PORTALS & RBAC
    # =========================================================================
    story.append(Paragraph("3. Role-Based Workspaces &amp; Persona Matrix", h1_style))
    story.append(Paragraph(
        "ExamForge completely eliminates shared generic dashboards by provisioning dedicated, role-isolated command centers.",
        body_style
    ))

    portal_data = [
        [Paragraph("<b>Workspace / Persona</b>", table_header_style), Paragraph("<b>Target Route</b>", table_header_style), Paragraph("<b>Key Functional Capabilities</b>", table_header_style)],
        [
            Paragraph("<b>1. Authority &amp; Controller</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/authority, /controller</font>", table_cell_style),
            Paragraph("Exam blueprinting, question difficulty balance, dual-key unsealing ceremony, publication gates.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Vendor Partner (EaaS)</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/vendor</font>", table_cell_style),
            Paragraph("Third-party agency onboarding, hardware verification, SLA monitoring, bulk candidate allocations.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Centre Superintendent</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/center-console</font>", table_cell_style),
            Paragraph("Center desk, physical seat map locking, gate biometrics, buffer capacity override, handoff claims.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Candidate / Student</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/candidate, /student-exam</font>", table_cell_style),
            Paragraph("UIDAI registration, admit card QR, distraction-free CBT console, cryptographic score breakdown.", table_cell_style)
        ],
        [
            Paragraph("<b>5. Subject Evaluator</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/evaluator, /omr-review</font>", table_cell_style),
            Paragraph("Dual-blind grading queue, rubric scoring, OMR computer vision scanner, conflict arbitration queue.", table_cell_style)
        ],
        [
            Paragraph("<b>6. Independent Auditor</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/audit-timeline</font>", table_cell_style),
            Paragraph("Cryptographic Merkle tree timeline, root-hash inspector, immutable dispute version ledger.", table_cell_style)
        ],
        [
            Paragraph("<b>7. War Room Commander</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/war-room</font>", table_cell_style),
            Paragraph("Real-time node connectivity radar, active incident kill-switch, live center packet synchronization.", table_cell_style)
        ],
        [
            Paragraph("<b>8. Security &amp; Pen-Test Lead</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/security-pentest</font>", table_cell_style),
            Paragraph("Automated red-team simulated attacks, key rotation lifecycle, zero-trust policy compliance auditor.", table_cell_style)
        ],
        [
            Paragraph("<b>9. Dispute Appeals Officer</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/disputes, /dispute-ops</font>", table_cell_style),
            Paragraph("Candidate grievance triaging, signed evidence packet generator, referee re-evaluation tracking.", table_cell_style)
        ],
        [
            Paragraph("<b>10. SafeBatch Operations Hub</b>", table_cell_bold),
            Paragraph("<font name='Courier' size='7.5'>/safebatch</font>", table_cell_style),
            Paragraph("Safeguarded bulk allocation wizard, pre-flight blast simulation, operational handoff management.", table_cell_style)
        ],
    ]
    portal_table = Table(portal_data, colWidths=[130, 120, 254])
    portal_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_PINE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, DARK_PINE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(portal_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 4: 5-PHASE EXAMINATION LIFECYCLE
    # =========================================================================
    story.append(Paragraph("4. End-to-End Examination Lifecycle", h1_style))
    story.append(Paragraph(
        "ExamForge governs the entire assessment pipeline across 5 secure chronological phases:",
        body_style
    ))

    phases = [
        ("Phase 1: Pre-Examination & Blueprinting", "AI topic weighting, Bloom's taxonomy distribution, question authoring with dual-custody paper encryption and (m-of-n) secret key generation."),
        ("Phase 2: Secure Allocation & Packaging", "ExamForge SafeBatch bulk allocation, encrypted offline center package distribution (.efpkg), and anti-collusion spatial seating generation."),
        ("Phase 3: Exam Execution & Gate Verification", "Offline UIDAI QR biometric gate check-in, real-time War Room telemetry, distraction-free offline-resilient CBT exam taking."),
        ("Phase 4: Evaluation & Arbitration", "OMR computer vision extraction, dual-blind subjective grading, and automated referee conflict arbitration when evaluator score delta exceeds 2.0."),
        ("Phase 5: Results, Merkle Proofs & Certificates", "Scorecard Merkle tree sealing, ECDSA tamper-evident QR certificates, public cryptographic proof verification portal.")
    ]

    for p_title, p_desc in phases:
        story.append(Paragraph(f"• <b>{p_title}:</b> {p_desc}", bullet_style))
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 5: EXAMFORGE SAFEBATCH & HANDOFF ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("5. ExamForge SafeBatch: Safeguarded Bulk Operations", h1_style))
    story.append(Paragraph(
        "High-volume operations (e.g., allocating 2,847 candidates across centers) traditionally risk irreversible data corruption "
        "or ambiguous failures. ExamForge SafeBatch introduces <b>blast-radius impact previews, resilient exception isolation, "
        "and automated operational handoffs</b>.",
        body_style
    ))

    # 5 Step SafeBatch Flow Table
    sb_data = [
        [Paragraph("<b>Step</b>", table_header_style), Paragraph("<b>SafeBatch Stage</b>", table_header_style), Paragraph("<b>Mechanism &amp; Output</b>", table_header_style)],
        [
            Paragraph("<b>01</b>", table_cell_bold),
            Paragraph("<b>Scope &amp; Risk Classification</b>", table_cell_style),
            Paragraph("Evaluates operation risk level (Low, Medium, High, Critical) and selects candidate cohort.", table_cell_style)
        ],
        [
            Paragraph("<b>02</b>", table_cell_bold),
            Paragraph("<b>Pre-Flight Impact Preview</b>", table_cell_style),
            Paragraph("Simulates allocation across 4 centres. Identifies 2,813 safe allocations, 23 capacity overruns, and 11 missing address flaws before touching DB.", table_cell_style)
        ],
        [
            Paragraph("<b>03</b>", table_cell_bold),
            Paragraph("<b>Safety Confirmation Gate</b>", table_cell_style),
            Paragraph("Requires explicit operator sign-off and dual-custody authorization for high/critical tier operations.", table_cell_style)
        ],
        [
            Paragraph("<b>04</b>", table_cell_bold),
            Paragraph("<b>Resilient Safe Execution</b>", table_cell_style),
            Paragraph("Allocates 2,813 safe candidates immediately. Isolates the 34 exceptions into discrete exception records without batch rollback.", table_cell_style)
        ],
        [
            Paragraph("<b>05</b>", table_cell_bold),
            Paragraph("<b>Operational Handoff Note</b>", table_cell_style),
            Paragraph("Generates structured handoff packet (HO-2026-0822-0034) assigned to Centre Superintendent with 1-click buffer seat resolution console.", table_cell_style)
        ],
    ]
    sb_table = Table(sb_data, colWidths=[35, 175, 294])
    sb_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_PINE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, DARK_PINE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sb_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 6: CORE CRYPTOGRAPHIC PILLARS
    # =========================================================================
    story.append(Paragraph("6. Cryptographic Innovation &amp; Zero-Trust Protocols", h1_style))
    story.append(Paragraph(
        "ExamForge implements mathematical guarantees rather than relying on administrative trust:",
        body_style
    ))

    crypto_items = [
        ("Shamir's (m, n) Threshold Secret Sharing", "Examination papers are encrypted with AES-256-GCM. Unsealing requires a quorum of cryptographic keys held by independent officials, preventing single-actor leaks."),
        ("Spatial Anti-Collusion Seating Algorithm", "Constructs candidate adjacency graphs factoring in roll numbers, institutions, and postal codes to mathematically ensure zero proximity between affiliated test-takers."),
        ("Offline Public-Key Biometric Gate Check", "Parses UIDAI QR codes using local RSA-2048/ECDSA public certificate chains, enabling instant identity validation even in total network blackout conditions."),
        ("Merkle Tree Forensic Audit Ledger", "Every state mutation emits a SHA-256 hash linked into the Merkle root. Independent auditors can verify the mathematical proof of any exam event.")
    ]
    for c_name, c_desc in crypto_items:
        story.append(Paragraph(f"• <b>{c_name}:</b> {c_desc}", bullet_style))
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 7: TECHNICAL TOPOLOGY & STACK
    # =========================================================================
    story.append(Paragraph("7. Technical Stack &amp; Production Topology", h1_style))

    tech_data = [
        [Paragraph("<b>Stack Layer</b>", table_header_style), Paragraph("<b>Selected Technology</b>", table_header_style), Paragraph("<b>Key Rationale</b>", table_header_style)],
        [
            Paragraph("Frontend Framework", table_cell_bold),
            Paragraph("Next.js 16 (App Router), React 19, TypeScript", table_cell_style),
            Paragraph("Server Components, edge rendering, zero hydration drift, sub-second load times.", table_cell_style)
        ],
        [
            Paragraph("Styling &amp; Design", table_cell_bold),
            Paragraph("Tailwind CSS, Lucide Icons, Glassmorphism", table_cell_style),
            Paragraph("High-contrast pine green/mint aesthetic, fully responsive across tablets and desktops.", table_cell_style)
        ],
        [
            Paragraph("Backend API Core", table_cell_bold),
            Paragraph("Python 3.12/3.14, FastAPI, Pydantic v2", table_cell_style),
            Paragraph("High-concurrency async endpoints, automated OpenAPI contract generation, strict typing.", table_cell_style)
        ],
        [
            Paragraph("Database &amp; ORM", table_cell_bold),
            Paragraph("SQLAlchemy ORM, PostgreSQL / SQLite", table_cell_style),
            Paragraph("40+ relational models, automated schema migration, ACID transactional consistency.", table_cell_style)
        ],
        [
            Paragraph("Real-Time Telemetry", table_cell_bold),
            Paragraph("WebSockets, Server-Sent Events (SSE)", table_cell_style),
            Paragraph("Sub-100ms node latency monitoring, live War Room radar, batch execution progress.", table_cell_style)
        ],
        [
            Paragraph("Edge Deployment", table_cell_bold),
            Paragraph("Vercel Edge, Docker Containerized Nodes", table_cell_style),
            Paragraph("Global CDN caching, zero-config deployment, local center node containerization.", table_cell_style)
        ],
    ]
    tech_table = Table(tech_data, colWidths=[110, 180, 214])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_PINE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, DARK_PINE),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CARD]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 8: PRESENTATION SLIDE OUTLINE
    # =========================================================================
    story.append(Paragraph("8. Presentation Slide Flow (PPT Guide)", h1_style))
    story.append(Paragraph(
        "When delivering this architecture to stakeholders, structure the presentation into 8 core slides:",
        body_style
    ))

    slides = [
        ("Slide 1: Vision &amp; Problem", "The 5 critical vulnerabilities in legacy assessments and ExamForge's zero-trust thesis."),
        ("Slide 2: 4-Tier Architecture", "Visual diagram showing Presentation, API Gateway, Crypto Engines, and Persistence."),
        ("Slide 3: 10 Persona Workspaces", "Role-based command centers for Controllers, Vendors, Superintendents, and Evaluators."),
        ("Slide 4: 5-Phase Exam Lifecycle", "End-to-end journey from AI blueprinting to Merkle score publishing."),
        ("Slide 5: SafeBatch Operations", "Blast-radius simulation, partial execution, and automated operational handoff notes."),
        ("Slide 6: Cryptographic Innovations", "Dual-custody key ceremony, offline UIDAI QR check, and anti-collusion seating graph."),
        ("Slide 7: Evaluation &amp; Dispute Engine", "Dual-blind grading, OMR computer vision scanner, and automated arbitration queue."),
        ("Slide 8: Enterprise Tech Stack &amp; ROI", "Next.js 16 + FastAPI + PostgreSQL topology and competitive advantages.")
    ]
    for s_title, s_desc in slides:
        story.append(Paragraph(f"• <b>{s_title}:</b> {s_desc}", bullet_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "ExamForge_Complete_System_Architecture.pdf")
    generate_pdf(out_file)
