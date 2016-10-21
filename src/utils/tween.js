// Tween to target by difference factor
export function factorTween (name, context, target, factor) {
  const nextState = target[name]
  let state = context[name]
  if (state == null) state = context[name] = nextState
  context[name] += (nextState - state) * factor
  return context[name]
}

// Tween to target by fixed step
export function stepTween (context, defaultStep) {
  return (name, target, instanceStep) => {
    let state = context[name]
    if (state == null) state = context[name] = target
    if (state === target) return state
    const step = instanceStep || defaultStep
    const dir = state < target ? 1 : -1

    if ((target - state) * dir < step) {
      context[name] = target
      return state
    }

    context[name] += step * dir
    return context[name]
  }
}
