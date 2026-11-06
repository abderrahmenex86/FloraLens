#!/usr/bin/env node
/**
 * react-native-css 3.1.0-rc.1 (the engine behind nativewind 5) rewrites every
 * `import ... from 'react-native'` to its own partial shim at
 *
 *   node_modules/react-native-css/dist/module/components/index.cjs
 *
 * The shim only re-exports the components/APIs it wraps. Anything else becomes
 * `undefined`. `expo-asset` imports `AssetRegistry` from 'react-native', so the
 * first `Asset.fromModule()` call (font loading, model loading) throws
 *
 *   TypeError: Cannot read property 'getAssetByID' of undefined
 *
 * and `useFonts` never resolves, leaving the app on a blank screen.
 *
 * This patch appends a forwarding layer that lazily exposes every export of the
 * real `react-native` module that the shim does not already define. Remove it
 * once react-native-css forwards unknown exports itself.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-css',
  'dist',
  'module',
  'components',
  'index.cjs',
);

const marker = '// [flora-patch] forward unwrapped react-native exports';

const footer = `
${marker}
// The shim above is a fixed list. Fill in everything else from the real module
// so libraries that import e.g. \`AssetRegistry\` keep working.
const __floraReactNative = require('react-native');
for (const __floraKey of Object.keys(__floraReactNative)) {
  if (!(__floraKey in module.exports)) {
    Object.defineProperty(module.exports, __floraKey, {
      enumerable: true,
      configurable: true,
      get: () => __floraReactNative[__floraKey],
    });
  }
}
`;

if (!fs.existsSync(target)) {
  console.log('[patch-react-native-css] react-native-css not installed, skipping');
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');

if (source.includes(marker)) {
  console.log('[patch-react-native-css] already patched');
  process.exit(0);
}

fs.writeFileSync(target, source + footer);
console.log('[patch-react-native-css] forward unwrapped react-native exports');
