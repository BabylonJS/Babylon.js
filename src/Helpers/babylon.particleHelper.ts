module BABYLON {
    /**
     * Represents all the data needed to create a ParticleSystem.
     */
    export interface IParticleSystemData {
        type: ParticleSystemType;
        capacity: number;
        textureFile: string;
        minEmitBox: { x: number, y: number, z: number };
        maxEmitBox: { x: number, y: number, z: number };
        color1: { r: number, g: number, b: number, a: number };
        color2: { r: number, g: number, b: number, a: number };
        colorDead: { r: number, g: number, b: number, a: number };
        minSize: number;
        maxSize: number;
        minLifeTime: number;
        maxLifeTime: number;
        emitRate: number;
        blendMode: number;
        gravity: { x: number, y: number, z: number };
        direction1: { x: number, y: number, z: number };
        direction2: { x: number, y: number, z: number };
        minAngularSpeed: number;
        maxAngularSpeed: number;
        minEmitPower: number;
        maxEmitPower: number;
        updateSpeed: number;
    }
    /**
     * ParticleSystemType
     */
    export enum ParticleSystemType {
        /**
         * None is to represents an error in parsing the type string in the create method.
         */
        None = "none",
        /**
         * Fire particle system.
         */
        Fire = "fire",
        /**
         * Smoke particle system.
         */
        Smoke = "smoke"
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
         * @param type This string will be parsed to a ParticleSystemType
         * @param emitter The object where the particle system will start to emit from.
         * @param scene The scene where the particle system should live.
         * @param gpu If the system will use gpu.
         * @returns the ParticleSystem created.
         */
        public static Create(type: string, emitter: AbstractMesh,
                                   scene: Nullable<Scene> = Engine.LastCreatedScene, gpu: boolean = false): Promise<ParticleSystem> {
            
            return new Promise((resolve, reject) => {
                const typeParsed = this._parseType(type);
                if (typeParsed === ParticleSystemType.None) {
                    throw new Error("This particle system type doesn't exist.");
                }

                if (scene) {
                    this._scene = scene;
                } else {
                    throw new Error("A particle system need a scene.");
                }

                this._emitter = emitter;

                Tools.LoadFile(`${this._baseAssetsUrl}/systems/${typeParsed}.json`, (data, response) => {
                    const newData = JSON.parse(data.toString()) as IParticleSystemData;
                    return resolve(this._createSystem(newData));
                });

            });
        }

        private static _parseType(type: string): ParticleSystemType {
            switch (type) {
                case "fire":
                case "Fire":
                case "FIRE":
                    return ParticleSystemType.Fire;
                case "smoke":
                case "Smoke":
                case "SMOKE":
                    return ParticleSystemType.Smoke;
                default:
                    return ParticleSystemType.None;
            }
        }

        private static _createSystem(data: IParticleSystemData): ParticleSystem {
            // Create a particle system
            const fireSystem = new ParticleSystem(data.type, data.capacity, this._scene);
            // Texture of each particle
            fireSystem.particleTexture = new Texture(`${this._baseAssetsUrl}/textures/${data.textureFile}`, this._scene);
            // Where the particles come from
            fireSystem.emitter = this._emitter; // the starting object, the emitter
            fireSystem.minEmitBox = new Vector3(data.minEmitBox.x, data.minEmitBox.y, data.minEmitBox.z); // Starting all from
            fireSystem.maxEmitBox = new Vector3(data.maxEmitBox.x, data.maxEmitBox.y, data.maxEmitBox.z); // To...

            // Colors of all particles
            fireSystem.color1 = new Color4(data.color1.r, data.color1.g, data.color1.b, data.color1.a);
            fireSystem.color2 = new Color4(data.color2.r, data.color2.g, data.color2.b, data.color2.a);
            fireSystem.colorDead = new Color4(data.colorDead.r, data.colorDead.g, data.colorDead.b, data.colorDead.a);

            // Size of each particle (random between...
            fireSystem.minSize = data.minSize;
            fireSystem.maxSize = data.maxSize;

            // Life time of each particle (random between...
            fireSystem.minLifeTime = data.minLifeTime;
            fireSystem.maxLifeTime = data.maxLifeTime;

            // Emission rate
            fireSystem.emitRate = data.emitRate;

            // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
            fireSystem.blendMode = data.blendMode;

            // Set the gravity of all particles
            fireSystem.gravity = new Vector3(data.gravity.x, data.gravity.y, data.gravity.z);

            // Direction of each particle after it has been emitted
            fireSystem.direction1 = new Vector3(data.direction1.x, data.direction1.y, data.direction1.z);
            fireSystem.direction2 = new Vector3(data.direction2.x, data.direction2.y, data.direction2.z);

            // Angular speed, in radians
            fireSystem.minAngularSpeed = data.minAngularSpeed;
            fireSystem.maxAngularSpeed = data.maxAngularSpeed;

            // Speed
            fireSystem.minEmitPower = data.minEmitPower;
            fireSystem.maxEmitPower = data.maxEmitPower;
            fireSystem.updateSpeed = data.updateSpeed;

            return fireSystem;
        }
    }

}