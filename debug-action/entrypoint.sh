#!/bin/sh

set -e

echo "Environment variables"
echo "================================================================="
env

echo
echo
echo "Event JSON"
echo "================================================================="
cat "$GITHUB_EVENT_PATH"
