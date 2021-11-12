import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Measure } from "babylonjs-gui/2D/measure";
import { Axis } from "babylonjs/Maths/math.axis";
import { Plane } from "babylonjs/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";

require("./workbenchCanvas.scss");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {

    scalePoints: HTMLDivElement[] = [];
    private _mouseDown: boolean = false;
    private _scalePointIndex: number = -1;
    private _previousPositions: Vector2[] = [];

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;

        props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection) {
                this.scalePoints.forEach(scalePoint => {
                    scalePoint.style.display = "flex";
                });
            }
            else {
                this.scalePoints.forEach(scalePoint => {
                    scalePoint.style.display = "none";
                });
            }
            this.updateGizmo();
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo();
        })

    }

    componentDidMount() {
    }


    updateGizmo() {

        if (this.scalePoints[0].style.display === "none") return;
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            let size = this.props.globalState.guiTexture.getSize();
            let tempMeasure = new Measure(0, 0, 0, 0);
            node._currentMeasure.transformToRef(node._transformMatrix, tempMeasure);

            var ox = tempMeasure.left;
            var oy = tempMeasure.top;

            let startingPositions = [new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),];

            startingPositions[0].x -= node._currentMeasure.width / 2;
            startingPositions[0].z += node._currentMeasure.height / 2;

            startingPositions[1].x -= node._currentMeasure.width / 2;
            startingPositions[1].z -= node._currentMeasure.height / 2;

            startingPositions[2].x += node._currentMeasure.width / 2;
            startingPositions[2].z -= node._currentMeasure.height / 2;

            startingPositions[3].x += node._currentMeasure.width / 2;
            startingPositions[3].z += node._currentMeasure.height / 2


            let index = 0;
            this.scalePoints.forEach(scalePoint => {
                //we get the corner of the control with rotation 0
                let res = startingPositions[index];

                let result = new Vector2(res.x, res.z);
                let m2d = Matrix2D.Identity();
                let m2dP = Matrix2D.Identity();
                let translateBack = Matrix2D.Identity();
                let translateTo = Matrix2D.Identity();
                let resultMatrix = Matrix2D.Identity();

                var oox = ox ;
                var ooy = oy ;
                
                Matrix2D.TranslationToRef(oox, ooy, translateBack);
                Matrix2D.TranslationToRef(-oox, -ooy, translateTo);
                Matrix2D.RotationToRef(node.rotation, m2d);
                let parent = node.parent;
                while (parent) { //#S69ESC
                    let parentRot = parent.rotation;
                    Matrix2D.RotationToRef(parentRot, m2dP);
                    m2d.multiplyToRef(m2dP, m2d);
                    parent = parent.parent;
                }

                translateTo.multiplyToRef(m2d, resultMatrix);
                resultMatrix.multiplyToRef(translateBack, resultMatrix);
                resultMatrix.transformCoordinates(result.x, result.y, result);

                //v (x,0,y); 
                res.x = result.x;
                res.z = result.y;

                //project to screen space
                res.x -= (size.width / 2) - tempMeasure.width / 2;
                res.z -= (size.height / 2) - tempMeasure.height / 2;
                res.z *= -1;

                this._previousPositions[index].x = res.x;
                this._previousPositions[index].y = res.z;

                let camera = this.props.globalState.workbench._camera;
                const scene = this.props.globalState.workbench._scene;
                const engine = scene.getEngine();
                let finalResult = Vector3.Project(res,
                    Matrix.Identity(),
                    scene.getTransformMatrix(),
                    camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

                scalePoint.style.left = finalResult.x + "px";
                scalePoint.style.top = finalResult.y + "px";

                ++index;

            });
        }

    }

    createBaseGizmo() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("workbench-canvas") as HTMLCanvasElement;

        for (let i = 0; i < 4; ++i) {
            let scalePoint = canvas.ownerDocument!.createElement("div");
            scalePoint.className = "ge-scalePoint";
            canvas.parentElement?.appendChild(scalePoint);
            scalePoint.style.position = "absolute";
            scalePoint.style.display = "none";
            scalePoint.style.left = i * 100 + 'px';
            scalePoint.style.top = i * 100 + 'px';
            scalePoint.style.transform = "translate(-50%, -50%)";
            this.scalePoints.push(scalePoint);
            this._previousPositions.push(new Vector2(0, 0));
        }

        this.scalePoints[0].addEventListener("pointerdown", this._onLeftBottomDown);
        this.scalePoints[1].addEventListener("pointerdown", this._onLeftTopDown);
        this.scalePoints[2].addEventListener("pointerdown", this._onRightTopDown);
        this.scalePoints[3].addEventListener("pointerdown", this._onRightBottomDown);

        this.scalePoints[0].addEventListener("pointerup", this._onUp);
        this.scalePoints[1].addEventListener("pointerup", this._onUp);
        this.scalePoints[2].addEventListener("pointerup", this._onUp);
        this.scalePoints[3].addEventListener("pointerup", this._onUp);

        this.updateGizmo();
    }

    public onMove(evt: React.PointerEvent) {
        if (this._mouseDown) {
            this._updateScale();
        }
    }

    private _updateScale() {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];


            let camera = this.props.globalState.workbench._camera;
            const scene = this.props.globalState.workbench._scene;
            const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
            let newPosition = this.props.globalState.workbench.getPosition(scene, camera, plane);


            let dx = newPosition.x - this._previousPositions[this._scalePointIndex].x;
            let dy = newPosition.z - this._previousPositions[this._scalePointIndex].y;

            switch (this._scalePointIndex) {
                case 0:
                    node.widthInPixels -= dx * 2;
                    node.heightInPixels -= dy * 2;
                    break;
                case 1:
                    node.widthInPixels -= dx * 2;
                    node.heightInPixels += dy * 2;
                    break;
                case 2:
                    node.widthInPixels += dx * 2;
                    node.heightInPixels += dy * 2;
                    break;
                case 3:
                    node.widthInPixels += dx * 2;
                    node.heightInPixels -= dy * 2;
                    break;
                default:
                    break;
            }

            //this.props.globalState.workbench.testControl.leftInPixels = newPosition.x;
            //this.props.globalState.workbench.testControl.topInPixels = -newPosition.z;

            this._previousPositions[this._scalePointIndex].x = newPosition.x;
            this._previousPositions[this._scalePointIndex].y = newPosition.z;
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            this.updateGizmo();

        }
    }

    public onUp(evt: React.PointerEvent<HTMLElement>) {
        this._mouseDown = false;
        this._scalePointIndex = -1;
    }

    private _onUp = (evt: PointerEvent) => {
        this._mouseDown = false;
        this._scalePointIndex = -1;
    }

    private _onLeftBottomDown = (evt: PointerEvent) => {
        this._setMousePosition(0);
    }

    private _onLeftTopDown = (evt: PointerEvent) => {
        this._setMousePosition(1);
    }

    private _onRightTopDown = (evt: PointerEvent) => {
        this._setMousePosition(2);
    }

    private _onRightBottomDown = (evt: PointerEvent) => {
        this._setMousePosition(3);
    }

    private _setMousePosition = (index: number) => {
        this._mouseDown = true;
        this._scalePointIndex = index;
    }

    render() {
        return (
            null
        );
    }
}
