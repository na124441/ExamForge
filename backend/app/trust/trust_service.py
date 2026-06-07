from app.trust.score_engine import calculate_exam_trust_score

def get_exam_security_report(db, exam_id: str) -> dict:
    """
    Wraps the scoring engine to produce a security report for the controller.
    """
    return calculate_exam_trust_score(db, exam_id)
