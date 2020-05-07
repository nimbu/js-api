# Thin abstraction layer for the Nimbu API for modern browsers

When we say "modern browsers" we mean a browser with:

- `window.Promise`:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
- `window.fetch`: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

Polyfilling these on older browsers will also work.

The files distributed in the package are compiled to ES6. If you need support for older browsers,
you need to configure your packager to compile files in `node_modules` to ES5.

This library is written in TypeScript and provides bundled type declarations for usage with
TypeScript.
