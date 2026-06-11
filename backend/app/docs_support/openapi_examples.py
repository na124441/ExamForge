PILOT_RUN_EXAMPLE = {
    "id": "run_01j12ab34cd56789ef",
    "institution_id": "INS-NSB-001",
    "started_at": "2026-06-11T14:00:00Z",
    "completed_at": None,
    "status": "IN_PROGRESS",
    "readiness_score": None
}

EVIDENCE_BINDER_EXAMPLE = {
    "id": "bnd_99j88ab77cd66",
    "institution_id": "INS-NSB-001",
    "pilot_run_id": "run_01j12ab34cd56789ef",
    "binder_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "signature": "MEQCIFzK4aX+YmR1g8J7Z5/q...",
    "metadata_json": '{"policy": {"threshold": 95.0}, "exam": {"id": "EXM-PILOT-001"}}',
    "created_by": "controller@example.com",
    "created_at": "2026-06-11T14:15:00Z"
}

AUTHORITY_DASHBOARD_EXAMPLE = {
    "institution": {
        "id": "INS-NSB-001",
        "name": "National Scholarship Board",
        "keyspace_keys": 2
    },
    "exam_lifecycle": {
        "exam_id": "EXM-PILOT-001",
        "state": "RESULT_PUBLISHED"
    },
    "trust_ops": {
        "score": 97,
        "gate_allowed": True
    },
    "deployment_ops": {
        "db_status": "OK",
        "redis_status": "OK",
        "storage_status": "OK"
    },
    "security_ops": {
        "unmitigated_threats": 0,
        "pending_approvals": 0,
        "compliance_score": 97
    },
    "verdict": {
        "status": "READY",
        "reasons": []
    }
}
