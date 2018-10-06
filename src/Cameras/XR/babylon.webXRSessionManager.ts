module BABYLON {
    /**
     * Manages an XRSession
     * @see https://doc.babylonjs.com/how_to/webxr
     */
    export class WebXRSessionManager {
        private _xrNavigator: any;
        private _xrDevice: XRDevice;
        private _tmpMatrix = new BABYLON.Matrix();
        /** @hidden */
        public _xrSession: XRSession;
        /** @hidden */
        public _frameOfReference: XRFrameOfReference;
        /** @hidden */
        public _sessionRenderTargetTexture: RenderTargetTexture;
        /** @hidden */
        public _currentXRFrame: XRFrame;

        /**
         * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
         * @param scene The scene which the session should be created for
         */
        constructor(private scene: BABYLON.Scene) {

        }

        /**
         * Initializes the manager, this must be done with a user action (eg. button click event)
         * After initialization enterXR can be called to start an XR session
         * @param scene
         * @returns Promise which resolves after it is initialized
         */
        public initialize(): Promise<void> {
             // Check if the browser supports webXR
            this._xrNavigator = navigator;
            if (!this._xrNavigator.xr) {
                return Promise.reject("webXR not supported by this browser");
            }
             // Request the webXR device
            return this._xrNavigator.xr.requestDevice().then((device: XRDevice) => {
                this._xrDevice = device;
                return (<any>this.scene.getEngine()._gl).setCompatibleXRDevice(this._xrDevice);
            });
        }

        /**
         * Enters XR with the desired XR session options
         * @param sessionCreationOptions
         * @returns Promise which resolves after it enters XR
         */
        public enterXR(sessionCreationOptions: XRSessionCreationOptions, frameOfReferenceType: XRFrameOfReferenceType): Promise<void> {
            // initialize session
            return this._xrDevice.requestSession(sessionCreationOptions).then((session: XRSession) => {
                this._xrSession = session;
                this._xrSession.baseLayer = new XRWebGLLayer(this._xrSession, this.scene.getEngine()._gl);
                return this._xrSession.requestFrameOfReference(frameOfReferenceType);
            }).then((frameOfRef: any) => {
                this._frameOfReference = frameOfRef;
                // Tell the engine's render loop to be driven by the xr session's refresh rate and provide xr pose information
                this.scene.getEngine().customAnimationFrameRequester = {
                    requestAnimationFrame: this._xrSession.requestAnimationFrame.bind(this._xrSession),
                    renderFunction: (timestamp: number, xrFrame: XRFrame) => {
                        // Store the XR frame in the manager to be consumed by the XR camera to update pose
                        this._currentXRFrame = xrFrame;
                        this.scene.getEngine()._renderLoop();
                    }
                };
                // Create render target texture from xr's webgl render target
                this._sessionRenderTargetTexture = WebXRSessionManager._CreateRenderTargetTextureFromSession(this._xrSession, this.scene);
            });
        }

        /**
         * Stops the xrSession and restores the renderloop
         * @returns Promise which resolves after it exits XR
         */
        public exitXR() {
            return new Promise((res) => {
                this.scene.getEngine().customAnimationFrameRequester = null;
                this._xrSession.end();
                // Restore frame buffer to avoid clear on xr framebuffer after session end
                this.scene.getEngine().restoreDefaultFramebuffer();
                // Need to restart render loop as after calling session.end the last request for new frame will never call callback
                this.scene.getEngine()._renderLoop();
                res();
            });
        }

        /**
         * Fires a ray and returns the closest hit in the xr sessions enviornment, useful to place objects in AR
         * @param ray ray to cast into the environment
         * @returns Promise which resolves with a collision point in the environment if it exists
         */
        public environmentPointHitTest(ray: BABYLON.Ray): Promise<Nullable<Vector3>> {
            return new Promise((res, rej) => {
                // Compute left handed inputs to request hit test
                var origin = new Float32Array([ray.origin.x, ray.origin.y, ray.origin.z]);
                var direction = new Float32Array([ray.direction.x, ray.direction.y, ray.direction.z]);
                if (!this.scene.useRightHandedSystem) {
                    origin[2] *= -1;
                    direction[2] *= -1;
                }

                // Fire hittest
                this._xrSession.requestHitTest(origin, direction, this._frameOfReference)
                .then((hits: any) => {
                    if (hits.length > 0) {
                        BABYLON.Matrix.FromFloat32ArrayToRefScaled(hits[0].hitMatrix, 0, 1.0, this._tmpMatrix);
                        var hitPoint = this._tmpMatrix.getTranslation();
                        if (!this.scene.useRightHandedSystem) {
                            hitPoint.z *= -1;
                        }
                        res(hitPoint);
                    }else {
                        res(null);
                    }
                }).catch((e: Error) => {
                    res(null);
                });
            });
        }

        /**
         * @hidden
         * Converts the render layer of xrSession to a render target 
         * @param session session to create render target for
         * @param scene scene the new render target should be created for
         */
        public static _CreateRenderTargetTextureFromSession(session: XRSession, scene: BABYLON.Scene) {
            // Create internal texture
            var internalTexture = new BABYLON.InternalTexture(scene.getEngine(), BABYLON.InternalTexture.DATASOURCE_UNKNOWN, true);
            internalTexture.width = session.baseLayer.framebufferWidth;
            internalTexture.height = session.baseLayer.framebufferHeight;
            internalTexture._framebuffer = session.baseLayer.framebuffer;

             // Create render target texture from the internal texture
            var renderTargetTexture = new BABYLON.RenderTargetTexture("XR renderTargetTexture", {width: internalTexture.width, height: internalTexture.height}, scene, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
            renderTargetTexture._texture = internalTexture;

             return renderTargetTexture;
        }
    }
}