from app.config.settings import settings

def is_saas_mode() -> bool:
    return settings.DEPLOYMENT_MODE.upper() == "SAAS"

def is_on_premise_mode() -> bool:
    return settings.DEPLOYMENT_MODE.upper() == "ON_PREMISE"
