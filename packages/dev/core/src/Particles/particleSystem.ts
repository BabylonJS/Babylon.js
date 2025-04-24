import { ThinParticleSystem } from "./thinParticleSystem";
import type { IParticleEmitterType } from "./EmitterTypes/IParticleEmitterType";
import { SubEmitter, SubEmitterType } from "./subEmitter";
import { Color3, Color4 } from "../Maths/math.color";
import { Vector3 } from "../Maths/math.vector";
import type { IParticleSystem } from "./IParticleSystem";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { AbstractEngine } from "../Engines/abstractEngine";
import { GetClass } from "../Misc/typeStore";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Effect } from "../Materials/effect";
import type { Particle } from "./particle";
import { Constants } from "../Engines/constants";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { MeshParticleEmitter } from "./EmitterTypes/meshParticleEmitter";
import { CustomParticleEmitter } from "./EmitterTypes/customParticleEmitter";
import { BoxParticleEmitter } from "./EmitterTypes/boxParticleEmitter";
import { PointParticleEmitter } from "./EmitterTypes/pointParticleEmitter";
import { HemisphericParticleEmitter } from "./EmitterTypes/hemisphericParticleEmitter";
import { SphereDirectedParticleEmitter, SphereParticleEmitter } from "./EmitterTypes/sphereParticleEmitter";
import { CylinderDirectedParticleEmitter, CylinderParticleEmitter } from "./EmitterTypes/cylinderParticleEmitter";
import { ConeDirectedParticleEmitter, ConeParticleEmitter } from "./EmitterTypes/coneParticleEmitter";
import {
    CreateConeEmitter,
    CreateCylinderEmitter,
    CreateDirectedCylinderEmitter,
    CreateDirectedSphereEmitter,
    CreateDirectedConeEmitter,
    CreateHemisphericEmitter,
    CreatePointEmitter,
    CreateSphereEmitter,
} from "./particleSystem.functions";

/**
 * This represents a particle system in Babylon.
 * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
 * Particles can take different shapes while emitted like box, sphere, cone or you can write your custom function.
 * @example https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
 */
export class ParticleSystem extends ThinParticleSystem {
    /**
     * Billboard mode will only apply to Y axis
     */
    public static readonly BILLBOARDMODE_Y = Constants.PARTICLES_BILLBOARDMODE_Y;
    /**
     * Billboard mode will apply to all axes
     */
    public static readonly BILLBOARDMODE_ALL = Constants.PARTICLES_BILLBOARDMODE_ALL;
    /**
     * Special billboard mode where the particle will be biilboard to the camera but rotated to align with direction
     */
    public static readonly BILLBOARDMODE_STRETCHED = Constants.PARTICLES_BILLBOARDMODE_STRETCHED;
    /**
     * Special billboard mode where the particle will be billboard to the camera but only around the axis of the direction of particle emission
     */
    public static readonly BILLBOARDMODE_STRETCHED_LOCAL = Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL;

    // Sub-emitters
    private _rootParticleSystem: Nullable<ParticleSystem>;

