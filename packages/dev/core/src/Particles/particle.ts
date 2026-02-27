import type { Nullable } from "../types";
import { Vector2, Vector3, TmpVectors, Vector4 } from "../Maths/math.vector";
import { Color4 } from "../Maths/math.color";
import type { SubEmitter } from "./subEmitter";
import type { ColorGradient, FactorGradient } from "../Misc/gradients";

import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { ThinParticleSystem } from "./thinParticleSystem";
import { Clamp } from "../Maths/math.scalar.functions";

/**
 * @internal
 * Holds all internal properties of a Particle, grouped into a single sub-object
 * to keep the Particle's own property count low (V8 in-object property limit).
 */
class ParticleInternalProperties {
    /** @internal */
    public randomCellOffset?: number;

    /** @internal */
    public initialDirection: Nullable<Vector3>;

    /** @internal */
    public attachedSubEmitters: Nullable<Array<SubEmitter>> = null;

    /** @internal */
    public initialStartSpriteCellId: number;
    /** @internal */
    public initialEndSpriteCellId: number;
    /** @internal */
    public initialSpriteCellLoop: boolean;

    /** @internal */
    public currentColorGradient: Nullable<ColorGradient>;
    /** @internal */
    public currentColor1 = new Color4(0, 0, 0, 0);
    /** @internal */
    public currentColor2 = new Color4(0, 0, 0, 0);

    /** @internal */
    public currentSizeGradient: Nullable<FactorGradient>;
    /** @internal */
    public currentSize1 = 0;
    /** @internal */
    public currentSize2 = 0;

    /** @internal */
    public currentAngularSpeedGradient: Nullable<FactorGradient>;
    /** @internal */
    public currentAngularSpeed1 = 0;
    /** @internal */
    public currentAngularSpeed2 = 0;

    /** @internal */
    public currentVelocityGradient: Nullable<FactorGradient>;
    /** @internal */
    public currentVelocity1 = 0;
    /** @internal */
    public currentVelocity2 = 0;

    /** @internal */
    public directionScale: number;
    /** @internal */
    public scaledDirection = Vector3.Zero();

    /** @internal */
    public currentLimitVelocityGradient: Nullable<FactorGradient>;
    /** @internal */
    public currentLimitVelocity1 = 0;
    /** @internal */
    public currentLimitVelocity2 = 0;

    /** @internal */
    public currentDragGradient: Nullable<FactorGradient>;
    /** @internal */
    public currentDrag1 = 0;
    /** @internal */
    public currentDrag2 = 0;

    /** @internal */
    public randomNoiseCoordinates1: Nullable<Vector3>;
    /** @internal */
    public randomNoiseCoordinates2: Nullable<Vector3>;

    /** @internal */
    public localPosition?: Vector3;

    /**
     * Callback triggered when the particle is reset
     */
    public onReset: Nullable<() => void>;

    /** @internal */
    public reset(): void {
        this.currentColorGradient = null;
        this.currentSizeGradient = null;
        this.currentAngularSpeedGradient = null;
        this.currentVelocityGradient = null;
        this.currentLimitVelocityGradient = null;
        this.currentDragGradient = null;
        this.randomCellOffset = undefined;
        this.randomNoiseCoordinates1 = null;
        this.randomNoiseCoordinates2 = null;
    }
}

/**
 * A particle represents one of the element emitted by a particle system.
 * This is mainly define by its coordinates, direction, velocity and age.
 */
export class Particle {
    private static _Count = 0;
    /**
     * Unique ID of the particle
     */
    public id: number;
    /**
     * The world position of the particle in the scene.
     */
    public position = Vector3.Zero();

    /**
     * The world direction of the particle in the scene.
     */
    public direction = Vector3.Zero();

    /**
     * The color of the particle.
     */
    public color = new Color4(0, 0, 0, 0);

    /**
     * The color change of the particle per step.
     */
    public colorStep = new Color4(0, 0, 0, 0);

    /**
     * The creation color of the particle.
     */
    public initialColor = new Color4(0, 0, 0, 0);

    /**
     * The color used when the end of life of the particle.
     */
    public colorDead = new Color4(0, 0, 0, 0);

    /**
     * Defines how long will the life of the particle be.
     */
    public lifeTime = 1.0;

