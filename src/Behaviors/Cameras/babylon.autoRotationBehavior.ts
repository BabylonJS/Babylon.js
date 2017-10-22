module BABYLON {
    export class AutoRotationBehavior implements Behavior<ArcRotateCamera> {
        public get name(): string {
            return "AutoRotation";
        }

        private _zoomStopsAnimation = false;
		private _idleRotationSpeed = 0.05;
		private _idleRotationWaitTime = 2000;
        private _idleRotationSpinupTime = 2000;  
       
		/**
		* Sets the flag that indicates if user zooming should stop animation.
		*/
		public set zoomStopsAnimation(flag: boolean) {
			this._zoomStopsAnimation = flag;
		}

		/**
		* Gets the flag that indicates if user zooming should stop animation.
		*/
		public get zoomStopsAnimation(): boolean {
			return this._zoomStopsAnimation;
        }       
        
		/**
		* Sets the default speed at which the camera rotates around the model.
		*/
		public set idleRotationSpeed(speed: number) {
			this._idleRotationSpeed = speed;
		}

		/**
		* Gets the default speed at which the camera rotates around the model.
		*/
		public get idleRotationSpeed() {
			return this._idleRotationSpeed;
		}

		/**
		* Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
		*/
		public set idleRotationWaitTime(time: number) {
			this._idleRotationWaitTime = time;
		}

		/**
		* Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
		*/
		public get idleRotationWaitTime() {
			return this._idleRotationWaitTime;
		}

		/**
		* Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
		*/
		public set idleRotationSpinupTime(time: number) {
			this._idleRotationSpinupTime = time;
		}

		/**
		* Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
		*/
		public get idleRotationSpinupTime() {
			return this._idleRotationSpinupTime;
		}

		/**
		 * Gets a value indicating if the camera is currently rotating because of this behavior
		 */
		public get rotationInProgress(): boolean {
			return Math.abs(this._cameraRotationSpeed) > 0;
		}
        
        // Default behavior functions
        private _onPrePointerObservableObserver: Nullable<Observer<PointerInfoPre>>;
        private _onAfterCheckInputsObserver: Nullable<Observer<Camera>>;
        private _attachedCamera: Nullable<ArcRotateCamera>;
        private _isPointerDown = false;
        private _lastFrameTime: Nullable<number> = null;
		private _lastInteractionTime = -Infinity;
		private _cameraRotationSpeed: number = 0;

        public attach(camera: ArcRotateCamera): void {
            this._attachedCamera = camera;
            let scene = this._attachedCamera.getScene();

            this._onPrePointerObservableObserver = scene.onPrePointerObservable.add((pointerInfoPre) => {
                if (pointerInfoPre.type === PointerEventTypes.POINTERDOWN) {
                    this._isPointerDown = true;
                    return
                }

                if (pointerInfoPre.type === PointerEventTypes.POINTERUP) {
                    this._isPointerDown = false;
                }
            });

            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {      
                let now = Tools.Now;
                let dt = 0;
                if (this._lastFrameTime != null) {
                    dt =  now - this._lastFrameTime;
                }
                this._lastFrameTime = now;

                // Stop the animation if there is user interaction and the animation should stop for this interaction
                this._applyUserInteraction();
    
                let timeToRotation = now - this._lastInteractionTime - this._idleRotationWaitTime;
				let scale = Math.max(Math.min(timeToRotation / (this._idleRotationSpinupTime), 1), 0);
                this._cameraRotationSpeed = this._idleRotationSpeed * scale;
    
				// Step camera rotation by rotation speed
				if (this._attachedCamera) {
					this._attachedCamera.alpha -= this._cameraRotationSpeed * (dt / 1000);
				}
            });
        }
             
        public detach(): void {
			if (!this._attachedCamera) {
				return;
			}
            let scene = this._attachedCamera.getScene();
			
			if (this._onPrePointerObservableObserver) {
				scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
			}
			
			this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
			this._attachedCamera = null;
		}

		/**
		 * Returns true if user is scrolling. 
		 * @return true if user is scrolling.
		 */
		private _userIsZooming(): boolean {
			if (!this._attachedCamera) {
				return false;
			}			
			return this._attachedCamera.inertialRadiusOffset !== 0;
		}   		
		
		private _lastFrameRadius = 0;
		private _shouldAnimationStopForInteraction(): boolean {
			if (!this._attachedCamera) {
				return false;
			}	

			var zoomHasHitLimit = false;
			if (this._lastFrameRadius === this._attachedCamera.radius && this._attachedCamera.inertialRadiusOffset !== 0) {
				zoomHasHitLimit = true;
			}

			// Update the record of previous radius - works as an approx. indicator of hitting radius limits
			this._lastFrameRadius = this._attachedCamera.radius;
			return this._zoomStopsAnimation ? zoomHasHitLimit : this._userIsZooming();
		}   		

		/**
		 *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
		 */          
        private _applyUserInteraction(): void {
			if (this._userIsMoving() && !this._shouldAnimationStopForInteraction()) {
                this._lastInteractionTime = Tools.Now;
			}
        }                
   
        // Tools
        private _userIsMoving(): boolean {
			if (!this._attachedCamera) {
				return false;
			}	
			
			return this._attachedCamera.inertialAlphaOffset !== 0 ||
				this._attachedCamera.inertialBetaOffset !== 0 ||
				this._attachedCamera.inertialRadiusOffset !== 0 ||
				this._attachedCamera.inertialPanningX !== 0 ||
				this._attachedCamera.inertialPanningY !== 0 ||
				this._isPointerDown;
		}
    }
}