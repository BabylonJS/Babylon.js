import type { IDisposable } from "core/scene";
import type { LottieAnimation, LottieLayer, LottieSprite } from "./types/processedLottie";

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
        for (const layer of this._animation.layers) {
            if (this._currentFrame < layer.inFrame || this._currentFrame > layer.outFrame) {
                if (layer.isVisible) {
                    this._hideLayer(layer);
                }
            }

            if (this._currentFrame >= layer.inFrame && this._currentFrame <= layer.outFrame) {
                if (!layer.isVisible) {
                    this._showLayer(layer);
                }
            }
        }

        // Update only visible elements of the animation
        for (const layer of this._animation.layers) {
            if (layer.isVisible === true) {
                this._updateLayer(layer);
            }
        }

        this._currentFrame++;
    }

    private _hideLayer(layer: LottieLayer): void {
        layer.isVisible = false;

        if (layer.children) {
            for (const child of layer.children) {
                this._hideLayer(child);
            }
        }

        if (layer.sprites) {
            for (const sprite of layer.sprites) {
                this._hideSprite(sprite);
            }
        }
    }

    private _showLayer(layer: LottieLayer): void {
        layer.isVisible = true;

        if (layer.children) {
            for (const child of layer.children) {
                this._showLayer(child);
            }
        }

        if (layer.sprites) {
            for (const sprite of layer.sprites) {
                this._showSprite(sprite);
            }
        }
    }

    private _hideSprite(sprite: LottieSprite): void {
        sprite.isVisible = false;
        sprite.mesh.isVisible = false;

        if (sprite.child) {
            this._hideSprite(sprite.child);
        }
    }

    private _showSprite(sprite: LottieSprite): void {
        sprite.isVisible = true;
        sprite.mesh.isVisible = true;

        if (sprite.child) {
            this._showSprite(sprite.child);
        }
    }

    private _updateLayer(layer: LottieLayer): void {
        this._updatePosition(layer);
        this._updateRotation(layer);
        this._updateScale(layer);

        if (layer.children) {
            for (const child of layer.children) {
                this._updateLayer(child);
            }
        }

        if (layer.sprites) {
            for (const sprite of layer.sprites) {
                this._updateSprite(sprite);
            }
        }
    }

    private _updateSprite(sprite: LottieSprite): void {
        this._updatePosition(sprite);
        this._updateRotation(sprite);
        this._updateScale(sprite);

        if (sprite.child) {
            this._updateSprite(sprite.child);
        }
    }

    private _updatePosition(layer: LottieLayer | LottieSprite): void {
        if (layer.transform) {
            if (layer.transform.position?.keyframes !== undefined && layer.transform.position.keyframes.length > 0) {
                // We have keyframes, so the position is animated
                if (this._currentFrame < layer.transform.position.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < layer.transform.position.keyframes.length - 1; i++) {
                    const currentFrame = layer.transform.position.keyframes[i];
                    const nextFrame = layer.transform.position.keyframes[i + 1];

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

                        layer.localPosition.x = this._lerp(startValueX, endValueX, easeGradientFactorX);
                        layer.localPosition.y = this._lerp(startValueY, endValueY, easeGradientFactorY);

                        layer.mesh.position.x = layer.localPosition.x;
                        layer.mesh.position.y = layer.localPosition.y;

                        break;
                    }
                }
            }
        }
    }

    private _updateRotation(layer: LottieLayer | LottieSprite): void {
        if (layer.transform) {
            if (layer.transform.rotation?.keyframes !== undefined && layer.transform.rotation.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < layer.transform.rotation.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < layer.transform.rotation.keyframes.length - 1; i++) {
                    const currentFrame = layer.transform.rotation.keyframes[i];
                    const nextFrame = layer.transform.rotation.keyframes[i + 1];

                    // Find the right keyframe we are currently in
                    if (this._currentFrame >= currentFrame.time && this._currentFrame < nextFrame.time) {
                        // BUG WITH THE LAST FRAME OF THE LAST KEYFRAME
                        const startTime = currentFrame.time;
                        const startValue = currentFrame.value;

                        const endTime = nextFrame.time;
                        const endValue = nextFrame.value;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        const easeGradientFactor = currentFrame.easeFunction?.ease(gradient) ?? gradient;

                        layer.localRotation = this._lerp(startValue, endValue, easeGradientFactor);

                        layer.mesh.rotation.z = (layer.localRotation * Math.PI) / 180;

                        break;
                    }
                }
            }
        }
    }

    private _updateScale(layer: LottieLayer | LottieSprite): void {
        if (layer.transform) {
            if (layer.transform.scale?.keyframes !== undefined && layer.transform.scale.keyframes.length > 0) {
                // We have keyframes, so the scale is animated
                if (this._currentFrame < layer.transform.scale.keyframes[0].time) {
                    return; // Animation not started yet
                }

                for (let i = 0; i < layer.transform.scale.keyframes.length - 1; i++) {
                    const currentFrame = layer.transform.scale.keyframes[i];
                    const nextFrame = layer.transform.scale.keyframes[i + 1];

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

                        layer.localScale.x = this._lerp(startValueX, endValueX, easeGradientFactorX) / 100;
                        layer.localScale.y = this._lerp(startValueY, endValueY, easeGradientFactorY) / 100;

                        layer.mesh.scaling.x = layer.localScale.x;
                        layer.mesh.scaling.y = layer.localScale.y;

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
