import type { IDisposable } from "core/scene";
import type { LottieAnimationData, LottieNode, ScalarKeyframe, Vector2Keyframe } from "./types/processedLottie";
import { Mesh } from "core/Meshes";
import type { BezierCurveEase } from "core/Animations";

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

    // Variables used to avoid allocations when updating
    private _animationStartFrame: number;
    private _animationEndFrame: number;
    private _currentNode: LottieNode;
    private _currentVector2Keyframe: Vector2Keyframe | undefined;
    private _nextVector2Keyframe: Vector2Keyframe | undefined;
    private _currentScalarKeyframe: ScalarKeyframe | undefined;
    private _nextScalarKeyframe: ScalarKeyframe | undefined;

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
        this._currentNode = this._animationNodes[0];
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
        const framesToAdvance = Math.floor(this._accumulatedTime / this._frameDuration);

        if (framesToAdvance <= 0) {
            return; // No frames to advance
        }

        this._accumulatedTime -= framesToAdvance * this._frameDuration;
        this._currentFrame += framesToAdvance;

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

        // Update the visibility of the animation components
        for (let i = 0; i < this._animationNodes.length; i++) {
            this._currentNode = this._animationNodes[i];
            if (this._currentFrame < this._currentNode.inFrame || this._currentFrame > this._currentNode.outFrame) {
                if (this._currentNode.nodeAnchor instanceof Mesh && this._currentNode.nodeAnchor.isVisible === true) {
                    this._currentNode.nodeAnchor.isVisible = false; // Hide the node if the layer is not visible
                }
            }

            if (this._currentFrame >= this._currentNode.inFrame && this._currentFrame <= this._currentNode.outFrame) {
                if (this._currentNode.isHidden === false && this._currentNode.nodeAnchor instanceof Mesh && this._currentNode.nodeAnchor.isVisible === false) {
                    this._currentNode.nodeAnchor.isVisible = true; // Hide the node if the layer is not visible
                }
            }

            this._updateNode(this._currentNode);
        }

        this._currentFrame++;
    }

    private _updateNode(node: LottieNode): void {
        this._updatePosition(node);
        this._updateRotation(node);
        this._updateScale(node);
        this._updateAnchor(node);
        this._updateOpacity(node);
    }

    private _updatePosition(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.position?.keyframes !== undefined && node.transform.position.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < node.transform.position.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.position.keyframes.length - 1; i++) {
                    this._currentVector2Keyframe = node.transform.position.keyframes[i];
                    this._nextVector2Keyframe = node.transform.position.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        node.nodeTrs!.position.x = this._calculateValueUpdate(
                            this._currentVector2Keyframe.value.x,
                            this._nextVector2Keyframe.value.x,
                            this._currentVector2Keyframe.time,
                            this._nextVector2Keyframe.time,
                            this._currentVector2Keyframe.easeFunction1
                        );

                        node.nodeTrs!.position.y = this._calculateValueUpdate(
                            this._currentVector2Keyframe.value.y,
                            this._nextVector2Keyframe.value.y,
                            this._currentVector2Keyframe.time,
                            this._nextVector2Keyframe.time,
                            this._currentVector2Keyframe.easeFunction2
                        );

                        break;
                    }
                }
            }
        }
    }

    private _updateRotation(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.rotation?.keyframes !== undefined && node.transform.rotation.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < node.transform.rotation.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.rotation.keyframes.length - 1; i++) {
                    this._currentScalarKeyframe = node.transform.rotation.keyframes[i];
                    this._nextScalarKeyframe = node.transform.rotation.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= this._currentScalarKeyframe.time && this._currentFrame < this._nextScalarKeyframe.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const interpolatedValue = this._calculateValueUpdate(
                            this._currentScalarKeyframe.value,
                            this._nextScalarKeyframe.value,
                            this._currentScalarKeyframe.time,
                            this._nextScalarKeyframe.time,
                            this._currentScalarKeyframe.easeFunction
                        );

                        node.nodeTrs!.rotation.z = -(interpolatedValue * Math.PI) / 180;
                        break;
                    }
                }
            }
        }
    }

    private _updateScale(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.scale?.keyframes !== undefined && node.transform.scale.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < node.transform.scale.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.scale.keyframes.length - 1; i++) {
                    this._currentVector2Keyframe = node.transform.scale.keyframes[i];
                    this._nextVector2Keyframe = node.transform.scale.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        node.nodeTrs!.scaling.x =
                            this._calculateValueUpdate(
                                this._currentVector2Keyframe.value.x,
                                this._nextVector2Keyframe.value.x,
                                this._currentVector2Keyframe.time,
                                this._nextVector2Keyframe.time,
                                this._currentVector2Keyframe.easeFunction1
                            ) / 100;

                        node.nodeTrs!.scaling.y =
                            this._calculateValueUpdate(
                                this._currentVector2Keyframe.value.y,
                                this._nextVector2Keyframe.value.y,
                                this._currentVector2Keyframe.time,
                                this._nextVector2Keyframe.time,
                                this._currentVector2Keyframe.easeFunction2
                            ) / 100;

                        break;
                    }
                }
            }
        }
    }

    private _updateAnchor(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.anchorPoint?.keyframes !== undefined && node.transform.anchorPoint.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < node.transform.anchorPoint.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.anchorPoint.keyframes.length - 1; i++) {
                    this._currentVector2Keyframe = node.transform.anchorPoint.keyframes[i];
                    this._nextVector2Keyframe = node.transform.anchorPoint.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= this._currentVector2Keyframe.time && this._currentFrame < this._nextVector2Keyframe.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        node.nodeAnchor!.position.x = this._calculateValueUpdate(
                            this._currentVector2Keyframe.value.x,
                            this._nextVector2Keyframe.value.x,
                            this._currentVector2Keyframe.time,
                            this._nextVector2Keyframe.time,
                            this._currentVector2Keyframe.easeFunction1
                        );

                        node.nodeAnchor!.position.y = this._calculateValueUpdate(
                            this._currentVector2Keyframe.value.y,
                            this._nextVector2Keyframe.value.y,
                            this._currentVector2Keyframe.time,
                            this._nextVector2Keyframe.time,
                            this._currentVector2Keyframe.easeFunction2
                        );

                        break;
                    }
                }
            }
        }
    }

    private _updateOpacity(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.opacity?.keyframes !== undefined && node.transform.opacity.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < node.transform.opacity.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.opacity.keyframes.length - 1; i++) {
                    this._currentScalarKeyframe = node.transform.opacity.keyframes[i];
                    this._nextScalarKeyframe = node.transform.opacity.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= this._currentScalarKeyframe.time && this._currentFrame < this._nextScalarKeyframe.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        //const alpha =
                        this._calculateValueUpdate(
                            this._currentScalarKeyframe.value,
                            this._nextScalarKeyframe.value,
                            this._currentScalarKeyframe.time,
                            this._nextScalarKeyframe.time,
                            this._currentScalarKeyframe.easeFunction
                        ) / 100;

                        // const children = node.nodeAnchor && node.nodeAnchor.getChildMeshes(false);
                        // if (children && children.length > 0) {
                        //     for (const child of children) {
                        //         child.material && (child.material.alpha = alpha);
                        //     }
                        // }

                        break;
                    }
                }
            }
        }
    }

    private _calculateValueUpdate(startValue: number, endValue: number, startTime: number, endTime: number, easeFunction: BezierCurveEase): number {
        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
        const easeGradientFactor = easeFunction.ease(gradient) ?? gradient;
        return startValue + easeGradientFactor * (endValue - startValue); // Lerping the value
    }

    /**
     * Disposes of the resources used by the LottieRenderer.
     */
    dispose(): void {
        // TODO: free the animation resources
    }
}
