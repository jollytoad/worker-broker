import { hasTransferableStreams } from "../transfer.ts";
import type { Marshalled } from "../types.ts";

interface MarshalledRequest extends Marshalled<"Request"> {
  readonly url: string;
  readonly method?: string;
  readonly headers: [string, string][];
  readonly cache?: RequestCache;
  readonly credentials?: RequestCredentials;
  readonly integrity?: string;
  readonly keepalive?: boolean;
  readonly mode?: RequestMode;
  readonly redirect?: RequestRedirect;
  readonly referrer?: string;
  readonly referrerPolicy?: ReferrerPolicy;
  readonly body: ArrayBuffer | ReadableStream<Uint8Array> | null;
}

/**
 * Marshal a Request object so it can be passed between Workers.
 */
export const marshal = async (r: Request): Promise<MarshalledRequest> => ({
  __marshaller__: "Request",
  url: r.url,
  method: r.method,
  headers: [...r.headers.entries()],
  cache: r.cache,
  credentials: r.credentials,
  integrity: r.integrity,
  keepalive: r.keepalive,
  mode: r.mode,
  redirect: r.redirect,
  referrer: r.referrer,
  referrerPolicy: r.referrerPolicy,
  body: !r.body || await hasTransferableStreams()
    ? r.body
    : await r.arrayBuffer(),
});

/**
 * Unmarshal a marshalled Request object.
 */
export const unmarshal = (
  { __marshaller__, url, ...init }: MarshalledRequest,
): Request => new Request(url, init);
