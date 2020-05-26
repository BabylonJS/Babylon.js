import { Observable, Observer } from '../Misc/observable';
import { Nullable } from '../types';
import { IDisposable } from '../scene';

/**
 * Construction options for a timer
 */
export interface ITimerOptions<T> {
    /**
     * Time-to-end
     */
    timeout: number;
    /**
     * The context observable is used to calculate time deltas and provides the context of the timer's callbacks. Will usually be OnBeforeRenderObservable.
     * Countdown calculation is done ONLY when the observable is notifying its observers, meaning that if
     * you choose an observable that doesn't trigger too often, the wait time might extend further than the requested max time
     */
    contextObservable: Observable<T>;
    /**
     * Optional parameters when adding an observer to the observable
     */
    observableParameters?: {
        mask?: number;
        insertFirst?: boolean;
        scope?: any;
    };
    /**
     * An optional break condition that will stop the times prematurely. In this case onEnded will not be triggered!
     */
    breakCondition?: (data?: ITimerData<T>) => boolean;
    /**
     * Will be triggered when the time condition has met
     */
    onEnded?: (data: ITimerData<any>) => void;
    /**
     * Will be triggered when the break condition has met (prematurely ended)
     */
    onAborted?: (data: ITimerData<any>) => void;
    /**
     * Optional function to execute on each tick (or count)
     */
    onTick?: (data: ITimerData<any>) => void;
}

/**
 * An interface defining the data sent by the timer
 */
export interface ITimerData<T> {
    /**
     * When did it start
     */
    startTime: number;
    /**
     * Time now
     */
    currentTime: number;
    /**
     * Time passed since started
     */
    deltaTime: number;
    /**
     * How much is completed, in [0.0...1.0].
     * Note that this CAN be higher than 1 due to the fact that we don't actually measure time but delta between observable calls
     */
    completeRate: number;
    /**
     * What the registered observable sent in the last count
     */
    payload: T;
}

/**
 * The current state of the timer
 */
export enum TimerState {
    /**
     * Timer initialized, not yet started
     */
    INIT,
    /**
     * Timer started and counting
     */
    STARTED,
    /**
     * Timer ended (whether aborted or time reached)
     */
    ENDED
}

/**
 * A simple version of the timer. Will take options and start the timer immediately after calling it
 *
 * @param options options with which to initialize this timer
 */
export function setAndStartTimer(options: ITimerOptions<any>): Nullable<Observer<any>> {
    let timer = 0;
    const startTime = Date.now();
    options.observableParameters = options.observableParameters ?? {};
    const observer = options.contextObservable.add((payload: any) => {
        const now = Date.now();
        timer = now - startTime;
        const data: ITimerData<any> = {
            startTime,
            currentTime: now,
            deltaTime: timer,
            completeRate: timer / options.timeout,
            payload
        };
        options.onTick && options.onTick(data);
        if (options.breakCondition && options.breakCondition()) {
            options.contextObservable.remove(observer);
            options.onAborted && options.onAborted(data);
        }
        if (timer >= options.timeout) {
            options.contextObservable.remove(observer);
            options.onEnded && options.onEnded(data);
        }
    }, options.observableParameters.mask, options.observableParameters.insertFirst, options.observableParameters.scope);
    return observer;
}

/**
 * An advanced implementation of a timer class
 */
export class AdvancedTimer<T = any> implements IDisposable {

    /**
     * Will notify each time the timer calculates the remaining time
     */
    public onEachCountObservable: Observable<ITimerData<T>> = new Observable();
    /**
     * Will trigger when the timer was aborted due to the break condition
     */
    public onTimerAbortedObservable: Observable<ITimerData<T>> = new Observable();
    /**
     * Will trigger when the timer ended successfully
     */
    public onTimerEndedObservable: Observable<ITimerData<T>> = new Observable();
    /**
     * Will trigger when the timer state has changed
     */
    public onStateChangedObservable: Observable<TimerState> = new Observable();

    private _observer: Nullable<Observer<T>> = null;
    private _contextObservable: Observable<T>;
    private _observableParameters: {
        mask?: number;
        insertFirst?: boolean;
        scope?: any;
    };
    private _startTime: number;
    private _timer: number;
    private _state: TimerState;
    private _breakCondition: (data: ITimerData<T>) => boolean;
    private _timeToEnd: number;
    private _breakOnNextTick: boolean = false;

    /**
     * Will construct a new advanced timer based on the options provided. Timer will not start until start() is called.
     * @param options construction options for this advanced timer
     */
    constructor(options: ITimerOptions<T>) {
        this._setState(TimerState.INIT);
        this._contextObservable = options.contextObservable;
        this._observableParameters = options.observableParameters ?? {};
        this._breakCondition = options.breakCondition ?? (() => false);
        if (options.onEnded) {
            this.onTimerEndedObservable.add(options.onEnded);
        }
        if (options.onTick) {
            this.onEachCountObservable.add(options.onTick);
        }
        if (options.onAborted) {
            this.onTimerAbortedObservable.add(options.onAborted);
        }
    }

    /**
     * set a breaking condition for this timer. Default is to never break during count
     * @param predicate the new break condition. Returns true to break, false otherwise
     */
    public set breakCondition(predicate: (data: ITimerData<T>) => boolean) {
        this._breakCondition = predicate;
    }

    /**
     * Reset ALL associated observables in this advanced timer
     */
    public clearObservables() {
        this.onEachCountObservable.clear();
        this.onTimerAbortedObservable.clear();
        this.onTimerEndedObservable.clear();
        this.onStateChangedObservable.clear();
    }

    /**
     * Will start a new iteration of this timer. Only one instance of this timer can run at a time.
     *
     * @param timeToEnd how much time to measure until timer ended
     */
    public start(timeToEnd: number = this._timeToEnd) {
        if (this._state === TimerState.STARTED) {
            throw new Error('Timer already started. Please stop it before starting again');
        }
        this._timeToEnd = timeToEnd;
        this._startTime = Date.now();
        this._timer = 0;
        this._observer = this._contextObservable.add(this._tick, this._observableParameters.mask, this._observableParameters.insertFirst, this._observableParameters.scope);
        this._setState(TimerState.STARTED);
    }

    /**
     * Will force a stop on the next tick.
     */
    public stop() {
        if (this._state !== TimerState.STARTED) {
            return;
        }
        this._breakOnNextTick = true;
    }

    /**
     * Dispose this timer, clearing all resources
     */
    public dispose() {
        if (this._observer) {
            this._contextObservable.remove(this._observer);
        }
        this.clearObservables();
    }

    private _setState(newState: TimerState) {
        this._state = newState;
        this.onStateChangedObservable.notifyObservers(this._state);
    }

    private _tick = (payload: T) => {
        const now = Date.now();
        this._timer = now - this._startTime;
        const data: ITimerData<T> = {
            startTime: this._startTime,
            currentTime: now,
            deltaTime: this._timer,
            completeRate: this._timer / this._timeToEnd,
            payload
        };
        const shouldBreak = this._breakOnNextTick || this._breakCondition(data);
        if (shouldBreak || this._timer >= this._timeToEnd) {
            this._stop(data, shouldBreak);
        } else {
            this.onEachCountObservable.notifyObservers(data);
        }
    }

    private _stop(data: ITimerData<T>, aborted: boolean = false) {
        this._contextObservable.remove(this._observer);
        this._setState(TimerState.ENDED);
        if (aborted) {
            this.onTimerAbortedObservable.notifyObservers(data);
        } else {
            this.onTimerEndedObservable.notifyObservers(data);
        }
    }
}