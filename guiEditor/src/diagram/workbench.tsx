import * as React from "react";
import { GlobalState } from "../globalState";
import { Nullable } from "babylonjs/types";
import { Control } from "babylonjs-gui/2D/controls/control";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";
import { Color4 } from "babylonjs/Maths/math.color";
import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { Axis } from "babylonjs/Maths/math.axis";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Plane } from "babylonjs/Maths/math.plane";
import { PointerEventTypes, PointerInfo } from "babylonjs/Events/pointerEvents";
import { EventState } from "babylonjs/Misc/observable";
import { IWheelEvent } from "babylonjs/Events/deviceInputEvents";
import { Epsilon } from "babylonjs/Maths/math.constants";
import { Button } from "babylonjs-gui/2D/controls/button";
import { Container } from "babylonjs-gui/2D/controls/container";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { KeyboardEventTypes, KeyboardInfo } from "babylonjs/Events/keyboardEvents";
import { Line } from "babylonjs-gui/2D/controls/line";
import { DataStorage } from "babylonjs/Misc/dataStorage";
require("./workbenchCanvas.scss");

export interface IWorkbenchComponentProps {
    globalState: GlobalState;
}

export type FramePortData = {};

export const isFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData) !== undefined;
    } else return false;
};

export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
    private _rootContainer: React.RefObject<HTMLCanvasElement>;;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _textureMesh: Mesh;
    private _scene: Scene;
    private _selectedGuiNodes: Control[] = [];
    private _ctrlKeyIsPressed = false;
    private _forcePanning = false;
    private _forceZooming = false;
    private _forceSelecting = false;
    private _outlines = false;
    public _frameIsMoving = false;
    public _isLoading = false;
    public isOverGUINode = false;
    public artBoardBackground : Rectangle;
    private _panning: boolean;
    private _canvas: HTMLCanvasElement;
    private _responsive: boolean;

    public get globalState() {
        return this.props.globalState;
    }

    public get nodes() {
        return this.globalState.guiTexture.getChildren()[0].children;
    }

    public get selectedGuiNodes() {
        return this._selectedGuiNodes;
    }

    constructor(props: IWorkbenchComponentProps) {
        super(props);
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        props.globalState.onSelectionChangedObservable.add((selection) => {
            if (!selection) {
                this.changeSelectionHighlight(false);
                this._selectedGuiNodes = [];
            } else {
                if (selection instanceof Control) {
                    if (this._ctrlKeyIsPressed) {
                        if (this._selectedGuiNodes.indexOf(selection) === -1) {
                            this._selectedGuiNodes.push(selection);
                        }
                    } else {
                        this.changeSelectionHighlight(false);
                        this._selectedGuiNodes = [selection];
                    }
                    this.changeSelectionHighlight(true);
                }
            }
        });

        props.globalState.onPanObservable.add(() => {
            this._forcePanning = !this._forcePanning;
            this._forceSelecting = false;
            this._forceZooming = false;
            if (!this._forcePanning) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            }
            else {
                this._canvas.style.cursor = "move";
            }
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._forceSelecting = true;
            this._forcePanning = false;
            this._forceZooming = false;
            this._canvas.style.cursor = "default"
        });

        props.globalState.onZoomObservable.add(() => {
            this._forceZooming = !this._forceZooming;
            this._forcePanning = false;
            this._forceSelecting = false;
            if (!this._forceZooming) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            }
            else {
                this._canvas.style.cursor = "zoom-in";
            }
        });

        props.globalState.onOutlinesObservable.add(() => {
            this._outlines = !this._outlines;
        });

        props.globalState.onParentingChangeObservable.add((control) => {
            this.parent(control);
        });

        props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.hostDocument!.addEventListener(
            "keyup",
            this.ctrlEvent,
            false
        );

        // Hotkey shortcuts
        this.props.globalState.hostDocument!.addEventListener(
            "keydown",
            this.ctrlEvent,
            false
        );
        this.props.globalState.hostDocument!.defaultView!.addEventListener(
            "blur",
            this.ctrlFalseEvent,
            false
        );

        this.props.globalState.workbench = this;
    }

    ctrlEvent = (evt: KeyboardEvent) => {
        this._ctrlKeyIsPressed = evt.ctrlKey;

    };

    ctrlFalseEvent = () => {
        this._ctrlKeyIsPressed = false;
    };

    componentWillUnmount() {
        this.props.globalState.hostDocument!.removeEventListener("keyup", this.ctrlEvent);
        this.props.globalState.hostDocument!.removeEventListener("keydown", this.ctrlEvent);
        this.props.globalState.hostDocument!.defaultView!.removeEventListener("blur", this.ctrlFalseEvent);
    }

    loadFromJson(serializationObject: any) {
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.globalState.guiTexture.parseContent(serializationObject);
        this.loadToEditor();
    }

    async loadFromSnippet(snippedId: string) {
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        await this.globalState.guiTexture.parseFromSnippetAsync(snippedId);
        this.loadToEditor();
    }

    loadToEditor() {
        var children = this.globalState.guiTexture.getChildren();
        children[0].children.forEach(guiElement => {
            if(guiElement.name === "Art-Board-Background" && guiElement.typeName === "Rectangle"){
                this.artBoardBackground = guiElement as Rectangle;
                return;
            }
            this.createNewGuiNode(guiElement);
        });
    }

    changeSelectionHighlight(value: boolean) {
        this.selectedGuiNodes.forEach(node => {
            if (this._outlines) {
                node.isHighlighted = true;
                node.highlightLineWidth = value ? 10 : 5;
            }
            else {
                node.isHighlighted = value;
                node.highlightLineWidth = 10;
            }
        });
    }

    resizeGuiTexture(newvalue: Vector2) {
        this._textureMesh.scaling.x = newvalue.x;
        this._textureMesh.scaling.z = newvalue.y;
        this.globalState.guiTexture.scaleTo(newvalue.x, newvalue.y);
        this.globalState.guiTexture.markAsDirty();
        this.globalState.onResizeObservable.notifyObservers(newvalue);
    }

    findNodeFromGuiElement(guiControl: Control) {
        return this.nodes.filter((n) => n === guiControl)[0];
    }

    appendBlock(guiElement: Control) {
        var newGuiNode = this.createNewGuiNode(guiElement);
        this.globalState.guiTexture.addControl(guiElement);
        return newGuiNode;
    }

    public isContainer(guiControl: Control) {
        switch (guiControl.typeName) {
            case "Button":
            case "StackPanel":
            case "Rectangle":
            case "Ellipse":
                return true;
            default:
                return false;
        }
    }

    createNewGuiNode(guiControl: Control) {
        this.enableEditorProperties(guiControl);
        guiControl.onPointerUpObservable.add((evt) => {
            this.clicked = false;
        });

        guiControl.onPointerDownObservable.add((evt) => {
            if (!this.isUp) return;
            this.isSelected(true, guiControl);
            this.isUp = false;
        });

        guiControl.onPointerEnterObservable.add((evt) => {
            this.isOverGUINode = true;
        });

        guiControl.onPointerOutObservable.add((evt) => {
            this.isOverGUINode = false;
        });

        if (this.isContainer(guiControl)) {
            (guiControl as Container).children.forEach(child => {
                this.createNewGuiNode(child);
            });
        }

        return guiControl;
    }

    enableEditorProperties(guiControl: Control) {
        switch (guiControl.typeName) {
            case "Button":
                (guiControl as Button).pointerDownAnimation = () => null;
                (guiControl as Button).pointerUpAnimation = () => null;
                break;
            case "StackPanel":
            case "Grid":
                guiControl.isHighlighted = true;
                break;
            default:
                break;
        }
        guiControl.highlightLineWidth = 5;
    }

    private parent(control: Nullable<Control>) {
        const draggedControl = this.props.globalState.draggedControl;

        if (draggedControl != null) {
            if (draggedControl.parent) {
                (draggedControl.parent as Container).removeControl(draggedControl);
                this.props.globalState.guiTexture.addControl(draggedControl);
            }
            if (control != null && this.props.globalState.workbench.isContainer(control)) {
                this.props.globalState.guiTexture.removeControl(draggedControl);
                (control as Container).addControl(draggedControl);
            }
        }
        this.globalState.draggedControl = null;
    }

    public isSelected(value: boolean, guiNode: Control) {
        this.globalState.onSelectionChangedObservable.notifyObservers(guiNode);
    }

    public clicked: boolean;

    public _onMove(guiControl: Control, evt: Vector2, startPos: Vector2, ignorClick: boolean = false) {
        let newX = evt.x - startPos.x;
        let newY = evt.y - startPos.y;

        if (guiControl.typeName === "Line") {
            let line = (guiControl as Line);
            const x1 = (line.x1 as string).substr(0, (line.x1 as string).length - 2); //removing the 'px'
            const x2 = (line.x2 as string).substr(0, (line.x2 as string).length - 2);
            const y1 = (line.y1 as string).substr(0, (line.y1 as string).length - 2);
            const y2 = (line.y2 as string).substr(0, (line.y2 as string).length - 2);
            line.x1 = Number(x1) + newX;
            line.x2 = Number(x2) + newX;
            line.y1 = Number(y1) + newY;
            line.y2 = Number(y2) + newY;
            return true;
        }

        guiControl.leftInPixels += newX;
        guiControl.topInPixels += newY;

        //convert to percentage
        if (this._responsive) {
            const left = (guiControl.leftInPixels * 100) / (this._textureMesh.scaling.x);
            const top = (guiControl.topInPixels * 100) / (this._textureMesh.scaling.z);
            guiControl.left = `${left}%`;
            guiControl.top = `${top}%`;
        }
        return true;
    }

    componentDidMount() {
        this._rootContainer = React.createRef();
    }

    onMove(evt: React.PointerEvent) {
        var pos = this.getGroundPosition();
        // Move or guiNodes
        if (this._mouseStartPointX != null && this._mouseStartPointY != null && !this._panning) {
            var x = this._mouseStartPointX;
            var y = this._mouseStartPointY;
            let selected = false;
            this.selectedGuiNodes.forEach((element) => {
                //var zoom = this._camera.radius;

                if (pos) {
                    selected =
                        this._onMove(
                            element,
                            new Vector2(pos.x, -pos.z), //need to add zoom factor here.
                            new Vector2(x, y),
                            false
                        ) || selected;
                }
            });

            this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
            this._mouseStartPointY = pos ? pos.z * -1 : this._mouseStartPointY;
        }
    }

    public getGroundPosition() {
        var tex = this._textureMesh;
        // Use a predicate to get position on the ground
        var pickinfo = this._scene.pick(this._scene.pointerX, this._scene.pointerY, function (mesh) {
            return mesh == tex;
        });
        if (pickinfo?.hit) {
            return pickinfo.pickedPoint;
        }

        return null;
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.current?.setPointerCapture(evt.pointerId);

        if (!this.isOverGUINode) {
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        }

        var pos = this.getGroundPosition();
        this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
        this._mouseStartPointY = pos ? -pos.z : this._mouseStartPointY;
    }

    public isUp: boolean = true;
    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.current?.releasePointerCapture(evt.pointerId);
        this.isUp = true;
    }

    public createGUICanvas() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("workbench-canvas") as HTMLCanvasElement;
        this._canvas = canvas;
        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);

        // Create our first scene.
        this._scene = new Scene(engine);
        const clearColor = 204 / 255.0;
        this._scene.clearColor = new Color4(clearColor, clearColor, clearColor, 1.0);
        let camera = new ArcRotateCamera("Camera", -Math.PI / 2, 0, 1024, Vector3.Zero(), this._scene);
        const light = new HemisphericLight("light1", Axis.Y, this._scene);
        light.intensity = 0.9;

        let textureSize = 1024;
        this._textureMesh = Mesh.CreateGround("GuiCanvas", 1, 1, 1, this._scene);
        this._textureMesh.scaling.x = textureSize;
        this._textureMesh.scaling.z = textureSize;
        this.globalState.guiTexture = AdvancedDynamicTexture.CreateForMesh(this._textureMesh, textureSize, textureSize, true);
        this._textureMesh.showBoundingBox = true;

        this.artBoardBackground = new Rectangle("Art-Board-Background");
        this.artBoardBackground.width = "100%"
        this.artBoardBackground.height = "100%";
        this.artBoardBackground.background = "white";

        this.globalState.guiTexture.addControl(this.artBoardBackground);
        this.addControls(this._scene, camera);

        this._scene.getEngine().onCanvasPointerOutObservable.clear();

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize();
        });

        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`Please note: This editor is still a work in progress. You may submit feedback to msDestiny14 on GitHub.`);
        engine.runRenderLoop(() => { this._scene.render() });
        this.globalState.onNewSceneObservable.notifyObservers(this.globalState.guiTexture.getScene());
    };

    //Add map-like controls to an ArcRotate camera
    addControls(scene: Scene, camera: ArcRotateCamera) {
        camera.inertia = 0.7;
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 2500;
        camera.upperBetaLimit = Math.PI / 2 - 0.1;
        camera.angularSensibilityX = camera.angularSensibilityY = 500;

        const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);

        const inertialPanning = Vector3.Zero();

        let initialPos = new Vector3(0, 0, 0);
        const panningFn = () => {
            const pos = this.getPosition(scene, camera, plane);
            this.panning(pos, initialPos, camera.inertia, inertialPanning);
        };

        const inertialPanningFn = () => {
            if (inertialPanning.x !== 0 || inertialPanning.y !== 0 || inertialPanning.z !== 0) {
                camera.target.addInPlace(inertialPanning);
                inertialPanning.scaleInPlace(camera.inertia);
                this.zeroIfClose(inertialPanning);
            }
        };

        const wheelPrecisionFn = () => {
            camera.wheelPrecision = (1 / camera.radius) * 1000;
        };

        const zoomFnScrollWheel = (p: PointerInfo, e: EventState) => {
            const delta = this.zoomWheel(p, e, camera);
            this.zooming(delta, scene, camera, plane, inertialPanning);
        };

        const zoomFnMouse = (p: PointerInfo, e: EventState) => {
            const newPos = this.getPosition(scene, camera, plane);
            const deltaVector = initialPos.subtract(newPos);
            this.zooming(deltaVector.x > 0 ? -10 : 10, scene, camera, plane, inertialPanning);
        };

        const removeObservers = () => {
            scene.onPointerObservable.removeCallback(panningFn);
            scene.onPointerObservable.removeCallback(zoomFnMouse);
        };

        scene.onPointerObservable.add((p: PointerInfo, e: EventState) => {
            removeObservers();
            if (p.event.button !== 0 || this._forcePanning) {
                initialPos = this.getPosition(scene, camera, plane);
                scene.onPointerObservable.add(panningFn, PointerEventTypes.POINTERMOVE);
                this._panning = true;
            }
            else if (this._forceZooming) {
                initialPos = this.getPosition(scene, camera, plane);
                scene.onPointerObservable.add(zoomFnMouse, PointerEventTypes.POINTERMOVE);
                this._panning = false;
            }
            else {
                this._panning = false;
            }
        }, PointerEventTypes.POINTERDOWN);

        scene.onPointerObservable.add((p: PointerInfo, e: EventState) => {
            this._panning = false;
            removeObservers();
        }, PointerEventTypes.POINTERUP);


        scene.onKeyboardObservable.add((k: KeyboardInfo, e: KeyboardEventTypes) => {
            switch (k.event.key) {
                case "q": //select
                case "Q":
                    if (!this._forceSelecting)
                        this.globalState.onSelectionButtonObservable.notifyObservers();
                    break;
                case "w": //pan
                case "W":
                    if (!this._forcePanning)
                        this.globalState.onPanObservable.notifyObservers();
                    break;
                case "e": //zoom
                case "E":
                    if (!this._forceZooming)
                        this.globalState.onZoomObservable.notifyObservers();
                    break;
                case "r": //outlines
                case "R":
                    this.globalState.onOutlinesObservable.notifyObservers();
                    break;
                default:
                    break;
            }
        }, KeyboardEventTypes.KEYDOWN);


        scene.onPointerObservable.add(zoomFnScrollWheel, PointerEventTypes.POINTERWHEEL);
        scene.onBeforeRenderObservable.add(inertialPanningFn);
        scene.onBeforeRenderObservable.add(wheelPrecisionFn);

        // stop context menu showing on canvas right click
        scene
            .getEngine()
            .getRenderingCanvas()
            ?.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
    }

    //Get pos on plane
    getPosition(scene: Scene, camera: ArcRotateCamera, plane: Plane) {
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera, false);
        const distance = ray.intersectsPlane(plane);

        //not using this ray again, so modifying its vectors here is fine
        return distance !== null ? ray.origin.addInPlace(ray.direction.scaleInPlace(distance)) : Vector3.Zero();
    }

    //Return offsets for inertial panning given initial and current pointer positions
    panning(newPos: Vector3, initialPos: Vector3, inertia: number, ref: Vector3) {
        const directionToZoomLocation = initialPos.subtract(newPos);
        const panningX = directionToZoomLocation.x * (1 - inertia);
        const panningZ = directionToZoomLocation.z * (1 - inertia);
        ref.copyFromFloats(panningX, 0, panningZ);
        return ref;
    }

    //Get the wheel delta divided by the camera wheel precision
    zoomWheel(p: PointerInfo, e: EventState, camera: ArcRotateCamera) {
        const event = p.event as IWheelEvent;

        event.preventDefault();
        let delta = 0;
        if (event.deltaY) {
            delta = -event.deltaY;
        } else if (event.detail) {
            delta = -event.detail;
        }
        delta /= camera.wheelPrecision;
        return delta;
    }

    //Zoom to pointer position. Zoom amount determined by delta
    zooming(delta: number, scene: Scene, camera: ArcRotateCamera, plane: Plane, ref: Vector3) {
        let lr = camera.lowerRadiusLimit;
        let ur = camera.upperRadiusLimit;
        if (!lr || !ur) {
            return;
        }
        if (camera.radius - lr < 1 && delta > 0) {
            return;
        } else if (ur - camera.radius < 1 && delta < 0) {
            return;
        }
        const inertiaComp = 1 - camera.inertia;
        if (camera.radius - (camera.inertialRadiusOffset + delta) / inertiaComp < lr) {
            delta = (camera.radius - lr) * inertiaComp - camera.inertialRadiusOffset;
        } else if (camera.radius - (camera.inertialRadiusOffset + delta) / inertiaComp > ur) {
            delta = (camera.radius - ur) * inertiaComp - camera.inertialRadiusOffset;
        }

        const zoomDistance = delta / inertiaComp;
        const ratio = zoomDistance / camera.radius;
        const vec = this.getPosition(scene, camera, plane);

        const directionToZoomLocation = vec.subtract(camera.target);
        const offset = directionToZoomLocation.scale(ratio);
        offset.scaleInPlace(inertiaComp);
        ref.addInPlace(offset);

        camera.inertialRadiusOffset += delta;
    }

    //Sets x y or z of passed in vector to zero if less than Epsilon
    zeroIfClose(vec: Vector3) {
        if (Math.abs(vec.x) < Epsilon) {
            vec.x = 0;
        }
        if (Math.abs(vec.y) < Epsilon) {
            vec.y = 0;
        }
        if (Math.abs(vec.z) < Epsilon) {
            vec.z = 0;
        }
    }

    render() {
        return (
            <canvas id="workbench-canvas" onPointerMove={(evt) => this.onMove(evt)} onPointerDown={(evt) => this.onDown(evt)} onPointerUp={(evt) => this.onUp(evt)}
                ref={this._rootContainer}>
            </canvas>
        );
    }
}
