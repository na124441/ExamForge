# ExamForge Troubleshooting Guide

Common issues encountered when running, seeding, or deploying ExamForge, and their resolutions.

---

## 1. Seeder Database Mismatches
* **Symptom**: `IntegrityError` or `ForeignKeyViolation` when running the seeder.
* **Cause**: Database tables contain stale schemas or values from previous versions.
* **Resolution**: Re-run the clean reset seeder which drops and recreates all tables:
  ```bash
  python seed_v10_authority_pilot.py
  ```

---

## 2. Authentication 403 Forbidden Errors
* **Symptom**: Calling security or pilot endpoints returns `403 Forbidden`.
* **Cause**: Current logged-in user does not have the required role (e.g. `CONTROLLER` or `PLATFORM_SUPER_ADMIN`).
* **Resolution**: Re-authenticate as `controller@example.com` or `platform_admin@example.com` using the homepage login dashboard.

---

## 3. Publication Gate Blocks
* **Symptom**: `verify_publication_gate` returns `allowed = False`.
* **Cause**: One of the critical checkpoints (unmitigated threats, open P0 incidents, or unresolved double evaluations) is failing.
* **Resolution**: Check the returned `blocking_reasons` array. Mitigate outstanding threat models or resolve open security incidents via the incidents ledger.

---

## 4. Next.js TypeScript Type Errors
* **Symptom**: Frontend build fails during static generation with `Type error: Cannot find name 'int'`.
* **Cause**: Stale use of SQL-like variable type names (`int`) inside interfaces instead of standard TypeScript types (`number`).
* **Resolution**: Replace the type declaration with `number` inside `/src/app/security/access-review/page.tsx` or other pages.
