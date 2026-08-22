import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

def audit_codebase():
    findings = []
    
    # 1. Inspect Backend API Authorization and Security
    backend_app_dir = os.path.join(PROJECT_ROOT, 'backend', 'app')
    
    # Sensitive action keywords in route paths
    sensitive_patterns = [
        (re.compile(r'/publish|/release|/decision|/approve|/tamper|/clear|/rotate|/verify-candidate|/assign|/generate-paper|/seal'), 'CRITICAL_ACTION', 'P1'),
        (re.compile(r'/delete|/remove|/reset|/purge'), 'DESTRUCTIVE_ACTION', 'P1'),
        (re.compile(r'/payment|/pay|/order|/checkout|/webhook'), 'FINANCIAL_WORKFLOW', 'P0'),
        (re.compile(r'/key|/secret|/vault|/hsm'), 'CRYPTOGRAPHIC_KEYSPACE', 'P0'),
    ]

    endpoint_re = re.compile(r'@(?:router|app)\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)["\']')
    current_user_re = re.compile(r'Depends\((?:get_current_user|require_role|get_current_active_user|auth_required|require_permissions)\)')
    
    for root, dirs, files in os.walk(backend_app_dir):
        for f in files:
            if f.endswith('.py'):
                p = os.path.join(root, f)
                rel_path = os.path.relpath(p, PROJECT_ROOT)
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    lines = content.split('\n')
                    
                    for idx, line in enumerate(lines):
                        m = endpoint_re.search(line)
                        if m:
                            method, route_path = m.group(1).upper(), m.group(2)
                            func_chunk = '\n'.join(lines[idx:idx+45])
                            
                            has_auth = bool(current_user_re.search(func_chunk))
                            
                            # Check if router itself has dependencies
                            is_router_protected = 'dependencies=[Depends(' in content[:idx]
                            
                            # Check sensitive endpoints without auth
                            for pat, category, severity in sensitive_patterns:
                                if pat.search(route_path) and not has_auth and not is_router_protected:
                                    findings.append({
                                        'id': f'SEC-{len(findings)+1:03d}',
                                        'severity': severity,
                                        'category': category,
                                        'title': f'Unauthenticated Sensitive Endpoint: {method} {route_path}',
                                        'file': rel_path,
                                        'line': idx + 1,
                                        'method': method,
                                        'path': route_path,
                                        'symptom': f'Endpoint {route_path} performs privileged state mutations without direct token validation.',
                                        'root_cause': 'Route handler does not inject Depends(get_current_user) or Depends(require_role).',
                                        'recommendation': 'Add appropriate role/permission dependency to route definition.'
                                    })

    # 2. Inspect Database Transactions & Partial Failure Risks
    for root, dirs, files in os.walk(backend_app_dir):
        for f in files:
            if f.endswith('.py'):
                p = os.path.join(root, f)
                rel_path = os.path.relpath(p, PROJECT_ROOT)
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    
                    # Look for functions doing multiple db.add or db.commit without db.rollback in except
                    if 'db.commit()' in content:
                        blocks = re.split(r'\ndef ', content)
                        for block in blocks[1:]:
                            if 'db.commit()' in block and 'except' in block and 'db.rollback()' not in block:
                                func_name = block.split('(')[0].strip()
                                findings.append({
                                    'id': f'DATA-{len(findings)+1:03d}',
                                    'severity': 'P1',
                                    'category': 'TRANSACTION_INTEGRITY',
                                    'title': f'Missing db.rollback() on exception in {func_name}',
                                    'file': rel_path,
                                    'line': 1,
                                    'symptom': f'If an exception occurs during db.commit() in {func_name}, the transaction remains un-rolled back, poisoning the connection pool.',
                                    'root_cause': 'Exception handler does not call db.rollback() before returning error response.',
                                    'recommendation': 'Add db.rollback() in except Exception block.'
                                })

    # 3. Inspect Frontend Mock Data / Hardcoded State
    frontend_app_dir = os.path.join(PROJECT_ROOT, 'frontend', 'src')
    mock_pattern = re.compile(r'(?:const\s+mock[A-Z]\w+|const\s+DUMMY_\w+|const\s+FAKE_\w+)\s*[:=]')
    
    for root, dirs, files in os.walk(frontend_app_dir):
        for f in files:
            if f.endswith(('.tsx', '.ts')) and not f.endswith('.d.ts'):
                p = os.path.join(root, f)
                rel_path = os.path.relpath(p, PROJECT_ROOT)
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    for line_idx, line in enumerate(fp, 1):
                        if mock_pattern.search(line):
                            findings.append({
                                'id': f'UX-{len(findings)+1:03d}',
                                'severity': 'P2',
                                'category': 'MOCK_DATA_LEAK',
                                'title': f'Hardcoded Static Mock Array in {os.path.basename(p)}',
                                'file': rel_path,
                                'line': line_idx,
                                'symptom': f'Component contains hardcoded mock dataset `{line.strip()[:50]}` instead of pure database-backed state.',
                                'root_cause': 'Legacy placeholder array not fully connected to API/DB source-of-truth.',
                                'recommendation': 'Ensure dynamic fetch from backend API with graceful hydration fallback.'
                            })

    return findings

if __name__ == '__main__':
    findings = audit_codebase()
    print(f"=== AUDIT FINDINGS: {len(findings)} ISSUES DETECTED ===")
    
    by_severity = {}
    for f in findings:
        sev = f['severity']
        by_severity[sev] = by_severity.get(sev, 0) + 1
        
    for sev, count in sorted(by_severity.items()):
        print(f"  {sev}: {count}")
        
    out_file = os.path.join(PROJECT_ROOT, 'backend', 'security_audit_findings.json')
    with open(out_file, 'w', encoding='utf-8') as fp:
        json.dump(findings, fp, indent=2)
    print(f"Findings exported to {out_file}")
