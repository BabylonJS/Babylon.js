import type { IDisposable } from "core/scene";
import type { LottieAnimationData, LottieNode, ScalarKeyframe, Vector2Keyframe } from "./types/processedLottie";
import { Mesh } from "core/Meshes";

/**
 * Class responsible for rendering lottie animations.
 */
export class LottieAnimation implements IDisposable {
    // Animation information
    private _animation: LottieAnimationData;
    private _animationNodes: Array<LottieNode>;
    private _loop: boolean = false;
    private _frameDuration: number;

    // Variables for playing the animation
    private _accumulatedTime: number;
    private _isPlaying: boolean;
    private _isCompleted: boolean;
    private _currentFrame: number;
    private _framesToAdvance: number;

    // Variables used to avoid allocations when updating
    private _animationStartFrame: number;
    private _animationEndFrame: number;
    private _currentVector2Keyframes: Vector2Keyframe[] | undefined;
    private _currentVector2Keyframe: Vector2Keyframe | undefined;
    private _nextVector2Keyframe: Vector2Keyframe | undefined;
    private _currentScalarKeyframes: ScalarKeyframe[] | undefined;
    private _currentScalarKeyframe: ScalarKeyframe | undefined;
    private _nextScalarKeyframe: ScalarKeyframe | undefined;
    private _gradient: number;
    private _easeGradientFactor: number;

    /**
     * Creates an instance of LottieRenderer.
     * @param animation The LottieAnimation to be rendered.
     * @param loop Whether the animation should loop or not.
     */
    public constructor(animation: LottieAnimationData, loop: boolean = false) {
        this._animation = animation;
        this._loop = loop;

        this._frameDuration = 1000 / this._animation.frameRate;
        this._accumulatedTime = 0;
        this._isPlaying = false;
        this._isCompleted = false;
        this._currentFrame = 0;

        this._animationNodes = Array.from(this._animation.nodes.values());
        this._animationStartFrame = this._animation.startFrame;
        this._animationEndFrame = this._animation.endFrame;
    }

    /**
     * Starts playing the animation.
     */
    public play(): void {
        this._isPlaying = true;
        if (this._isCompleted && !this._loop) {
            this._reset();
        }
    }

    /**
     * Pauses the animation.
     */
    public pause(): void {
        this._isPlaying = false;
    }

    /**
     * Stops the animation.
     */
    public stop(): void {
        this._isPlaying = false;
        this._reset();
    }

    private _reset(): void {
        this._accumulatedTime = 0;
        this._isCompleted = false;
        this._currentFrame = 0;
    }

    /**
     * Updates the animation state based on the given time.
     * @param delta The time delta since the last update, in milliseconds.
     */
    public update(delta: number): void {
        if (!this._isPlaying || this._isCompleted) {
            return;
        }

        this._accumulatedTime += delta;
        this._framesToAdvance = Math.floor(this._accumulatedTime / this._frameDuration);

        if (this._framesToAdvance <= 0) {
            return; // No frames to advance
        }

        this._accumulatedTime -= this._framesToAdvance * this._frameDuration;
        this._currentFrame += this._framesToAdvance;

        if (this._currentFrame < this._animationStartFrame) {
            return;
        }

        if (this._currentFrame > this._animationEndFrame) {
            if (this._loop) {
                this._currentFrame = this._animationStartFrame % (this._animationEndFrame - this._animationStartFrame);
            } else {
                this._isPlaying = false;
                this._isCompleted = true;
                return;
            }
        }

        for (let i = 0; i < this._animationNodes.length; i++) {
            this._updateNode(this._animationNodes[i]);
        }

        this._currentFrame++;
    }

