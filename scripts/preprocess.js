const fs = require('fs')
const path = require('path')
const readline = require('readline')

const filePath = path.join(process.cwd(), process.argv[2])
const lineReader = readline.createInterface({
  input: fs.createReadStream(filePath)
})

const matchStart = '// #ifdef DEVELOPMENT'
const matchEnd = '// #endif'
let isMatchedBlock = false
lineReader.on('line', (line) => {
  if (line.indexOf(matchStart) === 0) {
    isMatchedBlock = true
  }
  if (!isMatchedBlock) {
    process.stdout.write(line + '\n')
  }
  if (isMatchedBlock && line.indexOf(matchEnd) === 0) {
    isMatchedBlock = false
  }
})
