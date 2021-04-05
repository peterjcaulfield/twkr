const pkg = require("./package.json");
const fs = require("fs");

const onError = () => process.exit(1);

const baseConfig = {
  bundle: true,
  sourcemap: true,
  minify: true,
  entryPoints: ["./src/index.ts"],
  external: Object.keys(pkg.peerDependencies),
  define: {
    "process.env.NODE_ENV": "production",
  },
};

const esbuild = require("esbuild");

esbuild
  .build({
    ...baseConfig,
    outfile: "dist/twkr.esm.js",
  })
  .catch(onError);

esbuild
  .build({
    ...baseConfig,
    platform: "node",
    outfile: "dist/twkr.cjs.js",
  })
  .catch(onError);
