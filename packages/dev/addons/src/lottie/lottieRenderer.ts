import type { IDisposable } from "core/scene";
import type { LottieAnimation, LottieNode } from "./types/processedLottie";
import { Mesh } from "core/Meshes";

/**
 * Class responsible for rendering lottie animations.
 */
export class LottieRenderer implements IDisposable {
    private _animation: LottieAnimation | null;
    private _currentFrame: number;

    /**
     * Creates an instance of LottieRenderer.
     * @param animation The LottieAnimation to be rendered.
     */
    public constructor(animation: LottieAnimation) {
        this._animation = animation;
        this._currentFrame = 0;
    }

    /**
     * Updates the animation state based on the given time.
     */
    public update(): void {
        if (!this._animation) {
            return;
        }

        // For now ignore time and just think that each call to update is 1 frame
        if (this._currentFrame < this._animation.startFrame || this._currentFrame > this._animation.endFrame) {
            return; // Animation is not playing
        }

        // Update the visibility of the animation components
        for (const layer of this._animation.nodes.values()) {
            if (this._currentFrame < layer.inFrame || this._currentFrame > layer.outFrame) {
                if (layer.nodeAnchor instanceof Mesh && layer.nodeAnchor.isVisible === true) {
                    layer.nodeAnchor.isVisible = false; // Hide the node if the layer is not visible
                }
            }

            if (this._currentFrame >= layer.inFrame && this._currentFrame <= layer.outFrame) {
                if (layer.isHidden === false && layer.nodeAnchor instanceof Mesh && layer.nodeAnchor.isVisible === false) {
                    layer.nodeAnchor.isVisible = true; // Hide the node if the layer is not visible
                }
            }
        }

        // Update all nodes transforms
        for (const layer of this._animation.nodes.values()) {
            this._updatNode(layer);
        }

        this._currentFrame++;
    }

    private _updatNode(layer: LottieNode): void {
        this._updatePosition(layer);
        this._updateRotation(layer);
        this._updateScale(layer);
        this._updateAnchor(layer);
    }

    private _updatePosition(node: LottieNode): void {
        if (node.transform) {
            if (node.transform.position?.keyframes !== undefined && node.transform.position.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < node.transform.position.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < node.transform.position.keyframes.length - 1; i++) {
                    const currentFrame = node.transform.position.keyframes[i];
                    const nextFrame = node.transform.position.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValueX = currentFrame.value.x;
                        const startValueY = currentFrame.value.y;

                        const endTime = nextFrame.time;
                        const endValueX = nextFrame.value.x;
                        const endValueY = nextFrame.value.y;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactorX = currentFrame.easeFunction1?.ease(gradient) ?? gradient;
                        const easeGradientFactorY = currentFrame.easeFunction2?.ease(gradient) ?? gradient;

                        node.nodeTrs!.position.x = this._lerp(startValueX, endValueX, easeGradientFactorX);
                        node.nodeTrs!.position.y = this._lerp(startValueY, endValueY, easeGradientFactorY);

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
                    const currentFrame = node.transform.rotation.keyframes[i];
                    const nextFrame = node.transform.rotation.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValue = currentFrame.value;

                        const endTime = nextFrame.time;
                        const endValue = nextFrame.value;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactor = currentFrame.easeFunction?.ease(gradient) ?? gradient;

                        node.nodeTrs!.rotation.z = -(this._lerp(startValue, endValue, easeGradientFactor) * Math.PI) / 180;

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
                    const currentFrame = node.transform.scale.keyframes[i];
                    const nextFrame = node.transform.scale.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValueX = currentFrame.value.x;
                        const startValueY = currentFrame.value.y;

                        const endTime = nextFrame.time;
                        const endValueX = nextFrame.value.x;
                        const endValueY = nextFrame.value.y;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactorX = currentFrame.easeFunction1?.ease(gradient) ?? gradient;
                        const easeGradientFactorY = currentFrame.easeFunction2?.ease(gradient) ?? gradient;

                        node.nodeTrs!.scaling.x = this._lerp(startValueX, endValueX, easeGradientFactorX) / 100;
                        node.nodeTrs!.scaling.y = this._lerp(startValueY, endValueY, easeGradientFactorY) / 100;

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
                    const currentFrame = node.transform.anchorPoint.keyframes[i];
                    const nextFrame = node.transform.anchorPoint.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValueX = currentFrame.value.x;
                        const startValueY = currentFrame.value.y;

                        const endTime = nextFrame.time;
                        const endValueX = nextFrame.value.x;
                        const endValueY = nextFrame.value.y;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactorX = currentFrame.easeFunction1?.ease(gradient) ?? gradient;
                        const easeGradientFactorY = currentFrame.easeFunction2?.ease(gradient) ?? gradient;

                        node.nodeAnchor!.position.x = this._lerp(startValueX, endValueX, easeGradientFactorX);
                        node.nodeAnchor!.position.y = this._lerp(startValueY, endValueY, easeGradientFactorY);

                        break;
                    }
                }
            }
        }
    }

    private _lerp(start: number, end: number, t: number): number {
        return start + t * (end - start);
    }

    /**
     * Disposes of the resources used by the LottieRenderer.
     */
    dispose(): void {
        // TODO: free the animation resources
        this._animation = null;
    }
}
