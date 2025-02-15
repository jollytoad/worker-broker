import { hasTransferableStreams } from "../transfer.ts";
import type { Marshalled } from "../types.ts";

interface MarshalledResponse extends Marshalled<"Response"> {
  readonly status: number;
  readonly statusText: string;
  readonly headers: [string, string][];
  readonly body: ArrayBuffer | ReadableStream<Uint8Array> | null;
}

/**
 * Marshal a Response object so it can be passed between Workers.
 */
export const marshal = async (r: Response): Promise<MarshalledResponse> => ({
  __marshaller__: "Response",
  status: r.status,
  statusText: r.statusText,
  headers: [...r.headers.entries()],
  body: !r.body || await hasTransferableStreams()
    ? r.body
    : await r.arrayBuffer(),
});

/**
 * Unmarshal a marshalled Request object.
 */
export const unmarshal = (
  { __marshaller__, body, ...init }: MarshalledResponse,
): Response => new Response(body, init);
