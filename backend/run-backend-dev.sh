#!/usr/bin/env bash
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$BACKEND_ROOT/src/main/java"
BUILD_DIR="$BACKEND_ROOT/build/classes"
LIB_DIR="$BACKEND_ROOT/lib"

if [ -f "$BACKEND_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKEND_ROOT/.env"
  set +a
fi

export BACKEND_BASE_DIR="${BACKEND_BASE_DIR:-$BACKEND_ROOT}"
export DATA_DIR="${DATA_DIR:-$BACKEND_BASE_DIR/data}"
export LOG_FILE="${LOG_FILE:-$BACKEND_BASE_DIR/logs/app.log}"

mkdir -p "$BUILD_DIR"

# Collect Java sources
mapfile -t SOURCES < <(find "$SRC_DIR" -type f -name "*.java")
if [ ${#SOURCES[@]} -eq 0 ]; then
  echo "No Java sources found under $SRC_DIR" >&2
  exit 1
fi

SOURCES_FILE="$BUILD_DIR/sources.txt"
printf "%s\n" "${SOURCES[@]}" > "$SOURCES_FILE"

# Build classpath for compilation/run
if [ -d "$LIB_DIR" ]; then
  COMPILE_CP="$LIB_DIR/*"
  RUN_CP="$BUILD_DIR:$LIB_DIR/*"
else
  COMPILE_CP=""
  RUN_CP="$BUILD_DIR"
fi

echo "[JAVA] Compiling backend sources..."
if [ -n "$COMPILE_CP" ]; then
  javac -encoding UTF-8 -d "$BUILD_DIR" -cp "$COMPILE_CP" "@$SOURCES_FILE"
else
  javac -encoding UTF-8 -d "$BUILD_DIR" "@$SOURCES_FILE"
fi

echo "[JAVA] Starting backend..."
java -cp "$RUN_CP" com.sentra.backend.Main
