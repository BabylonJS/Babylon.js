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

    private _particleContext: Nullable<Particle | SolidParticle> = null;
    private _isSolidParticle: boolean = false;

    /**
     * Gets or sets the particle context for contextual data
     */
    public get particleContext(): Nullable<Particle | SolidParticle> {
        return this._particleContext;
    }

    public set particleContext(value: Nullable<Particle | SolidParticle>) {
        this._particleContext = value;
        this._isSolidParticle = value instanceof SolidParticle;
    }

    private _systemContext: Nullable<ThinParticleSystem | SolidParticleSystem> = null;
    private _isSolidParticleSystem: boolean = false;

    /**
     * Gets or sets the system context for contextual data
     */
    public get systemContext(): Nullable<ThinParticleSystem | SolidParticleSystem> {
        return this._systemContext;
    }

    public set systemContext(value: Nullable<ThinParticleSystem | SolidParticleSystem>) {
        this._systemContext = value;
        this._isSolidParticleSystem = value instanceof SolidParticleSystem;
    }

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
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).direction;
            case NodeParticleContextualSources.DirectionScale:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle)._directionScale;
            case NodeParticleContextualSources.ScaledDirection:
                if (this._isSolidParticle) {
                    return null;
                }
                const particle = this.particleContext as Particle;
                particle.direction.scaleToRef(particle._directionScale, particle._scaledDirection);
                return particle._scaledDirection;
            case NodeParticleContextualSources.Color:
                return this.particleContext.color;
            case NodeParticleContextualSources.InitialColor:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).initialColor;
            case NodeParticleContextualSources.ColorDead:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).colorDead;
            case NodeParticleContextualSources.Age:
                return this.particleContext.age;
            case NodeParticleContextualSources.Lifetime:
                return this.particleContext.lifeTime;
            case NodeParticleContextualSources.Angle:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).angle;
            case NodeParticleContextualSources.Scale:
                return this.particleContext.scale;
            case NodeParticleContextualSources.Size:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).size;
            case NodeParticleContextualSources.AgeGradient:
                return this.particleContext.age / this.particleContext.lifeTime;
            case NodeParticleContextualSources.SpriteCellEnd:
                if (this._isSolidParticleSystem) {
                    return null;
                }
                return (this.systemContext as ThinParticleSystem).endSpriteCellID;
            case NodeParticleContextualSources.SpriteCellIndex:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).cellIndex;
            case NodeParticleContextualSources.SpriteCellStart:
                if (this._isSolidParticleSystem) {
                    return null;
                }
                return (this.systemContext as ThinParticleSystem).startSpriteCellID;
            case NodeParticleContextualSources.SolidParticleIndex:
                if (!this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as SolidParticle).idx;
            case NodeParticleContextualSources.InitialDirection:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle)._initialDirection;
            case NodeParticleContextualSources.ColorStep:
                if (this._isSolidParticle) {
                    return null;
                }
                return (this.particleContext as Particle).colorStep;
            case NodeParticleContextualSources.ScaledColorStep:
                if (this._isSolidParticle || this._isSolidParticleSystem) {
                    return null;
                }
                const particleForColor = this.particleContext as Particle;
                const systemForColor = this.systemContext as ThinParticleSystem;
                particleForColor.colorStep.scaleToRef(systemForColor._scaledUpdateSpeed, systemForColor._scaledColorStep);
                return systemForColor._scaledColorStep;
            case NodeParticleContextualSources.LocalPositionUpdated:
                if (this._isSolidParticle || this._isSolidParticleSystem) {
                    return this.particleContext.position;
                }
                const particleForLocal = this.particleContext as Particle;
                const systemForLocal = this.systemContext as ThinParticleSystem;
                particleForLocal.direction.scaleToRef(particleForLocal._directionScale, particleForLocal._scaledDirection);
                particleForLocal._localPosition!.addInPlace(particleForLocal._scaledDirection);
                Vector3.TransformCoordinatesToRef(particleForLocal._localPosition!, systemForLocal._emitterWorldMatrix, particleForLocal.position);
                return particleForLocal.position;
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
        if (this._isSolidParticleSystem) {
            const worldMatrix = (this.systemContext as SolidParticleSystem).mesh?.getWorldMatrix();
            if (!worldMatrix) {
                return Matrix.Identity();
            }
            return worldMatrix;
        }
        return (this.systemContext as ThinParticleSystem)._emitterWorldMatrix;
    }

    /**
     * Gets the emitter inverse world matrix
     */
    public get emitterInverseWorldMatrix() {
        if (!this.systemContext) {
            return null;
        }
        if (this._isSolidParticleSystem) {
            const worldMatrix = (this.systemContext as SolidParticleSystem).mesh?.getWorldMatrix();
            if (!worldMatrix) {
                return Matrix.Identity();
            }
            return worldMatrix.invert();
        }
        return (this.systemContext as ThinParticleSystem)._emitterInverseWorldMatrix;
    }

    /**
     * Gets the emitter position
     */
    public get emitterPosition(): Nullable<Vector3> {
        if (!this.systemContext) {
            return null;
        }

        if (this._isSolidParticleSystem) {
            return (this.systemContext as SolidParticleSystem).mesh?.absolutePosition || Vector3.Zero();
        }

        const thinSystem = this.systemContext as ThinParticleSystem;
        if (!thinSystem.emitter) {
            return null;
        }

        if (thinSystem.emitter instanceof Vector3) {
            return thinSystem.emitter;
        }

        return (<AbstractMesh>thinSystem.emitter).absolutePosition;
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
