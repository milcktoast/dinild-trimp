export const Entity = {
  add (child) {
    const { item } = this
    item.add(child)
  },

  addTo (parent) {
    return this.createItem().then(() => {
      const { item, skeleton } = this
      parent.add(item)
      if (skeleton) {
        item.bind(skeleton)
      }
      if (parent.skeleton && item.isSkinnedMesh) {
        item.updateMatrixWorld(true)
        item.bind(parent.skeleton, item.matrixWorld)
      }
      return this
    })
  },

  bind (skeleton) {
    const { item } = this
    item.updateMatrixWorld(true)
    item.bind(skeleton, item.matrixWorld)
  }
}
