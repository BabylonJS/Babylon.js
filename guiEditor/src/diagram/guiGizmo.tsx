import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";

require("./workbenchCanvas.scss");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {

    scalePoints: HTMLDivElement[] = [];
    private _mouseX: number | undefined;
    private _mouseY: number | undefined;
    private _mouseDown: boolean = false;
    private _scalePointIndex: number;

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
           // this.updateGizmo();
        })

    }

    componentDidMount() {
    }


    updateGizmo() {

        if (this.scalePoints[0].style.display === "none") return;
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            //var ox = node._currentMeasure.width * node.transformCenterX + node._currentMeasure.left;
            //var oy = node._currentMeasure.height * node.transformCenterY + node._currentMeasure.top;

            var ox = node.leftInPixels;
            var oy = node.topInPixels;

            let startingPositions = [new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),];

            let size = this.props.globalState.guiTexture.getSize();
            //calcualte allignments
            let offsetX = 0;
            let offsetY = 0;
            switch (node.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    offsetX = ((-size.width / 2) + node._currentMeasure.width * node.scaleX / 2);
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    offsetX = ((size.width / 2) - node._currentMeasure.width * node.scaleX / 2);
                    break;
                default:
                    break;
            }
            switch (node.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    offsetY = ((size.height / 2) - node._currentMeasure.height * node.scaleY / 2);
                    break;
                case Control.VERTICAL_ALIGNMENT_TOP:
                    offsetY = ((-size.height / 2) + node._currentMeasure.height * node.scaleY / 2);
                    break;
                default:
                    break;
            }


            startingPositions[0].x -= node._currentMeasure.width * node.scaleX / 2;
            startingPositions[0].z += node._currentMeasure.height * node.scaleY / 2;

            startingPositions[1].x -= node._currentMeasure.width * node.scaleX / 2;
            startingPositions[1].z -= node._currentMeasure.height * node.scaleY / 2;

            startingPositions[2].x += node._currentMeasure.width * node.scaleX / 2;
            startingPositions[2].z -= node._currentMeasure.height * node.scaleY / 2;

            startingPositions[3].x += node._currentMeasure.width * node.scaleX / 2;
            startingPositions[3].z += node._currentMeasure.height * node.scaleY / 2;


            let index = 0;
            this.scalePoints.forEach(scalePoint => {

                //we get the corner of the control with rotation 0
                let res = startingPositions[index++];
                res.x += offsetX;
                res.z += offsetY;

                let result = new Vector2(res.x, res.z);
                let m2d = Matrix2D.Identity();
                let translateBack = Matrix2D.Identity();
                let translateTo = Matrix2D.Identity();
                let resultMatrix = Matrix2D.Identity();


                var oox = node.leftInPixels + offsetX;
                var ooy = node.topInPixels + offsetY;

                Matrix2D.TranslationToRef(oox, ooy, translateBack);
                Matrix2D.TranslationToRef(-oox, -ooy, translateTo);
                Matrix2D.RotationToRef(node.rotation, m2d);
                translateTo.multiplyToRef(m2d, resultMatrix);
                resultMatrix.multiplyToRef(translateBack, resultMatrix);
                resultMatrix.transformCoordinates(result.x, result.y, result);

                //node._transformMatrix.transformCoordinates(result.x, result.y, result);

                //v (x,0,y); 
                res.x = result.x;
                res.z = result.y;

                //project to screen space
                res.z *= -1;
                let camera = this.props.globalState.workbench._camera;
                const scene = this.props.globalState.workbench._scene;
                const engine = scene.getEngine();
                let finalResult = Vector3.Project(res,
                    Matrix.Identity(),
                    scene.getTransformMatrix(),
                    camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

                scalePoint.style.left = finalResult.x + "px";
                scalePoint.style.top = finalResult.y + "px";


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
        if (this._mouseDown && this._mouseX && this._mouseY) {
            const x = this.props.globalState.workbench._scene.pointerX;
            const y = this.props.globalState.workbench._scene.pointerY;
            const deltaX = x - this._mouseX;
            const deltaY = y - this._mouseY;

            const left = parseInt(this.scalePoints[this._scalePointIndex].style.left.substring(0, this.scalePoints[this._scalePointIndex].style.left.length - 2));
            const top = parseInt(this.scalePoints[this._scalePointIndex].style.top.substring(0, this.scalePoints[this._scalePointIndex].style.top.length - 2));

            this.scalePoints[this._scalePointIndex].style.left = left + deltaX + "px";
            this.scalePoints[this._scalePointIndex].style.top = top + deltaY + "px";

            this._mouseX = x;
            this._mouseY = y;
        }
    }

    public onUp(evt: React.PointerEvent<HTMLElement>) {
        this._mouseX = undefined;
        this._mouseY = undefined;
        this._mouseDown = false;
    }

    private _onUp = (evt: PointerEvent) => {
        this._mouseX = undefined;
        this._mouseY = undefined;
        this._mouseDown = false;
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

    private _setMousePosition = (index : number) => {
        this._mouseX = this.props.globalState.workbench._scene.pointerX;
        this._mouseY = this.props.globalState.workbench._scene.pointerY;
        this._mouseDown = true;
        this._scalePointIndex = index; 
    }

    render() {
        return (
            null
        );
    }
}
