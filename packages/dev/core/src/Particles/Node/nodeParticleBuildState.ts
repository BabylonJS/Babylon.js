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
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    public getContextualValue(source: NodeParticleContextualSources) {
        if (!this.particleContext) {
            return null;
        }

        const isParticle = this.particleContext instanceof Particle;
        const isSolidParticle = this.particleContext instanceof SolidParticle;

        switch (source) {
            // Sources supported by both Particle and SolidParticle
            case NodeParticleContextualSources.Position:
                return this.particleContext.position;
            case NodeParticleContextualSources.Color:
                return this.particleContext.color;
            case NodeParticleContextualSources.Scale:
                if (isParticle) {
                    return (this.particleContext as Particle).scale;
                } else if (isSolidParticle) {
                    // Convert Vector3 scaling to Vector2 for compatibility
                    const scaling = (this.particleContext as SolidParticle).scaling;
                    return new Vector2(scaling.x, scaling.y);
                }
                return null;

            // Sources only supported by Particle (require ThinParticleSystem)
            case NodeParticleContextualSources.Direction:
                if (!isParticle || !this.systemContext) {
                    return null;
                }
                return (this.particleContext as Particle).direction;
            case NodeParticleContextualSources.ScaledDirection:
                if (!isParticle || !this.systemContext) {
                    return null;
                }
                // ScaledDirection only works with ThinParticleSystem
                if (!(this.systemContext instanceof ThinParticleSystem)) {
                    return null;
                }
                const particle = this.particleContext as Particle;
                particle.direction.scaleToRef(this.systemContext._directionScale, this.systemContext._scaledDirection);
                return this.systemContext._scaledDirection;
            case NodeParticleContextualSources.InitialColor:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).initialColor;
            case NodeParticleContextualSources.ColorDead:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).colorDead;
            case NodeParticleContextualSources.Age:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).age;
            case NodeParticleContextualSources.Lifetime:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).lifeTime;
            case NodeParticleContextualSources.Angle:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).angle;
            case NodeParticleContextualSources.AgeGradient:
                if (!isParticle) {
                    return null;
                }
                const p = this.particleContext as Particle;
                return p.age / p.lifeTime;
            case NodeParticleContextualSources.SpriteCellEnd:
                if (!this.systemContext || !(this.systemContext instanceof ThinParticleSystem)) {
                    return null;
                }
                return this.systemContext.endSpriteCellID;
            case NodeParticleContextualSources.SpriteCellIndex:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle).cellIndex;
            case NodeParticleContextualSources.SpriteCellStart:
                if (!this.systemContext || !(this.systemContext instanceof ThinParticleSystem)) {
                    return null;
                }
                return this.systemContext.startSpriteCellID;
            case NodeParticleContextualSources.InitialDirection:
                if (!isParticle) {
                    return null;
                }
                return (this.particleContext as Particle)._initialDirection;
        }

        return null;
    }

    /**
     * Gets a boolean indicating if the emitter is a transform node (or a simple vector3)
     */
    public get isEmitterTransformNode() {
        if (!this.systemContext || !(this.systemContext instanceof ThinParticleSystem)) {
            return false;
        }

        if ((<AbstractMesh>this.systemContext.emitter).position) {
            return true;
        }

        return false;
    }

    /**
     * Gets the emitter world matrix
     */
    public get emitterWorldMatrix() {
        if (!this.systemContext || !(this.systemContext instanceof ThinParticleSystem)) {
            return null;
        }
        return this.systemContext._emitterWorldMatrix;
    }

    /**
     * Gets the emitter inverse world matrix
     */
    public get emitterInverseWorldMatrix() {
        if (!this.systemContext || !(this.systemContext instanceof ThinParticleSystem)) {
            return null;
        }
        return this.systemContext._emitterInverseWorldMatrix;
    }

    /**
     * Gets the emitter position
     */
    public get emitterPosition() {
        if (!this.systemContext) {
            return null;
        }

        if (this.systemContext instanceof ThinParticleSystem) {
            if (this.isEmitterTransformNode) {
                return (<AbstractMesh>this.systemContext.emitter).absolutePosition;
            }
            return this.systemContext.emitter as Vector3;
        } else if (this.systemContext instanceof SolidParticleSystem) {
            // For SPS, return mesh position as "emitter"
            return this.systemContext.mesh?.absolutePosition || Vector3.Zero();
        }

        return null;
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

        const isThinParticleSystem = this.systemContext instanceof ThinParticleSystem;
        const isSolidParticleSystem = this.systemContext instanceof SolidParticleSystem;

        switch (source) {
            case NodeParticleSystemSources.Time:
                if (isThinParticleSystem) {
                    return (this.systemContext as ThinParticleSystem)._actualFrame;
                } else if (isSolidParticleSystem) {
                    // For SPS, use frameId from scene
                    return this.scene.getFrameId() || 0;
                }
                return null;
            case NodeParticleSystemSources.Delta:
                if (isThinParticleSystem) {
                    return (this.systemContext as ThinParticleSystem)._scaledUpdateSpeed;
                } else if (isSolidParticleSystem) {
                    // For SPS, use deltaTime from engine
                    return this.scene.getEngine().getDeltaTime() || 0.016;
                }
                return null;
            case NodeParticleSystemSources.Emitter:
                if (isThinParticleSystem) {
                    const thinSystem = this.systemContext as ThinParticleSystem;
                    if (this.isEmitterTransformNode) {
                        const emitterMesh = <AbstractMesh>thinSystem.emitter;
                        return emitterMesh.absolutePosition;
                    } else {
                        return thinSystem.emitter;
                    }
                } else if (isSolidParticleSystem) {
                    // For SPS, return mesh position as "emitter"
                    return (this.systemContext as SolidParticleSystem).mesh?.absolutePosition || Vector3.Zero();
                }
                return null;
            case NodeParticleSystemSources.CameraPosition:
                // Works for both through scene
                return this.scene.activeCamera?.globalPosition || Vector3.Zero();
        }

        return null;
    }
}
