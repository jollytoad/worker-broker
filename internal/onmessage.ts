import type { WorkerCallOptions, WorkerMsgCall } from "./types.ts";
import { debug } from "./debug.ts";
import { findTransferables } from "./transfer.ts";
import { importAndCall } from "./importAndCall.ts";
import { setSpecifier } from "./workerSpecifier.ts";
import { getTelemetry } from "./telemetry.ts";

export type { WorkerMsgCall } from "./types.ts";

/**
 * Minimal definition of the `self` object within a Worker,
 * as required by the `onmessage` function.
 */
export interface WorkerSelf {
  /**
   * Post a message back to the main thread from the Worker.
   */
  // deno-lint-ignore no-explicit-any
  postMessage(message: any, transfer: Transferable[]): void;
}

/**
 * Definition of the `onmessage` function.
 */
export type OnMessageFn = (
  this: WorkerSelf,
  event: MessageEvent<WorkerMsgCall>,
) => Promise<void>;

/**
 * Create a an onmessage handler for a worker.
 *
 * It simply waits for function call messages, and will dynamically
 * import the target module when the first fn call msg is received.
 *
 * @param options to customize behaviour of the Worker environment and function calls.
 */
export function onmessage(
  options?: WorkerCallOptions,
): OnMessageFn {
  let ready = false;

  return async function ({ data: callMsg }) {
    if (callMsg.kind === "call") {
      await getTelemetry().msgSpan("onmessage", callMsg, async () => {
        debug("worker received call:", callMsg);

        if (!ready) {
          debug("initializing worker");

          setSpecifier(callMsg.targetModule, callMsg.targetSegregationId);

          await options?.initialCall?.(callMsg);

          ready = true;
        }

        const resultMsg = await importAndCall(callMsg, options);

        debug("worker sending result:", resultMsg);

        this.postMessage(resultMsg, await findTransferables(resultMsg.result));
      });
    }
  };
}
