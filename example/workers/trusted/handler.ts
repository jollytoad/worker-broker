import { notFound } from "@http/response/not-found";
import { cascade } from "@http/route/cascade";
import { byPattern } from "@http/route/by-pattern";
import { plainError } from "@http/response/plain-error";
import { callWorkerFn } from "@jollytoad/worker-broker/worker";

export default cascade(
  byPattern("/:moduleName/:functionName", async (_req, match) => {
    const { moduleName, functionName } = match.pathname.groups;
    const targetModule =
      new URL(`../untrusted/${moduleName}.ts`, import.meta.url).href;
    const params = urlParams(new URLSearchParams(match.search.input));

    try {
      const result = await callWorkerFn({
        kind: "call",
        id: crypto.randomUUID(),
        sourceModule: import.meta.url,
        targetModule,
        functionName,
        args: [params],
      });

      if (result instanceof Response) {
        return result;
      } else {
        return Response.json(result);
      }
    } catch (e: unknown) {
      if (e instanceof Response) {
        return e;
      } else if (
        e instanceof Error && e.message.includes("Module not found")
      ) {
        return notFound();
      } else {
        return plainError(
          500,
          "Internal Server Error",
          e instanceof Error ? e.message : undefined,
        );
      }
    }
  }),
);

function urlParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
