import { Nullable } from "../../types";
import { Observer, Observable } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { Matrix, Quaternion, Vector3, Color3, Axis } from '../../Maths/math';
import { WindowsMotionController } from '../../Gamepads/Controllers/windowsMotionController';
import { OculusTouchController } from '../../Gamepads/Controllers/oculusTouchController';
import { Mesh } from '../../Meshes/mesh';
import { Ray } from '../../Culling/ray';
import { StandardMaterial } from '../../Materials/standardMaterial';
import { DynamicTexture } from '../../Materials/Textures/dynamicTexture';
import { EasingFunction, SineEase } from '../../Animations/easing';
import { Animation } from '../../Animations/animation';
/**
 * Represents an XR input
 */
export class WebXRController {
    /**
     * Represents the part of the controller that is held. This may not exist if the controller is the head mounted display itself, if thats the case only the pointer from the head will be availible
     */
    public grip?: AbstractMesh;
    /**
     * Pointer which can be used to select objects or attach a visible laser to
     */
    public pointer: AbstractMesh;

    private _tmpMatrix = new Matrix();
    private _tmpQuaternion = new Quaternion();
    private _tmpVector = new Vector3();

    /**
     * Creates the controller
     * @see https://doc.babylonjs.com/how_to/webxr
     * @param scene the scene which the controller should be associated to
     * @param inputSource the underlying input source for the controller
     * @param parentContainer parent that the controller meshes should be children of
     */
    constructor(
        private scene: Scene,
        /** The underlying input source for the controller  */
        public inputSource: XRInputSource,
        private parentContainer: Nullable<AbstractMesh> = null)
    {
        this.pointer = new AbstractMesh("controllerPointer", scene);
        if (parentContainer) {
            parentContainer.addChild(this.pointer);
        }

        if (this.inputSource.gripSpace) {
            this.grip = new AbstractMesh("controllerGrip", this.scene);
            if (this.parentContainer) {
                this.parentContainer.addChild(this.grip);
            }
        }
    }

    /**
     * Updates the controller pose based on the given XRFrame
     * @param xrFrame xr frame to update the pose with
     * @param referenceSpace reference space to use
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace) {
        var pose = xrFrame.getPose(this.inputSource.targetRaySpace, referenceSpace);

        // Update the pointer mesh
        if (pose) {
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
            if (!this.pointer.getScene().useRightHandedSystem) {
                this._tmpMatrix.toggleModelMatrixHandInPlace();
            }
            if (!this.pointer.rotationQuaternion) {
                this.pointer.rotationQuaternion = new Quaternion();
            }
            this._tmpMatrix.decompose(this.pointer.scaling, this.pointer.rotationQuaternion!, this.pointer.position);
        }

        // Update the grip mesh if it exists
        if (this.inputSource.gripSpace && this.grip) {
            var pose = xrFrame.getPose(this.inputSource.gripSpace, referenceSpace);
            if (pose) {
                Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
                if (!this.grip.getScene().useRightHandedSystem) {
                    this._tmpMatrix.toggleModelMatrixHandInPlace();
                }
                if (!this.grip.rotationQuaternion) {
                    this.grip.rotationQuaternion = new Quaternion();
                }
                this._tmpMatrix.decompose(this.grip.scaling, this.grip.rotationQuaternion!, this.grip.position);
            }
        }
    }

    /**
     * Gets a world space ray coming from the controller
     * @param result the resulting ray
     */
    public getWorldPointerRayToRef(result:Ray){
        // Force update to ensure picked point is synced with ray
        var worldMatrix = this.pointer.computeWorldMatrix(true)
        worldMatrix.decompose(undefined, this._tmpQuaternion, undefined)
        this._tmpVector.set(0,0,1)
        this._tmpVector.rotateByQuaternionToRef(this._tmpQuaternion, this._tmpVector)
        result.origin = this.pointer.absolutePosition
        result.direction.copyFrom(this._tmpVector)
        result.length = 1000;
        return result;
    }

    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose();
        }
        this.pointer.dispose();
    }
}

/**
 * XR input used to track XR inputs such as controllers/rays
 */
export class WebXRInput implements IDisposable {
    /**
     * XR controllers being tracked
     */
    public controllers: Array<WebXRController> = [];
    private _frameObserver: Nullable<Observer<any>>;
    /**
     * Event when a controller has been connected/added
     */
    public onControllerAddedObservable = new Observable<WebXRController>();
    /**
     * Event when a controller has been removed/disconnected
     */
    public onControllerRemovedObservable = new Observable<WebXRController>();

