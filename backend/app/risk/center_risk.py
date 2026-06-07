import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Evaluation, OMRScan, Candidate, EncryptedPackage, AuditLog, RiskSimulation
from app.security import calculate_sha256

def detect_evaluator_conflicts(db: Session, exam_id: str) -> list[dict]:
    """
    Scans for candidates where multiple evaluators graded the same question
    and their scores differ by more than 2.0 marks.
    """
    evals = db.query(Evaluation).filter(Evaluation.exam_id == exam_id).all()
    
    # Group by anonymous_id and question_id
    grouped = {}
    for ev in evals:
        key = (ev.anonymous_id, ev.question_id)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(ev)
        
    conflicts = []
    for (anon_id, q_id), ev_list in grouped.items():
        if len(ev_list) < 2:
            continue
            
        # If there are multiple evaluations, compare all pairs
        for i in range(len(ev_list)):
            for j in range(i + 1, len(ev_list)):
                ev1 = ev_list[i]
                ev2 = ev_list[j]
                diff = abs(ev1.marks_awarded - ev2.marks_awarded)
                if diff > 2.0:
                    conflicts.append({
                        "candidate_anonymous_id": anon_id,
                        "question_id": q_id,
                        "evaluator_1": ev1.evaluator_id,
                        "marks_1": ev1.marks_awarded,
                        "evaluator_2": ev2.evaluator_id,
                        "marks_2": ev2.marks_awarded,
                        "difference": diff,
                        "max_marks": ev1.max_marks
                    })
    return conflicts

def get_omr_scans_by_band(db: Session, exam_id: str) -> dict:
    """
    Categorizes OMR Scans into bands based on bubble detection confidence scores:
    - AUTO_ACCEPTED: All question confidences >= 0.85
    - LOW_CONFIDENCE: At least one question confidence between 0.70 and 0.85
    - MANUAL_REVIEW: At least one question confidence < 0.70 OR answer is AMBIGUOUS
    """
    scans = db.query(OMRScan).filter(OMRScan.exam_id == exam_id).all()
    
    report = {
        "AUTO_ACCEPTED": [],
        "LOW_CONFIDENCE": [],
        "MANUAL_REVIEW": []
    }
    
    for scan in scans:
        try:
            conf_report = json.loads(scan.confidence_report)
            answers = json.loads(scan.detected_answers)
        except Exception:
            conf_report = {}
            answers = {}
            
        cand = db.query(Candidate).filter(Candidate.id == scan.candidate_id).first()
        anon_id = cand.anonymous_id if cand else "ANON-UNKNOWN"
        
        lowest_conf = 1.0
        has_ambiguous = False
        
        for q_num, conf in conf_report.items():
            lowest_conf = min(lowest_conf, float(conf))
            if answers.get(q_num) == "AMBIGUOUS":
                has_ambiguous = True
                
        scan_data = {
            "scan_id": scan.id,
            "candidate_id": scan.candidate_id,
            "candidate_anonymous_id": anon_id,
            "lowest_confidence": lowest_conf,
            "detected_answers": answers,
            "confidence_report": conf_report,
            "has_ambiguous": has_ambiguous,
            "status": scan.status
        }
        
        if lowest_conf < 0.70 or has_ambiguous:
            report["MANUAL_REVIEW"].append(scan_data)
        elif lowest_conf < 0.85:
            report["LOW_CONFIDENCE"].append(scan_data)
        else:
            report["AUTO_ACCEPTED"].append(scan_data)
            
    return report

def scan_system_anomalies(db: Session, exam_id: str) -> list[dict]:
    """
    Checks for high-priority security anomalies in the DB or audit logs:
    1. Early Paper Releases
    2. Package Mismatches
    3. Seat Modification Warnings
    4. OMR sheet swap indicators
    5. Database direct tamper logs
    """
    anomalies = []
    
    # 1. Check early releases from simulator or direct package checks
    sim_early = db.query(RiskSimulation).filter(RiskSimulation.vector == "early_release", RiskSimulation.is_active == True).first()
    pkg_early = db.query(EncryptedPackage).filter(EncryptedPackage.exam_id == exam_id, EncryptedPackage.status == "RELEASED").all()
    
    # Check if package released early physically
    import datetime
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    for pkg in pkg_early:
        v_from = pkg.valid_from.replace(tzinfo=datetime.timezone.utc) if pkg.valid_from.tzinfo is None else pkg.valid_from
        if now_utc < v_from:
            anomalies.append({
                "severity": "CRITICAL",
                "type": "EARLY_PAPER_RELEASE",
                "message": f"Package {pkg.id} for center {pkg.center_id} released before scheduled valid_from window.",
                "details": f"Scheduled: {pkg.valid_from.isoformat()}, Released at: {now_utc.isoformat()}"
            })
            
    if sim_early and not anomalies:
        # Fallback if no package but simulation is active
        anomalies.append({
            "severity": "CRITICAL",
            "type": "EARLY_PAPER_RELEASE",
            "message": "Simulated early release trigger active. Unauthorized decryption key release detected.",
            "details": sim_early.details
        })
        
    # 2. Check Package Hash Mismatch or Mismatches Simulator
    sim_pkg = db.query(RiskSimulation).filter(RiskSimulation.vector == "package_mismatch", RiskSimulation.is_active == True).first()
    if sim_pkg:
        anomalies.append({
            "severity": "CRITICAL",
            "type": "PACKAGE_INTEGRITY_MISMATCH",
            "message": "Exam paper package hash signature does not match ledger manifest.",
            "details": sim_pkg.details
        })
        
    # 3. Check Seat change anomalies
    sim_seat = db.query(RiskSimulation).filter(RiskSimulation.vector == "seat_change", RiskSimulation.is_active == True).first()
    seat_logs = db.query(AuditLog).filter(AuditLog.action == "UNAUTHORIZED_SEAT_CHANGE").all()
    if sim_seat or seat_logs:
        anomalies.append({
            "severity": "WARNING",
            "type": "UNAUTHORIZED_SEAT_CHANGE",
            "message": "Post-session seat modifications or anonymous ID adjustments detected in audit trails.",
            "details": seat_logs[-1].payload_hash if seat_logs else "Seat change simulation active."
        })
        
    # 4. Check OMR swap anomalies
    sim_swap = db.query(RiskSimulation).filter(RiskSimulation.vector == "omr_swap", RiskSimulation.is_active == True).first()
    swap_logs = db.query(AuditLog).filter(AuditLog.action == "OMR_SHEET_SWAP_DETECTED").all()
    if sim_swap or swap_logs:
        anomalies.append({
            "severity": "CRITICAL",
            "type": "OMR_SHEET_SWAP",
            "message": "OMR Scan image hash mismatch. Candidate booklet details do not match secure scans ledger.",
            "details": swap_logs[-1].payload_hash if swap_logs else "OMR swap simulation active."
        })
        
    # 5. Check Database direct tamper logs / signature anomalies
    sim_tamper = db.query(RiskSimulation).filter(RiskSimulation.vector == "db_tamper", RiskSimulation.is_active == True).first()
    tamper_logs = db.query(AuditLog).filter(AuditLog.action == "DIRECT_DATABASE_MARKS_EDIT").all()
    if sim_tamper or tamper_logs:
        anomalies.append({
            "severity": "CRITICAL",
            "type": "DATABASE_MARKS_TAMPERED",
            "message": "Backdoor edit detected! Marks modified directly in SQLite database, bypassing verification signatures.",
            "details": tamper_logs[-1].payload_hash if tamper_logs else "DB marks edit simulation active."
        })
        
    return anomalies
