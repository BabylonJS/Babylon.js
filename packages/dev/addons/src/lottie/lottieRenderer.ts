import type { IDisposable } from "core/scene";
import type { LottieAnimation, LottieLayer } from "./types/processedLottie";
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
        for (const layer of this._animation.layers.values()) {
            if (this._currentFrame < layer.inFrame || this._currentFrame > layer.outFrame) {
                if (layer.isVisible) {
                    layer.isVisible = false;
                    if (layer.nodeAnchor instanceof Mesh) {
                        layer.nodeAnchor.isVisible = false; // Hide the node if the layer is not visible
                    }
                }
            }

            if (this._currentFrame >= layer.inFrame && this._currentFrame <= layer.outFrame) {
                if (!layer.isVisible) {
                    layer.isVisible = true;
                    if (layer.nodeAnchor instanceof Mesh) {
                        layer.nodeAnchor.isVisible = true; // Hide the node if the layer is not visible
                    }
                }
            }
        }

        // Update only visible elements of the animation
        for (const layer of this._animation.layers.values()) {
            this._updateLayer(layer);
        }

        this._currentFrame++;
    }

    private _updateLayer(layer: LottieLayer): void {
        this._updatePosition(layer);
        this._updateRotation(layer);
        this._updateScale(layer);
    }

    private _updatePosition(element: LottieLayer): void {
        if (element.transform) {
            if (element.transform.position?.keyframes !== undefined && element.transform.position.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < element.transform.position.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < element.transform.position.keyframes.length - 1; i++) {
                    const currentFrame = element.transform.position.keyframes[i];
                    const nextFrame = element.transform.position.keyframes[i + 1];

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

                        element.nodeTrs!.position.x = this._lerp(startValueX, endValueX, easeGradientFactorX);
                        element.nodeTrs!.position.y = this._lerp(startValueY, endValueY, easeGradientFactorY);

                        break;
                    }
                }
            }
        }
    }

    private _updateRotation(element: LottieLayer): void {
        if (element.transform) {
            if (element.transform.rotation?.keyframes !== undefined && element.transform.rotation.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < element.transform.rotation.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < element.transform.rotation.keyframes.length - 1; i++) {
                    const currentFrame = element.transform.rotation.keyframes[i];
                    const nextFrame = element.transform.rotation.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValue = currentFrame.value;

                        const endTime = nextFrame.time;
                        const endValue = nextFrame.value;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactor = currentFrame.easeFunction?.ease(gradient) ?? gradient;

                        element.nodeTrs!.rotation.z = (this._lerp(startValue, endValue, easeGradientFactor) * Math.PI) / 180;

                        break;
                    }
                }
            }
        }
    }

    private _updateScale(element: LottieLayer): void {
        if (element.transform) {
            if (element.transform.scale?.keyframes !== undefined && element.transform.scale.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < element.transform.scale.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < element.transform.scale.keyframes.length - 1; i++) {
                    const currentFrame = element.transform.scale.keyframes[i];
                    const nextFrame = element.transform.scale.keyframes[i + 1];

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

                        element.nodeTrs!.scaling.x = this._lerp(startValueX, endValueX, easeGradientFactorX) / 100;
                        element.nodeTrs!.scaling.y = this._lerp(startValueY, endValueY, easeGradientFactorY) / 100;

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
