#!/usr/bin/env bash
# Build FractalSpace.saver (universal, ad-hoc signed) with the site bundled inside.
# Requires macOS with the Xcode command line tools. Output: macos/build/FractalSpace.saver
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
out="$here/build"
saver="$out/FractalSpace.saver"

rm -rf "$out"
mkdir -p "$saver/Contents/MacOS" "$saver/Contents/Resources/site"
cp "$here/Info.plist" "$saver/Contents/Info.plist"

for arch in arm64 x86_64; do
  swiftc -O -emit-library -module-name FractalSpace \
    -target "$arch-apple-macos11" \
    -framework ScreenSaver -framework WebKit \
    -o "$out/FractalSpace-$arch" "$here/FractalSpaceView.swift"
done
lipo -create "$out/FractalSpace-arm64" "$out/FractalSpace-x86_64" -output "$saver/Contents/MacOS/FractalSpace"
rm "$out/FractalSpace-arm64" "$out/FractalSpace-x86_64"

# The site, minus files only crawlers and downloads need.
rsync -a --exclude '_pages/' --exclude 'social/' --exclude '*.zip' --exclude 'seo-routes.conf' \
  "$root/dist/" "$saver/Contents/Resources/site/"

codesign --force --deep --sign - "$saver"
printf 'Built %s\n' "$saver"
