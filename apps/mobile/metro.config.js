const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getSentryExpoConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro resolve from both the app's and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Load custom web fonts from local assets.
config.resolver.assetExts = [...config.resolver.assetExts, "woff", "woff2"];

// Explicit alias for hoisted monorepo deps that may not exist under apps/mobile/node_modules
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@expo-google-fonts/manrope": path.resolve(
    monorepoRoot,
    "node_modules/@expo-google-fonts/manrope",
  ),
};

// Ensure Metro can resolve symlinked packages in pnpm
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: "./global.css" });