    /**
     * Initializes the WebXRInput
     * @param xrExperienceHelper experience helper which the input should be created for
     */
    public constructor(public xrExperienceHelper: WebXRExperienceHelper) {
        this._frameObserver = xrExperienceHelper.sessionManager.onXRFrameObservable.add(() => {
            if (!xrExperienceHelper.sessionManager.currentFrame) {
                return;
            }

            // Start listing to input add/remove event
            if (this.controllers.length == 0 && xrExperienceHelper.sessionManager.session.inputSources) {
                this._addAndRemoveControllers(xrExperienceHelper.sessionManager.session.inputSources, []);
                xrExperienceHelper.sessionManager.session.addEventListener("inputsourceschange", this._onInputSourcesChange);
            }

            // Update controller pose info
            this.controllers.forEach((controller) => {
                controller.updateFromXRFrame(xrExperienceHelper.sessionManager.currentFrame!, xrExperienceHelper.sessionManager.referenceSpace);
            });

        });
    }

    private _onInputSourcesChange = (event: XRInputSourceChangeEvent) => {
        this._addAndRemoveControllers(event.added, event.removed);
    }

    private _addAndRemoveControllers(addInputs: Array<XRInputSource>, removeInputs: Array<XRInputSource>) {
        // Add controllers if they don't already exist
        var sources = this.controllers.map((c) => {return c.inputSource; });
        for(var input of addInputs){
            if (sources.indexOf(input) === -1) {
                var controller = new WebXRController(this.xrExperienceHelper.camera._scene, input, this.xrExperienceHelper.container);
                this.controllers.push(controller);
                this.onControllerAddedObservable.notifyObservers(controller);
            }
        }

        // Remove and dispose of controllers to be disposed
        var keepControllers: Array<WebXRController> = [];
        var removedControllers: Array<WebXRController> = [];
        this.controllers.forEach((c) => {
            if (removeInputs.indexOf(c.inputSource) === -1) {
                keepControllers.push(c);
            }else {
                removedControllers.push(c);
            }
        });
        this.controllers = keepControllers;
        removedControllers.forEach((c) => {
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose();
        });

    }

    /**
     * Disposes of the object
     */
    public dispose() {
        this.controllers.forEach((c) => {
            c.dispose();
        });
        this.xrExperienceHelper.sessionManager.onXRFrameObservable.remove(this._frameObserver);
    }
}

/**
 * Loads a controller model and adds it as a child of the WebXRControllers grip when the controller is created
 */
export class WebXRControllerModelLoader {
    /**
     * Creates the WebXRControllerModelLoader
     * @param input xr input that creates the controllers
     */
    constructor(input: WebXRInput){
        input.onControllerAddedObservable.add((c)=>{
            if(c.inputSource.gamepad && c.inputSource.gamepad.id === "oculus-touch"){
                let controllerModel = new OculusTouchController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness
                controllerModel.isXR = true
                controllerModel.initControllerMesh(c.grip!.getScene(), (m)=>{
                    controllerModel.mesh!.parent = c.grip!
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(0,Math.PI,0);
                })
            }else if(c.inputSource.gamepad && c.inputSource.gamepad.id === "oculus-quest"){
                OculusTouchController._IsQuest = true;
                let controllerModel = new OculusTouchController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness
                controllerModel.isXR = true
                controllerModel.initControllerMesh(c.grip!.getScene(), (m)=>{
                    controllerModel.mesh!.parent = c.grip!
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI/-4,Math.PI,0);
                })
            }else{
                let controllerModel = new WindowsMotionController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness
                controllerModel.isXR = true
                controllerModel.initControllerMesh(c.grip!.getScene(), (m)=>{
                    controllerModel.mesh!.parent = c.grip!
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(0,Math.PI,0);
                })
            } 
        })
    }
}

/**
 * Handles pointer input automatically for the pointer of XR controllers
 */
export class WebXRControllerPointerSelection {
    
