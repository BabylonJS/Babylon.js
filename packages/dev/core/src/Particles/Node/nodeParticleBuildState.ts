import type { Scene } from "core/scene";
import type { NodeParticleConnectionPoint } from "./nodeParticleBlockConnectionPoint";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import type { Particle } from "../particle";
import type { Nullable } from "core/types";
import { NodeParticleBlockConnectionPointTypes } from "./Enums/nodeParticleBlockConnectionPointTypes";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import type { ThinParticleSystem } from "../thinParticleSystem";
import { Color4 } from "core/Maths/math.color";
import { NodeParticleSystemSources } from "./Enums/nodeParticleSystemSources";
import type { AbstractMesh } from "core/Meshes/abstractMesh";

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
    public particleContext: Nullable<Particle> = null;

    /**
     * Gets or sets the system context for contextual data
     */
    public systemContext: Nullable<ThinParticleSystem> = null;

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
                return this.particleContext.direction;
            case NodeParticleContextualSources.ScaledDirection:
                this.particleContext.direction.scaleToRef(this.systemContext._directionScale, this.systemContext._scaledDirection);
                return this.systemContext._scaledDirection;
            case NodeParticleContextualSources.Color:
                return this.particleContext.color;
            case NodeParticleContextualSources.InitialColor:
                return this.particleContext.colorStep;
            case NodeParticleContextualSources.Age:
                return this.particleContext.age;
            case NodeParticleContextualSources.Lifetime:
                return this.particleContext.lifeTime;
            case NodeParticleContextualSources.Angle:
                return this.particleContext.angle;
            case NodeParticleContextualSources.Scale:
                return this.particleContext.scale;
            case NodeParticleContextualSources.AgeGradient:
                return this.particleContext.age / this.particleContext.lifeTime;
            case NodeParticleContextualSources.SpriteCellEnd:
                return this.systemContext.endSpriteCellID;
            case NodeParticleContextualSources.SpriteCellIndex:
                return this.particleContext.cellIndex;
            case NodeParticleContextualSources.SpriteCellStart:
                return this.systemContext.startSpriteCellID;
        }

        return null;
    }

    /**
     * Gets a boolean indicating if the emitter is a transform node (or a simple vector3)
     */
    public get isEmitterTransformNode() {
        if (!this.systemContext) {
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
        if (!this.systemContext) {
            return null;
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
        return this.systemContext._emitterInverseWorldMatrix;
    }

    /**
     * Gets the emitter position
     */
    public get emitterPosition() {
        if (!this.systemContext) {
            return null;
        }

        if (this.isEmitterTransformNode) {
            return (<AbstractMesh>this.systemContext.emitter).absolutePosition;
        }

        return this.systemContext.emitter as Vector3;
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
                return this.systemContext._actualFrame;
            case NodeParticleSystemSources.Delta:
                return this.systemContext._scaledUpdateSpeed;
            case NodeParticleSystemSources.Emitter:
                if (this.isEmitterTransformNode) {
                    const emitterMesh = <AbstractMesh>this.systemContext.emitter;
                    return emitterMesh.absolutePosition;
                } else {
                    return this.systemContext.emitter;
                }
        }

        return null;
    }
}
