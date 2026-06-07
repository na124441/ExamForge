import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import RiskSimulation, EncryptedPackage, OMRScan, Evaluation, AuditLog, Candidate
from app.security import calculate_sha256
from app.audit.ledger import log_event

def trigger_simulation(db: Session, vector: str, details: str) -> dict:
    """
    Triggers a simulated attack vector by updating the database state or
    flagging a mock simulation event.
    """
    # Disable prior active simulations of the same vector
    db.query(RiskSimulation).filter(
        RiskSimulation.vector == vector,
        RiskSimulation.is_active == True
    ).update({"is_active": False})
    
    # Create new active simulation log
    sim = RiskSimulation(
        vector=vector,
        details=details,
        is_active=True
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)
    
    feedback = {"status": "TRIGGERED", "vector": vector, "details": details}
    
    # Perform direct database manipulations for physical simulated checks
    if vector == "early_release":
        # Find any SEALED package and mark it RELEASED early
        pkg = db.query(EncryptedPackage).first()
        if pkg:
            # Set valid_from to future (+1 hour) but status to RELEASED
            pkg.valid_from = datetime.now(timezone.utc) + timedelta(hours=1)
            pkg.status = "RELEASED"
            db.commit()
            feedback["effect"] = f"Package {pkg.id} set to RELEASED status despite future valid_from window."
            
            # Log anomaly in Audit Trail
            log_event(
                db=db,
                actor_id="CENTER_SIMULATOR",
                action="EARLY_PACKAGE_DECRYPTION_ATTEMPT",
                resource_type="EncryptedPackage",
                resource_id=pkg.id,
                payload_data=json.dumps({"package_id": pkg.id, "scheduled_from": pkg.valid_from.isoformat()})
            )
            
    elif vector == "package_mismatch":
        # Corrupt the package_hash of an existing package
        pkg = db.query(EncryptedPackage).first()
        if pkg:
            old_hash = pkg.package_hash
            pkg.package_hash = "BAD_HASH_" + old_hash[:10]
            db.commit()
            feedback["effect"] = f"Package {pkg.id} hash tampered from {old_hash[:10]} to {pkg.package_hash}."
            
            log_event(
                db=db,
                actor_id="CENTER_SIMULATOR",
                action="PACKAGE_INTEGRITY_MISMATCH",
                resource_type="EncryptedPackage",
                resource_id=pkg.id,
                payload_data=json.dumps({"package_id": pkg.id, "stored_hash": pkg.package_hash})
            )
            
    elif vector == "seat_change":
        # Log an unauthorized post-session candidate seat change in audit trails
        log_event(
            db=db,
            actor_id="MALICIOUS_OFFICER",
            action="UNAUTHORIZED_SEAT_CHANGE",
            resource_type="Candidate",
            resource_id="REG-1010",
            payload_data=json.dumps({
                "candidate_id": "Bob Tester", 
                "original_seat": "Room A - Desk 12",
                "new_seat": "Room B - Desk 4"
            })
        )
        feedback["effect"] = "Logged UNAUTHORIZED_SEAT_CHANGE event into secure Audit Ledger."
        
    elif vector == "omr_swap":
        # Tamper with OMR Scan image hash or answers
        scan = db.query(OMRScan).first()
        if scan:
            old_hash = scan.image_hash
            scan.image_hash = "SWAPPED_IMAGE_" + calculate_sha256(scan.image_hash)[:8]
            db.commit()
            feedback["effect"] = f"OMRScan {scan.id} image hash altered to simulate swapped sheet."
            
            log_event(
                db=db,
                actor_id="CENTER_SIMULATOR",
                action="OMR_SHEET_SWAP_DETECTED",
                resource_type="OMRScan",
                resource_id=scan.id,
                payload_data=json.dumps({"scan_id": scan.id, "original_hash": old_hash, "new_hash": scan.image_hash})
            )
            
    elif vector == "db_tamper":
        # Modify evaluation marks directly, breaking signature
        ev = db.query(Evaluation).first()
        if ev:
            old_marks = ev.marks_awarded
            ev.marks_awarded = min(ev.max_marks, ev.marks_awarded + 2.0)
            db.commit()
            feedback["effect"] = f"Directly modified Evaluation {ev.id} marks from {old_marks} to {ev.marks_awarded} without recalculating hash signature."
            
            log_event(
                db=db,
                actor_id="SQL_BACKDOOR",
                action="DIRECT_DATABASE_MARKS_EDIT",
                resource_type="Evaluation",
                resource_id=ev.id,
                payload_data=json.dumps({"evaluation_id": ev.id, "old_marks": old_marks, "new_marks": ev.marks_awarded})
            )
            
    return feedback

def clear_simulations(db: Session) -> dict:
    """Resets all simulation flags and restores sanity to DB if possible."""
    db.query(RiskSimulation).update({"is_active": False})
    db.commit()
    return {"status": "CLEARED", "message": "All simulation flags set to inactive."}
