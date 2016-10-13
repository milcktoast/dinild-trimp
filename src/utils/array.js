export function createArrayCursor (array) {
  return new ArrayCursor(array)
}

function ArrayCursor (array) {
  this.array = array
  this.cursor = 0
}

Object.assign(ArrayCursor.prototype, {
  push () {
    const { array } = this
    let { cursor } = this
    for (let i = 0; i < arguments.length; i++) {
      array[cursor++] = arguments[i]
    }
    this.cursor = cursor
  }
})
