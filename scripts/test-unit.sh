PATH=$(npm bin):$PATH
babel-tape-runner "src/**/*-test.js" | tap-spec
