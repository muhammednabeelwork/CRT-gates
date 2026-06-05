#!/usr/bin/env bash
set -e

# Change to project root (assumes script is in the root)
cd "$(dirname "$0")"

# Set remote to the correct CRT‑gates repository
git remote set-url origin https://github.com/muhammednabeelwork/CRT-gates.git

echo "Remote URL set to $(git remote get-url origin)"

# Fetch remote and ensure we are on the main branch
git fetch origin

git checkout -B main origin/main || git checkout -b main

# Stage all changes, commit, and push
git add .

git commit -m "Update heading to CRT and subheading"

git push -u origin main