    public static _idCounter = 0;
    
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    constructor(input: WebXRInput){
        
        input.onControllerAddedObservable.add((c)=>{
            var scene = c.pointer.getScene();

            let _laserPointer: Mesh;
            let _cursorMesh: Mesh;
            let triggerDown = false;
            let _id:number;
            _id = WebXRControllerPointerSelection._idCounter++;

            // Create a laser pointer for the XR controller
            _laserPointer = Mesh.CreateCylinder("laserPointer", 1, 0.0002, 0.004, 20, 1, scene, false);
            _laserPointer.parent = c.pointer
            var laserPointerMaterial = new StandardMaterial("laserPointerMat", scene);
            laserPointerMaterial.emissiveColor = new Color3(0.7, 0.7, 0.7);
            laserPointerMaterial.alpha = 0.6;
            _laserPointer.material = laserPointerMaterial;
            _laserPointer.rotation.x = Math.PI / 2;
            this._updatePointerDistance(_laserPointer,1)
            _laserPointer.isPickable = false;

            // Create a gaze tracker for the  XR controlelr
            _cursorMesh = Mesh.CreateTorus("gazeTracker", 0.0035*3, 0.0025*3, 20, scene, false);
            _cursorMesh.bakeCurrentTransformIntoVertices();
            _cursorMesh.isPickable = false;
            _cursorMesh.isVisible = false;
            var targetMat = new StandardMaterial("targetMat", scene);
            targetMat.specularColor = Color3.Black();
            targetMat.emissiveColor = new Color3(0.7, 0.7, 0.7);
            targetMat.backFaceCulling = false;
            _cursorMesh.material = targetMat;

            scene.onBeforeRenderObservable.add(()=>{     
                // Every frame check collisions/input        
                c.getWorldPointerRayToRef(this._tmpRay)
                var pick = scene.pickWithRay(this._tmpRay)
                if(pick){
                    if(c.inputSource.gamepad && c.inputSource.gamepad.buttons[0] && c.inputSource.gamepad.buttons[0].value > 0.7){
                        if(!triggerDown){
                            scene.simulatePointerDown(pick, { pointerId: _id });
                        }
                        triggerDown = true;
                    }else{
                        if(triggerDown){
                            scene.simulatePointerUp(pick, { pointerId: _id });
                        }
                        triggerDown = false;
                    }
                    scene.simulatePointerMove(pick, { pointerId: _id });
                }
                
                if(pick && pick.pickedPoint && pick.hit){
                    // Update laser state
                    this._updatePointerDistance(_laserPointer, pick.distance)

                    // Update cursor state
                    _cursorMesh.position.copyFrom(pick.pickedPoint)
                    _cursorMesh.scaling.x = Math.sqrt(pick.distance);
                    _cursorMesh.scaling.y = Math.sqrt(pick.distance);
                    _cursorMesh.scaling.z = Math.sqrt(pick.distance);

                    // To avoid z-fighting
                    var pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(), this._tmpRay);
                    let deltaFighting = 0.002;
                    _cursorMesh.position.copyFrom(pick.pickedPoint);
                    if (pickNormal) {
                        var axis1 = Vector3.Cross(Axis.Y, pickNormal);
                        var axis2 = Vector3.Cross(pickNormal, axis1);
                        Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, _cursorMesh.rotation);
                        _cursorMesh.position.addInPlace(pickNormal.scale(deltaFighting));
                    }
                    _cursorMesh.isVisible = true;
                }else{
                    _cursorMesh.isVisible = false;
                }
            })
        })
    }

    private _convertNormalToDirectionOfRay(normal: Nullable<Vector3>, ray: Ray) {
        if (normal) {
            var angle = Math.acos(Vector3.Dot(normal, ray.direction));
            if (angle < Math.PI / 2) {
                normal.scaleInPlace(-1);
            }
        }
        return normal;
    }

    private _updatePointerDistance(_laserPointer:Mesh, distance: number = 100) {
        _laserPointer.scaling.y = distance;
        _laserPointer.position.z = distance / 2;
    }
}

/**
 * Enables teleportation
 */
export class WebXRControllerTeleportation {
    private _teleportationFillColor: string = "#444444";
    private _teleportationBorderColor: string = "#FFFFFF";

    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();

