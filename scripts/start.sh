PATH=$(npm bin):$PATH
export NODE_ENV=development
budo index.js:build/index.js --live -- -t brfs-babel -t babelify -t envify
