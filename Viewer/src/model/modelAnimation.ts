import { Vector3 } from "babylonjs/Maths/math.vector";
import { AnimationGroup, Animatable } from "babylonjs/Animations/index";

/**
 * Animation play mode enum - is the animation looping or playing once
 */
export enum AnimationPlayMode {
    ONCE,
    LOOP
}

/**
 * An enum representing the current state of an animation object
 */
export enum AnimationState {
    INIT,
    PLAYING,
    PAUSED,
    STOPPED,
    ENDED
}

/**
 * The different type of easing functions available
 */
export enum EasingFunction {
    Linear = 0,
    CircleEase = 1,
    BackEase = 2,
    BounceEase = 3,
    CubicEase = 4,
    ElasticEase = 5,
    ExponentialEase = 6,
    PowerEase = 7,
    QuadraticEase = 8,
    QuarticEase = 9,
    QuinticEase = 10,
    SineEase = 11
}

/**
 * Defines a simple animation to be applied to a model (scale).
 */
export interface ModelAnimationConfiguration {
    /**
     * Time of animation, in seconds
     */
    time: number;

    /**
     * Scale to apply
     */
    scaling?: Vector3;

    /**
     * Easing function to apply
     * See SPECTRE.EasingFunction
     */
    easingFunction?: number;

    /**
     * An Easing mode to apply to the easing function
     * See BABYLON.EasingFunction
     */
    easingMode?: number;
}

/**
 * This interface can be implemented to define new types of ModelAnimation objects.
 */
export interface IModelAnimation {
    /**
     * Current animation state (playing, stopped etc')
     */
    readonly state: AnimationState;
    /**
     * the name of the animation
     */
    readonly name: string;
    /**
     * Get the max numbers of frame available in the animation group
     *
     * In correlation to an arry, this would be ".length"
     */
    readonly frames: number;
    /**
     * Get the current frame playing right now.
     * This can be used to poll the frame currently playing (and, for exmaple, display a progress bar with the data)
     *
     * In correlation to an array, this would be the current index
     */
    readonly currentFrame: number;
    /**
     * Animation's FPS value
     */
    readonly fps: number;
    /**
     * Get or set the animation's speed ration (Frame-to-fps)
     */
    speedRatio: number;
    /**
     * Gets or sets the aimation's play mode.
     */
    playMode: AnimationPlayMode;
    /**
     * Start the animation
     */
    start();
    /**
     * Stop the animation.
     * This will fail silently if the animation group is already stopped.
     */
    stop();
    /**
     * Pause the animation
     * This will fail silently if the animation is not currently playing
     */
    pause();
    /**
     * Reset this animation
     */
    reset();
    /**
     * Restart the animation
     */
    restart();
    /**
     * Go to a specific
     * @param frameNumber the frame number to go to
     */
    goToFrame(frameNumber: number);
    /**
     * Dispose this animation
     */
    dispose();
}

/**
 * The GroupModelAnimation is an implementation of the IModelAnimation interface using BABYLON's
 * native GroupAnimation class.
 */
export class GroupModelAnimation implements IModelAnimation {

    private _playMode: AnimationPlayMode;
    private _state: AnimationState;

    /**
     * Create a new GroupModelAnimation object using an AnimationGroup object
     * @param _animationGroup The aniamtion group to base the class on
     */
    constructor(private _animationGroup: AnimationGroup) {
        this._state = AnimationState.INIT;
        this._playMode = AnimationPlayMode.LOOP;

        this._animationGroup.onAnimationEndObservable.add(() => {
            this.stop();
            this._state = AnimationState.ENDED;
        });
    }

    /**
     * Get the animation's name
     */
    public get name() {
        return this._animationGroup.name;
    }

    /**
     * Get the current animation's state
     */
    public get state() {
        return this._state;
    }

    /**
     * Gets the speed ratio to use for all animations
     */
    public get speedRatio(): number {
        return this._animationGroup.speedRatio;
    }

    /**
     * Sets the speed ratio to use for all animations
     */
    public set speedRatio(value: number) {
        this._animationGroup.speedRatio = value;
    }

    /**
     * Get the max numbers of frame available in the animation group
     *
     * In correlation to an arry, this would be ".length"
     */
    public get frames(): number {
        return this._animationGroup.to - this._animationGroup.from;
    }

    /**
     * Get the current frame playing right now.
     * This can be used to poll the frame currently playing (and, for exmaple, display a progress bar with the data)
     *
     * In correlation to an array, this would be the current index
     */
    public get currentFrame(): number {
        if (this._animationGroup.targetedAnimations[0] && this._animationGroup.targetedAnimations[0].animation.runtimeAnimations[0]) {
            return this._animationGroup.targetedAnimations[0].animation.runtimeAnimations[0].currentFrame - this._animationGroup.from;
        } else {
            return 0;
        }
    }

    /**
     * Get the FPS value of this animation
     */
    public get fps(): number {
        // get the first currentFrame found
        for (let i = 0; i < this._animationGroup.animatables.length; ++i) {
            let animatable: Animatable = this._animationGroup.animatables[i];
            let animations = animatable.getAnimations();
            if (!animations || !animations.length) {
                continue;
            }
            for (let idx = 0; idx < animations.length; ++idx) {
                if (animations[idx].animation && animations[idx].animation.framePerSecond) {
                    return animations[idx].animation.framePerSecond;
                }
            }
        }
        return 0;
    }

    /**
     * What is the animation'S play mode (looping or played once)
     */
    public get playMode(): AnimationPlayMode {
        return this._playMode;
    }

    /**
     * Set the play mode.
     * If the animation is played, it will continue playing at least once more, depending on the new play mode set.
     * If the animation is not set, the will be initialized and will wait for the user to start playing it.
     */
    public set playMode(value: AnimationPlayMode) {
        if (value === this._playMode) {
            return;
        }

        this._playMode = value;

        if (this.state === AnimationState.PLAYING) {
            this._animationGroup.play(this._playMode === AnimationPlayMode.LOOP);
        } else {
            this._animationGroup.reset();
            this._state = AnimationState.INIT;
        }
    }

    /**
     * Reset the animation group
     */
    reset() {
        this._animationGroup.reset();
    }

    /**
     * Restart the animation group
     */
    restart() {
        if (this.state === AnimationState.PAUSED) {
            this._animationGroup.restart();
        }
        else {
            this.start();
        }
    }

    /**
     *
     * @param frameNumber Go to a specific frame in the animation
     */
    goToFrame(frameNumber: number) {
        this._animationGroup.goToFrame(frameNumber + this._animationGroup.from);
    }

    /**
     * Start playing the animation.
     */
    public start() {
        this._animationGroup.start(this.playMode === AnimationPlayMode.LOOP, this.speedRatio);
        if (this._animationGroup.isStarted) {
            this._state = AnimationState.PLAYING;
        }
    }

    /**
     * Pause the animation
     */
    pause() {
        this._animationGroup.pause();
        this._state = AnimationState.PAUSED;
    }

    /**
     * Stop the animation.
     * This will fail silently if the animation group is already stopped.
     */
    public stop() {
        this._animationGroup.stop();
        if (!this._animationGroup.isStarted) {
            this._state = AnimationState.STOPPED;
        }
    }

    /**
     * Dispose this animation object.
     */
    public dispose() {
        this._animationGroup.dispose();
    }
}