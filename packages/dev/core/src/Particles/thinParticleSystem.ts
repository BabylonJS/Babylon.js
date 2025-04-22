/* eslint-disable import/no-internal-modules */
import type { Immutable, Nullable } from "../types";
import { FactorGradient, ColorGradient, Color3Gradient, GradientHelper } from "../Misc/gradients";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import { Vector3, Matrix, Vector4, TmpVectors } from "../Maths/math.vector";
import { VertexBuffer, Buffer } from "../Buffers/buffer";

import type { Effect } from "../Materials/effect";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { EngineStore } from "../Engines/engineStore";
import type { IDisposable, Scene } from "../scene";

import type { IParticleSystem } from "./IParticleSystem";
import { BaseParticleSystem } from "./baseParticleSystem";
import { Particle } from "./particle";
import { Constants } from "../Engines/constants";
import type { IAnimatable } from "../Animations/animatable.interface";
import { DrawWrapper } from "../Materials/drawWrapper";

import type { DataBuffer } from "../Buffers/dataBuffer";
import { Color4, Color3, TmpColors } from "../Maths/math.color";
import type { ISize } from "../Maths/math.size";
import type { AbstractEngine } from "../Engines/abstractEngine";

import "../Engines/Extensions/engine.alpha";
import { addClipPlaneUniforms, prepareStringDefinesForClipPlanes, bindClipPlane } from "../Materials/clipPlaneMaterialHelper";

import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { ProceduralTexture } from "../Materials/Textures/Procedurals/proceduralTexture";
import { BindFogParameters, BindLogDepth } from "../Materials/materialHelper.functions";
import { BoxParticleEmitter } from "./EmitterTypes/boxParticleEmitter";
import { Clamp, Lerp, RandomRange } from "../Maths/math.scalar.functions";
import { PrepareSamplersForImageProcessing, PrepareUniformsForImageProcessing } from "../Materials/imageProcessingConfiguration.functions";
import type { ThinEngine } from "../Engines/thinEngine";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * This represents a thin particle system in Babylon.
 * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
 * Particles can take different shapes while emitted like box, sphere, cone or you can write your custom function.
 * This thin version contains a limited subset of the total features in order to provide users with a way to get particles but with a smaller footprint
 * @example https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
 */
export class ThinParticleSystem extends BaseParticleSystem implements IDisposable, IAnimatable, IParticleSystem {
    /**
     * Force all the particle systems to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;

    /**
     * This function can be defined to provide custom update for active particles.
     * This function will be called instead of regular update (age, position, color, etc.).
     * Do not forget that this function will be called on every frame so try to keep it simple and fast :)
     */
    public updateFunction: (particles: Particle[]) => void;

    private _emitterWorldMatrix: Matrix;
    private _emitterInverseWorldMatrix: Matrix = Matrix.Identity();

