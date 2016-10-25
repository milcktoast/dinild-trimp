export const Entity = {
  add (child) {
    this.item.add(child)
  },

  addTo (parent) {
    parent.add(this.item)
  },

  bind (skeleton) {
    this.item.bind(skeleton)
  }
}
