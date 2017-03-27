module BABYLON {
    export class HemisphericLight extends Light {
        @serializeAsColor3()
        public groundColor = new Color3(0.0, 0.0, 0.0);

        @serializeAsVector3()
        public direction: Vector3

        private _worldMatrix: Matrix;

        /**
         * Creates a HemisphericLight object in the scene according to the passed direction (Vector3).  
         * The HemisphericLight simulates the ambient environment light, so the passed direction is the light reflection direction, not the incoming direction.  
         * The HemisphericLight can't cast shadows.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, direction: Vector3, scene: Scene) {
            super(name, scene);
            this.direction = direction;
        }
        /**
         * Returns the string "HemisphericLight".  
         */
        public getClassName(): string {
            return "HemisphericLight";
        }          
        /**
         * Sets the HemisphericLight direction towards the passed target (Vector3).  
         * Returns the updated direction.  
         */
        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(Vector3.Zero()));
            return this.direction;
        }

        public getShadowGenerator(): ShadowGenerator {
            return null;
        }

        /**
         * Sets the passed Effect object with the HemisphericLight normalized direction and color and the passed name (string).  
         * Returns the HemisphericLight.  
         */
        public transferToEffect(effect: Effect, directionUniformName: string, groundColorUniformName: string): HemisphericLight {
            var normalizeDirection = Vector3.Normalize(this.direction);
            effect.setFloat4(directionUniformName,
                normalizeDirection.x,
                normalizeDirection.y,
                normalizeDirection.z,
                0.0);
            effect.setColor3(groundColorUniformName, this.groundColor.scale(this.intensity));
            return this;
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }
            return this._worldMatrix;
        }
        /**
         * Returns the integer 3.  
         */
        public getTypeID(): number {
            return 3;
        }
    }
} 