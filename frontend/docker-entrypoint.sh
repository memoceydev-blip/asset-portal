#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/config.js
window.APP_CONFIG = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:8000}",
  KEYCLOAK_URL: "${KEYCLOAK_URL:-https://keycloak.example.com}",
  KEYCLOAK_REALM: "${KEYCLOAK_REALM:-master}",
  KEYCLOAK_CLIENT_ID: "${KEYCLOAK_CLIENT_ID:-asset-frontend}"
};
EOF

exec "$@"
