module BABYLON {
    export class FreeCamera extends TargetCamera {        
        @serializeAsVector3()
        public ellipsoid = new Vector3(0.5, 1, 0.5);

        @serialize()
        public checkCollisions = false;

        @serialize()
        public applyGravity = false;
                
        public inputs : FreeCameraInputsManager;
        
        //-- 2016-03-08 properties for backward compatibility for inputs
        //deprecated
        public get angularSensibility() {
            Tools.Warn("Warning: angularSensibility is deprecated on FreeCamera, use camera.inputs.attached.mouse.angularSensibility instead.");
            var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
            if (mouse)
                return mouse.angularSensibility;
        }
        
        //deprecated
        public set angularSensibility(value) {
            Tools.Warn("Warning: angularSensibility is deprecated on FreeCamera, use camera.inputs.attached.mouse.angularSensibility instead.");
            var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
            if (mouse)
                mouse.angularSensibility = value;
        }
        
        //deprecated
        public get keysUp() {
            Tools.Warn("Warning: keysUp is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysUp instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysUp;
        }
        
        //deprecated
        public set keysUp(value) {
            Tools.Warn("Warning: keysUp is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysUp instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysUp = value;
        }
        
        //deprecated
        public get keysDown() {
            Tools.Warn("Warning: keysDown is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysDown instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysDown;
        }
        
        //deprecated
        public set keysDown(value) {
            Tools.Warn("Warning: keysDown is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysDown instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysDown = value;
        }
        
        //deprecated
        public get keysLeft() {
            Tools.Warn("Warning: keysLeft is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysLeft instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysLeft;
        }
        
        //deprecated
        public set keysLeft(value) {
            Tools.Warn("Warning: keysLeft is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysLeft instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysLeft = value;
        }
        
        //deprecated
        public get keysRight() {
            Tools.Warn("Warning: keysRight is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysRight instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysRight;
        }
        
        //deprecated
        public set keysRight(value) {
            Tools.Warn("Warning: keysRight is deprecated on FreeCamera, use camera.inputs.attached.keyboard.keysRight instead.");
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysRight = value;
        }
        
        //-- end properties for backward compatibility for inputs
        
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
            this.inputs = new FreeCameraInputsManager(this);
            this.inputs.addKeyboard().addMouse();
        }

        // Controls
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            if (this._attachedElement) {
                return;
            }
            this._noPreventDefault = noPreventDefault;
            this._attachedElement = element;
            noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;

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
