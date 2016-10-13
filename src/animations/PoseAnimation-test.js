import test from 'tape'
import { PoseAnimation } from './PoseAnimation'

test('PoseAnimation - create', (t) => {
  t.plan(1)
  const pose = new PoseAnimation([[0, 1]])
  t.ok(pose)
})
