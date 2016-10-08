export function createTaskManager (...queueNames) {
  const tasks = {}
  queueNames.forEach((name) => {
    tasks[name] = []
  })
  tasks.add = (context, queueName, name_) => {
    const name = name_ || queueName
    const queue = tasks[queueName]
    const fn = context[name] || context
    queue.push(fn.bind(context))
  }
  tasks.run = (queueName, ...args) => {
    tasks[queueName].forEach((task) => {
      task(...args)
    })
  }
  return tasks
}
