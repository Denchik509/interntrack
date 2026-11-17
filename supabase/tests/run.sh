#!/usr/bin/env bash
# Checks the schema and Row Level Security on a local PostgreSQL server
# (not on Supabase). Connection settings come from the standard libpq
# variables, for example:
#
#   PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
#
# It creates a throwaway database named interntrack_rls_test and drops it after.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DB=interntrack_rls_test

psql -d postgres -q -c "drop database if exists $DB" -c "create database $DB"
trap 'psql -d postgres -q -c "drop database if exists $DB"' EXIT
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$DIR/00_supabase_stub.sql"
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$DIR/../migrations/20261117000000_initial_schema.sql"
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$DIR/10_rls_checks.sql" | grep -E "PASSED"
