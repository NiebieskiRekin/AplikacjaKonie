#!/bin/bash
# NOTE: this script is used to create multiple users and database on the same docker postgres container.
# It is both susceptible to improper shell variable interpolation and SQL injection, so be considerate with the values.

# Source
# https://github.com/mrts/docker-postgresql-multiple-databases/blob/master/create-multiple-postgresql-databases.sh

set -e
set -u

function create_user_and_database() {
	local database=$1
    local password="$2"
	echo "  Creating user and database '$database' and password '$password'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE USER $database WITH PASSWORD '$password';
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $database;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	IFS=',' read -r -a postgres_db_array <<< "$POSTGRES_MULTIPLE_DATABASES"
	IFS=',' read -r -a postgres_pass_array <<< "$POSTGRES_MULTIPLE_PASSWORDS"
	for i in ${!postgres_db_array[@]}; do
		echo "${postgres_db_array[$i]}" "${postgres_pass_array[$i]}"
		create_user_and_database "${postgres_db_array[$i]}" "${postgres_pass_array[$i]}"
	done
	echo "Multiple databases created"
fi