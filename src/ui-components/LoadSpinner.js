import { inherit } from '../utils/ctor'
import { factorTween } from '../utils/tween'

export function LoadSpinner () {
  this.opacity = 1
  this.rects = [
    [0, 0],
    [6, 0],
    [6, 6],
    [0, 6]
  ]
  this.state = {
    frame: 0,
    opacity: this.opacity
  }
  this.createElement(10, 10)
}

inherit(null, LoadSpinner, {
  createElement (size, offset = 0) {
    const element = document.createElement('canvas')
    const ctx = element.getContext('2d')
    const pxRatio = window.devicePixelRatio || 1

    element.className = 'laod-spinner'
    element.width = size * pxRatio
    element.height = size * pxRatio

    Object.assign(element.style, {
      position: 'absolute',
      top: offset + 'px',
      left: offset + 'px',
      width: size + 'px',
      height: size + 'px'
    })

    Object.assign(this, {
      element, ctx, pxRatio, size
    })
  },

  appendTo (parent) {
    parent.appendChild(this.element)
  },

  render () {
    const { ctx, pxRatio, rects, size, state } = this
    if (state.opacity < 0) return

    ctx.fillStyle = '#fff'
    ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const offset = state.frame++ * 0.25
    rects.forEach((pos, i) => {
      ctx.globalAlpha = (Math.sin(offset + i) * 0.5 + 0.5) * state.opacity
      ctx.fillRect(pos[0], pos[1], 4, 4)
    })

    factorTween('opacity', state, this, 0.2)
  }
})
