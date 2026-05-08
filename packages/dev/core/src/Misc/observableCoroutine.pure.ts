import { CoroutineStep, inlineScheduler, AsyncCoroutine, CoroutineScheduler, runCoroutineAsync } from "./coroutine";
import { Observable } from "./observable.pure";
let _registered = false;
export function registerObservableCoroutine(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    function CreateObservableScheduler<T>(observable: Observable<any>): { scheduler: CoroutineScheduler<T>; dispose: () => void } {
        const coroutines = new Array<AsyncCoroutine<T>>();
        const onSteps = new Array<(stepResult: CoroutineStep<T>) => void>();
        const onErrors = new Array<(stepError: any) => void>();

        const observer = observable.add(() => {
            const count = coroutines.length;
            for (let i = 0; i < count; i++) {
                inlineScheduler(coroutines.shift()!, onSteps.shift()!, onErrors.shift()!);
            }
        });

        const scheduler = (coroutine: AsyncCoroutine<T>, onStep: (stepResult: CoroutineStep<T>) => void, onError: (stepError: any) => void) => {
            coroutines.push(coroutine);
            onSteps.push(onStep);
            onErrors.push(onError);
        };

        return {
            scheduler: scheduler,
            dispose: () => {
                observable.remove(observer);
            },
        };
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    Observable.prototype.runCoroutineAsync = function (coroutine: AsyncCoroutine<void>) {
        if (!this._coroutineScheduler) {
            const schedulerAndDispose = CreateObservableScheduler<void>(this);
            this._coroutineScheduler = schedulerAndDispose.scheduler;
            this._coroutineSchedulerDispose = schedulerAndDispose.dispose;
        }

        return runCoroutineAsync(coroutine, this._coroutineScheduler);
    };

    Observable.prototype.cancelAllCoroutines = function () {
        if (this._coroutineSchedulerDispose) {
            this._coroutineSchedulerDispose();
        }
        this._coroutineScheduler = undefined;
        this._coroutineSchedulerDispose = undefined;
    };
}
