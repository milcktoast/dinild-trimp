PATH=$(npm bin):$PATH
export NODE_ENV=development
budo src/index.js:build/index.js --live -- -t babelify
