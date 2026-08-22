import math
from typing import List, Dict, Any

class SeatCollusionDetector:
    """
    Analyzes seating proximity matrix vs candidate answer response vectors
    to identify statistical collusion and cheat clusters.
    """

    @staticmethod
    def compute_jaccard_similarity(vec_a: List[str], vec_b: List[str]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        matches = sum(1 for a, b in zip(vec_a, vec_b) if a == b and a != "")
        total = max(len(vec_a), 1)
        return matches / total

    @staticmethod
    def calculate_distance(pos1: Dict[str, int], pos2: Dict[str, int]) -> float:
        dx = pos1.get("x", 0) - pos2.get("x", 0)
        dy = pos1.get("y", 0) - pos2.get("y", 0)
        return math.sqrt(dx * dx + dy * dy)

    def analyze_center_collusion(self, candidate_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        candidate_data format:
        [
           {"candidate_id": "C-101", "seat": {"x": 1, "y": 1}, "answers": ["A", "B", "C", "D"]},
           ...
        ]
        """
        suspicious_pairs = []
        high_risk_candidates = set()

        n = len(candidate_data)
        for i in range(n):
            for j in range(i + 1, n):
                c1 = candidate_data[i]
                c2 = candidate_data[j]
                
                dist = self.calculate_distance(c1["seat"], c2["seat"])
                sim = self.compute_jaccard_similarity(c1["answers"], c2["answers"])

                # Adjacent seat threshold (distance <= 1.5) with high similarity (>= 0.80)
                if dist <= 1.5 and sim >= 0.80:
                    pair_score = round(sim * (2.0 - dist * 0.5), 2)
                    suspicious_pairs.append({
                        "candidate_a": c1["candidate_id"],
                        "candidate_b": c2["candidate_id"],
                        "distance_meters": round(dist, 2),
                        "response_similarity": round(sim * 100, 1),
                        "risk_score": pair_score,
                        "flag": "HIGH_COLLUSION_SUSPICION"
                    })
                    high_risk_candidates.add(c1["candidate_id"])
                    high_risk_candidates.add(c2["candidate_id"])

        overall_risk = "LOW"
        if len(suspicious_pairs) > 3:
            overall_risk = "HIGH"
        elif len(suspicious_pairs) > 0:
            overall_risk = "MEDIUM"

        return {
            "center_risk_rating": overall_risk,
            "total_candidates_analyzed": n,
            "suspicious_clusters_found": len(suspicious_pairs),
            "flagged_candidates": list(high_risk_candidates),
            "collusion_pairs": suspicious_pairs
        }


class EvaluatorCalibrationEngine:
    """
    Analyzes evaluation bias, grading drift, and evaluator variance.
    """

    @staticmethod
    def analyze_evaluator_metrics(evaluator_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        evaluator_logs format:
        [
            {"evaluator_id": "EVAL-01", "score_given": 85, "master_avg": 78},
            ...
        ]
        """
        eval_scores = {}
        for entry in evaluator_logs:
            eid = entry["evaluator_id"]
            if eid not in eval_scores:
                eval_scores[eid] = {"diffs": [], "count": 0}
            diff = entry["score_given"] - entry["master_avg"]
            eval_scores[eid]["diffs"].append(diff)
            eval_scores[eid]["count"] += 1

        results = []
        for eid, data in eval_scores.items():
            diffs = data["diffs"]
            mean_bias = sum(diffs) / len(diffs) if diffs else 0.0
            variance = sum((x - mean_bias) ** 2 for x in diffs) / len(diffs) if diffs else 0.0
            std_dev = math.sqrt(variance)

            bias_label = "NORMAL"
            if mean_bias > 5.0:
                bias_label = "OVERLY_LENIENT"
            elif mean_bias < -5.0:
                bias_label = "OVERLY_HARSH"

            results.append({
                "evaluator_id": eid,
                "total_papers_graded": data["count"],
                "mean_bias_points": round(mean_bias, 2),
                "std_deviation": round(std_dev, 2),
                "calibration_status": bias_label
            })

        return {
            "evaluators_calibrated": len(results),
            "evaluator_profiles": results
        }
