#!/bin/bash

if [ "$#" -ne 1 ] || [[ "$1" != "major" && "$1" != "minor" && "$1" != "patch" && "$1" != "prerelease" ]]; then
  echo "Usage: ./publish.sh <major/minor/patch/prerelease>"
  exit 1
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Error: Environment variable GITHUB_TOKEN is not set."
  exit 1
fi

git pull
npm run clean
npm run build

STATUS=$(git status --porcelain)

if [ -n "$STATUS" ]; then
  echo "Error: There are uncommitted files. Please commit them first."
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$1" != "prerelease" ]; then
  if [ "$BRANCH" != "develop" ]; then
    echo "Error: You must be on the develop branch to publish."
    exit 1
  fi

  VERSION=$(npm version $1 --no-git-tag-version)
else
  if [ "$BRANCH" == "main" ] || [ "$BRANCH" == "develop" ]; then
    echo "Error: prerlease must be outside the main or develop branch."
    exit 1
  fi

  VERSION=$(npm version prerelease --preid rc)
fi

git add package.json package-lock.json
git commit -m "bump: $VERSION"
git push --follow-tags

git switch main
git merge develop --no-ff --no-edit
git push --follow-tags

git switch develop
