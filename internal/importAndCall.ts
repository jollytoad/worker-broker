import { marshal, unmarshalArgs } from "./marshal.ts";
import type { Fn, WorkerMsgCall, WorkerMsgResult } from "./types.ts";

/**
 * Import the target module and (optionally) call the function
 */
export const importAndCall = async <F extends Fn>(
  msg: WorkerMsgCall<F>,
): Promise<WorkerMsgResult<F>> => {
  let props: Pick<WorkerMsgResult<Fn>, "result" | "error"> = {};
  try {
    const m = await import(msg.targetModule);

    if (msg.functionName) {
      const fn = m[msg.functionName];

      if (typeof fn === "function") {
        const args = msg.args?.length ? await unmarshalArgs(msg.args) : [];

        props = {
          result: await marshal(await fn.apply(msg, args)),
        };
      } else {
        props = {
          error: "Function not found",
        };
      }
    }
  } catch (error: unknown) {
    props = {
      error: await marshal(error),
    };
  }

  return {
    ...msg,
    kind: "result",
    ...props,
  };
};
