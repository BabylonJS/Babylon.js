module BABYLON {

    /**
     * A particle represents one of the element emitted by a particle system.
     * This is mainly define by its coordinates, direction, velocity and age.
     */
    export class Particle {
        /**
         * The world position of the particle in the scene.
         */
        public position = Vector3.Zero();

        /**
         * The world direction of the particle in the scene.
         */
        public direction = Vector3.Zero();

        /**
         * The color of the particle.
         */
        public color = new Color4(0, 0, 0, 0);

        /**
         * The color change of the particle per step.
         */
        public colorStep = new Color4(0, 0, 0, 0);

        /**
         * Defines how long will the life of the particle be.
         */
        public lifeTime = 1.0;

        /**
         * The current age of the particle.
         */
        public age = 0;

        /**
         * The current size of the particle.
         */
        public size = 0;

        /**
         * The current scale of the particle.
         */
        public scale = new Vector2(1, 1);        

        /**
         * The current angle of the particle.
         */
        public angle = 0;

        /**
         * Defines how fast is the angle changing.
         */
        public angularSpeed = 0;

        /**
         * Defines the cell index used by the particle to be rendered from a sprite.
         */
        public cellIndex: number = 0;  

        /** @hidden */
        public _initialDirection: Nullable<Vector3>;

        /** @hidden */
        public _initialStartSpriteCellID: number;
        public _initialEndSpriteCellID: number;

        /** @hidden */
        public _currentColorGradient: Nullable<ColorGradient>;
        /** @hidden */
        public _currentColor1 = new Color4(0, 0, 0, 0);
        /** @hidden */
        public _currentColor2 = new Color4(0, 0, 0, 0);

        /** @hidden */
        public _currentSizeGradient: Nullable<FactorGradient>;
        /** @hidden */
        public _currentSize1 = 0;
        /** @hidden */
        public _currentSize2 = 0;      
        
        /** @hidden */
        public _currentAngularSpeedGradient: Nullable<FactorGradient>;
        /** @hidden */
        public _currentAngularSpeed1 = 0;
        /** @hidden */
        public _currentAngularSpeed2 = 0;          

        /**
         * Creates a new instance Particle
         * @param particleSystem the particle system the particle belongs to
         */
        constructor(
            /**
             * particleSystem the particle system the particle belongs to.
             */
            public particleSystem: ParticleSystem) {
            if (!this.particleSystem.isAnimationSheetEnabled) {
                return;
            }

            this.updateCellInfoFromSystem();
        }

        private updateCellInfoFromSystem(): void {
            this.cellIndex = this.particleSystem.startSpriteCellID;
        }

        /**
         * Defines how the sprite cell index is updated for the particle
         */
        public updateCellIndex(): void {
            let dist = (this._initialEndSpriteCellID - this._initialStartSpriteCellID);
            let ratio = Scalar.Clamp(((this.age * this.particleSystem.spriteCellChangeSpeed) % this.lifeTime) / this.lifeTime);

            this.cellIndex = this._initialStartSpriteCellID + (ratio * dist) | 0;
        }

        /**
         * Copy the properties of particle to another one.
         * @param other the particle to copy the information to.
         */
        public copyTo(other: Particle) {
            other.position.copyFrom(this.position);
            if (this._initialDirection) {
                if (other._initialDirection) {
                    other._initialDirection.copyFrom(this._initialDirection);
                } else {
                    other._initialDirection = this._initialDirection.clone();
                }
            } else {
                other._initialDirection = null;
            }
            other.direction.copyFrom(this.direction);
            other.color.copyFrom(this.color);
            other.colorStep.copyFrom(this.colorStep);
            other.lifeTime = this.lifeTime;
            other.age = this.age;
            other.size = this.size;
            other.scale.copyFrom(this.scale);
            other.angle = this.angle;
            other.angularSpeed = this.angularSpeed;
            other.particleSystem = this.particleSystem;
            other.cellIndex = this.cellIndex;
            if (this._currentColorGradient) {
                other._currentColorGradient = this._currentColorGradient;
                other._currentColor1.copyFrom(this._currentColor1);
                other._currentColor2.copyFrom(this._currentColor2);
            }
            if (this._currentSizeGradient) {
                other._currentSizeGradient = this._currentSizeGradient;
                other._currentSize1 = this._currentSize1;
                other._currentSize2 = this._currentSize2;
            }
            if (this._currentAngularSpeedGradient) {
                other._currentAngularSpeedGradient = this._currentAngularSpeedGradient;
                other._currentAngularSpeed1 = this._currentAngularSpeed1;
                other._currentAngularSpeed2 = this._currentAngularSpeed2;
            }            
            if (this.particleSystem.isAnimationSheetEnabled) {
                other._initialStartSpriteCellID = this._initialStartSpriteCellID;
                other._initialEndSpriteCellID = this._initialEndSpriteCellID;
            }
        }
    }
} 