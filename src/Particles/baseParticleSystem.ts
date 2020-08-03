import { Nullable } from "../types";
import { Vector2, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { ImageProcessingConfiguration, ImageProcessingConfigurationDefines } from "../Materials/imageProcessingConfiguration";
import { ProceduralTexture } from "../Materials/Textures/Procedurals/proceduralTexture";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { ColorGradient, FactorGradient, Color3Gradient, IValueGradient } from "../Misc/gradients";
import { BoxParticleEmitter, IParticleEmitterType, PointParticleEmitter, HemisphericParticleEmitter, SphereParticleEmitter, SphereDirectedParticleEmitter, CylinderParticleEmitter, CylinderDirectedParticleEmitter, ConeParticleEmitter } from "../Particles/EmitterTypes/index";
import { Constants } from "../Engines/constants";
import { Texture } from '../Materials/Textures/texture';
import { Color4 } from '../Maths/math.color';
import { ThinEngine } from '../Engines';

declare type Animation = import("../Animations/animation").Animation;
declare type Scene = import("../scene").Scene;

/**
 * This represents the base class for particle system in Babylon.
 * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
 * Particles can take different shapes while emitted like box, sphere, cone or you can write your custom function.
 * @example https://doc.babylonjs.com/babylon101/particles
 */
export class BaseParticleSystem {
    /**
     * Source color is added to the destination color without alpha affecting the result
     */
    public static BLENDMODE_ONEONE = 0;
    /**
     * Blend current color and particle color using particle’s alpha
     */
    public static BLENDMODE_STANDARD = 1;
    /**
     * Add current color and particle color multiplied by particle’s alpha
     */
    public static BLENDMODE_ADD = 2;
    /**
     * Multiply current color with particle color
     */
    public static BLENDMODE_MULTIPLY = 3;

    /**
     * Multiply current color with particle color then add current color and particle color multiplied by particle’s alpha
     */
    public static BLENDMODE_MULTIPLYADD = 4;

    /**
     * List of animations used by the particle system.
     */
    public animations: Animation[] = [];

    /**
     * Gets or sets the unique id of the particle system
     */
    public uniqueId: number;

    /**
     * The id of the Particle system.
     */
    public id: string;

    /**
     * The friendly name of the Particle system.
     */
    public name: string;

    /**
     * Snippet ID if the particle system was created from the snippet server
     */
    public snippetId: string;

    /**
     * The rendering group used by the Particle system to chose when to render.
     */
    public renderingGroupId = 0;

    /**
     * The emitter represents the Mesh or position we are attaching the particle system to.
     */
    public emitter: Nullable<AbstractMesh | Vector3> = Vector3.Zero();

    /**
     * The maximum number of particles to emit per frame
     */
    public emitRate = 10;

    /**
     * If you want to launch only a few particles at once, that can be done, as well.
     */
    public manualEmitCount = -1;

    /**
     * The overall motion speed (0.01 is default update speed, faster updates = faster animation)
     */
    public updateSpeed = 0.01;

    /**
     * The amount of time the particle system is running (depends of the overall update speed).
     */
    public targetStopDuration = 0;

    /**
     * Specifies whether the particle system will be disposed once it reaches the end of the animation.
     */
    public disposeOnStop = false;

    /**
     * Minimum power of emitting particles.
     */
    public minEmitPower = 1;
    /**
     * Maximum power of emitting particles.
     */
    public maxEmitPower = 1;

    /**
     * Minimum life time of emitting particles.
     */
    public minLifeTime = 1;
    /**
     * Maximum life time of emitting particles.
     */
    public maxLifeTime = 1;

    /**
     * Minimum Size of emitting particles.
     */
    public minSize = 1;
    /**
     * Maximum Size of emitting particles.
     */
    public maxSize = 1;

    /**
     * Minimum scale of emitting particles on X axis.
     */
    public minScaleX = 1;
    /**
     * Maximum scale of emitting particles on X axis.
     */
    public maxScaleX = 1;

    /**
     * Minimum scale of emitting particles on Y axis.
     */
    public minScaleY = 1;
    /**
     * Maximum scale of emitting particles on Y axis.
     */
    public maxScaleY = 1;

    /**
     * Gets or sets the minimal initial rotation in radians.
     */
    public minInitialRotation = 0;
    /**
     * Gets or sets the maximal initial rotation in radians.
     */
    public maxInitialRotation = 0;

    /**
     * Minimum angular speed of emitting particles (Z-axis rotation for each particle).
     */
    public minAngularSpeed = 0;
    /**
     * Maximum angular speed of emitting particles (Z-axis rotation for each particle).
     */
    public maxAngularSpeed = 0;

    /**
     * The texture used to render each particle. (this can be a spritesheet)
     */
    public particleTexture: Nullable<Texture>;

    /**
     * The layer mask we are rendering the particles through.
     */
    public layerMask: number = 0x0FFFFFFF;

    /**
     * This can help using your own shader to render the particle system.
     * The according effect will be created
     */
    public customShader: any = null;

    /**
     * By default particle system starts as soon as they are created. This prevents the
     * automatic start to happen and let you decide when to start emitting particles.
     */
    public preventAutoStart: boolean = false;

    private _noiseTexture: Nullable<ProceduralTexture>;

    /**
     * Gets or sets a texture used to add random noise to particle positions
     */
    public get noiseTexture(): Nullable<ProceduralTexture> {
        return this._noiseTexture;
    }

    public set noiseTexture(value: Nullable<ProceduralTexture>) {
        if (this._noiseTexture === value) {
            return;
        }

        this._noiseTexture = value;
        this._reset();
    }

    /** Gets or sets the strength to apply to the noise value (default is (10, 10, 10)) */
    public noiseStrength = new Vector3(10, 10, 10);

    /**
     * Callback triggered when the particle animation is ending.
     */
    public onAnimationEnd: Nullable<() => void> = null;

    /**
     * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE or ParticleSystem.BLENDMODE_STANDARD.
     */
    public blendMode = BaseParticleSystem.BLENDMODE_ONEONE;

    /**
     * Forces the particle to write their depth information to the depth buffer. This can help preventing other draw calls
     * to override the particles.
     */
    public forceDepthWrite = false;

    /** Gets or sets a value indicating how many cycles (or frames) must be executed before first rendering (this value has to be set before starting the system). Default is 0 */
    public preWarmCycles = 0;

    /** Gets or sets a value indicating the time step multiplier to use in pre-warm mode (default is 1) */
    public preWarmStepOffset = 1;

    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the speed of the sprite loop (default is 1 meaning the animation will play once during the entire particle lifetime)
     */
    public spriteCellChangeSpeed = 1;
    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the first sprite cell to display
     */
    public startSpriteCellID = 0;
    /**
     * If using a spritesheet (isAnimationSheetEnabled) defines the last sprite cell to display
     */
    public endSpriteCellID = 0;
    /**
     * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell width to use
     */
    public spriteCellWidth = 0;
    /**
     * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell height to use
     */
    public spriteCellHeight = 0;
    /**
     * This allows the system to random pick the start cell ID between startSpriteCellID and endSpriteCellID
     */
    public spriteRandomStartCell = false;

    /** Gets or sets a Vector2 used to move the pivot (by default (0,0)) */
    public translationPivot = new Vector2(0, 0);

    /** @hidden */
    protected _isAnimationSheetEnabled: boolean;

    /**
     * Gets or sets a boolean indicating that hosted animations (in the system.animations array) must be started when system.start() is called
     */
    public beginAnimationOnStart = false;

    /**
     * Gets or sets the frame to start the animation from when beginAnimationOnStart is true
     */
    public beginAnimationFrom = 0;

    /**
     * Gets or sets the frame to end the animation on when beginAnimationOnStart is true
     */
    public beginAnimationTo = 60;

    /**
     * Gets or sets a boolean indicating if animations must loop when beginAnimationOnStart is true
     */
    public beginAnimationLoop = false;

    /**
     * Gets or sets a world offset applied to all particles
     */
    public worldOffset = new Vector3(0, 0, 0);

    /**
     * Gets or sets whether an animation sprite sheet is enabled or not on the particle system
     */
    public get isAnimationSheetEnabled(): boolean {
        return this._isAnimationSheetEnabled;
    }

    public set isAnimationSheetEnabled(value: boolean) {
        if (this._isAnimationSheetEnabled == value) {
            return;
        }

        this._isAnimationSheetEnabled = value;

        this._reset();
    }

    /**
     * Get hosting scene
     * @returns the scene
     */
    public getScene(): Nullable<Scene> {
        return this._scene;
    }

    /**
     * You can use gravity if you want to give an orientation to your particles.
     */
    public gravity = Vector3.Zero();

    protected _colorGradients: Nullable<Array<ColorGradient>> = null;
    protected _sizeGradients: Nullable<Array<FactorGradient>> = null;
    protected _lifeTimeGradients: Nullable<Array<FactorGradient>> = null;
    protected _angularSpeedGradients: Nullable<Array<FactorGradient>> = null;
    protected _velocityGradients: Nullable<Array<FactorGradient>> = null;
    protected _limitVelocityGradients: Nullable<Array<FactorGradient>> = null;
    protected _dragGradients: Nullable<Array<FactorGradient>> = null;
    protected _emitRateGradients: Nullable<Array<FactorGradient>> = null;
    protected _startSizeGradients: Nullable<Array<FactorGradient>> = null;
    protected _rampGradients: Nullable<Array<Color3Gradient>> = null;
    protected _colorRemapGradients: Nullable<Array<FactorGradient>> = null;
    protected _alphaRemapGradients: Nullable<Array<FactorGradient>> = null;

    protected _hasTargetStopDurationDependantGradient() {
        return (this._startSizeGradients && this._startSizeGradients.length > 0)
            || (this._emitRateGradients && this._emitRateGradients.length > 0)
            || (this._lifeTimeGradients && this._lifeTimeGradients.length > 0);
    }

    /**
     * Defines the delay in milliseconds before starting the system (0 by default)
     */
    public startDelay = 0;

    /**
     * Gets the current list of drag gradients.
     * You must use addDragGradient and removeDragGradient to udpate this list
     * @returns the list of drag gradients
     */
    public getDragGradients(): Nullable<Array<FactorGradient>> {
        return this._dragGradients;
    }

    /** Gets or sets a value indicating the damping to apply if the limit velocity factor is reached */
    public limitVelocityDamping = 0.4;

    /**
     * Gets the current list of limit velocity gradients.
     * You must use addLimitVelocityGradient and removeLimitVelocityGradient to udpate this list
     * @returns the list of limit velocity gradients
     */
    public getLimitVelocityGradients(): Nullable<Array<FactorGradient>> {
        return this._limitVelocityGradients;
    }

    /**
     * Gets the current list of color gradients.
     * You must use addColorGradient and removeColorGradient to udpate this list
     * @returns the list of color gradients
     */
    public getColorGradients(): Nullable<Array<ColorGradient>> {
        return this._colorGradients;
    }

    /**
     * Gets the current list of size gradients.
     * You must use addSizeGradient and removeSizeGradient to udpate this list
     * @returns the list of size gradients
     */
    public getSizeGradients(): Nullable<Array<FactorGradient>> {
        return this._sizeGradients;
    }

    /**
     * Gets the current list of color remap gradients.
     * You must use addColorRemapGradient and removeColorRemapGradient to udpate this list
     * @returns the list of color remap gradients
     */
    public getColorRemapGradients(): Nullable<Array<FactorGradient>> {
        return this._colorRemapGradients;
    }

    /**
     * Gets the current list of alpha remap gradients.
     * You must use addAlphaRemapGradient and removeAlphaRemapGradient to udpate this list
     * @returns the list of alpha remap gradients
     */
    public getAlphaRemapGradients(): Nullable<Array<FactorGradient>> {
        return this._alphaRemapGradients;
    }

    /**
     * Gets the current list of life time gradients.
     * You must use addLifeTimeGradient and removeLifeTimeGradient to udpate this list
     * @returns the list of life time gradients
     */
    public getLifeTimeGradients(): Nullable<Array<FactorGradient>> {
        return this._lifeTimeGradients;
    }

    /**
     * Gets the current list of angular speed gradients.
     * You must use addAngularSpeedGradient and removeAngularSpeedGradient to udpate this list
     * @returns the list of angular speed gradients
     */
    public getAngularSpeedGradients(): Nullable<Array<FactorGradient>> {
        return this._angularSpeedGradients;
    }

    /**
     * Gets the current list of velocity gradients.
     * You must use addVelocityGradient and removeVelocityGradient to udpate this list
     * @returns the list of velocity gradients
     */
    public getVelocityGradients(): Nullable<Array<FactorGradient>> {
        return this._velocityGradients;
    }

    /**
     * Gets the current list of start size gradients.
     * You must use addStartSizeGradient and removeStartSizeGradient to udpate this list
     * @returns the list of start size gradients
     */
    public getStartSizeGradients(): Nullable<Array<FactorGradient>> {
        return this._startSizeGradients;
    }

    /**
     * Gets the current list of emit rate gradients.
     * You must use addEmitRateGradient and removeEmitRateGradient to udpate this list
     * @returns the list of emit rate gradients
     */
    public getEmitRateGradients(): Nullable<Array<FactorGradient>> {
        return this._emitRateGradients;
    }

    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    public get direction1(): Vector3 {
        if ((<BoxParticleEmitter>this.particleEmitterType).direction1) {
            return (<BoxParticleEmitter>this.particleEmitterType).direction1;
        }

        return Vector3.Zero();
    }

    public set direction1(value: Vector3) {
        if ((<BoxParticleEmitter>this.particleEmitterType).direction1) {
            (<BoxParticleEmitter>this.particleEmitterType).direction1 = value;
        }
    }

    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    public get direction2(): Vector3 {
        if ((<BoxParticleEmitter>this.particleEmitterType).direction2) {
            return (<BoxParticleEmitter>this.particleEmitterType).direction2;
        }

        return Vector3.Zero();
    }

    public set direction2(value: Vector3) {
        if ((<BoxParticleEmitter>this.particleEmitterType).direction2) {
            (<BoxParticleEmitter>this.particleEmitterType).direction2 = value;
        }
    }

    /**
     * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    public get minEmitBox(): Vector3 {
        if ((<BoxParticleEmitter>this.particleEmitterType).minEmitBox) {
            return (<BoxParticleEmitter>this.particleEmitterType).minEmitBox;
        }

        return Vector3.Zero();
    }

    public set minEmitBox(value: Vector3) {
        if ((<BoxParticleEmitter>this.particleEmitterType).minEmitBox) {
            (<BoxParticleEmitter>this.particleEmitterType).minEmitBox = value;
        }
    }

    /**
     * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    public get maxEmitBox(): Vector3 {
        if ((<BoxParticleEmitter>this.particleEmitterType).maxEmitBox) {
            return (<BoxParticleEmitter>this.particleEmitterType).maxEmitBox;
        }

        return Vector3.Zero();
    }

    public set maxEmitBox(value: Vector3) {
        if ((<BoxParticleEmitter>this.particleEmitterType).maxEmitBox) {
            (<BoxParticleEmitter>this.particleEmitterType).maxEmitBox = value;
        }
    }

    /**
     * Random color of each particle after it has been emitted, between color1 and color2 vectors
     */
    public color1 = new Color4(1.0, 1.0, 1.0, 1.0);
    /**
     * Random color of each particle after it has been emitted, between color1 and color2 vectors
     */
    public color2 = new Color4(1.0, 1.0, 1.0, 1.0);
    /**
     * Color the particle will have at the end of its lifetime
     */
    public colorDead = new Color4(0, 0, 0, 1.0);

    /**
     * An optional mask to filter some colors out of the texture, or filter a part of the alpha channel
     */
    public textureMask = new Color4(1.0, 1.0, 1.0, 1.0);

    /**
     * The particle emitter type defines the emitter used by the particle system.
     * It can be for example box, sphere, or cone...
     */
    public particleEmitterType: IParticleEmitterType;

    /** @hidden */
    public _isSubEmitter = false;

    /**
     * Gets or sets the billboard mode to use when isBillboardBased = true.
     * Value can be: ParticleSystem.BILLBOARDMODE_ALL, ParticleSystem.BILLBOARDMODE_Y, ParticleSystem.BILLBOARDMODE_STRETCHED
     */
    public billboardMode = Constants.PARTICLES_BILLBOARDMODE_ALL;

    protected _isBillboardBased = true;
    /**
     * Gets or sets a boolean indicating if the particles must be rendered as billboard or aligned with the direction
     */
    public get isBillboardBased(): boolean {
        return this._isBillboardBased;
    }

    public set isBillboardBased(value: boolean) {
        if (this._isBillboardBased === value) {
            return;
        }

        this._isBillboardBased = value;
        this._reset();
    }

    /**
     * The scene the particle system belongs to.
     */
    protected _scene: Nullable<Scene>;
    
    /**
     * The engine the particle system belongs to.
     */
    protected _engine: ThinEngine;

    /**
     * Local cache of defines for image processing.
     */
    protected _imageProcessingConfigurationDefines = new ImageProcessingConfigurationDefines();

    /**
     * Default configuration related to image processing available in the standard Material.
     */
    protected _imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;

    /**
     * Gets the image processing configuration used either in this material.
     */
    public get imageProcessingConfiguration(): Nullable<ImageProcessingConfiguration> {
        return this._imageProcessingConfiguration;
    }

    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    public set imageProcessingConfiguration(value: Nullable<ImageProcessingConfiguration>) {
        this._attachImageProcessingConfiguration(value);
    }

    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }

        // Pick the scene configuration if needed.
        if (!configuration && this._scene) {
            this._imageProcessingConfiguration = this._scene.imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
    }

    /** @hidden */
    protected _reset() {
    }

    /** @hidden */
    protected _removeGradientAndTexture(gradient: number, gradients: Nullable<IValueGradient[]>, texture: Nullable<RawTexture>): BaseParticleSystem {
        if (!gradients) {
            return this;
        }

        let index = 0;
        for (var valueGradient of gradients) {
            if (valueGradient.gradient === gradient) {
                gradients.splice(index, 1);
                break;
            }
            index++;
        }

        if (texture) {
            texture.dispose();
        }

        return this;
    }

    /**
     * Instantiates a particle system.
     * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
     * @param name The name of the particle system
     */
    public constructor(name: string) {
        this.id = name;
        this.name = name;
    }

    /**
     * Creates a Point Emitter for the particle system (emits directly from the emitter position)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @returns the emitter
     */
    public createPointEmitter(direction1: Vector3, direction2: Vector3): PointParticleEmitter {
        var particleEmitter = new PointParticleEmitter();
        particleEmitter.direction1 = direction1;
        particleEmitter.direction2 = direction2;

        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
     * @param radius The radius of the hemisphere to emit from
     * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    public createHemisphericEmitter(radius = 1, radiusRange = 1): HemisphericParticleEmitter {
        var particleEmitter = new HemisphericParticleEmitter(radius, radiusRange);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
     * @param radius The radius of the sphere to emit from
     * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    public createSphereEmitter(radius = 1, radiusRange = 1): SphereParticleEmitter {
        var particleEmitter = new SphereParticleEmitter(radius, radiusRange);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the sphere to emit from
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
     * @returns the emitter
     */
    public createDirectedSphereEmitter(radius = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): SphereDirectedParticleEmitter {
        var particleEmitter = new SphereDirectedParticleEmitter(radius, direction1, direction2);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
     * @param radius The radius of the emission cylinder
     * @param height The height of the emission cylinder
     * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
     * @param directionRandomizer How much to randomize the particle direction [0-1]
     * @returns the emitter
     */
    public createCylinderEmitter(radius = 1, height = 1, radiusRange = 1, directionRandomizer = 0): CylinderParticleEmitter {
        var particleEmitter = new CylinderParticleEmitter(radius, height, radiusRange, directionRandomizer);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the cylinder to emit from
     * @param height The height of the emission cylinder
     * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
     * @returns the emitter
     */
    public createDirectedCylinderEmitter(radius = 1, height = 1, radiusRange = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): CylinderDirectedParticleEmitter {
        var particleEmitter = new CylinderDirectedParticleEmitter(radius, height, radiusRange, direction1, direction2);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
     * @param radius The radius of the cone to emit from
     * @param angle The base angle of the cone
     * @returns the emitter
     */
    public createConeEmitter(radius = 1, angle = Math.PI / 4): ConeParticleEmitter {
        var particleEmitter = new ConeParticleEmitter(radius, angle);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
     * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
     * @returns the emitter
     */
    public createBoxEmitter(direction1: Vector3, direction2: Vector3, minEmitBox: Vector3, maxEmitBox: Vector3): BoxParticleEmitter {
        var particleEmitter = new BoxParticleEmitter();
        this.particleEmitterType = particleEmitter;
        this.direction1 = direction1;
        this.direction2 = direction2;
        this.minEmitBox = minEmitBox;
        this.maxEmitBox = maxEmitBox;
        return particleEmitter;
    }
}