    /**
     * The current age of the particle.
     */
    public age = 0;

    /**
     * The current size of the particle.
     */
    public size = 0;

    /**
     * The current scale of the particle.
     */
    public scale = new Vector2(1, 1);

    /**
     * The current angle of the particle.
     */
    public angle = 0;

    /**
     * Defines how fast is the angle changing.
     */
    public angularSpeed = 0;

    /**
     * Defines the cell index used by the particle to be rendered from a sprite.
     */
    public cellIndex: number = 0;

    /**
     * The information required to support color remapping
     */
    public remapData: Vector4;

    /** @internal */
    public _properties = new ParticleInternalProperties();

    /**
     * Creates a new instance Particle
     * @param particleSystem the particle system the particle belongs to
     */
    constructor(
        /**
         * The particle system the particle belongs to.
         */
        public particleSystem: ThinParticleSystem
    ) {
        this.id = Particle._Count++;
        if (!this.particleSystem.isAnimationSheetEnabled) {
            return;
        }

        this._updateCellInfoFromSystem();
    }

    private _updateCellInfoFromSystem(): void {
        this.cellIndex = this.particleSystem.startSpriteCellID;
    }

    /**
     * Defines how the sprite cell index is updated for the particle
     */
    public updateCellIndex(): void {
        let offsetAge = this.age;
        let changeSpeed = this.particleSystem.spriteCellChangeSpeed;

        if (this.particleSystem.spriteRandomStartCell) {
            if (this._properties.randomCellOffset === undefined) {
                this._properties.randomCellOffset = Math.random() * this.lifeTime;
            }

            if (changeSpeed === 0) {
                // Special case when speed = 0 meaning we want to stay on initial cell
                changeSpeed = 1;
                offsetAge = this._properties.randomCellOffset;
            } else {
                offsetAge += this._properties.randomCellOffset;
            }
        }

        const dist = this._properties.initialEndSpriteCellId - this._properties.initialStartSpriteCellId + 1;
        let ratio: number;
        if (this._properties.initialSpriteCellLoop) {
            ratio = Clamp(((offsetAge * changeSpeed) % this.lifeTime) / this.lifeTime);
        } else {
            ratio = Clamp((offsetAge * changeSpeed) / this.lifeTime);
        }
        this.cellIndex = (this._properties.initialStartSpriteCellId + ratio * dist) | 0;
    }

    /**
     * @internal
     */
    public _inheritParticleInfoToSubEmitter(subEmitter: SubEmitter) {
        if ((<AbstractMesh>subEmitter.particleSystem.emitter).position) {
            const emitterMesh = <AbstractMesh>subEmitter.particleSystem.emitter;
            emitterMesh.position.copyFrom(this.position);
            if (subEmitter.inheritDirection) {
                const temp = TmpVectors.Vector3[0];
                this.direction.normalizeToRef(temp);
                emitterMesh.setDirection(temp, 0, Math.PI / 2);
            }
        } else {
            const emitterPosition = <Vector3>subEmitter.particleSystem.emitter;
            emitterPosition.copyFrom(this.position);
        }
        // Set inheritedVelocityOffset to be used when new particles are created
        this.direction.scaleToRef(subEmitter.inheritedVelocityAmount / 2, TmpVectors.Vector3[0]);
        subEmitter.particleSystem._inheritedVelocityOffset.copyFrom(TmpVectors.Vector3[0]);
    }

    /** @internal */
    public _inheritParticleInfoToSubEmitters() {
        if (this._properties.attachedSubEmitters && this._properties.attachedSubEmitters.length > 0) {
            for (const subEmitter of this._properties.attachedSubEmitters) {
                this._inheritParticleInfoToSubEmitter(subEmitter);
            }
        }
    }

    /** @internal */
    public _reset() {
        if (this._properties.onReset) {
            this._properties.onReset();
        }
        this.age = 0;
        this.id = Particle._Count++;
        this._properties.reset();
        this.cellIndex = this.particleSystem.startSpriteCellID;
    }

