module BABYLON {
    export class FreeCamera extends TargetCamera {        
        @serializeAsVector3()
        public ellipsoid = new Vector3(0.5, 1, 0.5);

        @serialize()
        public checkCollisions = false;

        @serialize()
        public applyGravity = false;
                
        public inputs : FreeCameraInputsManager;
        
        //-- begin properties for backward compatibility for inputs
        public get angularSensibility(): number {
            var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
            if (mouse)
                return mouse.angularSensibility;

            return 0;
        }
        
        public set angularSensibility(value: number) {
            var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
            if (mouse)
                mouse.angularSensibility = value;
        }
        
        public get keysUp(): number[] {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysUp;

            return [];
        }
        
        public set keysUp(value: number[]) {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysUp = value;
        }
        
        public get keysDown(): number[] {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysDown;

            return [];
        }
        
        public set keysDown(value: number[]) {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysDown = value;
        }
        
        public get keysLeft(): number[] {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysLeft;

            return [];
        }
        
        public set keysLeft(value: number[]) {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysLeft = value;
        }
        
        public get keysRight(): number[] {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysRight;

            return [];
        }
        
        public set keysRight(value: number[]) {
            var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysRight = value;
        }
        
        //-- end properties for backward compatibility for inputs
        
        public onCollide: (collidedMesh: AbstractMesh) => void;
        
        private _collider: Collider;
        private _needMoveForGravity = false;
        private _oldPosition = Vector3.Zero();
        private _diffPosition = Vector3.Zero();
        private _newPosition = Vector3.Zero();
        
        public _localDirection: Vector3;
        public _transformedDirection: Vector3;        
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs = new FreeCameraInputsManager(this);
            this.inputs.addKeyboard().addMouse();
        }     

        // Controls
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            this.inputs.attachElement(element, noPreventDefault);
        }        

        public detachControl(element: HTMLElement): void {
            this.inputs.detachElement(element);
            
            this.cameraDirection = new Vector3(0, 0, 0);
            this.cameraRotation = new Vector2(0, 0);
        }

        // Collisions
        private _collisionMask = -1;
        
        public get collisionMask(): number {
            return this._collisionMask;
        }
        
        public set collisionMask(mask: number) {
            this._collisionMask = !isNaN(mask) ? mask : -1;
        }
	 
        public _collideWithWorld(displacement: Vector3): void {
            var globalPosition: Vector3;

            if (this.parent) {
                globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
            } else {
                globalPosition = this.position;
            }

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);

            if (!this._collider) {
                this._collider = new Collider();
            }

            this._collider.radius = this.ellipsoid;
            this._collider.collisionMask = this._collisionMask;
		
            //no need for clone, as long as gravity is not on.
            var actualDisplacement = displacement;
			
            //add gravity to the direction to prevent the dual-collision checking
            if (this.applyGravity) {
                //this prevents mending with cameraDirection, a global variable of the free camera class.
                actualDisplacement = displacement.add(this.getScene().gravity);
            }

            this.getScene().collisionCoordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);

        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
            //TODO move this to the collision coordinator!
            if (this.getScene().workerCollisions)
                newPosition.multiplyInPlace(this._collider.radius);

            var updatePosition = (newPos: Vector3) => {
                this._newPosition.copyFrom(newPos);

                this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

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
                super._updatePosition();
            }
        }

        public dispose(): void {
            this.inputs.clear();
            super.dispose();
        }
        
        public getClassName(): string {
            return "FreeCamera";
        }
    }    
} 
