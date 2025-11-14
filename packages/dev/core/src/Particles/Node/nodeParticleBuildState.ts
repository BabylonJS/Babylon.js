import type { Scene } from "core/scene";
import type { NodeParticleConnectionPoint } from "./nodeParticleBlockConnectionPoint";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { Particle } from "../particle";
import type { Nullable } from "core/types";
import { NodeParticleBlockConnectionPointTypes } from "./Enums/nodeParticleBlockConnectionPointTypes";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { SolidParticle } from "../solidParticle";
import { ThinParticleSystem } from "../thinParticleSystem";
import { Color4 } from "core/Maths/math.color";
import { NodeParticleSystemSources } from "./Enums/nodeParticleSystemSources";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { SolidParticleSystem } from "../solidParticleSystem";

/**
 * Class used to store node based geometry build state
 */
export class NodeParticleBuildState {
    /**
     * Gets the capactity of the particle system to build
     */
    public capacity: number;

    /**
     * Gets the scene where the particle system is built
     */
    public scene: Scene;

    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: NodeParticleConnectionPoint[] = [];

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;

    /**
     * Gets or sets the particle context for contextual data
     */
    public particleContext: Nullable<Particle | SolidParticle> = null;

    /**
     * Gets or sets the system context for contextual data
     * Can be either ThinParticleSystem or SolidParticleSystem
     */
    public systemContext: Nullable<ThinParticleSystem | SolidParticleSystem> = null;

    /**
     * Gets or sets the delta time for physics calculations
     */
    public deltaTime: number = 0.016; // 60 FPS default

    /**
     * Gets or sets the index of the gradient to use
     */
    public gradientIndex: number = 0;
    /**
     * Gets or sets next gradient in line
     */
    public nextGradientIndex: number = 0;
    /**
     * Gets or sets the next gradient value
     */
    public nextGradientValue: any;

    /**
     * Emits errors if any
     */
    public emitErrors() {
        let errorMessage = "";

        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${
                notConnectedInput.ownerBlock.name
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }

        if (errorMessage) {
            // eslint-disable-next-line no-throw-literal
            throw "Build of Node Particle System Set failed:\n" + errorMessage;
        }
    }

    /**
     * Adapt a value to a target type
     * @param source defines the value to adapt
     * @param targetType defines the target type
     * @returns the adapted value
     */
    adapt(source: NodeParticleConnectionPoint, targetType: NodeParticleBlockConnectionPointTypes) {
        const value = source.getConnectedValue(this) || 0;

        if (source.type === targetType) {
            return value;
        }

        switch (targetType) {
            case NodeParticleBlockConnectionPointTypes.Vector2:
                return new Vector2(value, value);
            case NodeParticleBlockConnectionPointTypes.Vector3:
                return new Vector3(value, value, value);
            case NodeParticleBlockConnectionPointTypes.Color4:
                return new Color4(value, value, value, value);
        }

        return null;
    }

    /**
     * Type guard to check if particle context is a Particle and system context is ThinParticleSystem
     */
    private isParticleWithThinSystem(): this is this & { particleContext: Particle; systemContext: ThinParticleSystem } {
        return this.particleContext instanceof Particle && this.systemContext instanceof ThinParticleSystem;
    }

    /**
     * Type guard to check if particle context is a Particle
     */
    private isParticle(): this is this & { particleContext: Particle } {
        return this.particleContext instanceof Particle;
    }

    /**
     * Type guard to check if particle context is a SolidParticle
     */
    private isSolidParticle(): this is this & { particleContext: SolidParticle } {
        return this.particleContext instanceof SolidParticle;
    }

    /**
     * Type guard to check if system context is a ThinParticleSystem
     */
    private isThinParticleSystem(): this is this & { systemContext: ThinParticleSystem } {
        return this.systemContext instanceof ThinParticleSystem;
    }

    /**
     * Type guard to check if system context is a SolidParticleSystem
     */
    private isSolidParticleSystem(): this is this & { systemContext: SolidParticleSystem } {
        return this.systemContext instanceof SolidParticleSystem;
    }

