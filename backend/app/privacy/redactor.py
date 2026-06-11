import re

def mask_name(name: str) -> str:
    if not name:
        return "[REDACTED]"
    parts = name.split()
    masked_parts = []
    for p in parts:
        if len(p) <= 2:
            masked_parts.append(p[0] + "*" * (len(p) - 1))
        else:
            masked_parts.append(p[0] + "*" * (len(p) - 2) + p[-1])
    return " ".join(masked_parts)

def mask_reg_num(reg: str) -> str:
    if not reg:
        return "[REDACTED]"
    # e.g. REG-1234-5678 -> REG-****-5678
    parts = reg.split("-")
    if len(parts) >= 3:
        parts[1] = "*" * len(parts[1])
        return "-".join(parts)
    return re.sub(r'\d', '*', reg)

def redact_payload(payload: dict, mode: str) -> dict:
    """
    Redacts candidate names, evaluator IDs, registration numbers, etc.,
    based on redaction mode: PUBLIC_SAFE, CANDIDATE_SAFE, EVALUATOR_SAFE,
    CENTER_SAFE, AUDITOR_FULL, LEGAL_EXPORT.
    """
    redacted = dict(payload)
    
    if mode == "AUDITOR_FULL":
        return redacted
        
    # Apply rules
    if mode == "PUBLIC_SAFE":
        # Redact candidate
        if "candidate_name" in redacted:
            redacted["candidate_name"] = mask_name(redacted["candidate_name"])
        if "name" in redacted and "candidate" in redacted.get("role", "").lower():
            redacted["name"] = mask_name(redacted["name"])
        if "registration_number" in redacted:
            redacted["registration_number"] = mask_reg_num(redacted["registration_number"])
        if "photo_url" in redacted:
            redacted["photo_url"] = "[REDACTED]"
            
        # Redact evaluator
        if "evaluator_id" in redacted:
            redacted["evaluator_id"] = "[HIDDEN]"
        if "evaluator_name" in redacted:
            redacted["evaluator_name"] = "[HIDDEN]"
            
        # Redact internal details
        if "internal_audit_actor_id" in redacted:
            redacted["internal_audit_actor_id"] = "[REDACTED]"

    elif mode == "CANDIDATE_SAFE":
        # Candidate can see their own info, but evaluators must be anonymous
        if "evaluator_id" in redacted:
            redacted["evaluator_id"] = "[HIDDEN]"
        if "evaluator_name" in redacted:
            redacted["evaluator_name"] = "[HIDDEN]"
        if "internal_audit_actor_id" in redacted:
            redacted["internal_audit_actor_id"] = "[REDACTED]"

    elif mode == "EVALUATOR_SAFE":
        # Evaluator can check answers, but candidate details must be hidden
        if "candidate_name" in redacted:
            redacted["candidate_name"] = mask_name(redacted["candidate_name"])
        if "candidate_id" in redacted:
            redacted["candidate_id"] = "[HIDDEN]"
        if "registration_number" in redacted:
            redacted["registration_number"] = mask_reg_num(redacted["registration_number"])
        if "photo_url" in redacted:
            redacted["photo_url"] = "[REDACTED]"
        if "internal_audit_actor_id" in redacted:
            redacted["internal_audit_actor_id"] = "[REDACTED]"

    elif mode == "CENTER_SAFE":
        # Center officer view
        if "evaluator_id" in redacted:
            redacted["evaluator_id"] = "[HIDDEN]"
            
    elif mode == "LEGAL_EXPORT":
        # Max redaction of PII, leaving only cryptographic checksums
        if "candidate_name" in redacted:
            redacted["candidate_name"] = "[REDACTED_LEGAL]"
        if "registration_number" in redacted:
            redacted["registration_number"] = "[REDACTED_LEGAL]"
        if "photo_url" in redacted:
            redacted["photo_url"] = "[REDACTED]"
        if "evaluator_id" in redacted:
            redacted["evaluator_id"] = "[REDACTED]"
        if "evaluator_name" in redacted:
            redacted["evaluator_name"] = "[REDACTED]"
        if "internal_audit_actor_id" in redacted:
            redacted["internal_audit_actor_id"] = "[REDACTED]"
            
    return redacted
