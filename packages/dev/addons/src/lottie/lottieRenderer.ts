import type { IDisposable } from "core/scene";
import type { LottieAnimation, LottieLayer, LottieSprite } from "./types/processedLottie";
import { Vector2, Vector3 } from "core/Maths";

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

        // DEBUG
        // HIDE EVERYTHING
        for (const layer of this._animation.layers) {
            this._hideLayer(layer);
        }

        // SHOW ONLY CERTAIN LAYERS FOR TESTING
        for (const layer of this._animation.layers) {
            if (layer.parent === undefined) {
                layer.isVisible = true;
                layer.mesh.isVisible = true;
            }
        }

        // // Update the visibility of the animation components
        // for (const layer of this._animation.layers) {
        //     if (this._currentFrame < layer.inFrame || this._currentFrame > layer.outFrame) {
        //         if (layer.isVisible) {
        //             this._hideLayer(layer);
        //         }
        //     }

        //     if (this._currentFrame >= layer.inFrame && this._currentFrame <= layer.outFrame) {
        //         if (!layer.isVisible) {
        //             this._showLayer(layer);
        //         }
        //     }
        // }

        // Update only visible elements of the animation
        for (const layer of this._animation.layers) {
            if (layer.isVisible === false) {
                continue;
            }

            this._updateLayer(layer);
        }

        this._currentFrame++;
    }

    private _hideLayer(layer: LottieLayer): void {
        layer.isVisible = false;
        layer.mesh.isVisible = false;

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

        // if (layer.children) {
        //     for (const child of layer.children) {
        //         this._updateLayer(child);
        //     }
        // }

        // if (layer.sprites) {
        //     for (const sprite of layer.sprites) {
        //         this._updateSprite(sprite);
        //     }
        // }
    }

    private _updatePosition(layer: LottieLayer): void {
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

    private _updateRotation(layer: LottieLayer): void {
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

                    // Convert degrees to radians
                    const radians = (layer.localRotation * Math.PI) / 180;
                    //const rotation = new Vector2(Math.cos(radians), Math.sin(radians));

                    layer.mesh.rotate(new Vector3(0, 0, 1), radians);
                    //layer.mesh.rotation.x = rotation.x;
                    //layer.mesh.rotation.y = rotation.y;

                    break;
                }
            }
        }
    }

    private _updateScale(layer: LottieLayer): void {
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

    private _updateSprite(sprite: LottieSprite): void {
        if (sprite.transform?.position?.keyframes !== undefined) {
            // We have keyframes, so the position is animated
            for (let i = 0; i < sprite.transform.position.keyframes.length; i++) {
                const keyframe = sprite.transform.position.keyframes[i];
                if (this._currentFrame >= keyframe.time) {
                    if (i === sprite.transform.position.keyframes.length - 1 || this._currentFrame < sprite.transform.position.keyframes[i + 1].time) {
                        let startTime = 0;
                        let startValueX = sprite.transform.position.startValue.x;
                        let startValueY = sprite.transform.position.startValue.y;
                        if (i != 0) {
                            startTime = sprite.transform.position.keyframes[i - 1].time;
                            startValueX = sprite.transform.position.keyframes[i - 1].value.x;
                            startValueY = sprite.transform.position.keyframes[i - 1].value.y;
                        }

                        const endTime = keyframe.time;
                        const endValueX = keyframe.value.x;
                        const endValueY = keyframe.value.y;

                        const gradient = (this._currentFrame - startTime) / (endTime - startTime);
                        //const easeFactorX = keyframe.easeFunction1?.ease(gradient);
                        //const easeFactorY = keyframe.easeFunction2?.ease(gradient);

                        sprite.localPosition!.x = this._lerp(startValueX, endValueX, gradient);
                        sprite.localPosition!.y = this._lerp(startValueY, endValueY, gradient);

                        // Calculate the world position
                        const worldTransform = new Vector2(0, 0);
                        this._calculateWorldTransform(sprite.parent, worldTransform);
                        sprite.mesh.position.x = sprite.localPosition!.x + worldTransform.x;
                        sprite.mesh.position.y = sprite.localPosition!.y + worldTransform.y;
                        break;
                    }
                }
            }
        }

        if (sprite.child) {
            this._updateSprite(sprite.child);
        }
    }

    /**
     * Calculates the world transform of a sprite by traversing up the hierarchy.
     * @param sprite The sprite whose world transform is to be calculated.
     * @param worldTransform The accumulated world transform.
     */
    private _calculateWorldTransform(sprite: LottieLayer | LottieSprite, worldTransform: Vector2): void {
        if (sprite.parent) {
            this._calculateWorldTransform(sprite.parent, worldTransform);
        }

        if (sprite.localPosition) {
            worldTransform.x += sprite.localPosition.x;
            worldTransform.y += sprite.localPosition.y;
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
