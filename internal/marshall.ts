import type { Fn, Marshalled } from './types.ts';

// deno-lint-ignore no-explicit-any
const classes: Record<string, any> = {
    'Response': Response,
    'Request': Request,
};

export const marshall = async (val: unknown): Promise<unknown> => {
    for (const marshaller in classes) {
        if (val instanceof classes[marshaller]) {
            return (await import(`./marshaller/${marshaller}.ts`)).marshall(
                val,
            );
        }
    }
    return val;
};

export const unmarshall = async <T = unknown>(val: unknown): Promise<T> => {
    if (isMarshalled(val)) {
        return await (await import(`./marshaller/${val.__marshaller__}.ts`))
            .unmarshall(val);
    }
    return val as T;
};

export const marshallArgs = <F extends Fn>(
    args: Parameters<F>,
): Promise<unknown[]> => Promise.all(args.map(marshall));

export const unmarshallArgs = <F extends Fn>(
    args: unknown[],
): Promise<Parameters<F>> =>
    Promise.all(args.map(unmarshall)) as Promise<Parameters<F>>;

const isMarshalled = (val: unknown): val is Marshalled =>
    !!val && typeof val === 'object' &&
    typeof (val as Marshalled).__marshaller__ === 'string';
