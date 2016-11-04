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

  animateOut () {
    const { element } = this
    element.classList.add('hidden')
    setTimeout(() => {
      element.style.display = 'none'
    }, 1000)
  },

  onEnter (event) {
    const eventEnter = this._events.enter
    const fidelity = this.fidelityInput.value
    eventEnter.value = fidelity
    this.dispatchEvent(eventEnter)
    event.preventDefault()
    setTimeout(() => {
      this.animateOut()
    }, 0)
  }
})
