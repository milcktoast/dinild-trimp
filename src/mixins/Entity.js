export const Entity = {
  add (child) {
    const { item } = this
    item.add(child)
  },

  addTo (parent) {
    const { item, skeleton } = this
    parent.add(item)
    if (skeleton) item.bind(skeleton)
  },

  bind (skeleton) {
    const { item } = this
    item.updateMatrixWorld(true)
    item.bind(skeleton, item.matrixWorld)
  }
}
