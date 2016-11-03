import { inherit } from '../utils/ctor'
import { factorTween } from '../utils/tween'

export function PhraseMap () {
  this.highlight = 0
  this.positions = []
  this.state = {
    frame: 0,
    highlight: this.highlight
  }
  this.createElement(100, 0, 10)
}

inherit(null, PhraseMap, {
  createElement (size, offset = 0, margin = 0) {
    const element = document.createElement('canvas')
    const ctx = element.getContext('2d')
    const pxRatio = window.devicePixelRatio || 1

    element.className = 'phrase-map'
    element.width = size * pxRatio
    element.height = size * pxRatio

    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'rgb(100,0,255)'

    Object.assign(element.style, {
      position: 'absolute',
      bottom: offset + 'px',
      left: offset + 'px',
      width: size + 'px',
      height: size + 'px'
    })

    Object.assign(this, {
      ctx,
      element,
      margin,
      pxRatio,
      size,
      sizeInner: size - margin * 2
    })

    this.bindEvents(element)
  },

  bindEvents (element) {
    element.addEventListener('mouseover', this.onMouseOver.bind(this), false)
    element.addEventListener('mouseout', this.onMouseOut.bind(this), false)
  },

  appendTo (parent) {
    parent.appendChild(this.element)
  },

  onMouseOver (event) {
    this.highlight = 1
  },

  onMouseOut (event) {
    this.highlight = 0
  },

  setPositions (positions) {
    this.positions = positions
  },

  render () {
    const { ctx, positions, state } = this
    const { margin, pxRatio, size, sizeInner } = this
    const offset = state.frame++ * 0.05

    factorTween('highlight', state, this, 0.1)

    ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0)
    ctx.clearRect(0, 0, size, size)

    positions.forEach((pos, i) => {
      const x = pos.x * sizeInner + margin
      const y = pos.y * sizeInner + margin
      const t = Math.sin(offset + i) * 0.5 + 0.5

      ctx.globalAlpha = t
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = t * state.highlight
      ctx.beginPath()
      ctx.arc(x, y, 8 * t, 0, Math.PI * 2)
      ctx.stroke()
    })
  }
})
