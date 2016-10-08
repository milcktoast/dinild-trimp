PATH=$(npm bin):$PATH
export NODE_ENV=production
node ./scripts/preprocess.js index.js > index.prod.js
browserify -t [ rollupify --config rollup.config.js ] index.prod.js | uglifyjs -cn > build/index.js
rm index.prod.js
