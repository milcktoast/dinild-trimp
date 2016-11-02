import { inherit } from '../utils/ctor'
import { LoadSpinner } from '../ui-components/LoadSpinner'

export function IndexInterface () {}

inherit(null, IndexInterface, {
  inject (container) {
    this.loader = new LoadSpinner()
    this.loader.appendTo(container)
    return Promise.resolve()
  },

  showLoader () {
    this.loader.opacity = 1
  },

  hideLoader () {
    this.loader.opacity = 0
  },

  render () {
    this.loader.render()
  }
})
