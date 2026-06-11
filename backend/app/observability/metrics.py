class MetricsRegistry:
    def __init__(self):
        self.counters = {
            "examforge_api_requests_total": 0,
            "examforge_auth_failures_total": 0,
            "examforge_package_release_attempts_total": 0,
            "examforge_audit_events_total": 0,
            "examforge_audit_chain_failures_total": 0,
            "examforge_jobs_running_total": 0,
            "examforge_jobs_failed_total": 0,
            "examforge_candidate_sessions_active": 0,
            "examforge_tenant_violations_total": 0
        }
        self.latencies = []

    def increment(self, name: str, value: int = 1):
        if name in self.counters:
            self.counters[name] += value

    def record_latency(self, seconds: float):
        self.latencies.append(seconds)
        if len(self.latencies) > 1000:
            self.latencies.pop(0)

    def get_avg_latency(self) -> float:
        if not self.latencies:
            return 0.0
        return sum(self.latencies) / len(self.latencies)

metrics_registry = MetricsRegistry()
