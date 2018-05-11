module BABYLON {
    /**
     * ParticleSystemType
     */
    export enum ParticleSystemType {
        /**
         * None is to represents an error in parsing the type string in the create method.
         */
        None,
        /**
         * Fire particle system.
         */
        Fire,
        /**
         * Smoke particle system.
         */
        Smoke
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
        public static Create(type: string, emitter: AbstractMesh, scene: Nullable<Scene> = Engine.LastCreatedScene, gpu: boolean = false): ParticleSystem {
            
            Tools.LoadFile(`${this._baseAssetsUrl}/fire.json`, (data, response) => {
                console.log(data, response);
            });
            
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

            switch (typeParsed) {
                case ParticleSystemType.Fire:
                    return this._createFire();
                case ParticleSystemType.Smoke:
                    return this._createSmoke();
                default:
                    throw new Error("Not yet implemented.");
            }
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

        private static _createFire(): ParticleSystem {
            // Create a particle system
            const fireSystem = new ParticleSystem("particles", 2000, this._scene);
            // Texture of each particle
            fireSystem.particleTexture = new Texture(`${this._baseAssetsUrl}/textures/flare.png`, this._scene);
            // Where the particles come from
            fireSystem.emitter = this._emitter; // the starting object, the emitter
            fireSystem.minEmitBox = new Vector3(-0.5, 1, -0.5); // Starting all from
            fireSystem.maxEmitBox = new Vector3(0.5, 1, 0.5); // To...

            // Colors of all particles
            fireSystem.color1 = new Color4(1, 0.5, 0, 1.0);
            fireSystem.color2 = new Color4(1, 0.5, 0, 1.0);
            fireSystem.colorDead = new Color4(0, 0, 0, 0.0);

            // Size of each particle (random between...
            fireSystem.minSize = 0.3;
            fireSystem.maxSize = 1;

            // Life time of each particle (random between...
            fireSystem.minLifeTime = 0.2;
            fireSystem.maxLifeTime = 0.4;

            // Emission rate
            fireSystem.emitRate = 600;

            // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
            fireSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

            // Set the gravity of all particles
            fireSystem.gravity = new Vector3(0, 0, 0);

            // Direction of each particle after it has been emitted
            fireSystem.direction1 = new Vector3(0, 4, 0);
            fireSystem.direction2 = new Vector3(0, 4, 0);

            // Angular speed, in radians
            fireSystem.minAngularSpeed = 0;
            fireSystem.maxAngularSpeed = Math.PI;

            // Speed
            fireSystem.minEmitPower = 1;
            fireSystem.maxEmitPower = 3;
            fireSystem.updateSpeed = 0.007;

            return fireSystem;
        }

        private static _createSmoke(): ParticleSystem {
            const smokeSystem = new ParticleSystem("smoke", 1000, this._scene);
            smokeSystem.particleTexture = new Texture(`${this._baseAssetsUrl}/textures/flare.png`, this._scene);
            smokeSystem.emitter = this._emitter;
            smokeSystem.minEmitBox = new Vector3(-0.5, 1, -0.5);
            smokeSystem.maxEmitBox = new Vector3(0.5, 1, 0.5);
            
            smokeSystem.color1 = new Color4(0.1, 0.1, 0.1, 1.0);
            smokeSystem.color2 = new Color4(0.1, 0.1, 0.1, 1.0);
            smokeSystem.colorDead = new Color4(0, 0, 0, 0.0);
            
            smokeSystem.minSize = 0.3;
            smokeSystem.maxSize = 1;

            smokeSystem.minLifeTime = 0.3;
            smokeSystem.maxLifeTime = 1.5;

            smokeSystem.emitRate = 350;

            smokeSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

            smokeSystem.gravity = new Vector3(0, 0, 0);

            smokeSystem.direction1 = new Vector3(-1.5, 8, -1.5);
            smokeSystem.direction2 = new Vector3(1.5, 8, 1.5);

            smokeSystem.minAngularSpeed = 0;
            smokeSystem.maxAngularSpeed = Math.PI;

            smokeSystem.minEmitPower = 0.5;
            smokeSystem.maxEmitPower = 1.5;
            smokeSystem.updateSpeed = 0.005;

            return smokeSystem;
        }
    }

}