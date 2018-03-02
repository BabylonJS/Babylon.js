import { AnimationGroup, Animatable, Skeleton, IDisposable } from "babylonjs";

export enum AnimationPlayMode {
    ONCE,
    LOOP
}

export enum AnimationState {
    INIT,
    STARTED,
    STOPPED
}

export interface IModelAnimation extends IDisposable {
    readonly state: AnimationState;
    readonly name: string;
    readonly frames: number;
    speedRatio: number;
    playMode: AnimationPlayMode;
    start();
    stop();
    pause();
    reset();
    restart();
    goToFrame(frameNumber: number);
}

export class GroupModelAnimation implements IModelAnimation {

    private _playMode: AnimationPlayMode;
    private _state: AnimationState;

    constructor(private _animationGroup: AnimationGroup) {
        this._state = AnimationState.INIT;
        this._playMode = AnimationPlayMode.LOOP;
    }

    public get name() {
        return this._animationGroup.name;
    }

    public get state() {
        return this._state;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public get speedRatio(): number {
        return this._animationGroup.speedRatio;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public set speedRatio(value: number) {
        this._animationGroup.speedRatio = value;
    }

    public get frames(): number {
        let animationFrames = this._animationGroup.targetedAnimations.map(ta => {
            let keys = ta.animation.getKeys();
            return keys[keys.length - 1].frame;
        });
        return Math.max.apply(null, animationFrames);
    }

    public get playMode(): AnimationPlayMode {
        return this._playMode;
    }

    public set playMode(value: AnimationPlayMode) {
        if (value === this._playMode) {
            return;
        }

        this._playMode = value;

        if (this.state === AnimationState.STARTED) {
            this.start();
        }
    }

    reset() {
        this._animationGroup.reset();
    }

    restart() {
        this._animationGroup.restart();
    }

    goToFrame(frameNumber: number) {
        this._animationGroup.goToFrame(frameNumber);
    }

    public start() {
        this._animationGroup.start(this.playMode === AnimationPlayMode.LOOP, this.speedRatio);
        if (this._animationGroup.isStarted) {
            this._state = AnimationState.STARTED;
        }
    }

    pause() {
        this._animationGroup.pause();
    }

    public stop() {
        this._animationGroup.stop();
        if (!this._animationGroup.isStarted) {
            this._state = AnimationState.STOPPED;
        }
    }

    public dispose() {
        this._animationGroup.dispose();
    }
}