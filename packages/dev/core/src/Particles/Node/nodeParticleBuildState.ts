import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Particle } from "core/Particles/particle";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";

import { Color4 } from "core/Maths/math.color";
import { Matrix, Vector2, Vector3 } from "core/Maths/math.vector";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleContextualSources } from "core/Particles/Node/Enums/nodeParticleContextualSources";
import { NodeParticleSystemSources } from "core/Particles/Node/Enums/nodeParticleSystemSources";
import { SolidParticle } from "core/Particles/solidParticle";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";

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
     */
    public systemContext: Nullable<ThinParticleSystem | SolidParticleSystem> = null;

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
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    public getContextualValue(source: NodeParticleContextualSources) {
        if (!this.particleContext || !this.systemContext) {
            return null;
        }

        switch (source) {
            case NodeParticleContextualSources.Position:
                return this.particleContext.position;
            case NodeParticleContextualSources.Direction:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.direction;
            case NodeParticleContextualSources.DirectionScale:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext._directionScale;
            case NodeParticleContextualSources.ScaledDirection:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                this.particleContext.direction.scaleToRef(this.particleContext._directionScale, this.particleContext._scaledDirection);
                return this.particleContext._scaledDirection;
            case NodeParticleContextualSources.Color:
                return this.particleContext.color;
            case NodeParticleContextualSources.InitialColor:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.initialColor;
            case NodeParticleContextualSources.ColorDead:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.colorDead;
            case NodeParticleContextualSources.Age:
                return this.particleContext.age;
            case NodeParticleContextualSources.Lifetime:
                return this.particleContext.lifeTime;
            case NodeParticleContextualSources.Angle:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.angle;
            case NodeParticleContextualSources.Scale:
                return this.particleContext.scale;
            case NodeParticleContextualSources.Size:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.size;
            case NodeParticleContextualSources.AgeGradient:
                return this.particleContext.age / this.particleContext.lifeTime;
            case NodeParticleContextualSources.SpriteCellEnd:
                if (this.systemContext instanceof SolidParticleSystem) {
                    return null;
                }
                return this.systemContext.endSpriteCellID;
            case NodeParticleContextualSources.SpriteCellIndex:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.cellIndex;
            case NodeParticleContextualSources.SpriteCellStart:
                if (this.systemContext instanceof SolidParticleSystem) {
                    return null;
                }
                return this.systemContext.startSpriteCellID;
            case NodeParticleContextualSources.InitialDirection:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext._initialDirection;
            case NodeParticleContextualSources.ColorStep:
                if (this.particleContext instanceof SolidParticle) {
                    return null;
                }
                return this.particleContext.colorStep;
            case NodeParticleContextualSources.ScaledColorStep:
                if (this.particleContext instanceof SolidParticle || this.systemContext instanceof SolidParticleSystem) {
                    return null;
                }
                this.particleContext.colorStep.scaleToRef(this.systemContext._scaledUpdateSpeed, this.systemContext._scaledColorStep);
                return this.systemContext._scaledColorStep;
            case NodeParticleContextualSources.LocalPositionUpdated:
                if (this.particleContext instanceof SolidParticle || this.systemContext instanceof SolidParticleSystem) {
                    return this.particleContext.position;
                }
                this.particleContext.direction.scaleToRef(this.particleContext._directionScale, this.particleContext._scaledDirection);
                this.particleContext._localPosition!.addInPlace(this.particleContext._scaledDirection);
                Vector3.TransformCoordinatesToRef(this.particleContext._localPosition!, this.systemContext._emitterWorldMatrix, this.particleContext.position);
                return this.particleContext.position;
        }

        return null;
    }

    /**
     * Gets the emitter world matrix
     */
    public get emitterWorldMatrix() {
        if (!this.systemContext) {
            return null;
        }
        if (this.systemContext instanceof SolidParticleSystem) {
            const worldMatrix = this.systemContext.mesh?.getWorldMatrix();
            if (!worldMatrix) {
                return Matrix.Identity();
            }
            return worldMatrix;
        }
        return this.systemContext._emitterWorldMatrix;
    }

    /**
     * Gets the emitter inverse world matrix
     */
    public get emitterInverseWorldMatrix() {
        if (!this.systemContext) {
            return null;
        }
        if (this.systemContext instanceof SolidParticleSystem) {
            const worldMatrix = this.systemContext.mesh?.getWorldMatrix();
            if (!worldMatrix) {
                return Matrix.Identity();
            }
            return worldMatrix.invert();
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

        if (this.systemContext instanceof SolidParticleSystem) {
            return this.systemContext.mesh?.absolutePosition || Vector3.Zero();
        }

        if (!this.systemContext.emitter) {
            return null;
        }

        if (this.systemContext.emitter instanceof Vector3) {
            return this.systemContext.emitter;
        }

        return (<AbstractMesh>this.systemContext.emitter).absolutePosition;
    }

    /**
     * Gets the value associated with a system source
     * @param source Source of the system value
     * @returns the value associated with the source
     */
    public getSystemValue(source: NodeParticleSystemSources) {
        if (!this.systemContext) {
            return null;
        }

        switch (source) {
            case NodeParticleSystemSources.Time:
                return this.systemContext._actualFrame;
            case NodeParticleSystemSources.Delta:
                return this.systemContext._scaledUpdateSpeed;
            case NodeParticleSystemSources.Emitter:
                return this.emitterPosition;
            case NodeParticleSystemSources.CameraPosition:
                return this.scene.activeCamera?.globalPosition || Vector3.Zero();
        }

        return null;
    }
}
