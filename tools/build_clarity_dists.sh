#!/bin/bash

set -e

GIT_SDK_TAG=$1
API_TOKEN=$2

CORE_SRC=".blockstack-core-src"

# Pull blockstack-core src.
git clone --branch $GIT_SDK_TAG --depth 1 https://github.com/blockstack/blockstack-core.git "$CORE_SRC"

# Compile and archive binaries.
# (DIST_TARGET_FILTER=INVALID "$CORE_SRC/build-scripts/docker-run.sh")
("$CORE_SRC/build-scripts/docker-run.sh")


owner="blockstack"
repo="clarity-js-sdk"
tag="$GIT_SDK_TAG"
github_api_token="$API_TOKEN"

GH_API="https://api.github.com"
GH_REPO="$GH_API/repos/$owner/$repo"
GH_TAGS="$GH_REPO/releases/tags/$tag"
AUTH="Authorization: token $github_api_token"
WGET_ARGS="--content-disposition --auth-no-challenge --no-cookie"
CURL_ARGS="-LJO#"

# Validate token.
curl -o /dev/null -sH "$AUTH" $GH_REPO || { echo "Error: Invalid repo, token or network issue!";  exit 1; }

# Read asset tags.
response=$(curl -sH "$AUTH" $GH_TAGS)

uploadAsset() {
  filename="$1"
  # Get ID of the asset based on given filename.
  eval $(echo "$response" | grep -m 1 "id.:" | grep -w id | tr : = | tr -cd '[[:alnum:]]=')
  [ "$id" ] || { echo "Error: Failed to get release id for tag: $tag"; echo "$response" | awk 'length($0)<100' >&2; exit 1; }

  # Construct url
  GH_ASSET="https://uploads.github.com/repos/$owner/$repo/releases/$id/assets?name=$(basename $filename)"

  echo "Uploading $GH_ASSET"

  # Upload asset
  curl "$GITHUB_OAUTH_BASIC" --data-binary @"$filename" -H "Authorization: token $github_api_token" -H "Content-Type: application/octet-stream" $GH_ASSET
}

uploadAsset "$CORE_SRC/dist/clarity-cli-linux-x64.tar.gz"
uploadAsset "$CORE_SRC/dist/clarity-cli-linux-musl-x64.tar.gz"
uploadAsset "$CORE_SRC/dist/clarity-cli-win-x64.tar.gz"
uploadAsset "$CORE_SRC/dist/clarity-cli-mac-x64.tar.gz"
