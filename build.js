const pkg = require("./package.json");
const fs = require("fs");

const onError = (e) => {
  console.error(e);
  process.exit(1);
};

const baseConfig = {
  bundle: true,
  sourcemap: true,
  minify: true,
  entryPoints: ["./src/index.ts"],
  external: Object.keys(pkg.peerDependencies),
  define: {
    "process.env.NODE_ENV": `"production"`,
  },
};

const esbuild = require("esbuild");

esbuild
  .build({
    ...baseConfig,
    format: "esm",
    outfile: "dist/twkr.esm.js",
  })
  .catch(onError);

esbuild
  .build({
    ...baseConfig,
    format: "cjs",
    outfile: "dist/twkr.cjs.js",
  })
  .catch(onError);
