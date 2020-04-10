import { Nullable } from "../types";
import { Vector2, Vector3, TmpVectors, Vector4 } from "../Maths/math.vector";
import { Color4 } from '../Maths/math.color';
import { Scalar } from "../Maths/math.scalar";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { ParticleSystem } from "./particleSystem";
import { SubEmitter } from "./subEmitter";
import { ColorGradient, FactorGradient } from "../Misc/gradients";
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

    /** @hidden */
    public _randomCellOffset?: number;

    /** @hidden */
    public _initialDirection: Nullable<Vector3>;

    /** @hidden */
    public _attachedSubEmitters: Nullable<Array<SubEmitter>> = null;

    /** @hidden */
    public _initialStartSpriteCellID: number;
    /** @hidden */
    public _initialEndSpriteCellID: number;

    /** @hidden */
    public _currentColorGradient: Nullable<ColorGradient>;
    /** @hidden */
    public _currentColor1 = new Color4(0, 0, 0, 0);
    /** @hidden */
    public _currentColor2 = new Color4(0, 0, 0, 0);

    /** @hidden */
    public _currentSizeGradient: Nullable<FactorGradient>;
    /** @hidden */
    public _currentSize1 = 0;
    /** @hidden */
    public _currentSize2 = 0;

    /** @hidden */
    public _currentAngularSpeedGradient: Nullable<FactorGradient>;
    /** @hidden */
    public _currentAngularSpeed1 = 0;
    /** @hidden */
    public _currentAngularSpeed2 = 0;

    /** @hidden */
    public _currentVelocityGradient: Nullable<FactorGradient>;
    /** @hidden */
    public _currentVelocity1 = 0;
    /** @hidden */
    public _currentVelocity2 = 0;

    /** @hidden */
    public _currentLimitVelocityGradient: Nullable<FactorGradient>;
    /** @hidden */
    public _currentLimitVelocity1 = 0;
    /** @hidden */
    public _currentLimitVelocity2 = 0;

    /** @hidden */
    public _currentDragGradient: Nullable<FactorGradient>;
    /** @hidden */
    public _currentDrag1 = 0;
    /** @hidden */
    public _currentDrag2 = 0;

    /** @hidden */
    public _randomNoiseCoordinates1: Vector3;
    /** @hidden */
    public _randomNoiseCoordinates2: Vector3;

    /** @hidden */
    public _localPosition?: Vector3;

    /**
     * Creates a new instance Particle
     * @param particleSystem the particle system the particle belongs to
     */
    constructor(
        /**
         * The particle system the particle belongs to.
         */
        public particleSystem: ParticleSystem) {
        this.id = Particle._Count++;
        if (!this.particleSystem.isAnimationSheetEnabled) {
            return;
        }

        this.updateCellInfoFromSystem();
    }

    private updateCellInfoFromSystem(): void {
        this.cellIndex = this.particleSystem.startSpriteCellID;
    }

    /**
     * Defines how the sprite cell index is updated for the particle
     */
    public updateCellIndex(): void {
        let offsetAge = this.age;
        let changeSpeed = this.particleSystem.spriteCellChangeSpeed;

        if (this.particleSystem.spriteRandomStartCell) {
            if (this._randomCellOffset === undefined) {
                this._randomCellOffset = Math.random() * this.lifeTime;
            }

            if (changeSpeed === 0) { // Special case when speed = 0 meaning we want to stay on initial cell
                changeSpeed = 1;
                offsetAge = this._randomCellOffset;
            } else {
                offsetAge += this._randomCellOffset;
            }
        }

        let dist = (this._initialEndSpriteCellID - this._initialStartSpriteCellID);
        let ratio = Scalar.Clamp(((offsetAge * changeSpeed) % this.lifeTime) / this.lifeTime);

        this.cellIndex = this._initialStartSpriteCellID + (ratio * dist) | 0;
    }

    /** @hidden */
    public _inheritParticleInfoToSubEmitter(subEmitter: SubEmitter) {
        if ((<AbstractMesh>subEmitter.particleSystem.emitter).position) {
            var emitterMesh = (<AbstractMesh>subEmitter.particleSystem.emitter);
            emitterMesh.position.copyFrom(this.position);
            if (subEmitter.inheritDirection) {
                let temp = TmpVectors.Vector3[0];
                this.direction.normalizeToRef(temp);
                emitterMesh.setDirection(temp, 0, Math.PI / 2);
            }
        } else {
            var emitterPosition = (<Vector3>subEmitter.particleSystem.emitter);
            emitterPosition.copyFrom(this.position);
        }
        // Set inheritedVelocityOffset to be used when new particles are created
        this.direction.scaleToRef(subEmitter.inheritedVelocityAmount / 2, TmpVectors.Vector3[0]);
        subEmitter.particleSystem._inheritedVelocityOffset.copyFrom(TmpVectors.Vector3[0]);
    }

    /** @hidden */
    public _inheritParticleInfoToSubEmitters() {
        if (this._attachedSubEmitters && this._attachedSubEmitters.length > 0) {
            this._attachedSubEmitters.forEach((subEmitter) => {
                this._inheritParticleInfoToSubEmitter(subEmitter);
            });
        }
    }

    /** @hidden */
    public _reset() {
        this.age = 0;
        this.id = Particle._Count++;
        this._currentColorGradient = null;
        this._currentSizeGradient = null;
        this._currentAngularSpeedGradient = null;
        this._currentVelocityGradient = null;
        this._currentLimitVelocityGradient = null;
        this._currentDragGradient = null;
        this.cellIndex = this.particleSystem.startSpriteCellID;
        this._randomCellOffset = undefined;
    }

    /**
     * Copy the properties of particle to another one.
     * @param other the particle to copy the information to.
     */
    public copyTo(other: Particle) {
        other.position.copyFrom(this.position);
        if (this._initialDirection) {
            if (other._initialDirection) {
                other._initialDirection.copyFrom(this._initialDirection);
            } else {
                other._initialDirection = this._initialDirection.clone();
            }
        } else {
            other._initialDirection = null;
        }
        other.direction.copyFrom(this.direction);
        if (this._localPosition) {
            if (other._localPosition) {
                other._localPosition.copyFrom(this._localPosition);
            } else {
                other._localPosition = this._localPosition.clone();
            }
        }
        other.color.copyFrom(this.color);
        other.colorStep.copyFrom(this.colorStep);
        other.lifeTime = this.lifeTime;
        other.age = this.age;
        other._randomCellOffset = this._randomCellOffset;
        other.size = this.size;
        other.scale.copyFrom(this.scale);
        other.angle = this.angle;
        other.angularSpeed = this.angularSpeed;
        other.particleSystem = this.particleSystem;
        other.cellIndex = this.cellIndex;
        other.id = this.id;
        other._attachedSubEmitters = this._attachedSubEmitters;
        if (this._currentColorGradient) {
            other._currentColorGradient = this._currentColorGradient;
            other._currentColor1.copyFrom(this._currentColor1);
            other._currentColor2.copyFrom(this._currentColor2);
        }
        if (this._currentSizeGradient) {
            other._currentSizeGradient = this._currentSizeGradient;
            other._currentSize1 = this._currentSize1;
            other._currentSize2 = this._currentSize2;
        }
        if (this._currentAngularSpeedGradient) {
            other._currentAngularSpeedGradient = this._currentAngularSpeedGradient;
            other._currentAngularSpeed1 = this._currentAngularSpeed1;
            other._currentAngularSpeed2 = this._currentAngularSpeed2;
        }
        if (this._currentVelocityGradient) {
            other._currentVelocityGradient = this._currentVelocityGradient;
            other._currentVelocity1 = this._currentVelocity1;
            other._currentVelocity2 = this._currentVelocity2;
        }
        if (this._currentLimitVelocityGradient) {
            other._currentLimitVelocityGradient = this._currentLimitVelocityGradient;
            other._currentLimitVelocity1 = this._currentLimitVelocity1;
            other._currentLimitVelocity2 = this._currentLimitVelocity2;
        }
        if (this._currentDragGradient) {
            other._currentDragGradient = this._currentDragGradient;
            other._currentDrag1 = this._currentDrag1;
            other._currentDrag2 = this._currentDrag2;
        }
        if (this.particleSystem.isAnimationSheetEnabled) {
            other._initialStartSpriteCellID = this._initialStartSpriteCellID;
            other._initialEndSpriteCellID = this._initialEndSpriteCellID;
        }
        if (this.particleSystem.useRampGradients) {
            if (other.remapData && this.remapData) {
                other.remapData.copyFrom(this.remapData);
            } else {
                other.remapData = new Vector4(0, 0, 0, 0);
            }
        }
        if (this._randomNoiseCoordinates1) {
            if (other._randomNoiseCoordinates1) {
                other._randomNoiseCoordinates1.copyFrom(this._randomNoiseCoordinates1);
                other._randomNoiseCoordinates2.copyFrom(this._randomNoiseCoordinates2);
            } else {
                other._randomNoiseCoordinates1 = this._randomNoiseCoordinates1.clone();
                other._randomNoiseCoordinates2 = this._randomNoiseCoordinates2.clone();
            }
        }
    }
}
