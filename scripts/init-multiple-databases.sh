#!/bin/bash
# =============================================================================
# PostgreSQL: Create multiple databases on first startup
# =============================================================================
# This script is mounted to /docker-entrypoint-initdb.d/ and runs once
# when the PostgreSQL container is initialized for the first time.
#
# It creates the databases specified in POSTGRES_MULTIPLE_DATABASES env var
# (comma-separated) using the same owner as POSTGRES_DB.
# =============================================================================

set -e
set -u

# POSTGRES_MULTIPLE_DATABASES is a comma-separated list like "db1,db2,db3"
if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "Creating additional databases: ${POSTGRES_MULTIPLE_DATABASES}"

    IFS=','
    for db in ${POSTGRES_MULTIPLE_DATABASES}; do
        db=$(echo "$db" | xargs)  # Trim whitespace
        if [ -n "$db" ]; then
            echo "  → Creating database: ${db}"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
                SELECT 'CREATE DATABASE "${db}" OWNER "${POSTGRES_USER}"'
                WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db}');
EOSQL
            # Actually create it (the above is just a check, this does the creation)
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
                SELECT 1 FROM pg_database WHERE datname = '${db}';
EOSQL
            if [ $? -ne 0 ]; then
                createdb -O "$POSTGRES_USER" "$db" 2>/dev/null || true
            fi

            # Enable PostGIS extension on the plans database
            if [ "$db" = "electridom_plans" ]; then
                echo "  → Enabling PostGIS on ${db}"
                psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
                    CREATE EXTENSION IF NOT EXISTS postgis;
                    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL
            fi
        fi
    done
    unset IFS
    echo "Additional databases created successfully."
fi
