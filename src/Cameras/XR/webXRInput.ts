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

export class WebXRControllerModelLoader {
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

export class WebXRControllerPointerSelection {
    private _laserPointer: Mesh;
    private _gazeTracker: Mesh;
    private triggerDown = false;
    public static _idCounter = 0;
    private _id:number;
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    constructor(input: WebXRInput){
        this._id = WebXRControllerPointerSelection._idCounter++;
        input.onControllerAddedObservable.add((c)=>{
            var scene = c.pointer.getScene();
            this._laserPointer = Mesh.CreateCylinder("laserPointer", 1, 0.0002, 0.004, 20, 1, scene, false);
            this._laserPointer.parent = c.pointer

            var laserPointerMaterial = new StandardMaterial("laserPointerMat", scene);
            laserPointerMaterial.emissiveColor = new Color3(0.7, 0.7, 0.7);
            laserPointerMaterial.alpha = 0.6;
            this._laserPointer.material = laserPointerMaterial;
            
            this._laserPointer.rotation.x = Math.PI / 2;
            this._updatePointerDistance(1)
            this._laserPointer.isPickable = false;


            this._gazeTracker = Mesh.CreateTorus("gazeTracker", 0.0035*3, 0.0025*3, 20, scene, false);
            this._gazeTracker.bakeCurrentTransformIntoVertices();
            this._gazeTracker.isPickable = false;
            this._gazeTracker.isVisible = false;
            var targetMat = new StandardMaterial("targetMat", scene);
            targetMat.specularColor = Color3.Black();
            targetMat.emissiveColor = new Color3(0.7, 0.7, 0.7);
            targetMat.backFaceCulling = false;
            this._gazeTracker.material = targetMat;


            

            scene.onBeforeRenderObservable.add(()=>{                
                c.getWorldPointerRayToRef(this._tmpRay)
                var pick = scene.pickWithRay(this._tmpRay)

                if(pick){
                    if(c.inputSource.gamepad && c.inputSource.gamepad.buttons[0] && c.inputSource.gamepad.buttons[0].value > 0.7){
                        if(!this.triggerDown){
                            scene.simulatePointerDown(pick, { pointerId: this._id });
                        }
                        this.triggerDown = true;
                    }else{
                        if(this.triggerDown){
                            scene.simulatePointerUp(pick, { pointerId: this._id });
                        }
                        this.triggerDown = false;
                    }
                    scene.simulatePointerMove(pick, { pointerId: this._id });
                }
                

                
                if(pick && pick.pickedPoint && pick.hit){
                    this._updatePointerDistance(pick.distance)

                    // Scale based on distance
                    this._gazeTracker.position.copyFrom(pick.pickedPoint)
                    this._gazeTracker.scaling.x = Math.sqrt(pick.distance);
                    this._gazeTracker.scaling.y = Math.sqrt(pick.distance);
                    this._gazeTracker.scaling.z = Math.sqrt(pick.distance);

                    // To avoid z-fighting
                    var pickNormal = this._convertNormalToDirectionOfRay(pick.getNormal(), this._tmpRay);
                    let deltaFighting = 0.002;
                    this._gazeTracker.position.copyFrom(pick.pickedPoint);
                    if (pickNormal) {
                        var axis1 = Vector3.Cross(Axis.Y, pickNormal);
                        var axis2 = Vector3.Cross(pickNormal, axis1);
                        Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._gazeTracker.rotation);
                        this._gazeTracker.position.addInPlace(pickNormal.scale(deltaFighting));
                    }

                    this._gazeTracker.isVisible = true;
                }else{
                    this._gazeTracker.isVisible = false;
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

    public _updatePointerDistance(distance: number = 100) {
        this._laserPointer.scaling.y = distance;
        this._laserPointer.position.z = distance / 2;
    }
}

export class WebXRControllerTeleportation {
    private _teleportationFillColor: string = "#444444";
    private _teleportationBorderColor: string = "#FFFFFF";
    private _forwardReadyToTeleport = false;
    private _backwardReadyToTeleport = false;
    private _tmpRay = new Ray(new Vector3(), new Vector3());
    private _tmpVector = new Vector3();
    constructor(input: WebXRInput, public floorMeshes = []){
        input.onControllerAddedObservable.add((c)=>{
            var scene = c.pointer.getScene();

            // Teleport animation
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



            scene.onBeforeRenderObservable.add(()=>{
                if(this._forwardReadyToTeleport){
                    c.getWorldPointerRayToRef(this._tmpRay)
                    var pick = scene.pickWithRay(this._tmpRay)
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
                        if(c.inputSource.gamepad.axes[1] < -0.7){
                            this._forwardReadyToTeleport = true
                        }else{
                            if(this._forwardReadyToTeleport){
                                this._tmpVector.copyFrom(teleportationTarget.position)
                                this._tmpVector.y += input.xrExperienceHelper.camera.position.y;
                                input.xrExperienceHelper.setPositionOfCameraUsingContainer(this._tmpVector)
                            }
                            this._forwardReadyToTeleport = false
                        }

                        if(c.inputSource.gamepad.axes[1] > 0.7){
                            this._backwardReadyToTeleport = true
                        }else{
                            if(this._backwardReadyToTeleport){
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
                                var pick = scene.pickWithRay(this._tmpRay)

                                if(pick && pick.pickedPoint){
                                    this._tmpVector.copyFrom(pick.pickedPoint)
                                    this._tmpVector.y += input.xrExperienceHelper.camera.position.y;
                                    input.xrExperienceHelper.setPositionOfCameraUsingContainer(this._tmpVector)
                                }
                            }
                            this._backwardReadyToTeleport = false
                        }
                    }
                    
                }
            })
        })
    }

    
}