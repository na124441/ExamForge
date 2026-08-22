import re
from typing import Tuple, Optional
from pydantic import BaseModel

class DemographicMatchResult(BaseModel):
    name_match: bool
    dob_match: bool
    gender_match: bool
    mobile_match: bool
    name_similarity_score: float
    overall_score: float
    decision: str # OFFLINE_IDENTITY_VERIFIED, IDENTITY_MISMATCH, MANUAL_REVIEW
    mismatch_reasons: list[str] = []

def normalize_name(text: str) -> str:
    """Canonical name normalization stripping extra whitespace, prefixes, and special characters."""
    if not text:
        return ""
    cleaned = re.sub(r"[^\w\s]", "", text).upper().strip()
    return " ".join(cleaned.split())

def calculate_levenshtein_similarity(str1: str, str2: str) -> float:
    """Calculates normalized Levenshtein similarity ratio between 0.0 and 1.0."""
    s1, s2 = normalize_name(str1), normalize_name(str2)
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0
    
    len1, len2 = len(s1), len(s2)
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
    
    distance = matrix[len1][len2]
    max_len = max(len1, len2)
    return round(1.0 - (distance / max_len), 2)

class IdentityMatchEngine:
    @staticmethod
    def match_demographics(
        candidate_name: str,
        candidate_dob: str,
        candidate_gender: str,
        candidate_phone: str,
        extracted_name: Optional[str],
        extracted_dob: Optional[str],
        extracted_gender: Optional[str],
        extracted_masked_mobile: Optional[str] = None
    ) -> DemographicMatchResult:
        """
        Compares extracted document identity attributes against candidate database profile.
        Strict matching rules without false approvals.
        """
        reasons = []

        # 1. Canonical Name Match
        name_sim = calculate_levenshtein_similarity(candidate_name, extracted_name or "")
        is_name_match = (name_sim >= 0.80) if extracted_name else True

        if extracted_name and not is_name_match:
            reasons.append(f"Name mismatch: Candidate registered '{candidate_name}', but document extracted '{extracted_name}' (similarity {int(name_sim*100)}%).")

        # 2. DOB Match (Normalizes YYYY-MM-DD vs DD/MM/YYYY)
        is_dob_match = True
        if extracted_dob and candidate_dob:
            cand_parts = set(re.findall(r"\d+", candidate_dob))
            ext_parts = set(re.findall(r"\d+", extracted_dob))
            # Match year and digits
            is_dob_match = (cand_parts == ext_parts or len(cand_parts.intersection(ext_parts)) >= 3)
            if not is_dob_match:
                reasons.append(f"DOB mismatch: Candidate registered '{candidate_dob}', but document extracted '{extracted_dob}'.")

        # 3. Gender Match
        is_gender_match = True
        if extracted_gender and candidate_gender:
            g_cand = candidate_gender.upper()[0]
            g_ext = extracted_gender.upper()[0]
            is_gender_match = (g_cand == g_ext)
            if not is_gender_match:
                reasons.append(f"Gender mismatch: Candidate registered '{candidate_gender}', but document extracted '{extracted_gender}'.")

        # 4. Masked Mobile Match
        is_mobile_match = True
        if extracted_masked_mobile and candidate_phone:
            phone_digits = re.sub(r"\D", "", candidate_phone)
            mobile_digits = re.sub(r"\D", "", extracted_masked_mobile)
            if len(phone_digits) >= 4 and len(mobile_digits) >= 4:
                is_mobile_match = (phone_digits[-4:] == mobile_digits[-4:])
                if not is_mobile_match:
                    reasons.append(f"Phone mismatch: Candidate registered phone ends with '{phone_digits[-4:]}', but document masked mobile ends with '{mobile_digits[-4:]}'.")

        # Overall Match Decision
        if reasons:
            decision = "IDENTITY_MISMATCH"
            score = round(name_sim * 0.5, 2)
        else:
            decision = "OFFLINE_IDENTITY_VERIFIED"
            score = 1.0 if (is_name_match and is_dob_match and is_gender_match) else 0.85

        return DemographicMatchResult(
            name_match=is_name_match,
            dob_match=is_dob_match,
            gender_match=is_gender_match,
            mobile_match=is_mobile_match,
            name_similarity_score=name_sim,
            overall_score=score,
            decision=decision,
            mismatch_reasons=reasons
        )

# Backward compatibility alias
DemographicMatcher = IdentityMatchEngine
