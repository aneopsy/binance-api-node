import test from 'ava'

import { ErrorCodes } from 'index'

test('[MISC] Some error codes are defined', t => {
  t.truthy(ErrorCodes, 'The map is there')
  t.truthy(ErrorCodes.TOO_MANY_ORDERS, 'And we have this')
})
