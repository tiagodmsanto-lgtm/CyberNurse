const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Add support for .wasm files used by expo-sqlite on web, .db for pre-populated DBs, and audio files
config.resolver.assetExts.push('wasm', 'db', 'ogg', 'mp3', 'wav');

// 2. Add COEP and COOP headers to support SharedArrayBuffer in development
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = config;
