#!/usr/bin/env node
/* Applies NumDrop's native Android customizations to the Capacitor-generated
   android/ project. Idempotent — safe to run after every `cap add`/`cap sync`.

   Applies (per GAME_SPEC.md §9):
     • portrait screen-orientation lock on MainActivity
     • minSdkVersion 24

   Usage:  node scripts/apply-android-config.js   */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const manifestPath = path.join(
  root,
  "android/app/src/main/AndroidManifest.xml"
);
const variablesPath = path.join(root, "android/variables.gradle");

let changed = 0;

function patch(file, apply) {
  if (!fs.existsSync(file)) {
    console.warn("  ! skip (not found): " + path.relative(root, file));
    return;
  }
  const before = fs.readFileSync(file, "utf8");
  const after = apply(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log("  ✓ patched " + path.relative(root, file));
  } else {
    console.log("  = already applied " + path.relative(root, file));
  }
}

// 1) portrait lock — add android:screenOrientation="portrait" to MainActivity
patch(manifestPath, (xml) => {
  if (xml.includes('android:screenOrientation="portrait"')) return xml;
  return xml.replace(
    /(android:name=".MainActivity")/,
    '$1\n            android:screenOrientation="portrait"'
  );
});

// 2) minSdkVersion 24
patch(variablesPath, (gradle) =>
  gradle.replace(/minSdkVersion\s*=\s*\d+/, "minSdkVersion = 24")
);

console.log(
  changed
    ? "\nAndroid config applied (" + changed + " file(s) updated)."
    : "\nAndroid config already up to date."
);
