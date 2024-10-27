import { defineInstance } from "../instance.js";
import { execa } from "../processes/execa.js";
import { toArgs } from "../utils.js";

export type KatanaParameters = {
  /**
   * Number of dev accounts to generate and configure.
   *
   * @defaultValue 10
   */
  accounts?: number | undefined;
  /**
   * Block time in seconds for interval mining.
   */
  blockTime?: number | undefined;
  /**
   * Path or alias to the Anvil binary.
   */
  binary?: string | undefined;
  /**
   * The chain id.
   */
  chainId?: number | undefined;
  /**
   * Fetch state over a remote endpoint instead of starting from an empty state.
   *
   * If you want to fetch state from a specific block number, use the `forkBlockNumber` option.
   */
  rpcUrl?: string | undefined;
  /**
   * Fetch state from a specific block number over a remote endpoint.
   *
   * Requires `rpcUrl` to be set.
   */
  forkBlockNumber?: number | bigint | undefined;
  /**
   * The host the server will listen on.
   */
  host?: string | undefined;
  /**
   * Disable auto and interval mining, and mine on demand instead.
   */
  noMining?: boolean | undefined;
  /**
   * Port number to listen on.
   *
   * @defaultValue 8545
   */
  port?: number | undefined;
  /**
   * Don't print anything on startup and don't print logs.
   */
  silent?: boolean | undefined;

  dev?: boolean;
};

export const katana = defineInstance((parameters: KatanaParameters) => {
  const { binary = "katana", ...args } = parameters || {};

  const name = "katana";
  const process = execa({ name });

  return {
    _internal: {
      args,
      get process() {
        return process._internal.process;
      },
    },
    host: args.host ?? "localhost",
    name,
    port: args.port ?? 5051,
    async start({ port = args.port }, options) {
      // console.log(`EXECUTING: ${binary} ${toArgs({ ...args, port })}`);
      return await process.start(
        ($) => $`${binary} ${toArgs({ ...args, port })}`,
        {
          ...options,
          // Resolve when the process is listening via a "Listening on" message.
          resolver({ process, reject, resolve }) {
            process.stdout.on("data", (data: any) => {
              const message = data.toString();
              if (message.includes("RPC server started")) resolve();
            });
            process.stderr.on("data", reject);
          },
        }
      );
    },
    async stop() {
      await process.stop();
    },
  };
});

