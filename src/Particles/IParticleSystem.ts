import { Nullable } from "../types";
import { Vector2, Vector3, Matrix } from "../Maths/math.vector";
import { Color3, Color4 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { BoxParticleEmitter, IParticleEmitterType, PointParticleEmitter, HemisphericParticleEmitter, SphereParticleEmitter, SphereDirectedParticleEmitter, CylinderParticleEmitter, ConeParticleEmitter } from "../Particles/EmitterTypes/index";
import { Scene } from "../scene";
import { ColorGradient, FactorGradient, Color3Gradient } from "../Misc/gradients";
import { Effect } from "../Materials/effect";
import { Observable } from "../Misc/observable";

declare type Animation = import("../Animations/animation").Animation;

/**
 * Interface representing a particle system in Babylon.js.
 * This groups the common functionalities that needs to be implemented in order to create a particle system.
 * A particle system represents a way to manage particles from their emission to their animation and rendering.
 */
export interface IParticleSystem {
    /**
     * List of animations used by the particle system.
     */
    animations: Animation[];
    /**
     * The id of the Particle system.
     */
    id: string;
    /**
     * The name of the Particle system.
     */
    name: string;
    /**
     * The emitter represents the Mesh or position we are attaching the particle system to.
     */
    emitter: Nullable<AbstractMesh | Vector3>;
    /**
     * Gets or sets a boolean indicating if the particles must be rendered as billboard or aligned with the direction
     */
    isBillboardBased: boolean;
    /**
     * The rendering group used by the Particle system to chose when to render.
     */
    renderingGroupId: number;
    /**
     * The layer mask we are rendering the particles through.
     */
    layerMask: number;

    /**
    * The overall motion speed (0.01 is default update speed, faster updates = faster animation)
    */
    updateSpeed: number;

    /**
     * The amount of time the particle system is running (depends of the overall update speed).
     */
    targetStopDuration: number;

    /**
     * The texture used to render each particle. (this can be a spritesheet)
     */
    particleTexture: Nullable<BaseTexture>;

    /**
     * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE, ParticleSystem.BLENDMODE_STANDARD or ParticleSystem.BLENDMODE_ADD.
     */
    blendMode: number;

    /**
     * Minimum life time of emitting particles.
     */
    minLifeTime: number;
    /**
     * Maximum life time of emitting particles.
     */
    maxLifeTime: number;

    /**
     * Minimum Size of emitting particles.
     */
    minSize: number;
    /**
     * Maximum Size of emitting particles.
     */
    maxSize: number;

    /**
     * Minimum scale of emitting particles on X axis.
     */
    minScaleX: number;
    /**
     * Maximum scale of emitting particles on X axis.
     */
    maxScaleX: number;

    /**
     * Minimum scale of emitting particles on Y axis.
     */
    minScaleY: number;
    /**
     * Maximum scale of emitting particles on Y axis.
     */
    maxScaleY: number;

    /**
     * Random color of each particle after it has been emitted, between color1 and color2 vectors.
     */
    color1: Color4;
    /**
     * Random color of each particle after it has been emitted, between color1 and color2 vectors.
     */
    color2: Color4;

    /**
     * Color the particle will have at the end of its lifetime.
     */
    colorDead: Color4;

    /**
     * The maximum number of particles to emit per frame until we reach the activeParticleCount value
     */
    emitRate: number;

    /**
     * You can use gravity if you want to give an orientation to your particles.
     */
    gravity: Vector3;

    /**
     * Minimum power of emitting particles.
     */
    minEmitPower: number;
    /**
     * Maximum power of emitting particles.
     */
    maxEmitPower: number;
    /**
     * Minimum angular speed of emitting particles (Z-axis rotation for each particle).
     */
    minAngularSpeed: number;
    /**
     * Maximum angular speed of emitting particles (Z-axis rotation for each particle).
     */
    maxAngularSpeed: number;
    /**
     * Gets or sets the minimal initial rotation in radians.
     */
    minInitialRotation: number;
    /**
     * Gets or sets the maximal initial rotation in radians.
     */
    maxInitialRotation: number;
    /**
     * The particle emitter type defines the emitter used by the particle system.
     * It can be for example box, sphere, or cone...
     */
    particleEmitterType: Nullable<IParticleEmitterType>;
    /**
     * Defines the delay in milliseconds before starting the system (0 by default)
     */
    startDelay: number;
    /**
     * Gets or sets a value indicating how many cycles (or frames) must be executed before first rendering (this value has to be set before starting the system). Default is 0
     */
    preWarmCycles: number;
    /**
     * Gets or sets a value indicating the time step multiplier to use in pre-warm mode (default is 1)
     */
    preWarmStepOffset: number;

    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the speed of the sprite loop (default is 1 meaning the animation will play once during the entire particle lifetime)
     */
    spriteCellChangeSpeed: number;
    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the first sprite cell to display
     */
    startSpriteCellID: number;
    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the last sprite cell to display
     */
    endSpriteCellID: number;
    /**
     * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell width to use
     */
    spriteCellWidth: number;
    /**
     * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell height to use
     */
    spriteCellHeight: number;
    /**
     * This allows the system to random pick the start cell ID between startSpriteCellID and endSpriteCellID
     */
    spriteRandomStartCell: boolean;

    /**
     * Gets or sets a boolean indicating if a spritesheet is used to animate the particles texture
     */
    isAnimationSheetEnabled: boolean;

    /** Gets or sets a Vector2 used to move the pivot (by default (0,0)) */
    translationPivot: Vector2;

    /**
     * Gets or sets a texture used to add random noise to particle positions
     */
    noiseTexture: Nullable<BaseTexture>;

    /** Gets or sets the strength to apply to the noise value (default is (10, 10, 10)) */
    noiseStrength: Vector3;

    /**
     * Gets or sets the billboard mode to use when isBillboardBased = true.
     * Value can be: ParticleSystem.BILLBOARDMODE_ALL, ParticleSystem.BILLBOARDMODE_Y, ParticleSystem.BILLBOARDMODE_STRETCHED
     */
    billboardMode: number;

    /** Gets or sets a value indicating the damping to apply if the limit velocity factor is reached */
    limitVelocityDamping: number;

    /**
     * Gets or sets a boolean indicating that hosted animations (in the system.animations array) must be started when system.start() is called
     */
    beginAnimationOnStart: boolean;

    /**
     * Gets or sets the frame to start the animation from when beginAnimationOnStart is true
     */
    beginAnimationFrom: number;

    /**
     * Gets or sets the frame to end the animation on when beginAnimationOnStart is true
     */
    beginAnimationTo: number;

    /**
     * Gets or sets a boolean indicating if animations must loop when beginAnimationOnStart is true
     */
    beginAnimationLoop: boolean;

    /**
     * Specifies whether the particle system will be disposed once it reaches the end of the animation.
     */
    disposeOnStop: boolean;

    /**
     * Specifies if the particles are updated in emitter local space or world space
     */
    isLocal: boolean;

    /** Snippet ID if the particle system was created from the snippet server */
    snippetId: string;

    /** Gets or sets a matrix to use to compute projection */
    defaultProjectionMatrix: Matrix;

    /**
     * Gets the maximum number of particles active at the same time.
     * @returns The max number of active particles.
     */
    getCapacity(): number;

    /**
     * Gets the number of particles active at the same time.
     * @returns The number of active particles.
     */
    getActiveCount(): number;

    /**
     * Gets if the system has been started. (Note: this will still be true after stop is called)
     * @returns True if it has been started, otherwise false.
     */
    isStarted(): boolean;

    /**
     * Animates the particle system for this frame.
     */
    animate(): void;
    /**
     * Renders the particle system in its current state.
     * @returns the current number of particles
     */
    render(): number;
    /**
     * Dispose the particle system and frees its associated resources.
     * @param disposeTexture defines if the particule texture must be disposed as well (true by default)
     */
    dispose(disposeTexture?: boolean): void;
    /**
    * An event triggered when the system is disposed
    */
    onDisposeObservable: Observable<IParticleSystem>;
    /**
     * Clones the particle system.
     * @param name The name of the cloned object
     * @param newEmitter The new emitter to use
     * @returns the cloned particle system
     */
    clone(name: string, newEmitter: any): Nullable<IParticleSystem>;
    /**
     * Serializes the particle system to a JSON object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns the JSON object
     */
    serialize(serializeTexture: boolean): any;
    /**
     * Rebuild the particle system
     */
    rebuild(): void;

    /** Force the system to rebuild all gradients that need to be resync */
    forceRefreshGradients(): void;

    /**
     * Starts the particle system and begins to emit
     * @param delay defines the delay in milliseconds before starting the system (0 by default)
     */
    start(delay?: number): void;

    /**
     * Stops the particle system.
     */
    stop(): void;

    /**
     * Remove all active particles
     */
    reset(): void;

    /**
     * Gets a boolean indicating that the system is stopping
     * @returns true if the system is currently stopping
     */
    isStopping(): boolean;

    /**
     * Is this system ready to be used/rendered
     * @return true if the system is ready
     */
    isReady(): boolean;
    /**
     * Returns the string "ParticleSystem"
     * @returns a string containing the class name
     */
    getClassName(): string;
    /**
     * Gets the custom effect used to render the particles
     * @param blendMode Blend mode for which the effect should be retrieved
     * @returns The effect
     */
    getCustomEffect(blendMode: number): Nullable<Effect>;
    /**
     * Sets the custom effect used to render the particles
     * @param effect The effect to set
     * @param blendMode Blend mode for which the effect should be set
     */
    setCustomEffect(effect: Nullable<Effect>, blendMode: number): void;

    /**
     * Fill the defines array according to the current settings of the particle system
     * @param defines Array to be updated
     * @param blendMode blend mode to take into account when updating the array
     */
    fillDefines(defines: Array<string>, blendMode: number): void;
    /**
     * Fill the uniforms, attributes and samplers arrays according to the current settings of the particle system
     * @param uniforms Uniforms array to fill
     * @param attributes Attributes array to fill
     * @param samplers Samplers array to fill
     */
    fillUniformsAttributesAndSamplerNames(uniforms: Array<string>, attributes: Array<string>, samplers: Array<string>): void;
    /**
     * Observable that will be called just before the particles are drawn
     */
    onBeforeDrawParticlesObservable: Observable<Nullable<Effect>>;
    /**
     * Gets the name of the particle vertex shader
     */
    vertexShaderName: string;

    /**
     * Adds a new color gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param color1 defines the color to affect to the specified gradient
     * @param color2 defines an additional color used to define a range ([color, color2]) with main color to pick the final color from
     * @returns the current particle system
     */
    addColorGradient(gradient: number, color1: Color4, color2?: Color4): IParticleSystem;
    /**
     * Remove a specific color gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeColorGradient(gradient: number): IParticleSystem;
    /**
     * Adds a new size gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the size factor to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addSizeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific size gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeSizeGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of color gradients.
     * You must use addColorGradient and removeColorGradient to udpate this list
     * @returns the list of color gradients
     */
    getColorGradients(): Nullable<Array<ColorGradient>>;
    /**
     * Gets the current list of size gradients.
     * You must use addSizeGradient and removeSizeGradient to udpate this list
     * @returns the list of size gradients
     */
    getSizeGradients(): Nullable<Array<FactorGradient>>;
    /**
     * Gets the current list of angular speed gradients.
     * You must use addAngularSpeedGradient and removeAngularSpeedGradient to udpate this list
     * @returns the list of angular speed gradients
     */
    getAngularSpeedGradients(): Nullable<Array<FactorGradient>>;
    /**
     * Adds a new angular speed gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the angular speed to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addAngularSpeedGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific angular speed gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeAngularSpeedGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of velocity gradients.
     * You must use addVelocityGradient and removeVelocityGradient to udpate this list
     * @returns the list of velocity gradients
     */
    getVelocityGradients(): Nullable<Array<FactorGradient>>;
    /**
     * Adds a new velocity gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the velocity to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addVelocityGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific velocity gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeVelocityGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of limit velocity gradients.
     * You must use addLimitVelocityGradient and removeLimitVelocityGradient to udpate this list
     * @returns the list of limit velocity gradients
     */
    getLimitVelocityGradients(): Nullable<Array<FactorGradient>>;
    /**
     * Adds a new limit velocity gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the limit velocity to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addLimitVelocityGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific limit velocity gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeLimitVelocityGradient(gradient: number): IParticleSystem;
    /**
     * Adds a new drag gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the drag to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addDragGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific drag gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeDragGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of drag gradients.
     * You must use addDragGradient and removeDragGradient to udpate this list
     * @returns the list of drag gradients
     */
    getDragGradients(): Nullable<Array<FactorGradient>>;
    /**
     * Adds a new emit rate gradient (please note that this will only work if you set the targetStopDuration property)
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the emit rate to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addEmitRateGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific emit rate gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeEmitRateGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of emit rate gradients.
     * You must use addEmitRateGradient and removeEmitRateGradient to udpate this list
     * @returns the list of emit rate gradients
     */
    getEmitRateGradients(): Nullable<Array<FactorGradient>>;

    /**
     * Adds a new start size gradient (please note that this will only work if you set the targetStopDuration property)
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the start size to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addStartSizeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific start size gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeStartSizeGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of start size gradients.
     * You must use addStartSizeGradient and removeStartSizeGradient to udpate this list
     * @returns the list of start size gradients
     */
    getStartSizeGradients(): Nullable<Array<FactorGradient>>;

    /**
     * Adds a new life time gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param factor defines the life time factor to affect to the specified gradient
     * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
     * @returns the current particle system
     */
    addLifeTimeGradient(gradient: number, factor: number, factor2?: number): IParticleSystem;
    /**
     * Remove a specific life time gradient
     * @param gradient defines the gradient to remove
     * @returns the current particle system
     */
    removeLifeTimeGradient(gradient: number): IParticleSystem;
    /**
     * Gets the current list of life time gradients.
     * You must use addLifeTimeGradient and removeLifeTimeGradient to udpate this list
     * @returns the list of life time gradients
     */
    getLifeTimeGradients(): Nullable<Array<FactorGradient>>;

    /**
     * Gets the current list of color gradients.
     * You must use addColorGradient and removeColorGradient to udpate this list
     * @returns the list of color gradients
     */
    getColorGradients(): Nullable<Array<ColorGradient>>;

    /**
     * Adds a new ramp gradient used to remap particle colors
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param color defines the color to affect to the specified gradient
     * @returns the current particle system
     */
    addRampGradient(gradient: number, color: Color3): IParticleSystem;
    /**
     * Gets the current list of ramp gradients.
     * You must use addRampGradient and removeRampGradient to udpate this list
     * @returns the list of ramp gradients
     */
    getRampGradients(): Nullable<Array<Color3Gradient>>;

    /** Gets or sets a boolean indicating that ramp gradients must be used
     * @see https://doc.babylonjs.com/babylon101/particles#ramp-gradients
     */
    useRampGradients: boolean;

    /**
     * Adds a new color remap gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param min defines the color remap minimal range
     * @param max defines the color remap maximal range
     * @returns the current particle system
     */
    addColorRemapGradient(gradient: number, min: number, max: number): IParticleSystem;
    /**
     * Gets the current list of color remap gradients.
     * You must use addColorRemapGradient and removeColorRemapGradient to udpate this list
     * @returns the list of color remap gradients
     */
    getColorRemapGradients(): Nullable<Array<FactorGradient>>;

    /**
     * Adds a new alpha remap gradient
     * @param gradient defines the gradient to use (between 0 and 1)
     * @param min defines the alpha remap minimal range
     * @param max defines the alpha remap maximal range
     * @returns the current particle system
     */
    addAlphaRemapGradient(gradient: number, min: number, max: number): IParticleSystem;
    /**
     * Gets the current list of alpha remap gradients.
     * You must use addAlphaRemapGradient and removeAlphaRemapGradient to udpate this list
     * @returns the list of alpha remap gradients
     */
    getAlphaRemapGradients(): Nullable<Array<FactorGradient>>;

    /**
     * Creates a Point Emitter for the particle system (emits directly from the emitter position)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @returns the emitter
     */
    createPointEmitter(direction1: Vector3, direction2: Vector3): PointParticleEmitter;

    /**
     * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
     * @param radius The radius of the hemisphere to emit from
     * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    createHemisphericEmitter(radius: number, radiusRange: number): HemisphericParticleEmitter;

    /**
     * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
     * @param radius The radius of the sphere to emit from
     * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    createSphereEmitter(radius: number, radiusRange: number): SphereParticleEmitter;

    /**
     * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the sphere to emit from
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
     * @returns the emitter
     */
    createDirectedSphereEmitter(radius: number, direction1: Vector3, direction2: Vector3): SphereDirectedParticleEmitter;

    /**
     * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
     * @param radius The radius of the emission cylinder
     * @param height The height of the emission cylinder
     * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
     * @param directionRandomizer How much to randomize the particle direction [0-1]
     * @returns the emitter
     */
    createCylinderEmitter(radius: number, height: number, radiusRange: number, directionRandomizer: number): CylinderParticleEmitter;

    /**
     * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the cylinder to emit from
     * @param height The height of the emission cylinder
     * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
     * @returns the emitter
     */
    createDirectedCylinderEmitter(radius: number, height: number, radiusRange: number, direction1: Vector3, direction2: Vector3): SphereDirectedParticleEmitter;

    /**
     * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
     * @param radius The radius of the cone to emit from
     * @param angle The base angle of the cone
     * @returns the emitter
     */
    createConeEmitter(radius: number, angle: number): ConeParticleEmitter;

    /**
     * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
     * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
     * @returns the emitter
     */
    createBoxEmitter(direction1: Vector3, direction2: Vector3, minEmitBox: Vector3, maxEmitBox: Vector3): BoxParticleEmitter;

    /**
     * Get hosting scene
     * @returns the scene
     */
    getScene(): Nullable<Scene>;
}
