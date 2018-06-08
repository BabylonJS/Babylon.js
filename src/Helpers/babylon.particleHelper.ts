module BABYLON {
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
         * Minimum scale of each particle on X axis
         */
        minScaleX: number;
        /**
         * Maximum scale of each particle on X axis
         */
        maxScaleX: number;       
        /**
         * Minimum scale of each particle on Y axis
         */
        minScaleY: number;
        /**
         * Maximum scale of each particle on Y axis
         */
        maxScaleY: number;           
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
                if (!scene) {
                    scene = Engine.LastCreatedScene;;
                }

                if (gpu && !GPUParticleSystem.IsSupported) {
                    return reject("Particle system with GPU is not supported.");
                }

                Tools.LoadFile(`${ParticleHelper._baseAssetsUrl}/systems/${type}.json`, (data, response) => {
                    const newData = JSON.parse(data.toString()) as IParticleSystemData;
                    return resolve(ParticleHelper.CreateSystem(newData, scene!, emitter));
                }, undefined, undefined, undefined, (req, exception) => {
                    return reject(`An error occured while the creation of your particle system. Check if your type '${type}' exists.`);
                });

            });
        }

        /**
         * Static function used to create a new particle system from a IParticleSystemData
         * @param data defines the source data
         * @param scene defines the hosting scene
         * @param emitter defines the particle emitter
         * @returns a new ParticleSystem based on referenced data
         */
        public static CreateSystem(data: IParticleSystemData, scene: Scene, emitter: AbstractMesh): ParticleSystem {
            // Create a particle system
            const system = new ParticleSystem(data.type, data.capacity, scene);

            // Where the particles come from
            system.emitter = emitter; // the starting object, the emitter            

            ParticleHelper.UpdateSystem(system, data, scene);

            return system;
        }

        /**
         * Static function used to update a particle system from a IParticleSystemData
         * @param system defines the particle system to update
         * @param data defines the source data
         * @param scene defines the hosting scene
         */
        public static UpdateSystem(system: ParticleSystem, data: IParticleSystemData, scene: Scene): void {
            // Texture of each particle
            if (data.textureFile) {
                system.particleTexture = new Texture(`${ParticleHelper._baseAssetsUrl}/textures/${data.textureFile}`, scene);
            }

            // Colors of all particles
            system.color1 = new Color4(data.color1.r, data.color1.g, data.color1.b, data.color1.a);
            system.color2 = new Color4(data.color2.r, data.color2.g, data.color2.b, data.color2.a);
            system.colorDead = new Color4(data.colorDead.r, data.colorDead.g, data.colorDead.b, data.colorDead.a);

            // Size of each particle (random between...
            system.minSize = data.minSize;
            system.maxSize = data.maxSize;

            system.minScaleX = data.minScaleX;
            system.maxScaleX = data.maxScaleX;    
            
            system.minScaleY = data.minScaleY;
            system.maxScaleY = data.maxScaleY;              

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
                case "box":

                    if (!data.direction1 || !data.direction2) {
                        throw new Error("Directions are missing in this particle system.");
                    }

                    if (!data.minEmitBox || !data.maxEmitBox) {
                        throw new Error("EmitBox is missing in this particle system.");
                    }

                    system.createBoxEmitter(
                        new Vector3(data.direction1.x, data.direction1.y, data.direction1.z),
                        new Vector3(data.direction2.x, data.direction2.y, data.direction2.z),
                        new Vector3(data.minEmitBox.x, data.minEmitBox.y, data.minEmitBox.z),
                        new Vector3(data.maxEmitBox.x, data.maxEmitBox.y, data.maxEmitBox.z)
                    );
                    break;
                case "sphere":
                    system.createSphereEmitter(data.radius);
                    break;
                case "directed_sphere":
                    
                    if (!data.direction1 || !data.direction2) {
                        throw new Error("Directions are missing in this particle system.");
                    }
                    
                    system.createDirectedSphereEmitter(
                        data.radius,
                        new Vector3(data.direction1.x, data.direction1.y, data.direction1.z),
                        new Vector3(data.direction2.x, data.direction2.y, data.direction2.z)
                    );
                    break;
                case "cone":
                    system.createConeEmitter(data.radius, data.angle);
                    break;
                default:
                    break;
            }
        }

        /**
         * Static function used to export a particle system to a IParticleSystemData variable.
         * Please note that texture file name is not exported and must be added manually
         * @param system defines the particle system to export
         */
        public static ExportSystem(system: ParticleSystem): IParticleSystemData {
            var outData: any = {};

            // Colors of all particles
            outData.color1 = { r: system.color1.r, g: system.color1.g, b: system.color1.b, a: system.color1.a };
            outData.color2 = { r: system.color2.r, g: system.color2.g, b: system.color2.b, a: system.color2.a };
            outData.colorDead = { r: system.colorDead.r, g: system.colorDead.g, b: system.colorDead.b, a: system.colorDead.a };

            // Size of each particle (random between...
            outData.minSize = system.minSize;
            outData.maxSize = system.maxSize;

            outData.minScaleX = system.minScaleX;
            outData.maxScaleX = system.maxScaleX;     
            
            outData.minScaleY = system.minScaleY;
            outData.maxScaleY = system.maxScaleY;             

            // Life time of each particle (random between...
            outData.minLifeTime = system.minLifeTime;
            outData.maxLifeTime = system.maxLifeTime;

            // Emission rate
            outData.emitRate = system.emitRate;

            // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
            outData.blendMode = system.blendMode;

            // Set the gravity of all particles
            outData.gravity = {x: system.gravity.x, y: system.gravity.y, z: system.gravity.z};

            // Angular speed, in radians
            outData.minAngularSpeed = system.minAngularSpeed;
            outData.maxAngularSpeed = system.maxAngularSpeed;

            // Speed
            outData.minEmitPower = system.minEmitPower;
            outData.maxEmitPower = system.maxEmitPower;
            outData.updateSpeed = system.updateSpeed;

            
            switch (system.particleEmitterType.getClassName()) {
                case "BoxEmitter":
                    outData.emitterType = "box";
                    outData.direction1 = {x: system.direction1.x, y: system.direction1.y, z: system.direction1.z };
                    outData.direction2 = {x: system.direction2.x, y: system.direction2.y, z: system.direction2.z };
                    outData.minEmitBox = {x: system.minEmitBox.x, y: system.minEmitBox.y, z: system.minEmitBox.z };
                    outData.maxEmitBox = {x: system.maxEmitBox.x, y: system.maxEmitBox.y, z: system.maxEmitBox.z };
                    break;
                case "SphereParticleEmitter":
                    outData.emitterType = "sphere";
                    outData.radius = (system.particleEmitterType as SphereParticleEmitter).radius;
                    break;
                case "SphereDirectedParticleEmitter":
                    outData.emitterType = "directed_sphere";
                    var sphereDirectedParticleEmitter = system.particleEmitterType as SphereDirectedParticleEmitter;
                    outData.radius = sphereDirectedParticleEmitter.radius;
                    outData.direction1 = {x: sphereDirectedParticleEmitter.direction1.x, y: sphereDirectedParticleEmitter.direction1.y, z: sphereDirectedParticleEmitter.direction1.z };
                    outData.direction2 = {x: sphereDirectedParticleEmitter.direction2.x, y: sphereDirectedParticleEmitter.direction2.y, z: sphereDirectedParticleEmitter.direction2.z };                
                    break;
                case "ConeEmitter":
                    outData.emitterType = "cone";
                    outData.radius = (system.particleEmitterType as ConeParticleEmitter).radius;
                    outData.angle = (system.particleEmitterType as ConeParticleEmitter).angle;
                    break;
                default:
                    break;
            }

            return outData;
        }
    }

}