    /**
     * The Sub-emitters templates that will be used to generate the sub particle system to be associated with the system, this property is used by the root particle system only.
     * When a particle is spawned, an array will be chosen at random and all the emitters in that array will be attached to the particle.  (Default: [])
     */
    public subEmitters: Array<ParticleSystem | SubEmitter | Array<SubEmitter>>;
    // the subEmitters field above converted to a constant type
    private _subEmitters: Array<Array<SubEmitter>>;
    /**
     * @internal
     * If the particle systems emitter should be disposed when the particle system is disposed
     */
    public _disposeEmitterOnDispose = false;
    /**
     * The current active Sub-systems, this property is used by the root particle system only.
     */
    public activeSubSystems: Array<ParticleSystem>;
    /**
     * Creates a Point Emitter for the particle system (emits directly from the emitter position)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @returns the emitter
     */
    public override createPointEmitter(direction1: Vector3, direction2: Vector3): PointParticleEmitter {
        const particleEmitter = CreatePointEmitter(direction1, direction2);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
     * @param radius The radius of the hemisphere to emit from
     * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    public override createHemisphericEmitter(radius = 1, radiusRange = 1): HemisphericParticleEmitter {
        const particleEmitter = CreateHemisphericEmitter(radius, radiusRange);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
     * @param radius The radius of the sphere to emit from
     * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     * @returns the emitter
     */
    public override createSphereEmitter(radius = 1, radiusRange = 1): SphereParticleEmitter {
        const particleEmitter = CreateSphereEmitter(radius, radiusRange);
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
    public override createDirectedSphereEmitter(radius = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): SphereDirectedParticleEmitter {
        const particleEmitter = CreateDirectedSphereEmitter(radius, direction1, direction2);
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
    public override createCylinderEmitter(radius = 1, height = 1, radiusRange = 1, directionRandomizer = 0): CylinderParticleEmitter {
        const particleEmitter = CreateCylinderEmitter(radius, height, radiusRange, directionRandomizer);
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
    public override createDirectedCylinderEmitter(
        radius = 1,
        height = 1,
        radiusRange = 1,
        direction1 = new Vector3(0, 1.0, 0),
        direction2 = new Vector3(0, 1.0, 0)
    ): CylinderDirectedParticleEmitter {
        const particleEmitter = CreateDirectedCylinderEmitter(radius, height, radiusRange, direction1, direction2);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }

    /**
     * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
     * @param radius The radius of the cone to emit from
     * @param angle The base angle of the cone
     * @returns the emitter
     */
    public override createConeEmitter(radius = 1, angle = Math.PI / 4): ConeParticleEmitter {
        const particleEmitter = CreateConeEmitter(radius, angle);
        this.particleEmitterType = particleEmitter;
        return particleEmitter;
    }
    public override createDirectedConeEmitter(
        radius = 1,
        angle = Math.PI / 4,
        direction1 = new Vector3(0, 1.0, 0),
        direction2 = new Vector3(0, 1.0, 0)
    ): ConeDirectedParticleEmitter {
        const particleEmitter = CreateDirectedConeEmitter(radius, angle, direction1, direction2);
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
    public override createBoxEmitter(direction1: Vector3, direction2: Vector3, minEmitBox: Vector3, maxEmitBox: Vector3): BoxParticleEmitter {
        const particleEmitter = new BoxParticleEmitter();
        this.particleEmitterType = particleEmitter;
        this.direction1 = direction1;
        this.direction2 = direction2;
        this.minEmitBox = minEmitBox;
        this.maxEmitBox = maxEmitBox;
        return particleEmitter;
    }

    private _prepareSubEmitterInternalArray() {
        this._subEmitters = new Array<Array<SubEmitter>>();
        if (this.subEmitters) {
            for (const subEmitter of this.subEmitters) {
                if (subEmitter instanceof ParticleSystem) {
                    this._subEmitters.push([new SubEmitter(subEmitter)]);
                } else if (subEmitter instanceof SubEmitter) {
                    this._subEmitters.push([subEmitter]);
                } else if (subEmitter instanceof Array) {
                    this._subEmitters.push(subEmitter);
                }
            }
        }
    }

    private _stopSubEmitters(): void {
        if (!this.activeSubSystems) {
            return;
        }
        for (const subSystem of this.activeSubSystems) {
            subSystem.stop(true);
        }
        this.activeSubSystems = [] as ParticleSystem[];
    }

    private _removeFromRoot(): void {
        if (!this._rootParticleSystem) {
            return;
        }

        const index = this._rootParticleSystem.activeSubSystems.indexOf(this);
        if (index !== -1) {
            this._rootParticleSystem.activeSubSystems.splice(index, 1);
        }

        this._rootParticleSystem = null;
    }

    public override _emitFromParticle: (particle: Particle) => void = (particle) => {
        if (!this._subEmitters || this._subEmitters.length === 0) {
            return;
        }
        const templateIndex = Math.floor(Math.random() * this._subEmitters.length);

        for (const subEmitter of this._subEmitters[templateIndex]) {
            if (subEmitter.type === SubEmitterType.END) {
                const subSystem = subEmitter.clone();
                particle._inheritParticleInfoToSubEmitter(subSystem);
                subSystem.particleSystem._rootParticleSystem = this;
                this.activeSubSystems.push(subSystem.particleSystem);
                subSystem.particleSystem.start();
            }
        }
    };

    public override _preStart() {
        // Convert the subEmitters field to the constant type field _subEmitters
        this._prepareSubEmitterInternalArray();

        if (this._subEmitters && this._subEmitters.length != 0) {
            this.activeSubSystems = [] as ParticleSystem[];
        }
    }

    public override _postStop(stopSubEmitters: boolean) {
        if (stopSubEmitters) {
            this._stopSubEmitters();
        }
    }

    public override _prepareParticle(particle: Particle): void {
        // Attach emitters
        if (this._subEmitters && this._subEmitters.length > 0) {
            const subEmitters = this._subEmitters[Math.floor(Math.random() * this._subEmitters.length)];
            particle._attachedSubEmitters = [];
            for (const subEmitter of subEmitters) {
                if (subEmitter.type === SubEmitterType.ATTACHED) {
                    const newEmitter = subEmitter.clone();
                    (<Array<SubEmitter>>particle._attachedSubEmitters).push(newEmitter);
                    newEmitter.particleSystem.start();
                }
            }
        }
    }

    /** @internal */
    public override _onDispose(disposeAttachedSubEmitters = false, disposeEndSubEmitters = false) {
        this._removeFromRoot();

        if (this.subEmitters && !this._subEmitters) {
            this._prepareSubEmitterInternalArray();
        }

        if (disposeAttachedSubEmitters) {
            if (this.particles) {
                for (const particle of this.particles) {
                    if (particle._attachedSubEmitters) {
                        for (let i = particle._attachedSubEmitters.length - 1; i >= 0; i -= 1) {
                            particle._attachedSubEmitters[i].dispose();
                        }
                    }
                }
            }
        }

        if (disposeEndSubEmitters) {
            if (this.activeSubSystems) {
                for (let i = this.activeSubSystems.length - 1; i >= 0; i -= 1) {
                    this.activeSubSystems[i].dispose();
                }
            }
        }

        if (this._subEmitters && this._subEmitters.length) {
            for (let index = 0; index < this._subEmitters.length; index++) {
                for (const subEmitter of this._subEmitters[index]) {
                    subEmitter.dispose();
                }
            }

            this._subEmitters = [];
            this.subEmitters = [];
        }

        if (this._disposeEmitterOnDispose && this.emitter && (this.emitter as AbstractMesh).dispose) {
            (<AbstractMesh>this.emitter).dispose(true);
        }
    }

    /**
     * @internal
     */
    public static _Parse(parsedParticleSystem: any, particleSystem: IParticleSystem, sceneOrEngine: Scene | AbstractEngine, rootUrl: string) {
        let scene: Nullable<Scene>;

        if (sceneOrEngine instanceof AbstractEngine) {
            scene = null;
        } else {
            scene = sceneOrEngine as Scene;
        }

        const internalClass = GetClass("BABYLON.Texture");
        if (internalClass && scene) {
            // Texture
            if (parsedParticleSystem.texture) {
                particleSystem.particleTexture = internalClass.Parse(parsedParticleSystem.texture, scene, rootUrl) as BaseTexture;
            } else if (parsedParticleSystem.textureName) {
                particleSystem.particleTexture = new internalClass(
                    rootUrl + parsedParticleSystem.textureName,
                    scene,
                    false,
                    parsedParticleSystem.invertY !== undefined ? parsedParticleSystem.invertY : true
                );
                particleSystem.particleTexture!.name = parsedParticleSystem.textureName;
            }
        }

        // Emitter
        if (!parsedParticleSystem.emitterId && parsedParticleSystem.emitterId !== 0 && parsedParticleSystem.emitter === undefined) {
            particleSystem.emitter = Vector3.Zero();
        } else if (parsedParticleSystem.emitterId && scene) {
            particleSystem.emitter = scene.getLastMeshById(parsedParticleSystem.emitterId);
        } else {
            particleSystem.emitter = Vector3.FromArray(parsedParticleSystem.emitter);
        }

        particleSystem.isLocal = !!parsedParticleSystem.isLocal;

        // Misc.
        if (parsedParticleSystem.renderingGroupId !== undefined) {
            particleSystem.renderingGroupId = parsedParticleSystem.renderingGroupId;
        }

        if (parsedParticleSystem.isBillboardBased !== undefined) {
            particleSystem.isBillboardBased = parsedParticleSystem.isBillboardBased;
        }

        if (parsedParticleSystem.billboardMode !== undefined) {
            particleSystem.billboardMode = parsedParticleSystem.billboardMode;
        }

        if (parsedParticleSystem.useLogarithmicDepth !== undefined) {
            particleSystem.useLogarithmicDepth = parsedParticleSystem.useLogarithmicDepth;
        }

        // Animations
        if (parsedParticleSystem.animations) {
            for (let animationIndex = 0; animationIndex < parsedParticleSystem.animations.length; animationIndex++) {
                const parsedAnimation = parsedParticleSystem.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    particleSystem.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            particleSystem.beginAnimationOnStart = parsedParticleSystem.beginAnimationOnStart;
            particleSystem.beginAnimationFrom = parsedParticleSystem.beginAnimationFrom;
            particleSystem.beginAnimationTo = parsedParticleSystem.beginAnimationTo;
            particleSystem.beginAnimationLoop = parsedParticleSystem.beginAnimationLoop;
        }

        if (parsedParticleSystem.autoAnimate && scene) {
            scene.beginAnimation(
                particleSystem,
                parsedParticleSystem.autoAnimateFrom,
                parsedParticleSystem.autoAnimateTo,
                parsedParticleSystem.autoAnimateLoop,
                parsedParticleSystem.autoAnimateSpeed || 1.0
            );
        }

        // Particle system
        particleSystem.startDelay = parsedParticleSystem.startDelay | 0;
        particleSystem.minAngularSpeed = parsedParticleSystem.minAngularSpeed;
        particleSystem.maxAngularSpeed = parsedParticleSystem.maxAngularSpeed;
        particleSystem.minSize = parsedParticleSystem.minSize;
        particleSystem.maxSize = parsedParticleSystem.maxSize;

        if (parsedParticleSystem.minScaleX) {
            particleSystem.minScaleX = parsedParticleSystem.minScaleX;
            particleSystem.maxScaleX = parsedParticleSystem.maxScaleX;
            particleSystem.minScaleY = parsedParticleSystem.minScaleY;
            particleSystem.maxScaleY = parsedParticleSystem.maxScaleY;
        }

        if (parsedParticleSystem.preWarmCycles !== undefined) {
            particleSystem.preWarmCycles = parsedParticleSystem.preWarmCycles;
            particleSystem.preWarmStepOffset = parsedParticleSystem.preWarmStepOffset;
        }

        if (parsedParticleSystem.minInitialRotation !== undefined) {
            particleSystem.minInitialRotation = parsedParticleSystem.minInitialRotation;
            particleSystem.maxInitialRotation = parsedParticleSystem.maxInitialRotation;
        }

        particleSystem.minLifeTime = parsedParticleSystem.minLifeTime;
        particleSystem.maxLifeTime = parsedParticleSystem.maxLifeTime;
        particleSystem.minEmitPower = parsedParticleSystem.minEmitPower;
        particleSystem.maxEmitPower = parsedParticleSystem.maxEmitPower;
        particleSystem.emitRate = parsedParticleSystem.emitRate;
        particleSystem.gravity = Vector3.FromArray(parsedParticleSystem.gravity);
        if (parsedParticleSystem.noiseStrength) {
            particleSystem.noiseStrength = Vector3.FromArray(parsedParticleSystem.noiseStrength);
        }
        particleSystem.color1 = Color4.FromArray(parsedParticleSystem.color1);
        particleSystem.color2 = Color4.FromArray(parsedParticleSystem.color2);
        particleSystem.colorDead = Color4.FromArray(parsedParticleSystem.colorDead);
        particleSystem.updateSpeed = parsedParticleSystem.updateSpeed;
        particleSystem.targetStopDuration = parsedParticleSystem.targetStopDuration;
        particleSystem.blendMode = parsedParticleSystem.blendMode;

        if (parsedParticleSystem.colorGradients) {
            for (const colorGradient of parsedParticleSystem.colorGradients) {
                particleSystem.addColorGradient(
                    colorGradient.gradient,
                    Color4.FromArray(colorGradient.color1),
                    colorGradient.color2 ? Color4.FromArray(colorGradient.color2) : undefined
                );
            }
        }

        if (parsedParticleSystem.rampGradients) {
            for (const rampGradient of parsedParticleSystem.rampGradients) {
                particleSystem.addRampGradient(rampGradient.gradient, Color3.FromArray(rampGradient.color));
            }
            particleSystem.useRampGradients = parsedParticleSystem.useRampGradients;
        }

        if (parsedParticleSystem.colorRemapGradients) {
            for (const colorRemapGradient of parsedParticleSystem.colorRemapGradients) {
                particleSystem.addColorRemapGradient(
                    colorRemapGradient.gradient,
                    colorRemapGradient.factor1 !== undefined ? colorRemapGradient.factor1 : colorRemapGradient.factor,
                    colorRemapGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.alphaRemapGradients) {
            for (const alphaRemapGradient of parsedParticleSystem.alphaRemapGradients) {
                particleSystem.addAlphaRemapGradient(
                    alphaRemapGradient.gradient,
                    alphaRemapGradient.factor1 !== undefined ? alphaRemapGradient.factor1 : alphaRemapGradient.factor,
                    alphaRemapGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.sizeGradients) {
            for (const sizeGradient of parsedParticleSystem.sizeGradients) {
                particleSystem.addSizeGradient(sizeGradient.gradient, sizeGradient.factor1 !== undefined ? sizeGradient.factor1 : sizeGradient.factor, sizeGradient.factor2);
            }
        }

        if (parsedParticleSystem.angularSpeedGradients) {
            for (const angularSpeedGradient of parsedParticleSystem.angularSpeedGradients) {
                particleSystem.addAngularSpeedGradient(
                    angularSpeedGradient.gradient,
                    angularSpeedGradient.factor1 !== undefined ? angularSpeedGradient.factor1 : angularSpeedGradient.factor,
                    angularSpeedGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.velocityGradients) {
            for (const velocityGradient of parsedParticleSystem.velocityGradients) {
                particleSystem.addVelocityGradient(
                    velocityGradient.gradient,
                    velocityGradient.factor1 !== undefined ? velocityGradient.factor1 : velocityGradient.factor,
                    velocityGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.dragGradients) {
            for (const dragGradient of parsedParticleSystem.dragGradients) {
                particleSystem.addDragGradient(dragGradient.gradient, dragGradient.factor1 !== undefined ? dragGradient.factor1 : dragGradient.factor, dragGradient.factor2);
            }
        }

        if (parsedParticleSystem.emitRateGradients) {
            for (const emitRateGradient of parsedParticleSystem.emitRateGradients) {
                particleSystem.addEmitRateGradient(
                    emitRateGradient.gradient,
                    emitRateGradient.factor1 !== undefined ? emitRateGradient.factor1 : emitRateGradient.factor,
                    emitRateGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.startSizeGradients) {
            for (const startSizeGradient of parsedParticleSystem.startSizeGradients) {
                particleSystem.addStartSizeGradient(
                    startSizeGradient.gradient,
                    startSizeGradient.factor1 !== undefined ? startSizeGradient.factor1 : startSizeGradient.factor,
                    startSizeGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.lifeTimeGradients) {
            for (const lifeTimeGradient of parsedParticleSystem.lifeTimeGradients) {
                particleSystem.addLifeTimeGradient(
                    lifeTimeGradient.gradient,
                    lifeTimeGradient.factor1 !== undefined ? lifeTimeGradient.factor1 : lifeTimeGradient.factor,
                    lifeTimeGradient.factor2
                );
            }
        }

        if (parsedParticleSystem.limitVelocityGradients) {
            for (const limitVelocityGradient of parsedParticleSystem.limitVelocityGradients) {
                particleSystem.addLimitVelocityGradient(
                    limitVelocityGradient.gradient,
                    limitVelocityGradient.factor1 !== undefined ? limitVelocityGradient.factor1 : limitVelocityGradient.factor,
                    limitVelocityGradient.factor2
                );
            }
            particleSystem.limitVelocityDamping = parsedParticleSystem.limitVelocityDamping;
        }

        if (parsedParticleSystem.noiseTexture && scene) {
            const internalClass = GetClass("BABYLON.ProceduralTexture");
            particleSystem.noiseTexture = internalClass.Parse(parsedParticleSystem.noiseTexture, scene, rootUrl);
        }

        // Emitter
        let emitterType: IParticleEmitterType;
        if (parsedParticleSystem.particleEmitterType) {
            switch (parsedParticleSystem.particleEmitterType.type) {
                case "SphereParticleEmitter":
                    emitterType = new SphereParticleEmitter();
                    break;
                case "SphereDirectedParticleEmitter":
                    emitterType = new SphereDirectedParticleEmitter();
                    break;
                case "ConeEmitter":
                case "ConeParticleEmitter":
                    emitterType = new ConeParticleEmitter();
                    break;
                case "ConeDirectedParticleEmitter":
                    emitterType = new ConeDirectedParticleEmitter();
                    break;
                case "CylinderParticleEmitter":
                    emitterType = new CylinderParticleEmitter();
                    break;
                case "CylinderDirectedParticleEmitter":
                    emitterType = new CylinderDirectedParticleEmitter();
                    break;
                case "HemisphericParticleEmitter":
                    emitterType = new HemisphericParticleEmitter();
                    break;
                case "PointParticleEmitter":
                    emitterType = new PointParticleEmitter();
                    break;
                case "MeshParticleEmitter":
                    emitterType = new MeshParticleEmitter();
                    break;
                case "CustomParticleEmitter":
                    emitterType = new CustomParticleEmitter();
                    break;
                case "BoxEmitter":
                case "BoxParticleEmitter":
                default:
                    emitterType = new BoxParticleEmitter();
                    break;
            }

            emitterType.parse(parsedParticleSystem.particleEmitterType, scene);
        } else {
            emitterType = new BoxParticleEmitter();
            emitterType.parse(parsedParticleSystem, scene);
        }
        particleSystem.particleEmitterType = emitterType;

        // Animation sheet
        particleSystem.startSpriteCellID = parsedParticleSystem.startSpriteCellID;
        particleSystem.endSpriteCellID = parsedParticleSystem.endSpriteCellID;
        particleSystem.spriteCellLoop = parsedParticleSystem.spriteCellLoop ?? true;
        particleSystem.spriteCellWidth = parsedParticleSystem.spriteCellWidth;
        particleSystem.spriteCellHeight = parsedParticleSystem.spriteCellHeight;
        particleSystem.spriteCellChangeSpeed = parsedParticleSystem.spriteCellChangeSpeed;
        particleSystem.spriteRandomStartCell = parsedParticleSystem.spriteRandomStartCell;

        particleSystem.disposeOnStop = parsedParticleSystem.disposeOnStop ?? false;
        particleSystem.manualEmitCount = parsedParticleSystem.manualEmitCount ?? -1;
    }

    /**
     * Parses a JSON object to create a particle system.
     * @param parsedParticleSystem The JSON object to parse
     * @param sceneOrEngine The scene or the engine to create the particle system in
     * @param rootUrl The root url to use to load external dependencies like texture
     * @param doNotStart Ignore the preventAutoStart attribute and does not start
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns the Parsed particle system
     */
    public static Parse(parsedParticleSystem: any, sceneOrEngine: Scene | AbstractEngine, rootUrl: string, doNotStart = false, capacity?: number): ParticleSystem {
        const name = parsedParticleSystem.name;
        let custom: Nullable<Effect> = null;
        let program: any = null;
        let engine: AbstractEngine;
        let scene: Nullable<Scene>;

        if (sceneOrEngine instanceof AbstractEngine) {
            engine = sceneOrEngine;
        } else {
            scene = sceneOrEngine as Scene;
            engine = scene.getEngine();
        }

        if (parsedParticleSystem.customShader && (engine as any).createEffectForParticles) {
            program = parsedParticleSystem.customShader;
            const defines: string = program.shaderOptions.defines.length > 0 ? program.shaderOptions.defines.join("\n") : "";
            custom = (engine as any).createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
        }
        const particleSystem = new ParticleSystem(name, capacity || parsedParticleSystem.capacity, sceneOrEngine, custom, parsedParticleSystem.isAnimationSheetEnabled);
        particleSystem.customShader = program;
        particleSystem._rootUrl = rootUrl;

        if (parsedParticleSystem.id) {
            particleSystem.id = parsedParticleSystem.id;
        }

        // SubEmitters
        if (parsedParticleSystem.subEmitters) {
            particleSystem.subEmitters = [];
            for (const cell of parsedParticleSystem.subEmitters) {
                const cellArray = [];
                for (const sub of cell) {
                    cellArray.push(SubEmitter.Parse(sub, sceneOrEngine, rootUrl));
                }

                particleSystem.subEmitters.push(cellArray);
            }
        }

        ParticleSystem._Parse(parsedParticleSystem, particleSystem, sceneOrEngine, rootUrl);

        if (parsedParticleSystem.textureMask) {
            particleSystem.textureMask = Color4.FromArray(parsedParticleSystem.textureMask);
        }

        if (parsedParticleSystem.worldOffset) {
            particleSystem.worldOffset = Vector3.FromArray(parsedParticleSystem.worldOffset);
        }

        // Auto start
        if (parsedParticleSystem.preventAutoStart) {
            particleSystem.preventAutoStart = parsedParticleSystem.preventAutoStart;
        }

        if (!doNotStart && !particleSystem.preventAutoStart) {
            particleSystem.start();
        }

        return particleSystem;
    }

    /**
     * Serializes the particle system to a JSON object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns the JSON object
     */
    public override serialize(serializeTexture = false): any {
        const serializationObject: any = {};

        ParticleSystem._Serialize(serializationObject, this, serializeTexture);

        serializationObject.textureMask = this.textureMask.asArray();
        serializationObject.customShader = this.customShader;
        serializationObject.preventAutoStart = this.preventAutoStart;
        serializationObject.worldOffset = this.worldOffset.asArray();

        // SubEmitters
        if (this.subEmitters) {
            serializationObject.subEmitters = [];

            if (!this._subEmitters) {
                this._prepareSubEmitterInternalArray();
            }

            for (const subs of this._subEmitters) {
                const cell = [];
                for (const sub of subs) {
                    cell.push(sub.serialize(serializeTexture));
                }

                serializationObject.subEmitters.push(cell);
            }
        }

        return serializationObject;
    }

    /**
     * @internal
     */
    public static _Serialize(serializationObject: any, particleSystem: IParticleSystem, serializeTexture: boolean) {
        serializationObject.name = particleSystem.name;
        serializationObject.id = particleSystem.id;

        serializationObject.capacity = particleSystem.getCapacity();

        serializationObject.disposeOnStop = particleSystem.disposeOnStop;
        serializationObject.manualEmitCount = particleSystem.manualEmitCount;

        // Emitter
        if ((<AbstractMesh>particleSystem.emitter).position) {
            const emitterMesh = <AbstractMesh>particleSystem.emitter;
            serializationObject.emitterId = emitterMesh.id;
        } else {
            const emitterPosition = <Vector3>particleSystem.emitter;
            serializationObject.emitter = emitterPosition.asArray();
        }

        // Emitter
        if (particleSystem.particleEmitterType) {
            serializationObject.particleEmitterType = particleSystem.particleEmitterType.serialize();
        }

        if (particleSystem.particleTexture) {
            if (serializeTexture) {
                serializationObject.texture = particleSystem.particleTexture.serialize();
            } else {
                serializationObject.textureName = particleSystem.particleTexture.name;
                serializationObject.invertY = !!(particleSystem.particleTexture as any)._invertY;
            }
        }

        serializationObject.isLocal = particleSystem.isLocal;

        // Animations
        SerializationHelper.AppendSerializedAnimations(particleSystem, serializationObject);
        serializationObject.beginAnimationOnStart = particleSystem.beginAnimationOnStart;
        serializationObject.beginAnimationFrom = particleSystem.beginAnimationFrom;
        serializationObject.beginAnimationTo = particleSystem.beginAnimationTo;
        serializationObject.beginAnimationLoop = particleSystem.beginAnimationLoop;

        // Particle system
        serializationObject.startDelay = particleSystem.startDelay;
        serializationObject.renderingGroupId = particleSystem.renderingGroupId;
        serializationObject.isBillboardBased = particleSystem.isBillboardBased;
        serializationObject.billboardMode = particleSystem.billboardMode;
        serializationObject.minAngularSpeed = particleSystem.minAngularSpeed;
        serializationObject.maxAngularSpeed = particleSystem.maxAngularSpeed;
        serializationObject.minSize = particleSystem.minSize;
        serializationObject.maxSize = particleSystem.maxSize;
        serializationObject.minScaleX = particleSystem.minScaleX;
        serializationObject.maxScaleX = particleSystem.maxScaleX;
        serializationObject.minScaleY = particleSystem.minScaleY;
        serializationObject.maxScaleY = particleSystem.maxScaleY;
        serializationObject.minEmitPower = particleSystem.minEmitPower;
        serializationObject.maxEmitPower = particleSystem.maxEmitPower;
        serializationObject.minLifeTime = particleSystem.minLifeTime;
        serializationObject.maxLifeTime = particleSystem.maxLifeTime;
        serializationObject.emitRate = particleSystem.emitRate;
        serializationObject.gravity = particleSystem.gravity.asArray();
        serializationObject.noiseStrength = particleSystem.noiseStrength.asArray();
        serializationObject.color1 = particleSystem.color1.asArray();
        serializationObject.color2 = particleSystem.color2.asArray();
        serializationObject.colorDead = particleSystem.colorDead.asArray();
        serializationObject.updateSpeed = particleSystem.updateSpeed;
        serializationObject.targetStopDuration = particleSystem.targetStopDuration;
        serializationObject.blendMode = particleSystem.blendMode;
        serializationObject.preWarmCycles = particleSystem.preWarmCycles;
        serializationObject.preWarmStepOffset = particleSystem.preWarmStepOffset;
        serializationObject.minInitialRotation = particleSystem.minInitialRotation;
        serializationObject.maxInitialRotation = particleSystem.maxInitialRotation;
        serializationObject.startSpriteCellID = particleSystem.startSpriteCellID;
        serializationObject.spriteCellLoop = particleSystem.spriteCellLoop;
        serializationObject.endSpriteCellID = particleSystem.endSpriteCellID;
        serializationObject.spriteCellChangeSpeed = particleSystem.spriteCellChangeSpeed;
        serializationObject.spriteCellWidth = particleSystem.spriteCellWidth;
        serializationObject.spriteCellHeight = particleSystem.spriteCellHeight;
        serializationObject.spriteRandomStartCell = particleSystem.spriteRandomStartCell;
        serializationObject.isAnimationSheetEnabled = particleSystem.isAnimationSheetEnabled;
        serializationObject.useLogarithmicDepth = particleSystem.useLogarithmicDepth;

        const colorGradients = particleSystem.getColorGradients();
        if (colorGradients) {
            serializationObject.colorGradients = [];
            for (const colorGradient of colorGradients) {
                const serializedGradient: any = {
                    gradient: colorGradient.gradient,
                    color1: colorGradient.color1.asArray(),
                };

                if (colorGradient.color2) {
                    serializedGradient.color2 = colorGradient.color2.asArray();
                } else {
                    serializedGradient.color2 = colorGradient.color1.asArray();
                }

                serializationObject.colorGradients.push(serializedGradient);
            }
        }

        const rampGradients = particleSystem.getRampGradients();
        if (rampGradients) {
            serializationObject.rampGradients = [];
            for (const rampGradient of rampGradients) {
                const serializedGradient: any = {
                    gradient: rampGradient.gradient,
                    color: rampGradient.color.asArray(),
                };

                serializationObject.rampGradients.push(serializedGradient);
            }
            serializationObject.useRampGradients = particleSystem.useRampGradients;
        }

        const colorRemapGradients = particleSystem.getColorRemapGradients();
        if (colorRemapGradients) {
            serializationObject.colorRemapGradients = [];
            for (const colorRemapGradient of colorRemapGradients) {
                const serializedGradient: any = {
                    gradient: colorRemapGradient.gradient,
                    factor1: colorRemapGradient.factor1,
                };

                if (colorRemapGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = colorRemapGradient.factor2;
                } else {
                    serializedGradient.factor2 = colorRemapGradient.factor1;
                }

                serializationObject.colorRemapGradients.push(serializedGradient);
            }
        }

        const alphaRemapGradients = particleSystem.getAlphaRemapGradients();
        if (alphaRemapGradients) {
            serializationObject.alphaRemapGradients = [];
            for (const alphaRemapGradient of alphaRemapGradients) {
                const serializedGradient: any = {
                    gradient: alphaRemapGradient.gradient,
                    factor1: alphaRemapGradient.factor1,
                };

                if (alphaRemapGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = alphaRemapGradient.factor2;
                } else {
                    serializedGradient.factor2 = alphaRemapGradient.factor1;
                }

                serializationObject.alphaRemapGradients.push(serializedGradient);
            }
        }

        const sizeGradients = particleSystem.getSizeGradients();
        if (sizeGradients) {
            serializationObject.sizeGradients = [];
            for (const sizeGradient of sizeGradients) {
                const serializedGradient: any = {
                    gradient: sizeGradient.gradient,
                    factor1: sizeGradient.factor1,
                };

                if (sizeGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = sizeGradient.factor2;
                } else {
                    serializedGradient.factor2 = sizeGradient.factor1;
                }

                serializationObject.sizeGradients.push(serializedGradient);
            }
        }

        const angularSpeedGradients = particleSystem.getAngularSpeedGradients();
        if (angularSpeedGradients) {
            serializationObject.angularSpeedGradients = [];
            for (const angularSpeedGradient of angularSpeedGradients) {
                const serializedGradient: any = {
                    gradient: angularSpeedGradient.gradient,
                    factor1: angularSpeedGradient.factor1,
                };

                if (angularSpeedGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = angularSpeedGradient.factor2;
                } else {
                    serializedGradient.factor2 = angularSpeedGradient.factor1;
                }

                serializationObject.angularSpeedGradients.push(serializedGradient);
            }
        }

        const velocityGradients = particleSystem.getVelocityGradients();
        if (velocityGradients) {
            serializationObject.velocityGradients = [];
            for (const velocityGradient of velocityGradients) {
                const serializedGradient: any = {
                    gradient: velocityGradient.gradient,
                    factor1: velocityGradient.factor1,
                };

                if (velocityGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = velocityGradient.factor2;
                } else {
                    serializedGradient.factor2 = velocityGradient.factor1;
                }

                serializationObject.velocityGradients.push(serializedGradient);
            }
        }

        const dragGradients = particleSystem.getDragGradients();
        if (dragGradients) {
            serializationObject.dragGradients = [];
            for (const dragGradient of dragGradients) {
                const serializedGradient: any = {
                    gradient: dragGradient.gradient,
                    factor1: dragGradient.factor1,
                };

                if (dragGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = dragGradient.factor2;
                } else {
                    serializedGradient.factor2 = dragGradient.factor1;
                }

                serializationObject.dragGradients.push(serializedGradient);
            }
        }

        const emitRateGradients = particleSystem.getEmitRateGradients();
        if (emitRateGradients) {
            serializationObject.emitRateGradients = [];
            for (const emitRateGradient of emitRateGradients) {
                const serializedGradient: any = {
                    gradient: emitRateGradient.gradient,
                    factor1: emitRateGradient.factor1,
                };

                if (emitRateGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = emitRateGradient.factor2;
                } else {
                    serializedGradient.factor2 = emitRateGradient.factor1;
                }

                serializationObject.emitRateGradients.push(serializedGradient);
            }
        }

        const startSizeGradients = particleSystem.getStartSizeGradients();
        if (startSizeGradients) {
            serializationObject.startSizeGradients = [];
            for (const startSizeGradient of startSizeGradients) {
                const serializedGradient: any = {
                    gradient: startSizeGradient.gradient,
                    factor1: startSizeGradient.factor1,
                };

                if (startSizeGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = startSizeGradient.factor2;
                } else {
                    serializedGradient.factor2 = startSizeGradient.factor1;
                }

                serializationObject.startSizeGradients.push(serializedGradient);
            }
        }

        const lifeTimeGradients = particleSystem.getLifeTimeGradients();
        if (lifeTimeGradients) {
            serializationObject.lifeTimeGradients = [];
            for (const lifeTimeGradient of lifeTimeGradients) {
                const serializedGradient: any = {
                    gradient: lifeTimeGradient.gradient,
                    factor1: lifeTimeGradient.factor1,
                };

                if (lifeTimeGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = lifeTimeGradient.factor2;
                } else {
                    serializedGradient.factor2 = lifeTimeGradient.factor1;
                }

                serializationObject.lifeTimeGradients.push(serializedGradient);
            }
        }

        const limitVelocityGradients = particleSystem.getLimitVelocityGradients();
        if (limitVelocityGradients) {
            serializationObject.limitVelocityGradients = [];
            for (const limitVelocityGradient of limitVelocityGradients) {
                const serializedGradient: any = {
                    gradient: limitVelocityGradient.gradient,
                    factor1: limitVelocityGradient.factor1,
                };

                if (limitVelocityGradient.factor2 !== undefined) {
                    serializedGradient.factor2 = limitVelocityGradient.factor2;
                } else {
                    serializedGradient.factor2 = limitVelocityGradient.factor1;
                }

                serializationObject.limitVelocityGradients.push(serializedGradient);
            }

            serializationObject.limitVelocityDamping = particleSystem.limitVelocityDamping;
        }

        if (particleSystem.noiseTexture) {
            serializationObject.noiseTexture = particleSystem.noiseTexture.serialize();
        }
    }

    // Clone
    /**
     * Clones the particle system.
     * @param name The name of the cloned object
     * @param newEmitter The new emitter to use
     * @param cloneTexture Also clone the textures if true
     * @returns the cloned particle system
     */
    public override clone(name: string, newEmitter: any, cloneTexture = false): ParticleSystem {
        const custom = { ...this._customWrappers };
        let program: any = null;
        const engine = this._engine;
        if (engine.createEffectForParticles) {
            if (this.customShader != null) {
                program = this.customShader;
                const defines: string = program.shaderOptions.defines.length > 0 ? program.shaderOptions.defines.join("\n") : "";
                const effect = engine.createEffectForParticles(program.shaderPath.fragmentElement, program.shaderOptions.uniforms, program.shaderOptions.samplers, defines);
                if (!custom[0]) {
                    this.setCustomEffect(effect, 0);
                } else {
                    custom[0].effect = effect;
                }
            }
        }

        const serialization = this.serialize(cloneTexture);
        const result = ParticleSystem.Parse(serialization, this._scene || this._engine, this._rootUrl);
        result.name = name;
        result.customShader = program;
        result._customWrappers = custom;

        if (newEmitter === undefined) {
            newEmitter = this.emitter;
        }

        if (this.noiseTexture) {
            result.noiseTexture = this.noiseTexture.clone();
        }

        result.emitter = newEmitter;
        if (!this.preventAutoStart) {
            result.start();
        }

        return result;
    }
}

SubEmitter._ParseParticleSystem = ParticleSystem.Parse;
