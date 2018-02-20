module BABYLON {
    /**
     * Interface representing a particle system in Babylon.
     * This groups the common functionalities that needs to be implemented in order to create a particle system.
     * A particle system represents a way to manage particles (@see Particle) from their emission to their animation and rendering.
     */
    export interface IParticleSystem {
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
        particleTexture: Nullable<Texture>;   
        
        /**
         * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE or ParticleSystem.BLENDMODE_STANDARD.
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
         * The particle emitter type defines the emitter used by the particle system.
         * It can be for example box, sphere, or cone...
         */
        particleEmitterType: Nullable<IParticleEmitterType>;        

        /**
         * Gets the maximum number of particles active at the same time.
         * @returns The max number of active particles.
         */
        getCapacity(): number;

        /**
         * Gets Wether the system has been started.
         * @returns True if it has been started, otherwise false.
         */
        isStarted(): boolean;

        /**
         * Gets if the particle system has been started.
         * @return true if the system has been started, otherwise false.
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
         * Clones the particle system.
         * @param name The name of the cloned object
         * @param newEmitter The new emitter to use
         * @returns the cloned particle system
         */
        clone(name: string, newEmitter: any): Nullable<IParticleSystem>;
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */
        serialize(): any;
        /**
         * Rebuild the particle system
         */
        rebuild(): void;

        /**
         * Starts the particle system and begins to emit.
         */
        start(): void;

        /**
         * Stops the particle system.
         */
        stop(): void;

        /**
         * Remove all active particles
         */
        reset(): void;
    }
}