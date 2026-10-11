#!/usr/bin/env bash
# Generate self-signed SSL certificates for development HTTPS
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
mkdir -p "$DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/key.pem" \
  -out "$DIR/cert.pem" \
  -subj "/C=VN/ST=HCM/L=HoChiMinh/O=KidMeal/OU=IT/CN=localhost"

echo "SSL certificates generated successfully in $DIR"
