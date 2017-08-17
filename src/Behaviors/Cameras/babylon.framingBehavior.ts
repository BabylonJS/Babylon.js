module BABYLON {
    export class FramingBehavior implements Behavior<ArcRotateCamera> {
        public get name(): string {
            return "Framing";
        }

        private _mode = FramingBehavior.IgnoreBoundsSizeMode;
        private _radius = 0;
        private _elevation = 0;
        private _positionY = 0;
        private _defaultElevation = 0;
        private _elevationReturnTime = 2;
        private _elevationReturnWaitTime = 0;
        private _zoomStopsAnimation = false;
		private _framingTime = 1.0;
        private _easingFunction: EasingFunction = new ExponentialEase();
        private _easingMode = EasingFunction.EASINGMODE_EASEINOUT;
        
		/**
		 * Gets the easing function to use for transitions
		 */
		public get easingFunction(): EasingFunction {
            return this._easingFunction;
        }
        
        /**
		 * Sets the easing function to use for transitions
		 */
		public set easingFunction(value: EasingFunction) {
            this._easingFunction = value;
        }    

		/**
		 * Gets the easing function to use for transitions
		 */
		public get easingMode(): number {
            return this._easingMode;
        }
        
        /**
		 * Sets the easing function to use for transitions
		 */
		public set easingMode(value: number) {
            this._easingMode = value;
        }          

        /**
		 * Sets the current mode used by the behavior
		 */
		public set mode(mode: number) {
			this._mode = mode;
		}

		/**
		 * Gets current mode used by the behavior.
		 */
		public get mode(): number {
			return this._mode;
        }
        
	    /**
		 * Sets the radius of the camera relative to the framed model's bounding box.
		 */
		public set radius(radius: number) {
			this._radius = radius;
		}

		/**
		 * Gets the radius of the camera relative to the framed model's bounding box.
		 */
		public get radius(): number {
			return this._radius;
		}

		/**
		 * Sets the elevation of the camera from the framed model, in radians.
		 */
		public set elevation(elevation: number) {
			this._elevation = elevation;
		}

		/**
		 * Gets the elevation of the camera from the framed model, in radians.
		 */
		public get elevation(): number {
			return this._elevation;
		}

		/**
		 * Sets the Y offset of the primary model from the camera's focus.
		 */
		public set positionY(positionY: number) {
			this._positionY = positionY;
		}

		/**
		 * Gets the Y offset of the primary model from the camera's focus.
		 */
		public get positionY(): number {
			return this._positionY;
		}

		/**
		* Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
		* behaviour is triggered, in radians.
		*/
		public set defaultElevation(elevation: number) {
			this._defaultElevation = elevation;
		}

		/**
		* Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
		* behaviour is triggered, in radians.
		*/
		public get defaultElevation() {
			return this._defaultElevation;
		}

		/**
		 * Sets the time (in milliseconds) taken to return to the default beta position.
		 * Negative value indicates camera should not return to default.
		 */
		public set elevationReturnTime(speed: number) {
			this._elevationReturnTime = speed;
		}

		/**
		 * Gets the time (in milliseconds) taken to return to the default beta position.
		 * Negative value indicates camera should not return to default.
		 */
		public get elevationReturnTime(): number {
			return this._elevationReturnTime;
		}

		/**
		 * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
		 */
		public set elevationReturnWaitTime(time: number) {
			this._elevationReturnWaitTime = time;
		}

		/**
		 * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
		 */
		public get elevationReturnWaitTime(): number {
			return this._elevationReturnWaitTime;
		}

		/**
		* Sets the flag that indicates if user zooming should stop model animation.
		*/
		public set zoomStopsAnimation(flag: boolean) {
			this._zoomStopsAnimation = flag;
		}

		/**
		* Gets the flag that indicates if user zooming should stop model animation.
		*/
		public get zoomStopsAnimation(): boolean {
			return this._zoomStopsAnimation;
        }       
        	
		/**
		 * Sets the transition time when framing the model, in milliseconds
		*/
		public set framingTime(time: number) {
			this._framingTime = time;
		}

        /**
         * Gets the transition time when framing the model, in milliseconds
        */
        public get framingTime() {
            return this._framingTime;
		}        
        
        // Default behavior functions
        private _onPrePointerObservableObserver: Observer<PointerInfoPre>;
        private _onAfterCheckInputsObserver: Observer<Camera>;
        private _attachedCamera: ArcRotateCamera;
        private _isPointerDown = false;
        private _lastFrameTime: number = null;
        private _lastInteractionTime = -Infinity;

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
                // Stop the animation if there is user interaction and the animation should stop for this interaction
                this._applyUserInteraction();
       
                // Maintain the camera above the ground. If the user pulls the camera beneath the ground plane, lift it
                // back to the default position after a given timeout
                this._maintainCameraAboveGround();                
            });
        }
             
        public detach(camera: ArcRotateCamera): void {
            let scene = this._attachedCamera.getScene();
            
            scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
            camera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        }

        // Framing control
        private _animatables = new Array<BABYLON.Animatable>();
        private _betaIsAnimating = false;
        private _betaTransition: BABYLON.Animation;
        private _lastFrameRadius = 0;

		/**
		 * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
		 * is automatically returned to its default position (expected to be above ground plane). 
		 */
		private _maintainCameraAboveGround(): void {
			let timeSinceInteraction = Tools.Now - this._lastInteractionTime;
			let defaultBeta = Math.PI * 0.5 - this._defaultElevation;
			let limitBeta = Math.PI * 0.5;
            
            // Bring the camera back up if below the ground plane
			if (!this._betaIsAnimating && this._attachedCamera.beta > limitBeta && timeSinceInteraction >= this._elevationReturnWaitTime) {
                this._betaIsAnimating = true;
                
				//Transition to new position
                this.stopAllAnimations();
                
                if (!this._betaTransition) {
                    this.easingFunction.setEasingMode(this.easingMode);
                    this._betaTransition = Animation.CreateAnimation("beta", Animation.ANIMATIONTYPE_FLOAT, 60, this.easingFunction);
                }

				Animation.TransitionTo("beta", defaultBeta, this._attachedCamera, this._attachedCamera.getScene(), 60,
                    this._betaTransition, this._elevationReturnTime, 
                    () => {
						this.stopAllAnimations();
					});
			}
		}        

		/**
		 * Returns true if user is scrolling. 
		 * @return true if user is scrolling.
		 */
		protected _userIsZooming(): boolean {
			return this._attachedCamera.inertialRadiusOffset !== 0;
		}        

		/**
		 * Indicates if default model animation (rotation) should stop for the current user interaction.
		 * 
		 * @return True if the model animation (rotation) should stop when given the current user interaction.
		 */
		protected _shouldAnimationStopForInteraction(): boolean {
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
				this.stopAllAnimations();
			}
        }                
        
		/**
		 * Stops and removes all animations that have been applied to the camera
		 */        
        public stopAllAnimations(): void {
			this._attachedCamera.animations = [];
			while (this._animatables.length) {
				this._animatables[0].onAnimationEnd = null;
				this._animatables[0].stop();
				this._animatables.shift();
			}
		}        

        // Tools
        private _userIsMoving(): boolean {
			return this._attachedCamera.inertialAlphaOffset !== 0 ||
				this._attachedCamera.inertialBetaOffset !== 0 ||
				this._attachedCamera.inertialRadiusOffset !== 0 ||
				this._attachedCamera.inertialPanningX !== 0 ||
				this._attachedCamera.inertialPanningY !== 0 ||
				this._isPointerDown;
		}

        // Statics

        /**
         * The camera can move all the way towards the model.
         */
        public static IgnoreBoundsSizeMode = 0;

        /**
         * The camera is not allowed to zoom closer to the model than the point at which the adjusted bounding sphere touches the frustum sides
         */
        public static FitFrustumSidesMode = 0;
    }
}