    /**
     * 
     * @param input 
     * @param floorMeshes 
     */
    constructor(input: WebXRInput, public floorMeshes:Array<AbstractMesh> = []){
        input.onControllerAddedObservable.add((c)=>{
            var scene = c.pointer.getScene();

            var _forwardReadyToTeleport = false;
            var _backwardReadyToTeleport = false;
            var _leftReadyToTeleport = false;
            var _rightReadyToTeleport = false;

            // Teleport target abd it's animation
            var teleportationTarget = Mesh.CreateGround("teleportationTarget", 2, 2, 2, scene);
            teleportationTarget.isPickable = false;
            var length = 512;
            var dynamicTexture = new DynamicTexture("DynamicTexture", length, scene, true);
            dynamicTexture.hasAlpha = true;
            var context = dynamicTexture.getContext();
            var centerX = length / 2;
            var centerY = length / 2;
            var radius = 200;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = this._teleportationFillColor;
            context.fill();
            context.lineWidth = 10;
            context.strokeStyle = this._teleportationBorderColor;
            context.stroke();
            context.closePath();
            dynamicTexture.update();
            var teleportationCircleMaterial = new StandardMaterial("TextPlaneMaterial", scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            teleportationTarget.material = teleportationCircleMaterial;
            var torus = Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, scene, false);
            torus.isPickable = false;
            torus.parent = teleportationTarget;
            var animationInnerCircle = new Animation("animationInnerCircle", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            var keys = [];
            keys.push({
                frame: 0,
                value: 0
            });
            keys.push({
                frame: 30,
                value: 0.4
            });
            keys.push({
                frame: 60,
                value: 0
            });
            animationInnerCircle.setKeys(keys);
            var easingFunction = new SineEase();
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);
            torus.animations = [];
            torus.animations.push(animationInnerCircle);
            scene.beginAnimation(torus, 0, 60, true);

            // Handle user input on every frame
            scene.onBeforeRenderObservable.add(()=>{
                // Move the teleportationTarget to where the user is targetting to teleport to
                if(_forwardReadyToTeleport){
                    c.getWorldPointerRayToRef(this._tmpRay)
                    var pick = scene.pickWithRay(this._tmpRay, (o)=>{
                        return floorMeshes.indexOf(o) !== -1;
                    })
                    if(pick && pick.pickedPoint){
                        // To avoid z-fighting
                        teleportationTarget.position.copyFrom(pick.pickedPoint);
                        teleportationTarget.position.y += 0.002;
                    }
                    teleportationTarget.isVisible = true;
                    (<Mesh>teleportationTarget.getChildren()[0]).isVisible = true;
                }else{
                    teleportationTarget.isVisible = false;
                    (<Mesh>teleportationTarget.getChildren()[0]).isVisible = false;
                }

                if(c.inputSource.gamepad){
                    if(c.inputSource.gamepad.axes[1]){
                        // Forward teleportation
                        if(c.inputSource.gamepad.axes[1] < -0.7){
                            _forwardReadyToTeleport = true
                        }else{
                            if(_forwardReadyToTeleport){
                                // Teleport the users feet to where they targetted
                                this._tmpVector.copyFrom(teleportationTarget.position)
                                this._tmpVector.y += input.xrExperienceHelper.camera.position.y;
                                input.xrExperienceHelper.setPositionOfCameraUsingContainer(this._tmpVector)
                            }
                            _forwardReadyToTeleport = false
                        }

                        // Backward teleportation
                        if(c.inputSource.gamepad.axes[1] > 0.7){
                            _backwardReadyToTeleport = true
                        }else{
                            if(_backwardReadyToTeleport){
                                // Cast a ray down from behind the user
                                var camMat = input.xrExperienceHelper.camera.computeWorldMatrix();
                                var q = new Quaternion()
                                camMat.decompose(undefined, q, this._tmpRay.origin)
                                this._tmpVector.set(0,0,-1);
                                this._tmpVector.rotateByQuaternionToRef(q, this._tmpVector)
                                this._tmpVector.y = 0;
                                this._tmpVector.normalize()
                                this._tmpVector.y = -1.5;
                                this._tmpVector.normalize()
                                this._tmpRay.direction.copyFrom(this._tmpVector)
                                var pick = scene.pickWithRay(this._tmpRay, (o)=>{
                                    return floorMeshes.indexOf(o) !== -1;
                                })

                                if(pick && pick.pickedPoint){
                                    // Teleport the users feet to where they targetted
                                    this._tmpVector.copyFrom(pick.pickedPoint)
                                    this._tmpVector.y += input.xrExperienceHelper.camera.position.y;
                                    input.xrExperienceHelper.setPositionOfCameraUsingContainer(this._tmpVector)
                                }
                            }
                            _backwardReadyToTeleport = false
                        }
                    }

                    if(c.inputSource.gamepad.axes[0]){
                        if(c.inputSource.gamepad.axes[0] < -0.7){
                            _leftReadyToTeleport = true
                        }else{
                            if(_leftReadyToTeleport){
                                input.xrExperienceHelper.rotateCameraByQuaternionUsingContainer(Quaternion.FromEulerAngles(0, -Math.PI/4, 0))
                            }
                            _leftReadyToTeleport = false
                        }
                        if(c.inputSource.gamepad.axes[0] > 0.7){
                            _rightReadyToTeleport = true
                        }else{
                            if(_rightReadyToTeleport){
                                input.xrExperienceHelper.rotateCameraByQuaternionUsingContainer(Quaternion.FromEulerAngles(0, Math.PI/4, 0))
                            }
                            _rightReadyToTeleport = false
                        }
                    }
                    
                }
            })
        })
    }

    
}