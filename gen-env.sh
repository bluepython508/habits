#!/bin/bash

if [ "$1" = "-f" ] 
then
    shift
else
    set -C
fi

cat > ${1:-.env} <<EOF
POSTGRES_PASSWORD=$(openssl rand -base64 32)
ROCKET_SECRET_KEY=$(openssl rand -base64 32)
EOF