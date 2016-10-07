PATH=$(npm bin):$PATH
export NODE_ENV=production
browserify -t [ rollupify --config rollup.config.js ] index.js | uglifyjs -cn > build/index.js
