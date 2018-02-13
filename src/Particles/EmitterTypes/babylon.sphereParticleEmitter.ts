module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles alongside the sphere radius. The emission direction might be randomized.
     */
    export class SphereParticleEmitter implements IParticleEmitterType {

        /**
         * Creates a new instance of @see SphereParticleEmitter
         * @param radius the radius of the emission sphere (1 by default)
         * @param directionRandomizer defines how much to randomize the particle direction [0-1]
         */
        constructor(
            /**
             * The radius of the emission sphere.
             */
            public radius = 1, 
            /**
             * How much to randomize the particle direction [0-1].
             */
            public directionRandomizer = 0) {

        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        public startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
            var randX = Scalar.RandomRange(0, this.directionRandomizer);
            var randY = Scalar.RandomRange(0, this.directionRandomizer);
            var randZ = Scalar.RandomRange(0, this.directionRandomizer);
            direction.x += randX;
            direction.y += randY;
            direction.z += randZ;
            direction.normalize();

            Vector3.TransformNormalFromFloatsToRef(direction.x * emitPower, direction.y * emitPower, direction.z * emitPower, worldMatrix, directionToUpdate);
        }

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var phi = Scalar.RandomRange(0, 2 * Math.PI);
            var theta = Scalar.RandomRange(0, Math.PI);
            var randRadius = Scalar.RandomRange(0, this.radius);
            var randX = randRadius * Math.cos(phi) * Math.sin(theta);
            var randY = randRadius * Math.cos(theta);
            var randZ = randRadius * Math.sin(phi) * Math.sin(theta);
            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }

        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        public clone(): SphereParticleEmitter {
            let newOne = new SphereParticleEmitter(this.radius, this.directionRandomizer);

            Tools.DeepCopy(this, newOne);

            return newOne;
        }    
        
        /**
         * Called by the {BABYLON.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */        
        public applyToShader(effect: Effect): void {
            effect.setFloat("radius", this.radius);
            effect.setFloat("directionRandomizer", this.directionRandomizer);
        }    
        
        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        public getEffectDefines(): string {
            return "#define SPHEREEMITTER"
        }   
        
        /**
         * Returns the string "SphereParticleEmitter"
         * @returns a string containing the class name
         */
        public getClassName(): string {
            return "SphereParticleEmitter";
        }         
        
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */        
        public serialize(): any {
            var serializationObject: any = {};
            serializationObject.type = this.getClassName();
            serializationObject.radius = this.radius;
            serializationObject.directionRandomizer = this.directionRandomizer;

            return serializationObject;
        }    
        
        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        public parse(serializationObject: any): void {
            this.radius = serializationObject.radius;
            this.directionRandomizer = serializationObject.directionRandomizer;
        }          
    }

    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles randomly between two vectors.
     */
    export class SphereDirectedParticleEmitter extends SphereParticleEmitter {

        /**
         * Creates a new instance of @see SphereDirectedParticleEmitter
         * @param radius the radius of the emission sphere (1 by default)
         * @param direction1 the min limit of the emission direction (up vector by default)
         * @param direction2 the max limit of the emission direction (up vector by default)
         */
        constructor(radius = 1, 
            /**
             * The min limit of the emission direction.
             */
            public direction1 = new Vector3(0, 1, 0), 
            /**
             * The max limit of the emission direction.
             */
            public direction2 = new Vector3(0, 1, 0)) {
            super(radius);
        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        public startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
            var randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
            var randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);
            Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        }

        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        public clone(): SphereDirectedParticleEmitter {
            let newOne = new SphereDirectedParticleEmitter(this.radius, this.direction1, this.direction2);

            Tools.DeepCopy(this, newOne);

            return newOne;
        }     
        
        /**
         * Called by the {BABYLON.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */        
        public applyToShader(effect: Effect): void {
            effect.setFloat("radius", this.radius);
            effect.setVector3("direction1", this.direction1);
            effect.setVector3("direction2", this.direction2);
        }       
        
        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        public getEffectDefines(): string {
            return "#define SPHEREEMITTER\n#define DIRECTEDSPHEREEMITTER"
        }    
        
        /**
         * Returns the string "SphereDirectedParticleEmitter"
         * @returns a string containing the class name
         */
        public getClassName(): string {
            return "SphereDirectedParticleEmitter";
        }       
        
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */        
        public serialize(): any {
            var serializationObject = super.serialize();;

            serializationObject.direction1 = this.direction1.asArray();;
            serializationObject.direction2 = this.direction2.asArray();;

            return serializationObject;
        }    
        
        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        public parse(serializationObject: any): void {
            super.parse(serializationObject);
            this.direction1.copyFrom(serializationObject.direction1);
            this.direction2.copyFrom(serializationObject.direction2);
        }           
    }
}