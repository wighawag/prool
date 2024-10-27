import { afterEach, expect, test } from 'vitest'
import type { Instance } from '../instance.js'
import { type KatanaParameters, katana } from './katana.js'

const instances: Instance[] = []

const defineInstance = (parameters: KatanaParameters = {}) => {
  const instance = katana(parameters)
  instances.push(instance)
  return instance
}

afterEach(async () => {
  for (const instance of instances) await instance.stop().catch(() => {})
})

test('default', async () => {
  const messages: string[] = []
  const stdouts: string[] = []

  const instance = defineInstance({ })

  instance.on('message', (m) => messages.push(m))
  instance.on('stdout', (m) => stdouts.push(m))

  expect(instance.messages.get()).toMatchInlineSnapshot('[]')

  await instance.start()
  expect(instance.status).toEqual('started')

  expect(messages.join('')).toBeDefined()
  expect(stdouts.join('')).toBeDefined()
  expect(instance.messages.get().join('')).toBeDefined()

  await instance.stop()
  expect(instance.status).toEqual('stopped')

  expect(messages.join('')).toBeDefined()
  expect(stdouts.join('')).toBeDefined()
  expect(instance.messages.get()).toMatchInlineSnapshot('[]')
})

test('behavior: instance errored (duplicate ports)', async () => {
  const instance_1 = defineInstance({  port: 5051 })
  const instance_2 = defineInstance({  port: 5051 })

  await instance_1.start()
  await expect(() => instance_2.start()).rejects.toThrowError(
    'Failed to start process "katana"',
  )
})

test('behavior: start and stop multiple times', async () => {
  const instance = defineInstance()

  await instance.start()
  await instance.stop()
  await instance.start()
  await instance.stop()
  await instance.start()
  await instance.stop()
  await instance.start()
  await instance.stop()
})

test('behavior: can subscribe to stdout', async () => {
  const messages: string[] = []
  const instance = defineInstance({ })
  instance.on('stdout', (message) => messages.push(message))

  await instance.start()
  expect(messages.length).toBeGreaterThanOrEqual(1)
})

test('behavior: can subscribe to stderr', async () => {
  const messages: string[] = []

  const instance_1 = defineInstance({  port: 5051 })
  const instance_2 = defineInstance({  port: 5051 })

  await instance_1.start()
  instance_2.on('stderr', (message) => messages.push(message))
  await expect(instance_2.start()).rejects.toThrow(
    'Failed to start process "katana"',
  )
})

test.skip('behavior: starts katana with custom options', async () => {
  const instance = defineInstance({
    dev: true,
    chainId: 123,
    forkBlockNumber: 69420,
    rpcUrl: 'https://starknet.drpc.org',
  })

  await instance.start()
})

test('behavior: exit', async () => {
  const instance = defineInstance({ })

  let exitCode: number | null | undefined = undefined
  instance.on('exit', (code) => {
    exitCode = code
  })

  await instance.start()
  expect(instance.status).toEqual('started')

  instance._internal.process.kill()

  await new Promise<void>((res) => setTimeout(res, 100))
  expect(instance.status).toEqual('stopped')
  expect(typeof exitCode !== 'undefined').toBeTruthy()
})

test('behavior: exit when status is starting', async () => {
  const instance = defineInstance({ })

  const promise = instance.start()
  expect(instance.status).toEqual('starting')

  instance._internal.process.kill()

  await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Failed to start process "katana": exited]`,
  )
})
