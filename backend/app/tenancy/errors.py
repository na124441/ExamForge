class TenantBoundaryViolation(Exception):
    def __init__(self, message: str = "Cross-tenant boundary violation detected", details: str = ""):
        self.message = message
        self.details = details
        super().__init__(self.message)
