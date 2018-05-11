module BABYLON {
    /**
     * Represents all available shapes for the emitter
     */
    export enum EmitterShapes {
        Box = "box",
        Sphere = "sphere",
        DirectedSphere = "directed_sphere",
        Cone = "cone"
    }
    /**
     * Represents all the data needed to create a ParticleSystem.
     */
    export interface IParticleSystemData {
        /**
         * ParticleSystem type
         */
        type: string;
        /**
         * Shape of the emitter
         */
        emitterType: string
        /**
         * Maximum number of particles in the system
         */
        capacity: number;
        /**
         * Link for the texture file
         */
        textureFile: string;
        /**
         * minEmitBox Vector3
         */
        minEmitBox?: { x: number, y: number, z: number };
        /**
         * maxEmitBox Vector3
         */
        maxEmitBox?: { x: number, y: number, z: number };
        /**
         * color1 Color4
         */
        color1: { r: number, g: number, b: number, a: number };
        /**
         * color2 Color4
         */
        color2: { r: number, g: number, b: number, a: number };
        /**
         * colorDead Color4
         */
        colorDead: { r: number, g: number, b: number, a: number };
        /**
         * Minimum size of each particle
         */
        minSize: number;
        /**
         * Maximum size of each particle
         */
        maxSize: number;
        /**
         * Minimum lifetime for each particle
         */
        minLifeTime: number;
        /**
         * Maximum lifetime for each particle
         */
        maxLifeTime: number;
        /**
         * Emit rate
         */
        emitRate: number;
        /**
         * Blend Mode
         */
        blendMode: number;
        /**
         * gravity Vector3
         */
        gravity: { x: number, y: number, z: number };
        /**
         * direction1 Vector3
         */
        direction1?: { x: number, y: number, z: number };
        /**
         * direction2 Vector3
         */
        direction2?: { x: number, y: number, z: number };
        /**
         * Minimum Angular Speed
         */
        minAngularSpeed: number;
        /**
         * Maximum Angular Speed
         */
        maxAngularSpeed: number;
        /**
         * Minimum Emit Power
         */
        minEmitPower: number;
        /**
         * Maximum Emit Power
         */
        maxEmitPower: number;
        /**
         * Update Speed
         */
        updateSpeed: number;
        /**
         * Radius
         */
        radius?: number;
        /**
         * Angle
         */
        angle?: number;
    }
    /**
     * This class is made for on one-liner static method to help creating particle systems.
     */
    export class ParticleHelper {
        /**
         * Base Assets URL.
         */
        private static _baseAssetsUrl = "https://assets.babylonjs.com/particles";

        private static _scene: Scene;

        private static _emitter: AbstractMesh;

        /**
         * This is the main static method (one-liner) of this helper to create different particle systems.
         * @param type This string represents the type to the particle system to create
         * @param emitter The object where the particle system will start to emit from.
         * @param scene The scene where the particle system should live.
         * @param gpu If the system will use gpu.
         * @returns the ParticleSystem created.
         */
        public static CreateAsync(type: string, emitter: AbstractMesh,
                                   scene: Nullable<Scene> = Engine.LastCreatedScene, gpu: boolean = false): Promise<ParticleSystem> {
            
            return new Promise((resolve, reject) => {
                if (scene) {
                    this._scene = scene;
                } else {
                    return reject("A particle system need a scene.");
                }

                if (gpu && !GPUParticleSystem.IsSupported) {
                    return reject("Particle system with GPU is not supported.");
                }

                this._emitter = emitter;

                Tools.LoadFile(`${this._baseAssetsUrl}/systems/${type}.json`, (data, response) => {
                    const newData = JSON.parse(data.toString()) as IParticleSystemData;
                    return resolve(this._createSystem(newData));
                }, undefined, undefined, undefined, (req, exception) => {
                    return reject(`An error occured while the creation of your particle system. Check if your type '${type}' exists.`);
                });

            });
        }

        private static _createSystem(data: IParticleSystemData): ParticleSystem {
            // Create a particle system
            const system = new ParticleSystem(data.type, data.capacity, this._scene);
            // Texture of each particle
            system.particleTexture = new Texture(`${this._baseAssetsUrl}/textures/${data.textureFile}`, this._scene);
            // Where the particles come from
            system.emitter = this._emitter; // the starting object, the emitter

            // Colors of all particles
            system.color1 = new Color4(data.color1.r, data.color1.g, data.color1.b, data.color1.a);
            system.color2 = new Color4(data.color2.r, data.color2.g, data.color2.b, data.color2.a);
            system.colorDead = new Color4(data.colorDead.r, data.colorDead.g, data.colorDead.b, data.colorDead.a);

            // Size of each particle (random between...
            system.minSize = data.minSize;
            system.maxSize = data.maxSize;

            // Life time of each particle (random between...
            system.minLifeTime = data.minLifeTime;
            system.maxLifeTime = data.maxLifeTime;

            // Emission rate
            system.emitRate = data.emitRate;

            // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
            system.blendMode = data.blendMode;

            // Set the gravity of all particles
            system.gravity = new Vector3(data.gravity.x, data.gravity.y, data.gravity.z);

            // Angular speed, in radians
            system.minAngularSpeed = data.minAngularSpeed;
            system.maxAngularSpeed = data.maxAngularSpeed;

            // Speed
            system.minEmitPower = data.minEmitPower;
            system.maxEmitPower = data.maxEmitPower;
            system.updateSpeed = data.updateSpeed;

            switch (data.emitterType) {
                case EmitterShapes.Box:

                    if (!data.direction1 || !data.direction2) {
                        throw new Error("Directions are missing in this particle system.");
                    }

                    if (!data.minEmitBox || !data.maxEmitBox) {
                        throw new Error("EmitBox is missing in this particle system.");
                    }

                    const boxEmitter = system.createBoxEmitter(
                        new Vector3(data.direction1.x, data.direction1.y, data.direction1.z),
                        new Vector3(data.direction2.x, data.direction2.y, data.direction2.z),
                        new Vector3(data.minEmitBox.x, data.minEmitBox.y, data.minEmitBox.z),
                        new Vector3(data.maxEmitBox.x, data.maxEmitBox.y, data.maxEmitBox.z)
                    );
                    break;
                case EmitterShapes.Sphere:
                    const sphereEmitter = system.createSphereEmitter(data.radius);
                    break;
                case EmitterShapes.DirectedSphere:
                    
                    if (!data.direction1 || !data.direction2) {
                        throw new Error("Directions are missing in this particle system.");
                    }
                    
                    const directedSphereEmitter = system.createDirectedSphereEmitter(
                        data.radius,
                        new Vector3(data.direction1.x, data.direction1.y, data.direction1.z),
                        new Vector3(data.direction2.x, data.direction2.y, data.direction2.z)
                    );
                    break;
                case EmitterShapes.Cone:
                    const coneEmitter = system.createConeEmitter(data.radius, data.angle);
                    break;
                default:
                    break;
            }

            return system;
        }
    }

}