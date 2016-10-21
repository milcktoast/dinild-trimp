export function bindAll (context, ...names) {
  names.forEach((name) => {
    context[name] = context[name].bind(context)
  })
}
