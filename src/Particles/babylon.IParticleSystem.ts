module BABYLON {
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
        particleTexture: Nullable<Texture>;   
        
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
         * Only BABYLON.AbstractMesh.BILLBOARDMODE_ALL and AbstractMesh.BILLBOARDMODE_Y are supported so far
         */
        billboardMode: number;

        /** Gets or sets a value indicating the damping to apply if the limit velocity factor is reached */
        limitVelocityDamping: number;

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
         * Is this system ready to be used/rendered
         * @return true if the system is ready
         */
        isReady(): boolean; 
        /**
         * Adds a new color gradient
         * @param gradient defines the gradient to use (between 0 and 1)
         * @param color defines the color to affect to the specified gradient
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
    }  
}