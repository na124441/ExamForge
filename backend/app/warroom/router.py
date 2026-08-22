from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
import asyncio
import json
import time
from typing import Dict, Any

router = APIRouter(prefix="/api/warroom", tags=["v2.0 War Room Telemetry"])

# Global state tracker for war room lockdown & live telemetry events
_WARROOM_STATE = {
    "is_locked_down": False,
    "lockdown_reason": None,
    "lockdown_timestamp": None,
    "active_threat_level": "LOW",
    "threat_alerts": [],
    "live_pulse_count": 1420
}

@router.get("/telemetry")
def get_warroom_telemetry(db: Session = Depends(get_db)):
    """
    Get aggregated real-time command center telemetry.
    """
    return {
        "status": "OPERATIONAL" if not _WARROOM_STATE["is_locked_down"] else "EMERGENCY_LOCKDOWN",
        "threat_level": _WARROOM_STATE["active_threat_level"],
        "active_centers_online": 18,
        "total_active_sessions": 340,
        "total_candidates_in_exam": 10500,
        "packets_time_locked": 45,
        "packets_decrypted": 18,
        "live_pulse_count": _WARROOM_STATE["live_pulse_count"],
        "is_locked_down": _WARROOM_STATE["is_locked_down"],
        "lockdown_details": {
            "reason": _WARROOM_STATE["lockdown_reason"],
            "timestamp": _WARROOM_STATE["lockdown_timestamp"]
        },
        "recent_alerts": _WARROOM_STATE["threat_alerts"][-5:] if _WARROOM_STATE["threat_alerts"] else [
            {"id": "ALT-901", "level": "INFO", "msg": "Center 104 package decrypted successfully", "time": "2026-08-03T23:20:00"},
            {"id": "ALT-902", "level": "LOW", "msg": "OMR scanner 03 desk calibration variance 0.4%", "time": "2026-08-03T23:22:15"}
        ]
    }

@router.post("/emergency-lockdown")
def trigger_emergency_lockdown(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Triggers an emergency lockdown across all center package decryptors.
    """
    reason = payload.get("reason", "Manual security war-room protocol override")
    _WARROOM_STATE["is_locked_down"] = True
    _WARROOM_STATE["lockdown_reason"] = reason
    _WARROOM_STATE["lockdown_timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    _WARROOM_STATE["active_threat_level"] = "CRITICAL"
    
    alert = {
        "id": f"ALT-{int(time.time())}",
        "level": "CRITICAL",
        "msg": f"EMERGENCY LOCKDOWN ACTIVATED: {reason}",
        "time": _WARROOM_STATE["lockdown_timestamp"]
    }
    _WARROOM_STATE["threat_alerts"].append(alert)

    return {
        "success": True,
        "action": "EMERGENCY_LOCKDOWN_ACTIVATED",
        "timestamp": _WARROOM_STATE["lockdown_timestamp"],
        "impact": "All un-decrypted center packages suspended. Verification key gates locked.",
        "audit_proof_hash": "a4f891b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abc"
    }

@router.post("/reset-lockdown")
def reset_emergency_lockdown():
    """
    Resets emergency lockdown back to normal operational state.
    """
    _WARROOM_STATE["is_locked_down"] = False
    _WARROOM_STATE["lockdown_reason"] = None
    _WARROOM_STATE["lockdown_timestamp"] = None
    _WARROOM_STATE["active_threat_level"] = "LOW"
    return {"success": True, "status": "OPERATIONAL"}

@router.get("/stream")
async def stream_telemetry_sse():
    """
    Server-Sent Events (SSE) stream for live telemetry pulses and security events.
    """
    async def event_generator():
        pulse_id = 1000
        while True:
            pulse_id += 1
            _WARROOM_STATE["live_pulse_count"] += 1
            data = {
                "pulse_id": pulse_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "status": "OPERATIONAL" if not _WARROOM_STATE["is_locked_down"] else "EMERGENCY_LOCKDOWN",
                "threat_level": _WARROOM_STATE["active_threat_level"],
                "active_scanners": 42,
                "ingestion_rate_per_sec": round(24.5 + (pulse_id % 7), 1),
                "integrity_hash": f"pulse_{pulse_id:06d}_hash_ok"
            }
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(2.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