    /**
     * Copy the properties of particle to another one.
     * @param other the particle to copy the information to.
     */
    public copyTo(other: Particle) {
        other.position.copyFrom(this.position);
        if (this._properties.initialDirection) {
            if (other._properties.initialDirection) {
                other._properties.initialDirection.copyFrom(this._properties.initialDirection);
            } else {
                other._properties.initialDirection = this._properties.initialDirection.clone();
            }
        } else {
            other._properties.initialDirection = null;
        }
        other.direction.copyFrom(this.direction);
        if (this._properties.localPosition) {
            if (other._properties.localPosition) {
                other._properties.localPosition.copyFrom(this._properties.localPosition);
            } else {
                other._properties.localPosition = this._properties.localPosition.clone();
            }
        }
        other.color.copyFrom(this.color);
        other.colorStep.copyFrom(this.colorStep);
        other.initialColor.copyFrom(this.initialColor);
        other.colorDead.copyFrom(this.colorDead);
        other.lifeTime = this.lifeTime;
        other.age = this.age;
        other._properties.randomCellOffset = this._properties.randomCellOffset;
        other.size = this.size;
        other.scale.copyFrom(this.scale);
        other.angle = this.angle;
        other.angularSpeed = this.angularSpeed;
        other.particleSystem = this.particleSystem;
        other.cellIndex = this.cellIndex;
        other.id = this.id;
        other._properties.attachedSubEmitters = this._properties.attachedSubEmitters;
        if (this._properties.currentColorGradient) {
            other._properties.currentColorGradient = this._properties.currentColorGradient;
            other._properties.currentColor1.copyFrom(this._properties.currentColor1);
            other._properties.currentColor2.copyFrom(this._properties.currentColor2);
        }
        if (this._properties.currentSizeGradient) {
            other._properties.currentSizeGradient = this._properties.currentSizeGradient;
            other._properties.currentSize1 = this._properties.currentSize1;
            other._properties.currentSize2 = this._properties.currentSize2;
        }
        if (this._properties.currentAngularSpeedGradient) {
            other._properties.currentAngularSpeedGradient = this._properties.currentAngularSpeedGradient;
            other._properties.currentAngularSpeed1 = this._properties.currentAngularSpeed1;
            other._properties.currentAngularSpeed2 = this._properties.currentAngularSpeed2;
        }
        if (this._properties.currentVelocityGradient) {
            other._properties.currentVelocityGradient = this._properties.currentVelocityGradient;
            other._properties.currentVelocity1 = this._properties.currentVelocity1;
            other._properties.currentVelocity2 = this._properties.currentVelocity2;
        }
        if (this._properties.currentLimitVelocityGradient) {
            other._properties.currentLimitVelocityGradient = this._properties.currentLimitVelocityGradient;
            other._properties.currentLimitVelocity1 = this._properties.currentLimitVelocity1;
            other._properties.currentLimitVelocity2 = this._properties.currentLimitVelocity2;
        }
        if (this._properties.currentDragGradient) {
            other._properties.currentDragGradient = this._properties.currentDragGradient;
            other._properties.currentDrag1 = this._properties.currentDrag1;
            other._properties.currentDrag2 = this._properties.currentDrag2;
        }
        if (this.particleSystem.isAnimationSheetEnabled) {
            other._properties.initialStartSpriteCellId = this._properties.initialStartSpriteCellId;
            other._properties.initialEndSpriteCellId = this._properties.initialEndSpriteCellId;
            other._properties.initialSpriteCellLoop = this._properties.initialSpriteCellLoop;
        }
        if (this.particleSystem.useRampGradients) {
            if (other.remapData && this.remapData) {
                other.remapData.copyFrom(this.remapData);
            } else {
                other.remapData = new Vector4(0, 0, 0, 0);
            }
        }
        if (this._properties.randomNoiseCoordinates1 && this._properties.randomNoiseCoordinates2) {
            if (other._properties.randomNoiseCoordinates1 && other._properties.randomNoiseCoordinates2) {
                other._properties.randomNoiseCoordinates1.copyFrom(this._properties.randomNoiseCoordinates1);
                other._properties.randomNoiseCoordinates2.copyFrom(this._properties.randomNoiseCoordinates2);
            } else {
                other._properties.randomNoiseCoordinates1 = this._properties.randomNoiseCoordinates1.clone();
                other._properties.randomNoiseCoordinates2 = this._properties.randomNoiseCoordinates2.clone();
            }
        }
    }
}
