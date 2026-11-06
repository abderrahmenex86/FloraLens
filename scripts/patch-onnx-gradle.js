#!/usr/bin/env node
/**
 * onnxruntime-react-native 1.24.3 still ships a Gradle 8 build script:
 *
 *   - it pins AGP 7.4.2 in a library buildscript
 *   - it uses gradle.util.VersionNumber, removed in Gradle 9
 *
 * Expo SDK 58 uses Gradle 9.4.1, so the module fails during configuration.
 * This postinstall patch removes the obsolete buildscript and the RN < 0.71
 * branch (this project is always newer). Remove it when ONNX Runtime ships a
 * Gradle 9-compatible package.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'onnxruntime-react-native',
  'android',
  'build.gradle',
);

if (!fs.existsSync(target)) {
  console.log('[patch-onnx-gradle] onnxruntime-react-native not installed, skipping');
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
const before = source;

source = source.replace(
  /buildscript \{\n  repositories \{\n    google\(\)\n    mavenCentral\(\)\n  \}\n\n  dependencies \{\n    classpath 'com\.android\.tools\.build:gradle:7\.4\.2'\n    \/\/ noinspection DifferentKotlinGradleVersion\n  \}\n\}\n\n/,
  '',
);

source = source.replace(
  /  if \(VersionNumber\.parse\(REACT_NATIVE_VERSION\) < VersionNumber\.parse\("0\.71"\)\) \{\n    extractLibs "com\.facebook\.fbjni:fbjni:\+:headers"\n    extractLibs "com\.facebook\.fbjni:fbjni:\+"\n  \}\n\n/,
  '  // React Native >= 0.71 ships fbjni; Gradle 9 removed VersionNumber.\n',
);

if (source !== before) {
  fs.writeFileSync(target, source);
  console.log('[patch-onnx-gradle] patched onnxruntime-react-native android/build.gradle');
} else {
  console.log('[patch-onnx-gradle] already patched');
}