    /**
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    public getContextualValue(source: NodeParticleContextualSources) {
        if (!this.particleContext) {
            return null;
        }

        switch (source) {
            // Common properties available on both Particle and SolidParticle
            case NodeParticleContextualSources.Position:
                return this.particleContext.position;
            case NodeParticleContextualSources.Color:
                return this.particleContext.color;
            case NodeParticleContextualSources.Scale:
                if (this.isParticle()) {
                    return this.particleContext.scale;
                }
                if (this.isSolidParticle()) {
                    // Convert Vector3 scaling to Vector2 for compatibility
                    const scaling = this.particleContext.scaling;
                    return new Vector2(scaling.x, scaling.y);
                }
                return null;

            case NodeParticleContextualSources.Direction:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.direction;

            case NodeParticleContextualSources.ScaledDirection:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                this.particleContext.direction.scaleToRef(this.systemContext._directionScale, this.systemContext._scaledDirection);
                return this.systemContext._scaledDirection;

            case NodeParticleContextualSources.InitialColor:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.initialColor;

            case NodeParticleContextualSources.ColorDead:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.colorDead;

            case NodeParticleContextualSources.Age:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.age;

            case NodeParticleContextualSources.Lifetime:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.lifeTime;

            case NodeParticleContextualSources.Angle:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.angle;

            case NodeParticleContextualSources.AgeGradient:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.age / this.particleContext.lifeTime;

            case NodeParticleContextualSources.SpriteCellIndex:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.cellIndex;

            case NodeParticleContextualSources.InitialDirection:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext._initialDirection;

            case NodeParticleContextualSources.ColorStep:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                return this.particleContext.colorStep;

            case NodeParticleContextualSources.ScaledColorStep:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                this.particleContext.colorStep.scaleToRef(this.systemContext._scaledUpdateSpeed, this.systemContext._scaledColorStep);
                return this.systemContext._scaledColorStep;

            case NodeParticleContextualSources.LocalPositionUpdated:
                if (!this.isParticleWithThinSystem()) {
                    return null;
                }
                this.particleContext.direction.scaleToRef(this.systemContext._directionScale, this.systemContext._scaledDirection);
                if (this.particleContext._localPosition) {
                    this.particleContext._localPosition.addInPlace(this.systemContext._scaledDirection);
                    Vector3.TransformCoordinatesToRef(this.particleContext._localPosition, this.systemContext._emitterWorldMatrix, this.particleContext.position);
                }
                return this.particleContext.position;

            case NodeParticleContextualSources.SpriteCellEnd:
                if (!this.isThinParticleSystem()) {
                    return null;
                }
                return this.systemContext.endSpriteCellID;

            case NodeParticleContextualSources.SpriteCellStart:
                if (!this.isThinParticleSystem()) {
                    return null;
                }
                return this.systemContext.startSpriteCellID;
        }

        return null;
    }

    /**
     * Gets the emitter world matrix
     */
    public get emitterWorldMatrix() {
        if (!this.isThinParticleSystem()) {
            return null;
        }
        return this.systemContext._emitterWorldMatrix;
    }

    /**
     * Gets the emitter inverse world matrix
     */
    public get emitterInverseWorldMatrix() {
        if (!this.isThinParticleSystem()) {
            return null;
        }
        return this.systemContext._emitterInverseWorldMatrix;
    }

    /**
     * Gets the emitter position
     */
    public get emitterPosition(): Nullable<Vector3> {
        if (!this.systemContext) {
            return null;
        }

        if (this.isSolidParticleSystem()) {
            return this.systemContext.mesh?.absolutePosition || Vector3.Zero();
        }

        if (!this.isThinParticleSystem()) {
            return null;
        }

        if (!this.systemContext.emitter) {
            return null;
        }

        if (this.systemContext.emitter instanceof Vector3) {
            return this.systemContext.emitter;
        }

        return (this.systemContext.emitter as AbstractMesh).absolutePosition;
    }

    /**
     * Gets the actual frame number
     */
    public get actualFrame() {
        if (this.isThinParticleSystem()) {
            return this.systemContext._actualFrame;
        }
        return this.scene.getFrameId() || 0;
    }

    /**
     * Gets the delta time
     */
    public get delta() {
        if (this.isThinParticleSystem()) {
            return this.systemContext._scaledUpdateSpeed;
        }
        return this.scene.getEngine().getDeltaTime() || this.deltaTime;
    }

    /**
     * Gets the value associated with a system source
     * @param source Source of the system value
     * @returns the value associated with the source
     */
    public getSystemValue(source: NodeParticleSystemSources) {
        if (!this.particleContext || !this.systemContext) {
            return null;
        }

        switch (source) {
            case NodeParticleSystemSources.Time:
                return this.actualFrame;
            case NodeParticleSystemSources.Delta:
                return this.delta;
            case NodeParticleSystemSources.Emitter:
                return this.emitterPosition;
            case NodeParticleSystemSources.CameraPosition:
                return this.scene.activeCamera?.globalPosition || Vector3.Zero();
        }

        return null;
    }
}
