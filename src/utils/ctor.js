export function ctor (Ctor) {
  return function () {
    var instance = Object.create(Ctor.prototype)
    Ctor.apply(instance, arguments)
    return instance
  }
}

export function inherit (Ctor, ParentCtor) {
  Ctor.create = ctor(Ctor)
  if (ParentCtor) Ctor.prototype = Object.create(ParentCtor.prototype)
  Ctor.prototype.constructor = Ctor
}
