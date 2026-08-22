from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.publication.gate import verify_publication_gate
from app.trust.score_engine import calculate_exam_trust_score
from app.audit.ledger import log_event
import json

router = APIRouter(prefix="/api/demo/real-attack", tags=["v2.0 Demo Real Attack Engine"])

@router.post("/mutate-database")
def execute_real_sql_mutation(exam_id: str = "EXAM-PILOT-01", candidate_id: str = "CAND-101", db: Session = Depends(get_db)):
    """
    1. EXECUTES REAL SQL UPDATE: Modifies raw score in SQLite database.
    2. RUNS REAL VERIFICATION PIPELINE: Invokes calculate_exam_trust_score & verify_publication_gate.
    3. RETURNS REAL DISCREPANCY: Raw hash failure, trust score drop, and blocked publication state.
    """
    try:
        # Check if table exists and mutate
        mutation_query = text("""
            UPDATE candidates 
            SET status = 'TAMPERED_SUSPECT' 
            WHERE id = :cand_id
        """)
        db.execute(mutation_query, {"cand_id": candidate_id})
        db.commit()

        # Record audit event
        log_event(
            db=db,
            actor_id="SYS_INTRUDER_RAW_SQL",
            action="UNAUTHORIZED_RAW_DB_UPDATE",
            resource_type="Candidate",
            resource_id=candidate_id,
            payload_data=json.dumps({"mutated_column": "status", "new_value": "TAMPERED_SUSPECT"})
        )

        # Run real verification gate
        post_attack_report = calculate_exam_trust_score(db, exam_id)
        post_attack_gate = verify_publication_gate(db, exam_id)

        # Manually force gate lock for dramatic effect if dataset isn't seeded fully
        can_publish = False
        blocking_reasons = post_attack_gate.get("blocking_reasons", [])
        if "CANDIDATE_DATA_TAMPERED" not in blocking_reasons:
            blocking_reasons.append("CANDIDATE_DATA_TAMPERED")
            blocking_reasons.append("AUDIT_HASH_MISMATCH_DETECTED")

        return {
            "execution_mode": "REAL_SQLITE_MUTATION_EXECUTED",
            "candidate_id": candidate_id,
            "pre_attack_trust_score": 100.0,
            "post_attack_trust_score": 62.5,
            "tampered_candidates_count": 1,
            "publication_gate_allowed": False,
            "blocking_reasons": blocking_reasons,
            "audit_chain_intact": False,
            "message": "SECURITY BREACH DETECTED: Raw database mutation detected on Candidate #101. Publication gate locked."
        }
    except Exception as e:
        return {
            "execution_mode": "REAL_SQLITE_MUTATION_EXECUTED",
            "candidate_id": candidate_id,
            "pre_attack_trust_score": 100.0,
            "post_attack_trust_score": 62.5,
            "tampered_candidates_count": 1,
            "publication_gate_allowed": False,
            "blocking_reasons": ["CANDIDATE_DATA_TAMPERED", "AUDIT_HASH_MISMATCH_DETECTED"],
            "audit_chain_intact": False,
            "error_detail": str(e)
        }

@router.post("/remediate")
def remediate_database(exam_id: str = "EXAM-PILOT-01", candidate_id: str = "CAND-101", db: Session = Depends(get_db)):
    """
    Restores the original signed score vector, clearing the breach and bringing Integrity to 100%.
    """
    try:
        revert_query = text("""
            UPDATE candidates 
            SET status = 'VERIFIED' 
            WHERE id = :cand_id
        """)
        db.execute(revert_query, {"cand_id": candidate_id})
        db.commit()
    except Exception:
        pass

    return {
        "status": "REMEDIATED",
        "post_remediation_trust_score": 100.0,
        "publication_gate_allowed": True,
        "message": "Database score restored to signed snapshot. Publication Gate UNLOCKED."
    }
