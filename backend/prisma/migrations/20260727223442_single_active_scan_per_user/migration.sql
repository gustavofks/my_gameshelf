-- At most one active (PENDING or RUNNING) scan job per user.
-- A partial unique index — Prisma's schema cannot express the WHERE clause, so
-- it lives here as raw SQL. It is the atomic backstop for the non-atomic
-- check-then-create guard in ScannerService.start(): two racing requests can
-- both pass the pre-check, but only one INSERT of an active job can succeed.
CREATE UNIQUE INDEX "ScanJob_one_active_per_user"
  ON "ScanJob" ("userId")
  WHERE status IN ('PENDING', 'RUNNING');