    private _updateNode(node: LottieNode): void {
        if (this._currentFrame < node.inFrame || this._currentFrame > node.outFrame) {
            if (node.nodeAnchor instanceof Mesh && node.nodeAnchor.isVisible === true) {
                node.nodeAnchor.isVisible = false; // Hide the node if the layer is not visible
            }
        }

        if (this._currentFrame >= node.inFrame && this._currentFrame <= node.outFrame) {
            if (node.isHidden === false && node.nodeAnchor instanceof Mesh && node.nodeAnchor.isVisible === false) {
                node.nodeAnchor.isVisible = true; // Hide the node if the layer is not visible
            }
        }

        this._updatePosition(node);
        this._updateRotation(node);
        this._updateScale(node);
        this._updateAnchor(node);
        this._updateOpacity(node);
    }

    private _updatePosition(node: LottieNode): void {
        this._currentVector2Keyframes = node.transform.position.keyframes;
        if (this._currentVector2Keyframes === undefined || this._currentVector2Keyframes.length === 0) {
            return;
        }

        // We have keyframes, so the position is animated
        if (this._currentFrame < this._currentVector2Keyframes[0].time) {
            return; // Animation not started yet
        }

        for (let i = 0; i < this._currentVector2Keyframes.length - 1; i++) {
            this._currentVector2Keyframe = this._currentVector2Keyframes[i];
            this._nextVector2Keyframe = this._currentVector2Keyframes[i + 1];

            // Find the right keyframe we are currently in
            if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME

                this._gradient = (this._currentFrame - this._currentVector2Keyframe.time) / (this._nextVector2Keyframe.time - this._currentVector2Keyframe.time);

                // Position X component interpolation
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction1.ease(this._gradient);
                node.nodeTrs.position.x =
                    this._currentVector2Keyframe.value.x + this._easeGradientFactor * (this._nextVector2Keyframe.value.x - this._currentVector2Keyframe.value.x);

                // Position Y component interpolation
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction2.ease(this._gradient);
                node.nodeTrs.position.y =
                    this._currentVector2Keyframe.value.y + this._easeGradientFactor * (this._nextVector2Keyframe.value.y - this._currentVector2Keyframe.value.y);

                break;
            }
        }
    }

    private _updateRotation(node: LottieNode): void {
        this._currentScalarKeyframes = node.transform.rotation.keyframes;
        if (this._currentScalarKeyframes === undefined || this._currentScalarKeyframes.length === 0) {
            return;
        }

        // We have keyframes, so the scale is animated
        if (this._currentFrame < this._currentScalarKeyframes[0].time) {
            return; // Animation not started yet
        }

        for (let i = 0; i < this._currentScalarKeyframes.length - 1; i++) {
            this._currentScalarKeyframe = this._currentScalarKeyframes[i];
            this._nextScalarKeyframe = this._currentScalarKeyframes[i + 1];

            // Find the right keyframe we are currently in
            if (this._currentFrame >= this._currentScalarKeyframe.time && this._currentFrame < this._nextScalarKeyframe.time) {
                // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME

                this._gradient = (this._currentFrame - this._currentScalarKeyframe.time) / (this._nextScalarKeyframe.time - this._currentScalarKeyframe.time);

                // Rotation value interpolation
                this._easeGradientFactor = this._currentScalarKeyframe.easeFunction.ease(this._gradient);
                node.nodeTrs.rotation.z =
                    -((this._currentScalarKeyframe.value + this._easeGradientFactor * (this._nextScalarKeyframe.value - this._currentScalarKeyframe.value)) * Math.PI) / 180;

                break;
            }
        }
    }

    private _updateScale(node: LottieNode): void {
        this._currentVector2Keyframes = node.transform.scale.keyframes;
        if (this._currentVector2Keyframes === undefined || this._currentVector2Keyframes.length === 0) {
            return;
        }

        // We have keyframes, so the scale is animated
        if (this._currentFrame < this._currentVector2Keyframes[0].time) {
            return; // Animation not started yet
        }

        for (let i = 0; i < this._currentVector2Keyframes.length - 1; i++) {
            this._currentVector2Keyframe = this._currentVector2Keyframes[i];
            this._nextVector2Keyframe = this._currentVector2Keyframes[i + 1];

            // Find the right keyframe we are currently in
            if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME

                this._gradient = (this._currentFrame - this._currentVector2Keyframe.time) / (this._nextVector2Keyframe.time - this._currentVector2Keyframe.time);

                // Scale X interpolation
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction1.ease(this._gradient);
                node.nodeTrs.scaling.x =
                    (this._currentVector2Keyframe.value.x + this._easeGradientFactor * (this._nextVector2Keyframe.value.x - this._currentVector2Keyframe.value.x)) / 100;

                // Sacle Y interpolation
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction2.ease(this._gradient);
                node.nodeTrs.scaling.y =
                    (this._currentVector2Keyframe.value.y + this._easeGradientFactor * (this._nextVector2Keyframe.value.y - this._currentVector2Keyframe.value.y)) / 100;

                break;
            }
        }
    }

    private _updateAnchor(node: LottieNode): void {
        this._currentVector2Keyframes = node.transform.anchorPoint.keyframes;
        if (this._currentVector2Keyframes === undefined || this._currentVector2Keyframes.length === 0) {
            return;
        }

        // We have keyframes, so the position is animated
        if (this._currentFrame < this._currentVector2Keyframes[0].time) {
            return; // Animation not started yet
        }

        for (let i = 0; i < this._currentVector2Keyframes.length - 1; i++) {
            this._currentVector2Keyframe = this._currentVector2Keyframes[i];
            this._nextVector2Keyframe = this._currentVector2Keyframes[i + 1];

            // Find the right keyframe we are currently in
            if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME

                this._gradient = (this._currentFrame - this._currentVector2Keyframe.time) / (this._nextVector2Keyframe.time - this._currentVector2Keyframe.time);

                // Anchor X component
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction1.ease(this._gradient);
                node.nodeAnchor.position.x =
                    this._currentVector2Keyframe.value.x + this._easeGradientFactor * (this._nextVector2Keyframe.value.x - this._currentVector2Keyframe.value.x);

                // Anchor Y component
                this._easeGradientFactor = this._currentVector2Keyframe.easeFunction2.ease(this._gradient);
                node.nodeAnchor.position.y =
                    this._currentVector2Keyframe.value.y + this._easeGradientFactor * (this._nextVector2Keyframe.value.y - this._currentVector2Keyframe.value.y);

                break;
            }
        }
    }

    private _updateOpacity(node: LottieNode): void {
        this._currentScalarKeyframes = node.transform.opacity.keyframes;
        if (this._currentScalarKeyframes === undefined || this._currentScalarKeyframes.length === 0) {
            return;
        }

        // We have keyframes, so the position is animated
        if (this._currentFrame < this._currentScalarKeyframes[0].time) {
            return; // Animation not started yet
        }

        for (let i = 0; i < this._currentScalarKeyframes.length - 1; i++) {
            this._currentScalarKeyframe = this._currentScalarKeyframes[i];
            this._nextScalarKeyframe = this._currentScalarKeyframes[i + 1];

            // Find the right keyframe we are currently in
            if (this._currentFrame >= this._currentScalarKeyframe.time && this._currentFrame < this._nextScalarKeyframe.time) {
                // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME

                this._gradient = (this._currentFrame - this._currentScalarKeyframe.time) / (this._nextScalarKeyframe.time - this._currentScalarKeyframe.time);

                // Opacity interpolation
                this._easeGradientFactor = this._currentScalarKeyframe.easeFunction.ease(this._gradient);

                // const children = node.nodeAnchor.getChildMeshes(false);
                // if (children && children.length > 0) {
                //     for (const child of children) {
                //         child.material && (child.material.alpha = alpha);
                //     }
                // }

                break;
            }
        }
    }

    /**
     * Disposes of the resources used by the LottieRenderer.
     */
    dispose(): void {
        // TODO: free the animation resources
    }
}
