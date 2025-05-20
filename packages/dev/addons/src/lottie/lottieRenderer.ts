import type { IDisposable } from "core/scene";
import type { LottieAnimation, LottieLayer, LottieSprite } from "./types/processedLottie";
import { Vector2 } from "core/Maths";

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
            if (layer.isVisible === false) {
                continue;
            }

            this._updateLayer(layer);
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
        if (layer.transform.position?.keyframes !== undefined) {
            // We have keyframes, so the position is animated
            for (let i = 0; i < layer.transform.position.keyframes.length; i++) {
                const keyframe = layer.transform.position.keyframes[i];
                if (this._currentFrame >= keyframe.time) {
                    if (i === layer.transform.position.keyframes.length - 1 || this._currentFrame < layer.transform.position.keyframes[i + 1].time) {
                        let startTime = 0;
                        let startValueX = layer.transform.position.startValue.x;
                        let startValueY = layer.transform.position.startValue.y;
                        if (i != 0) {
                            startTime = layer.transform.position.keyframes[i - 1].time;
                            startValueX = layer.transform.position.keyframes[i - 1].value.x;
                            startValueY = layer.transform.position.keyframes[i - 1].value.y;
                        }

                        const endTime = keyframe.time;
                        const endValueX = keyframe.value.x;
                        const endValueY = keyframe.value.y;

                        const easeFactorX = keyframe.easeFunction1?.ease(this._currentFrame - startTime / (endTime - startTime));
                        const easeFactorY = keyframe.easeFunction2?.ease(this._currentFrame - startTime / (endTime - startTime));

                        if (easeFactorX) {
                            layer.localPosition.x = this._lerp(startValueX, endValueX, easeFactorX);
                        }

                        if (easeFactorY) {
                            layer.localPosition.y = this._lerp(startValueY, endValueY, easeFactorY);
                        }

                        break;
                    }
                }
            }
        }

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

                        const easeFactorX = keyframe.easeFunction1?.ease(this._currentFrame - startTime / (endTime - startTime));
                        const easeFactorY = keyframe.easeFunction2?.ease(this._currentFrame - startTime / (endTime - startTime));
                        sprite.localPosition!.x = this._lerp(startValueX, endValueX, easeFactorX!);
                        sprite.localPosition!.y = this._lerp(startValueY, endValueY, easeFactorY!);

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
