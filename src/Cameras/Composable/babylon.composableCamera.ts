module BABYLON {       
    export class ComposableCamera extends TargetCamera {
        @serializeAsVector3()
        public ellipsoid = new Vector3(0.5, 1, 0.5);

        @serialize()
        public checkCollisions = false;

        @serialize()
        public applyGravity = false;
        
        public inputs : ComposableCameraInputsManager;

        public onCollide: (collidedMesh: AbstractMesh) => void;
        
        private _collider = new Collider();
        private _needMoveForGravity = false;
        private _oldPosition = Vector3.Zero();
        private _diffPosition = Vector3.Zero();
        private _newPosition = Vector3.Zero();
        public _attachedElement: HTMLElement;
        public _noPreventDefault: boolean;
        
        public _localDirection: Vector3;
        public _transformedDirection: Vector3;        
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs = new ComposableCameraInputsManager(this);
            this.inputs.addKeyboard().addMouse();
        }

        // Controls
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            if (this._attachedElement) {
                return;
            }
            this._noPreventDefault = noPreventDefault;
            this._attachedElement = element;

            this.inputs.attachElement(element, noPreventDefault);
        }        

        public detachControl(element: HTMLElement): void {
            if (this._attachedElement !== element) {
                return;
            }

            this.inputs.detachElement(this._attachedElement);
            this._attachedElement = null;
            
            this.cameraDirection = new Vector3(0, 0, 0);
            this.cameraRotation = new Vector2(0, 0);
        }

        public _collideWithWorld(velocity: Vector3): void {
            var globalPosition: Vector3;

            if (this.parent) {
                globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
            } else {
                globalPosition = this.position;
            }

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
            this._collider.radius = this.ellipsoid;

            //no need for clone, as long as gravity is not on.
            var actualVelocity = velocity;
			
            //add gravity to the velocity to prevent the dual-collision checking
            if (this.applyGravity) {
                //this prevents mending with cameraDirection, a global variable of the free camera class.
                actualVelocity = velocity.add(this.getScene().gravity);
            }

            this.getScene().collisionCoordinator.getNewPosition(this._oldPosition, actualVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);

        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: AbstractMesh = null) => {
            //TODO move this to the collision coordinator!
            if (this.getScene().workerCollisions)
                newPosition.multiplyInPlace(this._collider.radius);

            var updatePosition = (newPos) => {
                this._newPosition.copyFrom(newPos);

                this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

                var oldPosition = this.position.clone();
                if (this._diffPosition.length() > Engine.CollisionsEpsilon) {
                    this.position.addInPlace(this._diffPosition);
                    if (this.onCollide && collidedMesh) {
                        this.onCollide(collidedMesh);
                    }
                }
            }

            updatePosition(newPosition);
        }

        public _checkInputs(): void {
            if (!this._localDirection) {
                this._localDirection = Vector3.Zero();
                this._transformedDirection = Vector3.Zero();
            }

            this.inputs.checkInputs();

            super._checkInputs();
        }

        public _decideIfNeedsToMove(): boolean {
            return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        }

        public _updatePosition(): void {
            if (this.checkCollisions && this.getScene().collisionsEnabled) {
                this._collideWithWorld(this.cameraDirection);
            } else {
                this.position.addInPlace(this.cameraDirection);
            }
        }

        public dispose(): void {
            this.inputs.clear();
            super.dispose();
        }
        
        public getTypeName(): string {
            return "FreeCamera";
        }
    }    
} 
