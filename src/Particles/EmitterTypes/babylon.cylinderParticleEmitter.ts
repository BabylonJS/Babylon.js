module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a cylinder.
     * It emits the particles alongside the cylinder radius. The emission direction might be randomized.
     */
    export class CylinderParticleEmitter implements IParticleEmitterType {
         /**
         * Creates a new instance CylinderParticleEmitter
         * @param radius the radius of the emission cylinder (1 by default)
         * @param height the height of the emission cylinder (1 by default)
         * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default) 
         * @param directionRandomizer defines how much to randomize the particle direction [0-1]
         */
        constructor(
            /**
             * The radius of the emission cylinder.
             */
            public radius = 1,
            /**
             * The height of the emission cylinder.
             */
            public height = 1,
            /**
             * The range of emission [0-1] 0 Surface only, 1 Entire Radius.
             */
            public radiusRange = 1,
            /**
             * How much to randomize the particle direction [0-1].
             */
            public directionRandomizer = 0) {
        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        public startDirectionFunction(worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
            var randY = Scalar.RandomRange(-this.directionRandomizer/2, this.directionRandomizer/2);
            
            var angle = Math.atan2(direction.x, direction.z);
            angle += Scalar.RandomRange(-Math.PI/2, Math.PI/2)*this.directionRandomizer;
            
            direction.y = randY; // set direction y to rand y to mirror normal of cylinder surface
            direction.x = Math.sin(angle);
            direction.z = Math.cos(angle);
            direction.normalize();

            Vector3.TransformNormalFromFloatsToRef(direction.x, direction.y, direction.z, worldMatrix, directionToUpdate);
        }

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var yPos = Scalar.RandomRange(-this.height/2, this.height/2);
            var angle = Scalar.RandomRange(0, 2 * Math.PI);

            // Pick a properly distributed point within the circle https://programming.guide/random-point-within-circle.html
            var radiusDistribution = Scalar.RandomRange((1-this.radiusRange)*(1-this.radiusRange), 1);
            var positionRadius = Math.sqrt(radiusDistribution)*this.radius;
            var xPos = positionRadius*Math.cos(angle);
            var zPos = positionRadius*Math.sin(angle);

            Vector3.TransformCoordinatesFromFloatsToRef(xPos, yPos, zPos, worldMatrix, positionToUpdate);
        }

        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        public clone(): CylinderParticleEmitter {
            let newOne = new CylinderParticleEmitter(this.radius, this.directionRandomizer);

            Tools.DeepCopy(this, newOne);

            return newOne;
        }    
        
        /**
         * Called by the {BABYLON.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */        
        public applyToShader(effect: Effect): void {
            effect.setFloat("radius", this.radius);
            effect.setFloat("height", this.height);
            effect.setFloat("radiusRange", this.radiusRange);
            effect.setFloat("directionRandomizer", this.directionRandomizer);
        }    
        
        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        public getEffectDefines(): string {
            return "#define CYLINDEREMITTER"
        }   
        
        /**
         * Returns the string "CylinderParticleEmitter"
         * @returns a string containing the class name
         */
        public getClassName(): string {
            return "CylinderParticleEmitter";
        }         
        
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */        
        public serialize(): any {
            var serializationObject: any = {};
            serializationObject.type = this.getClassName();
            serializationObject.radius = this.radius;
            serializationObject.height = this.height;
            serializationObject.radiusRange = this.radiusRange;
            serializationObject.directionRandomizer = this.directionRandomizer;

            return serializationObject;
        }    
        
        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        public parse(serializationObject: any): void {
            this.radius = serializationObject.radius;
            this.height = serializationObject.height;
            this.radiusRange = serializationObject.radiusRange;
            this.directionRandomizer = serializationObject.directionRandomizer;
        }          
    }
}
