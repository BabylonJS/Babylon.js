export * from "./observable.pure";

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect } from "./devTools";
import { Observable } from "./observable.pure";

Observable.prototype.notifyObserversWithPromise ??= _MissingSideEffect("Observable", "notifyObserversWithPromise") as any;
Observable.prototype.runCoroutineAsync ??= _MissingSideEffect("Observable", "runCoroutineAsync") as any;
Observable.prototype.cancelAllCoroutines ??= _MissingSideEffect("Observable", "cancelAllCoroutines") as any;
// #endregion GENERATED_SIDE_EFFECT_STUBS
