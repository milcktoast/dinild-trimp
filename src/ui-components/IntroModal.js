import {
  EventDispatcher
} from 'three'
import { inherit } from '../utils/ctor'

export function IntroModal () {
  const element = document.getElementById('intro')
  const form = document.getElementById('intro-form')
  const fidelityInput = form.querySelector('select[name="fidelity"]')
  Object.assign(this, {
    element, form, fidelityInput
  })
  this.bindEvents(element, form)
  setTimeout(() => {
    this.animateIn()
  }, 0)
}

inherit(null, IntroModal, EventDispatcher.prototype, {
  _events: {
    enter: { type: 'enter' }
  },

  bindEvents (element, form) {
    form.addEventListener('submit', this.onEnter.bind(this))
  },

  animateIn () {
    this.form.classList.remove('hidden')
  },

  animateOut (fn) {
    const { element } = this
    element.classList.add('hidden')
    setTimeout(() => {
      element.style.display = 'none'
      fn()
    }, 400)
  },

  onEnter (event) {
    const eventEnter = this._events.enter
    const fidelity = this.fidelityInput.value
    eventEnter.value = fidelity
    event.preventDefault()
    this.animateOut(() => {
      this.dispatchEvent(eventEnter)
    })
  }
})
