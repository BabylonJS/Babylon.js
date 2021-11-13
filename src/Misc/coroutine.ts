import { Deferred } from './deferred';

// "Coroutines are computer program components that generalize subroutines for non-preemptive multitasking, by allowing execution to be suspended and resumed."
// https://en.wikipedia.org/wiki/Coroutine

// In this implementation, coroutines are typically created via generator functions (function* with yield statements).
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*

// In this implementation, the generator function (possibly parameterized) is referred to as a coroutine factory, and the returned iterator is referred to as the coroutine.
// Technically yielding generator functions are not required - anything that implements the contract of Coroutine<T> can be run as a coroutine.

// The coroutine is started with the first call to next on the iterator, it is suspended with yield statements, and it is resumed with additional calls to next on the iterator.
// To create an object satisfying the Coroutine<T> contract with a generator function, it must not yield values, but rather only undefined via a plain "yield;" statement.
// Coroutines can call other coroutines via:
// 1. yield* someOtherCoroutine(); // If the called coroutine does not return a value
// 2. const result = yield* someOtherCoroutine(); // If the called coroutine returns a value

// Coroutines are run with the runCoroutine function, which takes a Coroutine<T>, a CoroutineScheduler<T>, and a success and error callback.
// A scheduler is responsible for scheduling the next step of a coroutine, either synchronously or asynchronously.

/**
 * A Coroutine<T> is the intersection of:
 * 1. An Iterator that yields undefined, returns a T, and is not passed values with calls to next.
 * 2. An IterableIterator of undefined (since it only yields undefined).
 */
export type Coroutine<T> = Iterator<undefined, T, unknown> & IterableIterator<undefined>;

// A CoroutineStep<T> represents a single step of a coroutine, and is an IteratorResult as returned from Coroutine<T>.next().
type CoroutineStep<T> = IteratorResult<undefined, T>;

// A CoroutineScheduler<T> is responsible for scheduling the call to Coroutine<T>.next and invokes the success or error callback after next is called.
type CoroutineScheduler<T> = (coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => void;

// The inline scheduler simply steps the coroutine synchronously. This is useful for running a coroutine synchronously, and also as a helper function for other schedulers.
function inlineScheduler<T>(coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) {
    try {
        onSuccess(coroutine.next());
    } catch (error) {
        onError(error);
    }
}

// The yielding scheduler steps the coroutine synchronously until the specified time interval has elapsed, then yields control so other operations can be performed.
// A single instance of a yielding scheduler could be shared across multiple coroutines to yield when their collective work exceeds the threshold.
function createYieldingScheduler<T>(yieldAfterMS = 25): CoroutineScheduler<T> {
    let start: number | undefined;
    return (coroutine: Coroutine<T>, onSuccess: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => {
        if (start === undefined) {
            // If start is undefined, this is the first step of a coroutine.
            start = performance.now();
        } else {
            // Otherwise check if the time interval has elapsed.
            const end = performance.now();
            if (end - start > yieldAfterMS) {
                // If so, record a new start time, and schedule the coroutine step to happen later, effectively yielding control of the execution context.
                start = end;
                setTimeout(() => {
                    inlineScheduler(coroutine, onSuccess, onError);
                }, 0);
                return;
            }
        }

        // If the coroutine step was not scheduled for the future, then do step it synchronously now.
        inlineScheduler(coroutine, onSuccess, onError);
    };
}

// Runs the specified coroutine with the specified scheduler. The success or error callback will be invoked when the coroutine finishes.
function runCoroutine<T>(coroutine: Coroutine<T>, scheduler: CoroutineScheduler<T>, onSuccess: (result: T) => void, onError: (error: any) => void) {
    function resume() {
        scheduler(coroutine,
            (stepResult: CoroutineStep<T>) => {
                if (stepResult.done) {
                    // If the coroutine is done, report success.
                    onSuccess(stepResult.value);
                } else {
                    // If the coroutine is not done, resume the coroutine (via the scheduler).
                    resume();
                }
            },
            (error: any) => {
                // If the coroutine threw an error, report the error.
                onError(error);
            });
    }

    resume();
}

// This is a helper type to extract the return type of a Coroutine<T>. It is conceptually very similar to the Awaited<T> utility type.
type ExtractCoroutineReturnType<T> = T extends Coroutine<infer TReturn> ? TReturn : never;

/**
 * Given a function that returns a Coroutine<T>, produce a function with the same parameters that returns a T.
 * The returned function runs the coroutine synchronously.
 * @param coroutineFactory A function that returns a Coroutine<T>.
 * @returns A function that runs the coroutine synchronously.
 */
export function makeSyncFunction<TReturn, TCoroutineFactory extends (...params: any[]) => Coroutine<TReturn>>(coroutineFactory: TCoroutineFactory): (...params: Parameters<TCoroutineFactory>) => ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>> {
    return (...params: Parameters<TCoroutineFactory>): ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>> => {
        // Create the coroutine from the factory function.
        const coroutine = coroutineFactory(...params);

        // Run the coroutine with the inline scheduler, storing the returned value, or re-throwing the error (since the error callback will be called synchronously by the inline scheduler).
        let result: TReturn | undefined;
        runCoroutine(coroutine, inlineScheduler, (r: TReturn) => result = r, (e: any) => { throw e; });

        // Synchronously return the result of the coroutine.
        return result as ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>; // TODO: How can we remove this cast?
    };
}

/**
 * Given a function that returns a Coroutine<T>, product a function with the same parameters that returns a Promise<T>.
 * The returned function runs the coroutine asynchronously, yield control of the execution context occasionally to enable a more responsive experience.
 * @param coroutineFactory A function that returns a Coroutine<T>.
 * @returns A function that runs the coroutine asynchronously.
 */
export function makeAsyncFunction<TReturn, TCoroutineFactory extends (...params: any[]) => Coroutine<TReturn>>(coroutineFactory: TCoroutineFactory): (...params: Parameters<TCoroutineFactory>) => Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>> {
    return (...params: Parameters<TCoroutineFactory>): Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>> => {
        // Create the coroutine from the factory function.
        const coroutine = coroutineFactory(...params);

        // Run the coroutine with a yielding scheduler, resolving or rejecting the result promise when the coroutine finishes.
        const result = new Deferred<TReturn>();
        const scheduler = createYieldingScheduler<TReturn>();
        runCoroutine(coroutine, scheduler, (r: TReturn) => result.resolve(r), (e: any) => result.reject(e));

        // Return the promise that will be resolved when the coroutine finishes.
        return result.promise as Promise<ExtractCoroutineReturnType<ReturnType<TCoroutineFactory>>>; // TODO: How can I remove this cast?
    };
}