    /**
     * This function can be defined to specify initial direction for every new particle.
     * It by default use the emitterType defined function
     */
    public startDirectionFunction: (worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle, isLocal: boolean) => void;
    /**
     * This function can be defined to specify initial position for every new particle.
     * It by default use the emitterType defined function
     */
    public startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle, isLocal: boolean) => void;

    /**
     * @internal
     */
    public _inheritedVelocityOffset = new Vector3();
    /**
     * An event triggered when the system is disposed
     */
    public onDisposeObservable = new Observable<IParticleSystem>();
    /**
     * An event triggered when the system is stopped
     */
    public onStoppedObservable = new Observable<IParticleSystem>();

    private _onDisposeObserver: Nullable<Observer<IParticleSystem>>;
    /**
     * Sets a callback that will be triggered when the system is disposed
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    private _particles = new Array<Particle>();
    private _epsilon: number;
    private _capacity: number;
    private _stockParticles = new Array<Particle>();
    private _newPartsExcess = 0;
    private _vertexData: Float32Array;
    private _vertexBuffer: Nullable<Buffer>;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _spriteBuffer: Nullable<Buffer>;
    private _indexBuffer: Nullable<DataBuffer>;
    private _linesIndexBuffer: Nullable<DataBuffer>;
    private _linesIndexBufferUseInstancing: Nullable<DataBuffer>;
    private _drawWrappers: DrawWrapper[][]; // first index is render pass id, second index is blend mode
    /** @internal */
    public _customWrappers: { [blendMode: number]: Nullable<DrawWrapper> };
    private _scaledColorStep = new Color4(0, 0, 0, 0);
    private _colorDiff = new Color4(0, 0, 0, 0);
    private _scaledDirection = Vector3.Zero();
    private _scaledGravity = Vector3.Zero();
    private _currentRenderId = -1;
    private _alive: boolean;
    private _useInstancing = false;
    private _vertexArrayObject: Nullable<WebGLVertexArrayObject>;

    private _started = false;
    private _stopped = false;
    private _actualFrame = 0;
    private _scaledUpdateSpeed: number;
    private _vertexBufferSize: number;

    /** @internal */
    public _currentEmitRateGradient: Nullable<FactorGradient>;
    /** @internal */
    public _currentEmitRate1 = 0;
    /** @internal */
    public _currentEmitRate2 = 0;

    /** @internal */
    public _currentStartSizeGradient: Nullable<FactorGradient>;
    /** @internal */
    public _currentStartSize1 = 0;
    /** @internal */
    public _currentStartSize2 = 0;

    /** Indicates that the update of particles is done in the animate function */
    public readonly updateInAnimate = true;

    private readonly _rawTextureWidth = 256;
    private _rampGradientsTexture: Nullable<RawTexture>;
    private _useRampGradients = false;

    /** Gets or sets a matrix to use to compute projection */
    public defaultProjectionMatrix: Matrix;

    /** Gets or sets a matrix to use to compute view */
    public defaultViewMatrix: Matrix;

    /** Gets or sets a boolean indicating that ramp gradients must be used
     * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro#ramp-gradients
     */
    public get useRampGradients(): boolean {
        return this._useRampGradients;
    }

    public set useRampGradients(value: boolean) {
        if (this._useRampGradients === value) {
            return;
        }

        this._useRampGradients = value;

        this._resetEffect();
    }

    /**
     * Specifies if the particles are updated in emitter local space or world space
     */
    public isLocal = false;

    /** Indicates that the particle system is CPU based */
    public readonly isGPU = false;

    /**
     * Gets the current list of active particles
     */
    public get particles(): Particle[] {
        return this._particles;
    }

    /** Shader language used by the material */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this material.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * Gets the number of particles active at the same time.
     * @returns The number of active particles.
     */
    public getActiveCount() {
        return this._particles.length;
    }

    /**
     * Returns the string "ParticleSystem"
     * @returns a string containing the class name
     */
    public getClassName(): string {
        return "ParticleSystem";
    }

    /**
     * Gets a boolean indicating that the system is stopping
     * @returns true if the system is currently stopping
     */
    public isStopping() {
        return this._stopped && this.isAlive();
    }

    /**
     * Gets the custom effect used to render the particles
     * @param blendMode Blend mode for which the effect should be retrieved
     * @returns The effect
     */
    public getCustomEffect(blendMode: number = 0): Nullable<Effect> {
        return this._customWrappers[blendMode]?.effect ?? this._customWrappers[0]!.effect;
    }

    private _getCustomDrawWrapper(blendMode: number = 0): Nullable<DrawWrapper> {
        return this._customWrappers[blendMode] ?? this._customWrappers[0];
    }

    /**
     * Sets the custom effect used to render the particles
     * @param effect The effect to set
     * @param blendMode Blend mode for which the effect should be set
     */
    public setCustomEffect(effect: Nullable<Effect>, blendMode: number = 0) {
        this._customWrappers[blendMode] = new DrawWrapper(this._engine);
        this._customWrappers[blendMode]!.effect = effect;
        if (this._customWrappers[blendMode]!.drawContext) {
            this._customWrappers[blendMode]!.drawContext!.useInstancing = this._useInstancing;
        }
    }

    /** @internal */
    private _onBeforeDrawParticlesObservable: Nullable<Observable<Nullable<Effect>>> = null;

    /**
     * Observable that will be called just before the particles are drawn
     */
    public get onBeforeDrawParticlesObservable(): Observable<Nullable<Effect>> {
        if (!this._onBeforeDrawParticlesObservable) {
            this._onBeforeDrawParticlesObservable = new Observable<Nullable<Effect>>();
        }

        return this._onBeforeDrawParticlesObservable;
    }

    /**
     * Gets the name of the particle vertex shader
     */
    public get vertexShaderName(): string {
        return "particles";
    }

    /**
     * Gets the vertex buffers used by the particle system
     */
    public get vertexBuffers(): Immutable<{ [key: string]: VertexBuffer }> {
        return this._vertexBuffers;
    }

    /**
     * Gets the index buffer used by the particle system (or null if no index buffer is used (if _useInstancing=true))
     */
    public get indexBuffer(): Nullable<DataBuffer> {
        return this._indexBuffer;
    }

    /**
     * Instantiates a particle system.
     * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
     * @param name The name of the particle system
     * @param capacity The max number of particles alive at the same time
     * @param sceneOrEngine The scene the particle system belongs to or the engine to use if no scene
     * @param customEffect a custom effect used to change the way particles are rendered by default
     * @param isAnimationSheetEnabled Must be true if using a spritesheet to animate the particles texture
     * @param epsilon Offset used to render the particles
     */
    constructor(
        name: string,
        capacity: number,
        sceneOrEngine: Scene | AbstractEngine,
        customEffect: Nullable<Effect> = null,
        isAnimationSheetEnabled: boolean = false,
        epsilon: number = 0.01
    ) {
        super(name);

        this._capacity = capacity;

        this._epsilon = epsilon;
        this._isAnimationSheetEnabled = isAnimationSheetEnabled;

        if (!sceneOrEngine || sceneOrEngine.getClassName() === "Scene") {
            this._scene = (sceneOrEngine as Scene) || EngineStore.LastCreatedScene;
            this._engine = this._scene.getEngine();
            this.uniqueId = this._scene.getUniqueId();
            this._scene.particleSystems.push(this);
        } else {
            this._engine = sceneOrEngine as AbstractEngine;
            this.defaultProjectionMatrix = Matrix.PerspectiveFovLH(0.8, 1, 0.1, 100, this._engine.isNDCHalfZRange);
        }

        if (this._engine.getCaps().vertexArrayObject) {
            this._vertexArrayObject = null;
        }

        this._initShaderSourceAsync();

        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);

        // eslint-disable-next-line @typescript-eslint/naming-convention
        this._customWrappers = { 0: new DrawWrapper(this._engine) };
        this._customWrappers[0]!.effect = customEffect;

        this._drawWrappers = [];
        this._useInstancing = this._engine.getCaps().instancedArrays;

        this._createIndexBuffer();
        this._createVertexBuffers();

        // Default emitter type
        this.particleEmitterType = new BoxParticleEmitter();
        let noiseTextureData: Nullable<Uint8Array> = null;

        // Update
        this.updateFunction = (particles: Particle[]): void => {
            let noiseTextureSize: Nullable<ISize> = null;

            if (this.noiseTexture) {
                // We need to get texture data back to CPU
                noiseTextureSize = this.noiseTexture.getSize();
                this.noiseTexture.getContent()?.then((data) => {
                    noiseTextureData = data as Uint8Array;
                });
            }

            const sameParticleArray = particles === this._particles;

            for (let index = 0; index < particles.length; index++) {
                const particle = particles[index];

                let scaledUpdateSpeed = this._scaledUpdateSpeed;
                const previousAge = particle.age;
                particle.age += scaledUpdateSpeed;

                // Evaluate step to death
                if (particle.age > particle.lifeTime) {
                    const diff = particle.age - previousAge;
                    const oldDiff = particle.lifeTime - previousAge;

                    scaledUpdateSpeed = (oldDiff * scaledUpdateSpeed) / diff;

                    particle.age = particle.lifeTime;
                }

                const ratio = particle.age / particle.lifeTime;

                // Color
                if (this._colorGradients && this._colorGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._colorGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentColorGradient) {
                            particle._currentColor1.copyFrom(particle._currentColor2);
                            (<ColorGradient>nextGradient).getColorToRef(particle._currentColor2);
                            particle._currentColorGradient = <ColorGradient>currentGradient;
                        }
                        Color4.LerpToRef(particle._currentColor1, particle._currentColor2, scale, particle.color);
                    });
                } else {
                    particle.colorStep.scaleToRef(scaledUpdateSpeed, this._scaledColorStep);
                    particle.color.addInPlace(this._scaledColorStep);

                    if (particle.color.a < 0) {
                        particle.color.a = 0;
                    }
                }

                // Angular speed
                if (this._angularSpeedGradients && this._angularSpeedGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._angularSpeedGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentAngularSpeedGradient) {
                            particle._currentAngularSpeed1 = particle._currentAngularSpeed2;
                            particle._currentAngularSpeed2 = (<FactorGradient>nextGradient).getFactor();
                            particle._currentAngularSpeedGradient = <FactorGradient>currentGradient;
                        }
                        particle.angularSpeed = Lerp(particle._currentAngularSpeed1, particle._currentAngularSpeed2, scale);
                    });
                }
                particle.angle += particle.angularSpeed * scaledUpdateSpeed;

                // Direction
                let directionScale = scaledUpdateSpeed;

                /// Velocity
                if (this._velocityGradients && this._velocityGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._velocityGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentVelocityGradient) {
                            particle._currentVelocity1 = particle._currentVelocity2;
                            particle._currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
                            particle._currentVelocityGradient = <FactorGradient>currentGradient;
                        }
                        directionScale *= Lerp(particle._currentVelocity1, particle._currentVelocity2, scale);
                    });
                }

                particle.direction.scaleToRef(directionScale, this._scaledDirection);

                /// Limit velocity
                if (this._limitVelocityGradients && this._limitVelocityGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._limitVelocityGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentLimitVelocityGradient) {
                            particle._currentLimitVelocity1 = particle._currentLimitVelocity2;
                            particle._currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
                            particle._currentLimitVelocityGradient = <FactorGradient>currentGradient;
                        }

                        const limitVelocity = Lerp(particle._currentLimitVelocity1, particle._currentLimitVelocity2, scale);
                        const currentVelocity = particle.direction.length();

                        if (currentVelocity > limitVelocity) {
                            particle.direction.scaleInPlace(this.limitVelocityDamping);
                        }
                    });
                }

                /// Drag
                if (this._dragGradients && this._dragGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._dragGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentDragGradient) {
                            particle._currentDrag1 = particle._currentDrag2;
                            particle._currentDrag2 = (<FactorGradient>nextGradient).getFactor();
                            particle._currentDragGradient = <FactorGradient>currentGradient;
                        }

                        const drag = Lerp(particle._currentDrag1, particle._currentDrag2, scale);

                        this._scaledDirection.scaleInPlace(1.0 - drag);
                    });
                }

                if (this.isLocal && particle._localPosition) {
                    particle._localPosition!.addInPlace(this._scaledDirection);
                    Vector3.TransformCoordinatesToRef(particle._localPosition!, this._emitterWorldMatrix, particle.position);
                } else {
                    particle.position.addInPlace(this._scaledDirection);
                }

                // Noise
                if (noiseTextureData && noiseTextureSize && particle._randomNoiseCoordinates1) {
                    const fetchedColorR = this._fetchR(
                        particle._randomNoiseCoordinates1.x,
                        particle._randomNoiseCoordinates1.y,
                        noiseTextureSize.width,
                        noiseTextureSize.height,
                        noiseTextureData
                    );
                    const fetchedColorG = this._fetchR(
                        particle._randomNoiseCoordinates1.z,
                        particle._randomNoiseCoordinates2.x,
                        noiseTextureSize.width,
                        noiseTextureSize.height,
                        noiseTextureData
                    );
                    const fetchedColorB = this._fetchR(
                        particle._randomNoiseCoordinates2.y,
                        particle._randomNoiseCoordinates2.z,
                        noiseTextureSize.width,
                        noiseTextureSize.height,
                        noiseTextureData
                    );

                    const force = TmpVectors.Vector3[0];
                    const scaledForce = TmpVectors.Vector3[1];

                    force.copyFromFloats(
                        (2 * fetchedColorR - 1) * this.noiseStrength.x,
                        (2 * fetchedColorG - 1) * this.noiseStrength.y,
                        (2 * fetchedColorB - 1) * this.noiseStrength.z
                    );

                    force.scaleToRef(scaledUpdateSpeed, scaledForce);
                    particle.direction.addInPlace(scaledForce);
                }

                // Gravity
                this.gravity.scaleToRef(scaledUpdateSpeed, this._scaledGravity);
                particle.direction.addInPlace(this._scaledGravity);

                // Size
                if (this._sizeGradients && this._sizeGradients.length > 0) {
                    GradientHelper.GetCurrentGradient(ratio, this._sizeGradients, (currentGradient, nextGradient, scale) => {
                        if (currentGradient !== particle._currentSizeGradient) {
                            particle._currentSize1 = particle._currentSize2;
                            particle._currentSize2 = (<FactorGradient>nextGradient).getFactor();
                            particle._currentSizeGradient = <FactorGradient>currentGradient;
                        }
                        particle.size = Lerp(particle._currentSize1, particle._currentSize2, scale);
                    });
                }

                // Remap data
                if (this._useRampGradients) {
                    if (this._colorRemapGradients && this._colorRemapGradients.length > 0) {
                        GradientHelper.GetCurrentGradient(ratio, this._colorRemapGradients, (currentGradient, nextGradient, scale) => {
                            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
                            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

                            particle.remapData.x = min;
                            particle.remapData.y = max - min;
                        });
                    }

                    if (this._alphaRemapGradients && this._alphaRemapGradients.length > 0) {
                        GradientHelper.GetCurrentGradient(ratio, this._alphaRemapGradients, (currentGradient, nextGradient, scale) => {
                            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
                            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

                            particle.remapData.z = min;
                            particle.remapData.w = max - min;
                        });
                    }
                }

                if (this._isAnimationSheetEnabled) {
                    particle.updateCellIndex();
                }

                // Update the position of the attached sub-emitters to match their attached particle
                particle._inheritParticleInfoToSubEmitters();

                if (particle.age >= particle.lifeTime) {
                    // Recycle by swapping with last particle
                    this._emitFromParticle(particle);
                    if (particle._attachedSubEmitters) {
                        for (const subEmitter of particle._attachedSubEmitters) {
                            subEmitter.particleSystem.disposeOnStop = true;
                            subEmitter.particleSystem.stop();
                        }
                        particle._attachedSubEmitters = null;
                    }
                    this.recycleParticle(particle);
                    if (sameParticleArray) {
                        index--;
                    }
                    continue;
                }
            }
        };
    }

    /** @internal */
    public _emitFromParticle: (particle: Particle) => void = (particle) => {
        // Do nothing
    };

    serialize(serializeTexture: boolean) {
        throw new Error("Method not implemented.");
    }

    /**
     * Clones the particle system.
     * @param name The name of the cloned object
     * @param newEmitter The new emitter to use
     * @param cloneTexture Also clone the textures if true
     */
    public clone(name: string, newEmitter: any, cloneTexture = false): ThinParticleSystem {
        throw new Error("Method not implemented.");
    }

    private _addFactorGradient(factorGradients: FactorGradient[], gradient: number, factor: number, factor2?: number) {
        const newGradient = new FactorGradient(gradient, factor, factor2);
        factorGradients.push(newGradient);

        factorGradients.sort((a, b) => {
            if (a.gradient < b.gradient) {
                return -1;
            } else if (a.gradient > b.gradient) {
                return 1;
            }

            return 0;
        });
    }

    private _removeFactorGradient(factorGradients: Nullable<FactorGradient[]>, gradient: number) {
        if (!factorGradients) {
            return;
        }

        let index = 0;
        for (const factorGradient of factorGradients) {
            if (factorGradient.gradient === gradient) {
                factorGradients.splice(index, 1);
                break;
            }
            index++;
        }
    }

    /**
     * Adds a new life time gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the life time factor to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addLifeTimeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._lifeTimeGradients) {
            this._lifeTimeGradients = [];
        }

        this._addFactorGradient(this._lifeTimeGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific life time gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeLifeTimeGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._lifeTimeGradients, gradient);

        return this;
    }

    /**
     * Adds a new size gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the size factor to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addSizeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._sizeGradients) {
            this._sizeGradients = [];
        }

        this._addFactorGradient(this._sizeGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific size gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeSizeGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._sizeGradients, gradient);

        return this;
    }

    /**
     * Adds a new color remap gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param min defines the color remap minimal range
     * @param max defines the color remap maximal range
     * @returns the current particle system
     */
    public addColorRemapGradient(gradient: number, min: number, max: number): IParticleSystem {
        if (!this._colorRemapGradients) {
            this._colorRemapGradients = [];
        }

        this._addFactorGradient(this._colorRemapGradients, gradient, min, max);

        return this;
    }

    /**
     * Remove a specific color remap gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeColorRemapGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._colorRemapGradients, gradient);

        return this;
    }

    /**
     * Adds a new alpha remap gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param min defines the alpha remap minimal range
     * @param max defines the alpha remap maximal range
     * @returns the current particle system
     */
    public addAlphaRemapGradient(gradient: number, min: number, max: number): IParticleSystem {
        if (!this._alphaRemapGradients) {
            this._alphaRemapGradients = [];
        }

        this._addFactorGradient(this._alphaRemapGradients, gradient, min, max);

        return this;
    }

    /**
     * Remove a specific alpha remap gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeAlphaRemapGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._alphaRemapGradients, gradient);

        return this;
    }

    /**
     * Adds a new angular speed gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the angular speed  to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addAngularSpeedGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._angularSpeedGradients) {
            this._angularSpeedGradients = [];
        }

        this._addFactorGradient(this._angularSpeedGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific angular speed gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeAngularSpeedGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._angularSpeedGradients, gradient);

        return this;
    }

    /**
     * Adds a new velocity gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the velocity to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addVelocityGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._velocityGradients) {
            this._velocityGradients = [];
        }

        this._addFactorGradient(this._velocityGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific velocity gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeVelocityGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._velocityGradients, gradient);

        return this;
    }

    /**
     * Adds a new limit velocity gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the limit velocity value to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addLimitVelocityGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._limitVelocityGradients) {
            this._limitVelocityGradients = [];
        }

        this._addFactorGradient(this._limitVelocityGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific limit velocity gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeLimitVelocityGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._limitVelocityGradients, gradient);

        return this;
    }

    /**
     * Adds a new drag gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the drag value to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addDragGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._dragGradients) {
            this._dragGradients = [];
        }

        this._addFactorGradient(this._dragGradients, gradient, factor, factor2);

        return this;
    }

    /**
     * Remove a specific drag gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeDragGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._dragGradients, gradient);

        return this;
    }

    /**
     * Adds a new emit rate gradient (please note that this will only work if you set the targetStopDuration property)
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the emit rate value to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addEmitRateGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._emitRateGradients) {
            this._emitRateGradients = [];
        }

        this._addFactorGradient(this._emitRateGradients, gradient, factor, factor2);
        return this;
    }

    /**
     * Remove a specific emit rate gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeEmitRateGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._emitRateGradients, gradient);

        return this;
    }

    /**
     * Adds a new start size gradient (please note that this will only work if you set the targetStopDuration property)
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the start size value to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    public addStartSizeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem {
        if (!this._startSizeGradients) {
            this._startSizeGradients = [];
        }

        this._addFactorGradient(this._startSizeGradients, gradient, factor, factor2);
        return this;
    }

    /**
     * Remove a specific start size gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeStartSizeGradient(gradient: number): IParticleSystem {
        this._removeFactorGradient(this._startSizeGradients, gradient);

        return this;
    }

    private _createRampGradientTexture() {
        if (!this._rampGradients || !this._rampGradients.length || this._rampGradientsTexture || !this._scene) {
            return;
        }

        const data = new Uint8Array(this._rawTextureWidth * 4);
        const tmpColor = TmpColors.Color3[0];

        for (let x = 0; x < this._rawTextureWidth; x++) {
            const ratio = x / this._rawTextureWidth;

            GradientHelper.GetCurrentGradient(ratio, this._rampGradients, (currentGradient, nextGradient, scale) => {
                Color3.LerpToRef((<Color3Gradient>currentGradient).color, (<Color3Gradient>nextGradient).color, scale, tmpColor);
                data[x * 4] = tmpColor.r * 255;
                data[x * 4 + 1] = tmpColor.g * 255;
                data[x * 4 + 2] = tmpColor.b * 255;
                data[x * 4 + 3] = 255;
            });
        }

        this._rampGradientsTexture = RawTexture.CreateRGBATexture(data, this._rawTextureWidth, 1, this._scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
    }

    /**
     * Gets the current list of ramp gradients.
     * You must use addRampGradient and removeRampGradient to update this list
     * @returns the list of ramp gradients
     */
    public getRampGradients(): Nullable<Array<Color3Gradient>> {
        return this._rampGradients;
    }

    /** Force the system to rebuild all gradients that need to be resync */
    public forceRefreshGradients() {
        this._syncRampGradientTexture();
    }

    private _syncRampGradientTexture() {
        if (!this._rampGradients) {
            return;
        }

        this._rampGradients.sort((a, b) => {
            if (a.gradient < b.gradient) {
                return -1;
            } else if (a.gradient > b.gradient) {
                return 1;
            }

            return 0;
        });

        if (this._rampGradientsTexture) {
            this._rampGradientsTexture.dispose();
            this._rampGradientsTexture = null;
        }

        this._createRampGradientTexture();
    }

    /**
     * Adds a new ramp gradient used to remap particle colors
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param color defines the color to affect to the specified gradient
     * @returns the current particle system
     */
    public addRampGradient(gradient: number, color: Color3): ThinParticleSystem {
        if (!this._rampGradients) {
            this._rampGradients = [];
        }

        const rampGradient = new Color3Gradient(gradient, color);
        this._rampGradients.push(rampGradient);

        this._syncRampGradientTexture();

        return this;
    }

    /**
     * Remove a specific ramp gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    public removeRampGradient(gradient: number): ThinParticleSystem {
        this._removeGradientAndTexture(gradient, this._rampGradients, this._rampGradientsTexture);
        this._rampGradientsTexture = null;

        if (this._rampGradients && this._rampGradients.length > 0) {
            this._createRampGradientTexture();
        }

        return this;
    }

    /**
     * Adds a new color gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param color1 defines the color to affect to the specified gradient
     * @param color2 defines an additional color used to define a range ([color, color2]) with main color to pick the final color from
     * @returns this particle system
     */
    public addColorGradient(gradient: number, color1: Color4, color2?: Color4): IParticleSystem {
        if (!this._colorGradients) {
            this._colorGradients = [];
        }

        const colorGradient = new ColorGradient(gradient, color1, color2);
        this._colorGradients.push(colorGradient);

        this._colorGradients.sort((a, b) => {
            if (a.gradient < b.gradient) {
                return -1;
            } else if (a.gradient > b.gradient) {
                return 1;
            }

            return 0;
        });

        return this;
    }

    /**
     * Remove a specific color gradient
     * @param gradient defines the gradient to remove
     * @returns this particle system
     */
    public removeColorGradient(gradient: number): IParticleSystem {
        if (!this._colorGradients) {
            return this;
        }

        let index = 0;
        for (const colorGradient of this._colorGradients) {
            if (colorGradient.gradient === gradient) {
                this._colorGradients.splice(index, 1);
                break;
            }
            index++;
        }

        return this;
    }

    /**
     * Resets the draw wrappers cache
     */
    public resetDrawCache(): void {
        for (const drawWrappers of this._drawWrappers) {
            if (drawWrappers) {
                for (const drawWrapper of drawWrappers) {
                    drawWrapper?.dispose();
                }
            }
        }

        this._drawWrappers = [];
    }

    private _fetchR(u: number, v: number, width: number, height: number, pixels: Uint8Array): number {
        u = Math.abs(u) * 0.5 + 0.5;
        v = Math.abs(v) * 0.5 + 0.5;

        const wrappedU = (u * width) % width | 0;
        const wrappedV = (v * height) % height | 0;

        const position = (wrappedU + wrappedV * width) * 4;
        return pixels[position] / 255;
    }

    protected override _reset() {
        this._resetEffect();
    }

    private _resetEffect() {
        if (this._vertexBuffer) {
            this._vertexBuffer.dispose();
            this._vertexBuffer = null;
        }

        if (this._spriteBuffer) {
            this._spriteBuffer.dispose();
            this._spriteBuffer = null;
        }

        if (this._vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }

        this._createVertexBuffers();
    }

    private _createVertexBuffers() {
        this._vertexBufferSize = this._useInstancing ? 10 : 12;
        if (this._isAnimationSheetEnabled) {
            this._vertexBufferSize += 1;
        }

        if (
            !this._isBillboardBased ||
            this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED ||
            this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL
        ) {
            this._vertexBufferSize += 3;
        }

        if (this._useRampGradients) {
            this._vertexBufferSize += 4;
        }

        const engine = this._engine;
        const vertexSize = this._vertexBufferSize * (this._useInstancing ? 1 : 4);
        this._vertexData = new Float32Array(this._capacity * vertexSize);
        this._vertexBuffer = new Buffer(engine, this._vertexData, true, vertexSize);

        let dataOffset = 0;
        const positions = this._vertexBuffer.createVertexBuffer(VertexBuffer.PositionKind, dataOffset, 3, this._vertexBufferSize, this._useInstancing);
        this._vertexBuffers[VertexBuffer.PositionKind] = positions;
        dataOffset += 3;

        const colors = this._vertexBuffer.createVertexBuffer(VertexBuffer.ColorKind, dataOffset, 4, this._vertexBufferSize, this._useInstancing);
        this._vertexBuffers[VertexBuffer.ColorKind] = colors;
        dataOffset += 4;

        const options = this._vertexBuffer.createVertexBuffer("angle", dataOffset, 1, this._vertexBufferSize, this._useInstancing);
        this._vertexBuffers["angle"] = options;
        dataOffset += 1;

        const size = this._vertexBuffer.createVertexBuffer("size", dataOffset, 2, this._vertexBufferSize, this._useInstancing);
        this._vertexBuffers["size"] = size;
        dataOffset += 2;

        if (this._isAnimationSheetEnabled) {
            const cellIndexBuffer = this._vertexBuffer.createVertexBuffer("cellIndex", dataOffset, 1, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers["cellIndex"] = cellIndexBuffer;
            dataOffset += 1;
        }

        if (
            !this._isBillboardBased ||
            this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED ||
            this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL
        ) {
            const directionBuffer = this._vertexBuffer.createVertexBuffer("direction", dataOffset, 3, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers["direction"] = directionBuffer;
            dataOffset += 3;
        }

        if (this._useRampGradients) {
            const rampDataBuffer = this._vertexBuffer.createVertexBuffer("remapData", dataOffset, 4, this._vertexBufferSize, this._useInstancing);
            this._vertexBuffers["remapData"] = rampDataBuffer;
            dataOffset += 4;
        }

        let offsets: VertexBuffer;
        if (this._useInstancing) {
            const spriteData = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
            this._spriteBuffer = new Buffer(engine, spriteData, false, 2);
            offsets = this._spriteBuffer.createVertexBuffer("offset", 0, 2);
        } else {
            offsets = this._vertexBuffer.createVertexBuffer("offset", dataOffset, 2, this._vertexBufferSize, this._useInstancing);
            dataOffset += 2;
        }
        this._vertexBuffers["offset"] = offsets;

        this.resetDrawCache();
    }

    private _createIndexBuffer() {
        if (this._useInstancing) {
            this._linesIndexBufferUseInstancing = this._engine.createIndexBuffer(new Uint32Array([0, 1, 1, 3, 3, 2, 2, 0, 0, 3]));
            return;
        }
        const indices = [];
        const indicesWireframe = [];
        let index = 0;
        for (let count = 0; count < this._capacity; count++) {
            indices.push(index);
            indices.push(index + 1);
            indices.push(index + 2);
            indices.push(index);
            indices.push(index + 2);
            indices.push(index + 3);
            indicesWireframe.push(index, index + 1, index + 1, index + 2, index + 2, index + 3, index + 3, index, index, index + 3);
            index += 4;
        }

        this._indexBuffer = this._engine.createIndexBuffer(indices);
        this._linesIndexBuffer = this._engine.createIndexBuffer(indicesWireframe);
    }

    /**
     * Gets the maximum number of particles active at the same time.
     * @returns The max number of active particles.
     */
    public getCapacity(): number {
        return this._capacity;
    }

    /**
     * Gets whether there are still active particles in the system.
     * @returns True if it is alive, otherwise false.
     */
    public isAlive(): boolean {
        return this._alive;
    }

    /**
     * Gets if the system has been started. (Note: this will still be true after stop is called)
     * @returns True if it has been started, otherwise false.
     */
    public isStarted(): boolean {
        return this._started;
    }

    /** @internal */
    public _preStart() {
        // Do nothing
    }

    /**
     * Starts the particle system and begins to emit
     * @param delay defines the delay in milliseconds before starting the system (this.startDelay by default)
     */
    public start(delay = this.startDelay): void {
        if (!this.targetStopDuration && this._hasTargetStopDurationDependantGradient()) {
            // eslint-disable-next-line no-throw-literal
            throw "Particle system started with a targetStopDuration dependant gradient (eg. startSizeGradients) but no targetStopDuration set";
        }
        if (delay) {
            setTimeout(() => {
                this.start(0);
            }, delay);
            return;
        }
        this._started = true;
        this._stopped = false;
        this._actualFrame = 0;

        this._preStart();

        // Reset emit gradient so it acts the same on every start
        if (this._emitRateGradients) {
            if (this._emitRateGradients.length > 0) {
                this._currentEmitRateGradient = this._emitRateGradients[0];
                this._currentEmitRate1 = this._currentEmitRateGradient.getFactor();
                this._currentEmitRate2 = this._currentEmitRate1;
            }
            if (this._emitRateGradients.length > 1) {
                this._currentEmitRate2 = this._emitRateGradients[1].getFactor();
            }
        }
        // Reset start size gradient so it acts the same on every start
        if (this._startSizeGradients) {
            if (this._startSizeGradients.length > 0) {
                this._currentStartSizeGradient = this._startSizeGradients[0];
                this._currentStartSize1 = this._currentStartSizeGradient.getFactor();
                this._currentStartSize2 = this._currentStartSize1;
            }
            if (this._startSizeGradients.length > 1) {
                this._currentStartSize2 = this._startSizeGradients[1].getFactor();
            }
        }

        if (this.preWarmCycles) {
            if (this.emitter?.getClassName().indexOf("Mesh") !== -1) {
                (this.emitter as any).computeWorldMatrix(true);
            }

            const noiseTextureAsProcedural = this.noiseTexture as ProceduralTexture;

            if (noiseTextureAsProcedural && noiseTextureAsProcedural.onGeneratedObservable) {
                noiseTextureAsProcedural.onGeneratedObservable.addOnce(() => {
                    setTimeout(() => {
                        for (let index = 0; index < this.preWarmCycles; index++) {
                            this.animate(true);
                            noiseTextureAsProcedural.render();
                        }
                    });
                });
            } else {
                for (let index = 0; index < this.preWarmCycles; index++) {
                    this.animate(true);
                }
            }
        }

        // Animations
        if (this.beginAnimationOnStart && this.animations && this.animations.length > 0 && this._scene) {
            this._scene.beginAnimation(this, this.beginAnimationFrom, this.beginAnimationTo, this.beginAnimationLoop);
        }
    }

    /**
     * Stops the particle system.
     * @param stopSubEmitters if true it will stop the current system and all created sub-Systems if false it will stop the current root system only, this param is used by the root particle system only. The default value is true.
     */
    public stop(stopSubEmitters = true): void {
        if (this._stopped) {
            return;
        }

        this.onStoppedObservable.notifyObservers(this);

        this._stopped = true;

        this._postStop(stopSubEmitters);
    }

    /** @internal */
    public _postStop(stopSubEmitters: boolean) {
        // Do nothing
    }

    // Animation sheet

    /**
     * Remove all active particles
     */
    public reset(): void {
        this._stockParticles.length = 0;
        this._particles.length = 0;
    }

    /**
     * @internal (for internal use only)
     */
    public _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void {
        let offset = index * this._vertexBufferSize;

        this._vertexData[offset++] = particle.position.x + this.worldOffset.x;
        this._vertexData[offset++] = particle.position.y + this.worldOffset.y;
        this._vertexData[offset++] = particle.position.z + this.worldOffset.z;
        this._vertexData[offset++] = particle.color.r;
        this._vertexData[offset++] = particle.color.g;
        this._vertexData[offset++] = particle.color.b;
        this._vertexData[offset++] = particle.color.a;
        this._vertexData[offset++] = particle.angle;

        this._vertexData[offset++] = particle.scale.x * particle.size;
        this._vertexData[offset++] = particle.scale.y * particle.size;

        if (this._isAnimationSheetEnabled) {
            this._vertexData[offset++] = particle.cellIndex;
        }

        if (!this._isBillboardBased) {
            if (particle._initialDirection) {
                let initialDirection = particle._initialDirection;
                if (this.isLocal) {
                    Vector3.TransformNormalToRef(initialDirection, this._emitterWorldMatrix, TmpVectors.Vector3[0]);
                    initialDirection = TmpVectors.Vector3[0];
                }
                if (initialDirection.x === 0 && initialDirection.z === 0) {
                    initialDirection.x = 0.001;
                }

                this._vertexData[offset++] = initialDirection.x;
                this._vertexData[offset++] = initialDirection.y;
                this._vertexData[offset++] = initialDirection.z;
            } else {
                let direction = particle.direction;
                if (this.isLocal) {
                    Vector3.TransformNormalToRef(direction, this._emitterWorldMatrix, TmpVectors.Vector3[0]);
                    direction = TmpVectors.Vector3[0];
                }

                if (direction.x === 0 && direction.z === 0) {
                    direction.x = 0.001;
                }
                this._vertexData[offset++] = direction.x;
                this._vertexData[offset++] = direction.y;
                this._vertexData[offset++] = direction.z;
            }
        } else if (this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED || this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL) {
            this._vertexData[offset++] = particle.direction.x;
            this._vertexData[offset++] = particle.direction.y;
            this._vertexData[offset++] = particle.direction.z;
        }

        if (this._useRampGradients && particle.remapData) {
            this._vertexData[offset++] = particle.remapData.x;
            this._vertexData[offset++] = particle.remapData.y;
            this._vertexData[offset++] = particle.remapData.z;
            this._vertexData[offset++] = particle.remapData.w;
        }

        if (!this._useInstancing) {
            if (this._isAnimationSheetEnabled) {
                if (offsetX === 0) {
                    offsetX = this._epsilon;
                } else if (offsetX === 1) {
                    offsetX = 1 - this._epsilon;
                }

                if (offsetY === 0) {
                    offsetY = this._epsilon;
                } else if (offsetY === 1) {
                    offsetY = 1 - this._epsilon;
                }
            }

            this._vertexData[offset++] = offsetX;
            this._vertexData[offset++] = offsetY;
        }
    }

    // start of sub system methods

    /**
     * "Recycles" one of the particle by copying it back to the "stock" of particles and removing it from the active list.
     * Its lifetime will start back at 0.
     * @param particle
     */
    public recycleParticle: (particle: Particle) => void = (particle) => {
        // move particle from activeParticle list to stock particles
        const lastParticle = <Particle>this._particles.pop();
        if (lastParticle !== particle) {
            lastParticle.copyTo(particle);
        }
        this._stockParticles.push(lastParticle);
    };

    private _createParticle: () => Particle = () => {
        let particle: Particle;
        if (this._stockParticles.length !== 0) {
            particle = <Particle>this._stockParticles.pop();
            particle._reset();
        } else {
            particle = new Particle(this);
        }

        this._prepareParticle(particle);
        return particle;
    };

    /** @internal */
    public _prepareParticle(particle: Particle) {
        //Do nothing
    }

    private _update(newParticles: number): void {
        // Update current
        this._alive = this._particles.length > 0;

        if ((<AbstractMesh>this.emitter).position) {
            const emitterMesh = <AbstractMesh>this.emitter;
            this._emitterWorldMatrix = emitterMesh.getWorldMatrix();
        } else {
            const emitterPosition = <Vector3>this.emitter;
            this._emitterWorldMatrix = Matrix.Translation(emitterPosition.x, emitterPosition.y, emitterPosition.z);
        }

        this._emitterWorldMatrix.invertToRef(this._emitterInverseWorldMatrix);
        this.updateFunction(this._particles);

        // Add new ones
        let particle: Particle;
        for (let index = 0; index < newParticles; index++) {
            if (this._particles.length === this._capacity) {
                break;
            }

            particle = this._createParticle();

            this._particles.push(particle);

            // Life time
            if (this.targetStopDuration && this._lifeTimeGradients && this._lifeTimeGradients.length > 0) {
                const ratio = Clamp(this._actualFrame / this.targetStopDuration);
                GradientHelper.GetCurrentGradient(ratio, this._lifeTimeGradients, (currentGradient, nextGradient) => {
                    const factorGradient1 = <FactorGradient>currentGradient;
                    const factorGradient2 = <FactorGradient>nextGradient;
                    const lifeTime1 = factorGradient1.getFactor();
                    const lifeTime2 = factorGradient2.getFactor();
                    const gradient = (ratio - factorGradient1.gradient) / (factorGradient2.gradient - factorGradient1.gradient);
                    particle.lifeTime = Lerp(lifeTime1, lifeTime2, gradient);
                });
            } else {
                particle.lifeTime = RandomRange(this.minLifeTime, this.maxLifeTime);
            }

            // Emitter
            const emitPower = RandomRange(this.minEmitPower, this.maxEmitPower);

            if (this.startPositionFunction) {
                this.startPositionFunction(this._emitterWorldMatrix, particle.position, particle, this.isLocal);
            } else {
                this.particleEmitterType.startPositionFunction(this._emitterWorldMatrix, particle.position, particle, this.isLocal);
            }

            if (this.isLocal) {
                if (!particle._localPosition) {
                    particle._localPosition = particle.position.clone();
                } else {
                    particle._localPosition.copyFrom(particle.position);
                }
                Vector3.TransformCoordinatesToRef(particle._localPosition!, this._emitterWorldMatrix, particle.position);
            }

            if (this.startDirectionFunction) {
                this.startDirectionFunction(this._emitterWorldMatrix, particle.direction, particle, this.isLocal);
            } else {
                this.particleEmitterType.startDirectionFunction(this._emitterWorldMatrix, particle.direction, particle, this.isLocal, this._emitterInverseWorldMatrix);
            }

            if (emitPower === 0) {
                if (!particle._initialDirection) {
                    particle._initialDirection = particle.direction.clone();
                } else {
                    particle._initialDirection.copyFrom(particle.direction);
                }
            } else {
                particle._initialDirection = null;
            }

            particle.direction.scaleInPlace(emitPower);

            // Size
            if (!this._sizeGradients || this._sizeGradients.length === 0) {
                particle.size = RandomRange(this.minSize, this.maxSize);
            } else {
                particle._currentSizeGradient = this._sizeGradients[0];
                particle._currentSize1 = particle._currentSizeGradient.getFactor();
                particle.size = particle._currentSize1;

                if (this._sizeGradients.length > 1) {
                    particle._currentSize2 = this._sizeGradients[1].getFactor();
                } else {
                    particle._currentSize2 = particle._currentSize1;
                }
            }
            // Size and scale
            particle.scale.copyFromFloats(RandomRange(this.minScaleX, this.maxScaleX), RandomRange(this.minScaleY, this.maxScaleY));

            // Adjust scale by start size
            if (this._startSizeGradients && this._startSizeGradients[0] && this.targetStopDuration) {
                const ratio = this._actualFrame / this.targetStopDuration;
                GradientHelper.GetCurrentGradient(ratio, this._startSizeGradients, (currentGradient, nextGradient, scale) => {
                    if (currentGradient !== this._currentStartSizeGradient) {
                        this._currentStartSize1 = this._currentStartSize2;
                        this._currentStartSize2 = (<FactorGradient>nextGradient).getFactor();
                        this._currentStartSizeGradient = <FactorGradient>currentGradient;
                    }

                    const value = Lerp(this._currentStartSize1, this._currentStartSize2, scale);
                    particle.scale.scaleInPlace(value);
                });
            }

            // Angle
            if (!this._angularSpeedGradients || this._angularSpeedGradients.length === 0) {
                particle.angularSpeed = RandomRange(this.minAngularSpeed, this.maxAngularSpeed);
            } else {
                particle._currentAngularSpeedGradient = this._angularSpeedGradients[0];
                particle.angularSpeed = particle._currentAngularSpeedGradient.getFactor();
                particle._currentAngularSpeed1 = particle.angularSpeed;

                if (this._angularSpeedGradients.length > 1) {
                    particle._currentAngularSpeed2 = this._angularSpeedGradients[1].getFactor();
                } else {
                    particle._currentAngularSpeed2 = particle._currentAngularSpeed1;
                }
            }
            particle.angle = RandomRange(this.minInitialRotation, this.maxInitialRotation);

            // Velocity
            if (this._velocityGradients && this._velocityGradients.length > 0) {
                particle._currentVelocityGradient = this._velocityGradients[0];
                particle._currentVelocity1 = particle._currentVelocityGradient.getFactor();

                if (this._velocityGradients.length > 1) {
                    particle._currentVelocity2 = this._velocityGradients[1].getFactor();
                } else {
                    particle._currentVelocity2 = particle._currentVelocity1;
                }
            }

            // Limit velocity
            if (this._limitVelocityGradients && this._limitVelocityGradients.length > 0) {
                particle._currentLimitVelocityGradient = this._limitVelocityGradients[0];
                particle._currentLimitVelocity1 = particle._currentLimitVelocityGradient.getFactor();

                if (this._limitVelocityGradients.length > 1) {
                    particle._currentLimitVelocity2 = this._limitVelocityGradients[1].getFactor();
                } else {
                    particle._currentLimitVelocity2 = particle._currentLimitVelocity1;
                }
            }

            // Drag
            if (this._dragGradients && this._dragGradients.length > 0) {
                particle._currentDragGradient = this._dragGradients[0];
                particle._currentDrag1 = particle._currentDragGradient.getFactor();

                if (this._dragGradients.length > 1) {
                    particle._currentDrag2 = this._dragGradients[1].getFactor();
                } else {
                    particle._currentDrag2 = particle._currentDrag1;
                }
            }

            // Color
            if (!this._colorGradients || this._colorGradients.length === 0) {
                const step = RandomRange(0, 1.0);

                Color4.LerpToRef(this.color1, this.color2, step, particle.color);

                this.colorDead.subtractToRef(particle.color, this._colorDiff);
                this._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
            } else {
                particle._currentColorGradient = this._colorGradients[0];
                particle._currentColorGradient.getColorToRef(particle.color);
                particle._currentColor1.copyFrom(particle.color);

                if (this._colorGradients.length > 1) {
                    this._colorGradients[1].getColorToRef(particle._currentColor2);
                } else {
                    particle._currentColor2.copyFrom(particle.color);
                }
            }

            // Sheet
            if (this._isAnimationSheetEnabled) {
                particle._initialStartSpriteCellID = this.startSpriteCellID;
                particle._initialEndSpriteCellID = this.endSpriteCellID;
                particle._initialSpriteCellLoop = this.spriteCellLoop;
            }

            // Inherited Velocity
            particle.direction.addInPlace(this._inheritedVelocityOffset);

            // Ramp
            if (this._useRampGradients) {
                particle.remapData = new Vector4(0, 1, 0, 1);
            }

            // Noise texture coordinates
            if (this.noiseTexture) {
                if (particle._randomNoiseCoordinates1) {
                    particle._randomNoiseCoordinates1.copyFromFloats(Math.random(), Math.random(), Math.random());
                    particle._randomNoiseCoordinates2.copyFromFloats(Math.random(), Math.random(), Math.random());
                } else {
                    particle._randomNoiseCoordinates1 = new Vector3(Math.random(), Math.random(), Math.random());
                    particle._randomNoiseCoordinates2 = new Vector3(Math.random(), Math.random(), Math.random());
                }
            }

            // Update the position of the attached sub-emitters to match their attached particle
            particle._inheritParticleInfoToSubEmitters();
        }
    }

    /**
     * @internal
     */
    public static _GetAttributeNamesOrOptions(isAnimationSheetEnabled = false, isBillboardBased = false, useRampGradients = false): string[] {
        const attributeNamesOrOptions = [VertexBuffer.PositionKind, VertexBuffer.ColorKind, "angle", "offset", "size"];

        if (isAnimationSheetEnabled) {
            attributeNamesOrOptions.push("cellIndex");
        }

        if (!isBillboardBased) {
            attributeNamesOrOptions.push("direction");
        }

        if (useRampGradients) {
            attributeNamesOrOptions.push("remapData");
        }

        return attributeNamesOrOptions;
    }

    /**
     * @internal
     */
    public static _GetEffectCreationOptions(isAnimationSheetEnabled = false, useLogarithmicDepth = false, applyFog = false): string[] {
        const effectCreationOption = ["invView", "view", "projection", "textureMask", "translationPivot", "eyePosition"];

        addClipPlaneUniforms(effectCreationOption);

        if (isAnimationSheetEnabled) {
            effectCreationOption.push("particlesInfos");
        }
        if (useLogarithmicDepth) {
            effectCreationOption.push("logarithmicDepthConstant");
        }

        if (applyFog) {
            effectCreationOption.push("vFogInfos");
            effectCreationOption.push("vFogColor");
        }

        return effectCreationOption;
    }

    /**
     * Fill the defines array according to the current settings of the particle system
     * @param defines Array to be updated
     * @param blendMode blend mode to take into account when updating the array
     * @param fillImageProcessing fills the image processing defines
     */
    public fillDefines(defines: Array<string>, blendMode: number, fillImageProcessing: boolean = true): void {
        if (this._scene) {
            prepareStringDefinesForClipPlanes(this, this._scene, defines);
            if (this.applyFog && this._scene.fogEnabled && this._scene.fogMode !== Constants.FOGMODE_NONE) {
                defines.push("#define FOG");
            }
        }

        if (this._isAnimationSheetEnabled) {
            defines.push("#define ANIMATESHEET");
        }

        if (this.useLogarithmicDepth) {
            defines.push("#define LOGARITHMICDEPTH");
        }

        if (blendMode === BaseParticleSystem.BLENDMODE_MULTIPLY) {
            defines.push("#define BLENDMULTIPLYMODE");
        }

        if (this._useRampGradients) {
            defines.push("#define RAMPGRADIENT");
        }

        if (this._isBillboardBased) {
            defines.push("#define BILLBOARD");

            switch (this.billboardMode) {
                case Constants.PARTICLES_BILLBOARDMODE_Y:
                    defines.push("#define BILLBOARDY");
                    break;
                case Constants.PARTICLES_BILLBOARDMODE_STRETCHED:
                case Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL:
                    defines.push("#define BILLBOARDSTRETCHED");
                    if (this.billboardMode === Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL) {
                        defines.push("#define BILLBOARDSTRETCHED_LOCAL");
                    }
                    break;
                case Constants.PARTICLES_BILLBOARDMODE_ALL:
                    defines.push("#define BILLBOARDMODE_ALL");
                    break;
                default:
                    break;
            }
        }

        if (fillImageProcessing && this._imageProcessingConfiguration) {
            this._imageProcessingConfiguration.prepareDefines(this._imageProcessingConfigurationDefines);
            defines.push(this._imageProcessingConfigurationDefines.toString());
        }
    }

    /**
     * Fill the uniforms, attributes and samplers arrays according to the current settings of the particle system
     * @param uniforms Uniforms array to fill
     * @param attributes Attributes array to fill
     * @param samplers Samplers array to fill
     */
    public fillUniformsAttributesAndSamplerNames(uniforms: Array<string>, attributes: Array<string>, samplers: Array<string>) {
        attributes.push(
            ...ThinParticleSystem._GetAttributeNamesOrOptions(
                this._isAnimationSheetEnabled,
                this._isBillboardBased &&
                    this.billboardMode !== Constants.PARTICLES_BILLBOARDMODE_STRETCHED &&
                    this.billboardMode !== Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL,
                this._useRampGradients
            )
        );

        uniforms.push(...ThinParticleSystem._GetEffectCreationOptions(this._isAnimationSheetEnabled, this.useLogarithmicDepth, this.applyFog));

        samplers.push("diffuseSampler", "rampSampler");

        if (this._imageProcessingConfiguration) {
            PrepareUniformsForImageProcessing(uniforms, this._imageProcessingConfigurationDefines);
            PrepareSamplersForImageProcessing(samplers, this._imageProcessingConfigurationDefines);
        }
    }

    /**
     * @internal
     */
    private _getWrapper(blendMode: number): DrawWrapper {
        const customWrapper = this._getCustomDrawWrapper(blendMode);

        if (customWrapper?.effect) {
            return customWrapper;
        }

        const defines: Array<string> = [];

        this.fillDefines(defines, blendMode);

        // Effect
        const currentRenderPassId = this._engine._features.supportRenderPasses ? this._engine.currentRenderPassId : Constants.RENDERPASS_MAIN;
        let drawWrappers = this._drawWrappers[currentRenderPassId];
        if (!drawWrappers) {
            drawWrappers = this._drawWrappers[currentRenderPassId] = [];
        }
        let drawWrapper = drawWrappers[blendMode];
        if (!drawWrapper) {
            drawWrapper = new DrawWrapper(this._engine);
            if (drawWrapper.drawContext) {
                drawWrapper.drawContext.useInstancing = this._useInstancing;
            }
            drawWrappers[blendMode] = drawWrapper;
        }

        const join = defines.join("\n");
        if (drawWrapper.defines !== join) {
            const attributesNamesOrOptions: Array<string> = [];
            const effectCreationOption: Array<string> = [];
            const samplers: Array<string> = [];

            this.fillUniformsAttributesAndSamplerNames(effectCreationOption, attributesNamesOrOptions, samplers);

            drawWrapper.setEffect(
                this._engine.createEffect(
                    "particles",
                    attributesNamesOrOptions,
                    effectCreationOption,
                    samplers,
                    join,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    this._shaderLanguage
                ),
                join
            );
        }

        return drawWrapper;
    }

    /**
     * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
     * @param preWarmOnly will prevent the system from updating the vertex buffer (default is false)
     */
    public animate(preWarmOnly = false): void {
        if (!this._started) {
            return;
        }

        if (!preWarmOnly && this._scene) {
            // Check
            if (!this.isReady()) {
                return;
            }

            if (this._currentRenderId === this._scene.getFrameId()) {
                return;
            }
            this._currentRenderId = this._scene.getFrameId();
        }

        this._scaledUpdateSpeed = this.updateSpeed * (preWarmOnly ? this.preWarmStepOffset : this._scene?.getAnimationRatio() || 1);

        // Determine the number of particles we need to create
        let newParticles;

        if (this.manualEmitCount > -1) {
            newParticles = this.manualEmitCount;
            this._newPartsExcess = 0;
            this.manualEmitCount = 0;
        } else {
            let rate = this.emitRate;

            if (this._emitRateGradients && this._emitRateGradients.length > 0 && this.targetStopDuration) {
                const ratio = this._actualFrame / this.targetStopDuration;
                GradientHelper.GetCurrentGradient(ratio, this._emitRateGradients, (currentGradient, nextGradient, scale) => {
                    if (currentGradient !== this._currentEmitRateGradient) {
                        this._currentEmitRate1 = this._currentEmitRate2;
                        this._currentEmitRate2 = (<FactorGradient>nextGradient).getFactor();
                        this._currentEmitRateGradient = <FactorGradient>currentGradient;
                    }

                    rate = Lerp(this._currentEmitRate1, this._currentEmitRate2, scale);
                });
            }

            newParticles = (rate * this._scaledUpdateSpeed) >> 0;
            this._newPartsExcess += rate * this._scaledUpdateSpeed - newParticles;
        }

        if (this._newPartsExcess > 1.0) {
            newParticles += this._newPartsExcess >> 0;
            this._newPartsExcess -= this._newPartsExcess >> 0;
        }

        this._alive = false;

        if (!this._stopped) {
            this._actualFrame += this._scaledUpdateSpeed;

            if (this.targetStopDuration && this._actualFrame >= this.targetStopDuration) {
                this.stop();
            }
        } else {
            newParticles = 0;
        }
        this._update(newParticles);

        // Stopped?
        if (this._stopped) {
            if (!this._alive) {
                this._started = false;
                if (this.onAnimationEnd) {
                    this.onAnimationEnd();
                }
                if (this.disposeOnStop && this._scene) {
                    this._scene._toBeDisposed.push(this);
                }
            }
        }

        if (!preWarmOnly) {
            // Update VBO
            let offset = 0;
            for (let index = 0; index < this._particles.length; index++) {
                const particle = this._particles[index];
                this._appendParticleVertices(offset, particle);
                offset += this._useInstancing ? 1 : 4;
            }

            if (this._vertexBuffer) {
                this._vertexBuffer.updateDirectly(this._vertexData, 0, this._particles.length);
            }
        }

        if (this.manualEmitCount === 0 && this.disposeOnStop) {
            this.stop();
        }
    }

    private _appendParticleVertices(offset: number, particle: Particle) {
        this._appendParticleVertex(offset++, particle, 0, 0);
        if (!this._useInstancing) {
            this._appendParticleVertex(offset++, particle, 1, 0);
            this._appendParticleVertex(offset++, particle, 1, 1);
            this._appendParticleVertex(offset++, particle, 0, 1);
        }
    }

    /**
     * Rebuilds the particle system.
     */
    public rebuild(): void {
        if (this._engine.getCaps().vertexArrayObject) {
            this._vertexArrayObject = null;
        }

        this._createIndexBuffer();

        this._spriteBuffer?._rebuild();

        this._createVertexBuffers();

        this.resetDrawCache();
    }

    private _shadersLoaded = false;
    private async _initShaderSourceAsync() {
        const engine = this._engine;

        if (engine.isWebGPU && !ThinParticleSystem.ForceGLSL) {
            this._shaderLanguage = ShaderLanguage.WGSL;

            await Promise.all([import("../ShadersWGSL/particles.vertex"), import("../ShadersWGSL/particles.fragment")]);
        } else {
            await Promise.all([import("../Shaders/particles.vertex"), import("../Shaders/particles.fragment")]);
        }

        this._shadersLoaded = true;
    }

    /**
     * Is this system ready to be used/rendered
     * @returns true if the system is ready
     */
    public isReady(): boolean {
        if (!this._shadersLoaded) {
            return false;
        }
        if (!this.emitter || (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.isReady()) || !this.particleTexture || !this.particleTexture.isReady()) {
            return false;
        }

        if (this.blendMode !== BaseParticleSystem.BLENDMODE_MULTIPLYADD) {
            if (!this._getWrapper(this.blendMode).effect!.isReady()) {
                return false;
            }
        } else {
            if (!this._getWrapper(BaseParticleSystem.BLENDMODE_MULTIPLY).effect!.isReady()) {
                return false;
            }
            if (!this._getWrapper(BaseParticleSystem.BLENDMODE_ADD).effect!.isReady()) {
                return false;
            }
        }

        return true;
    }

    private _render(blendMode: number) {
        const drawWrapper = this._getWrapper(blendMode);
        const effect = drawWrapper.effect!;

        const engine = this._engine;

        // Render
        engine.enableEffect(drawWrapper);

        const viewMatrix = this.defaultViewMatrix ?? this._scene!.getViewMatrix();
        effect.setTexture("diffuseSampler", this.particleTexture);
        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", this.defaultProjectionMatrix ?? this._scene!.getProjectionMatrix());

        if (this._isAnimationSheetEnabled && this.particleTexture) {
            const baseSize = this.particleTexture.getBaseSize();
            effect.setFloat3("particlesInfos", this.spriteCellWidth / baseSize.width, this.spriteCellHeight / baseSize.height, this.spriteCellWidth / baseSize.width);
        }

        effect.setVector2("translationPivot", this.translationPivot);
        effect.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a);

        if (this._isBillboardBased && this._scene) {
            const camera = this._scene.activeCamera!;
            effect.setVector3("eyePosition", camera.globalPosition);
        }

        if (this._rampGradientsTexture) {
            if (!this._rampGradients || !this._rampGradients.length) {
                this._rampGradientsTexture.dispose();
                this._rampGradientsTexture = null;
            }
            effect.setTexture("rampSampler", this._rampGradientsTexture);
        }

        const defines = effect.defines;

        if (this._scene) {
            bindClipPlane(effect, this, this._scene);

            if (this.applyFog) {
                BindFogParameters(this._scene, undefined, effect);
            }
        }

        if (defines.indexOf("#define BILLBOARDMODE_ALL") >= 0) {
            viewMatrix.invertToRef(TmpVectors.Matrix[0]);
            effect.setMatrix("invView", TmpVectors.Matrix[0]);
        }

        if (this._vertexArrayObject !== undefined) {
            if (this._scene?.forceWireframe) {
                engine.bindBuffers(this._vertexBuffers, this._linesIndexBufferUseInstancing, effect);
            } else {
                if (!this._vertexArrayObject) {
                    this._vertexArrayObject = (this._engine as ThinEngine).recordVertexArrayObject(this._vertexBuffers, null, effect);
                }

                (this._engine as ThinEngine).bindVertexArrayObject(this._vertexArrayObject, this._scene?.forceWireframe ? this._linesIndexBufferUseInstancing : this._indexBuffer);
            }
        } else {
            if (!this._indexBuffer) {
                // Use instancing mode
                engine.bindBuffers(this._vertexBuffers, this._scene?.forceWireframe ? this._linesIndexBufferUseInstancing : null, effect);
            } else {
                engine.bindBuffers(this._vertexBuffers, this._scene?.forceWireframe ? this._linesIndexBuffer : this._indexBuffer, effect);
            }
        }

        // Log. depth
        if (this.useLogarithmicDepth && this._scene) {
            BindLogDepth(defines, effect, this._scene);
        }

        // image processing
        if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
            this._imageProcessingConfiguration.bind(effect);
        }

        // Draw order
        this._engine.setAlphaMode(this._blendModeParticleToEngineConst(blendMode));

        if (this._onBeforeDrawParticlesObservable) {
            this._onBeforeDrawParticlesObservable.notifyObservers(effect);
        }

        if (this._useInstancing) {
            if (this._scene?.forceWireframe) {
                engine.drawElementsType(Constants.MATERIAL_LineStripDrawMode, 0, 10, this._particles.length);
            } else {
                engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, this._particles.length);
            }
        } else {
            if (this._scene?.forceWireframe) {
                engine.drawElementsType(Constants.MATERIAL_WireFrameFillMode, 0, this._particles.length * 10);
            } else {
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, this._particles.length * 6);
            }
        }

        return this._particles.length;
    }

    /**
     * Renders the particle system in its current state.
     * @returns the current number of particles
     */
    public render(): number {
        // Check
        if (!this.isReady() || !this._particles.length) {
            return 0;
        }

        const engine = this._engine as any;
        if (engine.setState) {
            engine.setState(false);

            if (this.forceDepthWrite) {
                engine.setDepthWrite(true);
            }
        }

        let outparticles = 0;

        if (this.blendMode === BaseParticleSystem.BLENDMODE_MULTIPLYADD) {
            outparticles = this._render(BaseParticleSystem.BLENDMODE_MULTIPLY) + this._render(BaseParticleSystem.BLENDMODE_ADD);
        } else {
            outparticles = this._render(this.blendMode);
        }

        this._engine.unbindInstanceAttributes();
        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);

        return outparticles;
    }

    /** @internal */
    public _onDispose(disposeAttachedSubEmitters = false, disposeEndSubEmitters = false) {
        // Do Nothing
    }

    /**
     * Disposes the particle system and free the associated resources
     * @param disposeTexture defines if the particle texture must be disposed as well (true by default)
     * @param disposeAttachedSubEmitters defines if the attached sub-emitters must be disposed as well (false by default)
     * @param disposeEndSubEmitters defines if the end type sub-emitters must be disposed as well (false by default)
     */
    public dispose(disposeTexture = true, disposeAttachedSubEmitters = false, disposeEndSubEmitters = false): void {
        this.resetDrawCache();

        if (this._vertexBuffer) {
            this._vertexBuffer.dispose();
            this._vertexBuffer = null;
        }

        if (this._spriteBuffer) {
            this._spriteBuffer.dispose();
            this._spriteBuffer = null;
        }

        if (this._indexBuffer) {
            this._engine._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        if (this._linesIndexBuffer) {
            this._engine._releaseBuffer(this._linesIndexBuffer);
            this._linesIndexBuffer = null;
        }

        if (this._linesIndexBufferUseInstancing) {
            this._engine._releaseBuffer(this._linesIndexBufferUseInstancing);
            this._linesIndexBufferUseInstancing = null;
        }

        if (this._vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }

        if (disposeTexture && this.particleTexture) {
            this.particleTexture.dispose();
            this.particleTexture = null;
        }

        if (disposeTexture && this.noiseTexture) {
            this.noiseTexture.dispose();
            this.noiseTexture = null;
        }

        if (this._rampGradientsTexture) {
            this._rampGradientsTexture.dispose();
            this._rampGradientsTexture = null;
        }

        this._onDispose(disposeAttachedSubEmitters, disposeEndSubEmitters);

        if (this._onBeforeDrawParticlesObservable) {
            this._onBeforeDrawParticlesObservable.clear();
        }

        // Remove from scene
        if (this._scene) {
            const index = this._scene.particleSystems.indexOf(this);
            if (index > -1) {
                this._scene.particleSystems.splice(index, 1);
            }

            this._scene._activeParticleSystems.dispose();
        }

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.onStoppedObservable.clear();

        this.reset();
    }
}
