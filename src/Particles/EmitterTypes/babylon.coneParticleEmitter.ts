module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a cone.
     * It emits the particles alongside the cone volume from the base to the particle. 
     * The emission direction might be randomized.
     */
    export class ConeParticleEmitter implements IParticleEmitterType {
        private _radius: number;
        private _height: number;

        /**
         * Gets the radius of the emission cone.
         */
        public get radius(): number {
            return this._radius;
        }

        /**
         * Sets the radius of the emission cone.
         */
        public set radius(value: number) {
            this._radius = value;
            if (this.angle !== 0) {
                this._height = value / Math.tan(this.angle / 2);
            }
            else {
                this._height = 1;
            }
        }

        /**
         * Creates a new instance of @see ConeParticleEmitter
         * @param radius the radius of the emission cone (1 by default)
         * @param angles the cone base angle (PI by default)
         * @param directionRandomizer defines how much to randomize the particle direction [0-1]
         */
        constructor(radius = 1, 
            /**
             * The radius of the emission cone.
             */
            public angle = Math.PI, 
            /**
             * The cone base angle.
             */
            public directionRandomizer = 0) {
            this.radius = radius;
        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        public startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            if (this.angle === 0) {
                Vector3.TransformNormalFromFloatsToRef(0, emitPower, 0, worldMatrix, directionToUpdate);
            }
            else {
                // measure the direction Vector from the emitter to the particle.
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
        }

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var s = Scalar.RandomRange(0, Math.PI * 2);
            var h = Scalar.RandomRange(0, 1);
            // Better distribution in a cone at normal angles.
            h = 1 - h * h;
            var radius = Scalar.RandomRange(0, this._radius);
            radius = radius * h / this._height;

            var randX = radius * Math.sin(s);
            var randZ = radius * Math.cos(s);
            var randY = h * this._height;

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }

        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        public clone(): ConeParticleEmitter {
            let newOne = new ConeParticleEmitter(this.radius, this.angle, this.directionRandomizer);

            Tools.DeepCopy(this, newOne);

            return newOne;
        }        
        
        /**
         * Called by the {BABYLON.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */        
        public applyToShader(effect: Effect): void {
            effect.setFloat("radius", this.radius);
            effect.setFloat("angle", this.angle);
            effect.setFloat("height", this._height);
            effect.setFloat("directionRandomizer", this.directionRandomizer);
        }

        /**
         * Returns a string to use to update the GPU particles update shader
         * @returns a string containng the defines string
         */
        public getEffectDefines(): string {
            return "#define CONEEMITTER"
        }     
        
        /**
         * Returns the string "BoxEmitter"
         * @returns a string containing the class name
         */
        public getClassName(): string {
            return "ConeEmitter";
        }  
        
        /**
         * Serializes the particle system to a JSON object.
         * @returns the JSON object
         */        
        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.type = this.getClassName();
            serializationObject.radius  = this.radius;
            serializationObject.angle  = this.angle;
            serializationObject.directionRandomizer  = this.directionRandomizer;

            return serializationObject;
        }   

        /**
         * Parse properties from a JSON object
         * @param serializationObject defines the JSON object
         */
        public parse(serializationObject: any): void {
            this.radius = serializationObject.radius;
            this.angle = serializationObject.angle;
            this.directionRandomizer = serializationObject.directionRandomizer;
        }        
    }
}