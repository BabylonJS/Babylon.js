import { Deferred } from './deferred';

export type Coroutine<T> = Iterator<undefined, T, unknown> & IterableIterator<undefined>;
type CoroutineStep<T> = IteratorResult<undefined, T>;
type ExtractCoroutineReturnType<T> = T extends Coroutine<infer TReturn> ? TReturn : never;
type CoroutineScheduler<T> = (coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => void;

function inlineScheduler<T>(coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) {
    try {
        onSuccess(coroutine.next());
    } catch (error) {
        onError(error);
    }
}

function createYieldingScheduler<T>(yieldAfterMS = 50): CoroutineScheduler<T> {
    let start: number | undefined;
    return (coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => {
        if (start === undefined) {
            start = performance.now();
        } else {
            const end = performance.now();
            if (end - start > yieldAfterMS) {
                start = end;
                setTimeout(() => {
                    inlineScheduler(coroutine, onSuccess, onError);
                }, 0);
                return;
            }
        }

        inlineScheduler(coroutine, onSuccess, onError);
    };
}

function runCoroutine<T>(coroutine: Coroutine<T>, scheduler: CoroutineScheduler<T>, onSuccess: (result: T) => void, onError: (error: any) => void) {
    function resume() {
        scheduler(coroutine,
            (stepResult: CoroutineStep<T>) => {
                if (stepResult.done) {
                    onSuccess(stepResult.value);
                } else {
                    resume();
                }
            },
            (error: any) => {
                onError(error);
            });
    }

    resume();
}

export function makeSyncFunction<TReturn, TCoroutineFactory extends (...params: any[]) => Coroutine<TReturn>>(coroutineFactory: TCoroutineFactory): (...params: Parameters<TCoroutineFactory>) => ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>> {
    return (...params: Parameters<TCoroutineFactory>): ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>> => {
        const coroutine = coroutineFactory(...params)
        let result: TReturn | undefined;
        runCoroutine(coroutine, inlineScheduler, (r: TReturn) => result = r, (e: any) => { throw e; });
        return result as ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>; // How can I remove this cast?;
    };
}

export function makeAsyncFunction<TReturn, TCoroutineFactory extends (...params: any[]) => Coroutine<TReturn>>(coroutineFactory: TCoroutineFactory): (...params: Parameters<TCoroutineFactory>) => Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>> {
    return (...params: Parameters<TCoroutineFactory>): Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>> => {
        const coroutine = coroutineFactory(...params);
        const result = new Deferred<TReturn>();
        const scheduler = createYieldingScheduler<TReturn>();
        runCoroutine(coroutine, scheduler, (r: TReturn) => result.resolve(r), (e: any) => result.reject(e));
        return result.promise as Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>>; // How can I remove this cast?;
    };
}