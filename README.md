# http-proxy-pool

```ts
import { defineProxyPool } from 'http-proxy-pool'
import { alto, anvil } from 'http-proxy-pool/instances/ethereum'

const executionProxy = defineProxyPool({
  instance: anvil({ 
    // ...
    forkRpcUrl: 'https://cloudflare-eth.com'
  }),
  port: 8545,
})

await executionProxy.start() 
// Instances started at:
// "http://localhost:8545/1"
// "http://localhost:8545/2"
// "http://localhost:8545/3"
// "http://localhost:8545/n"

const bundlerProxy = defineProxyPool({
  instance: ({ id }) => alto({
    // ...
    executionRpcUrl: `${executionPool.hostname}/${id}`
  }),
  port: 4337,
})

await bundlerProxy.start() 
// Instances started at:
// "http://localhost:4337/1" (executionRpcUrl: "http://localhost:8545/1")
// "http://localhost:4337/2" (executionRpcUrl: "http://localhost:8545/2")
// "http://localhost:4337/3" (executionRpcUrl: "http://localhost:8545/3")
// "http://localhost:4337/n" (executionRpcUrl: "http://localhost:8545/n")
```
