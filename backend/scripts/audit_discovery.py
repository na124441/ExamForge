import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

def discover_backend():
    endpoints = []
    transaction_issues = []
    
    endpoint_re = re.compile(r'@(?:router|app)\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)["\']')
    current_user_re = re.compile(r'Depends\((?:get_current_user|require_role|get_current_active_user|auth_required)\)')
    db_session_re = re.compile(r'db:\s*Session\s*=\s*Depends\(')
    commit_re = re.compile(r'db\.commit\(\)')
    rollback_re = re.compile(r'db\.rollback\(\)')

    backend_app_dir = os.path.join(PROJECT_ROOT, 'backend', 'app')
    for root, dirs, files in os.walk(backend_app_dir):
        for f in files:
            if f.endswith('.py'):
                p = os.path.join(root, f)
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    lines = content.split('\n')
                    
                    for idx, line in enumerate(lines):
                        m = endpoint_re.search(line)
                        if m:
                            method, route_path = m.group(1).upper(), m.group(2)
                            func_chunk = '\n'.join(lines[idx:idx+35])
                            has_auth = bool(current_user_re.search(func_chunk))
                            has_db = bool(db_session_re.search(func_chunk))
                            has_commit = bool(commit_re.search(func_chunk))
                            has_rollback = bool(rollback_re.search(func_chunk))
                            
                            endpoints.append({
                                'file': os.path.relpath(p, PROJECT_ROOT),
                                'line': idx + 1,
                                'method': method,
                                'path': route_path,
                                'has_auth': has_auth,
                                'has_db': has_db,
                                'has_commit': has_commit,
                                'has_rollback': has_rollback
                            })
                            
                            if has_commit and not has_rollback and 'try:' in func_chunk:
                                transaction_issues.append({
                                    'file': os.path.relpath(p, PROJECT_ROOT),
                                    'line': idx + 1,
                                    'path': route_path,
                                    'issue': 'Commit without explicit rollback in exception block'
                                })
                                
    return endpoints, transaction_issues

def discover_frontend():
    pages = []
    
    frontend_app_dir = os.path.join(PROJECT_ROOT, 'frontend', 'src', 'app')
    for root, dirs, files in os.walk(frontend_app_dir):
        for f in files:
            if f == 'page.tsx':
                p = os.path.join(root, f)
                rel = os.path.relpath(p, frontend_app_dir)
                route_dir = os.path.dirname(rel).replace('\\', '/')
                route_url = '/' + ('' if route_dir == '.' else route_dir)
                
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    has_auth_guard = 'useAuth' in content or 'localStorage.getItem("access_token")' in content or 'token' in content
                    has_role_guard = 'role' in content or 'user' in content
                    has_form = '<form' in content or 'onSubmit' in content or 'handle' in content
                    
                    pages.append({
                        'route': route_url,
                        'file': os.path.relpath(p, PROJECT_ROOT),
                        'has_auth_check': has_auth_guard,
                        'has_role_check': has_role_guard,
                        'has_form': has_form
                    })

    return pages

if __name__ == '__main__':
    backend_endpoints, tx_issues = discover_backend()
    frontend_pages = discover_frontend()
    
    print(f"=== DISCOVERY SUMMARY ===")
    print(f"Total Backend Endpoints: {len(backend_endpoints)}")
    print(f"Endpoints with Auth Protection: {sum(1 for e in backend_endpoints if e['has_auth'])}")
    print(f"Endpoints without Direct Auth Decorator (Public or router-level): {sum(1 for e in backend_endpoints if not e['has_auth'])}")
    print(f"Total Frontend Pages: {len(frontend_pages)}")
    print(f"Potential Transaction Issues: {len(tx_issues)}")
    
    out_file = os.path.join(PROJECT_ROOT, 'backend', 'discovery_report.json')
    with open(out_file, 'w', encoding='utf-8') as fp:
        json.dump({
            'backend_endpoints': backend_endpoints,
            'tx_issues': tx_issues,
            'frontend_pages': frontend_pages
        }, fp, indent=2)
    print(f"Report written to {out_file}")
