PATH=$(npm bin):$PATH
budo index.js --live -- -t babelify -t brfs
