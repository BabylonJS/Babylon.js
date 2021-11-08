import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";
import { PropertyChangedEvent } from "../sharedUiComponents/propertyChangedEvent";

require("./workbenchCanvas.scss");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {

    scalePoints: HTMLDivElement[] = [];
    private _headerElement: any;
    private _borderElement: any;
    private _canvas: HTMLCanvasElement;

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

        /*this.props.globalState.onPropertyGridUpdateRequiredObservable.add(() => {
            this.updateGizmo();
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo();
        });

        this.props.globalState.onPropertyChangedObservable.add((event: PropertyChangedEvent) => {
            ;
            if (event.property === "rotation" ||
                event.property === "position" ||
                event.property === "scale") {
                this.updateGizmo();
            }
        });*/


    }

    componentDidMount() {
    }

    onMove(evt: React.PointerEvent) {
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
    }


    updateGizmo() {

        setTimeout(() => {
            this.updateGizmo();
        }, 10);

        if (this.scalePoints[0].style.display === "none") return;
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            let startingPositions = [new Vector3(node.leftInPixels, 0, node.topInPixels),
            new Vector3(node.leftInPixels, 0, node.topInPixels),
            new Vector3(node.leftInPixels, 0, node.topInPixels),
            new Vector3(node.leftInPixels, 0, node.topInPixels),]

            let size = this.props.globalState.guiTexture.getSize();
            //calcualte allignments
            let offsetX = 0;
            let offsetY = 0;
            switch (node.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    offsetX = ((-size.width / 2) + node.widthInPixels / 2);
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    offsetX = ((size.width / 2) - node.widthInPixels / 2);
                    break;
                default:
                    break;
            }
            switch (node.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    break;
                case Control.VERTICAL_ALIGNMENT_TOP:
                    break;
                default:
                    break;
            }

            startingPositions[0].x -= node.widthInPixels / 2;
            startingPositions[0].z += node.heightInPixels / 2;

            startingPositions[1].x -= node.widthInPixels / 2;
            startingPositions[1].z -= node.heightInPixels / 2;

            startingPositions[2].x += node.widthInPixels / 2;
            startingPositions[2].z -= node.heightInPixels / 2;

            startingPositions[3].x += node.widthInPixels / 2;
            startingPositions[3].z += node.heightInPixels / 2;

            let index = 0;
            this.scalePoints.forEach(scalePoint => {

                //we get the corner of the control with rotation 0
                let res = startingPositions[index++];
                res.x += offsetX;
                res.y += offsetY;

                let result = new Vector2(res.x, res.z);
                let m2d = Matrix2D.Identity();
                let translateBack = Matrix2D.Identity();
                let translateTo = Matrix2D.Identity();
                let resultMatrix = Matrix2D.Identity();

                Matrix2D.TranslationToRef(node.leftInPixels, node.topInPixels, translateBack);
                Matrix2D.TranslationToRef(-node.leftInPixels, -node.topInPixels, translateTo);
                Matrix2D.RotationToRef(node.rotation, m2d);
                translateTo.multiplyToRef(m2d, resultMatrix);
                resultMatrix.multiplyToRef(translateBack, resultMatrix);
                resultMatrix.transformCoordinates(result.x, result.y, result);

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
        this._canvas = canvas;

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
        /*const root = canvas;
        this.element = root.ownerDocument!.createElement("div");
        this.element.classList.add("frame-box");
        root.appendChild(this.element);

        this._headerElement = root.ownerDocument!.createElement("div");
        this._headerElement.classList.add("frame-box-header");

        this.element.appendChild(this._headerElement);

        this._borderElement = root.ownerDocument!.createElement("div");
        this._borderElement.classList.add("frame-box-border");

        this.element.appendChild(this._borderElement);*/

        // add resizing side handles

        /*const rightHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        rightHandle.className = "handle right-handle";
        this.element.appendChild(rightHandle);
        rightHandle.addEventListener("pointerdown", this._onRightHandlePointerDown);

        const leftHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        leftHandle.className = "handle left-handle";
        this.element.appendChild(leftHandle);
        leftHandle.addEventListener("pointerdown", this._onLeftHandlePointerDown);

        const bottomHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomHandle.className = "handle bottom-handle";
        this.element.appendChild(bottomHandle);
        bottomHandle.addEventListener("pointerdown", this._onBottomHandlePointerDown);

        const topHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topHandle.className = "handle top-handle";
        this.element.appendChild(topHandle);
        topHandle.addEventListener("pointerdown", this._onTopHandlePointerDown);

        const topRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topRightCornerHandle.className = "handle right-handle top-right-corner-handle";
        this.element.appendChild(topRightCornerHandle);
        topRightCornerHandle.addEventListener("pointerdown", this._onTopRightHandlePointerDown);

        const bottomRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomRightCornerHandle.className = "handle right-handle bottom-right-corner-handle";
        this.element.appendChild(bottomRightCornerHandle);
        bottomRightCornerHandle.addEventListener("pointerdown", this._onBottomRightHandlePointerDown);

        const topLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topLeftCornerHandle.className = "handle left-handle top-left-corner-handle";
        this.element.appendChild(topLeftCornerHandle);
        topLeftCornerHandle.addEventListener("pointerdown", this._onTopLeftHandlePointerDown);

        const bottomLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomLeftCornerHandle.className = "handle left-handle bottom-left-corner-handle";
        this.element.appendChild(bottomLeftCornerHandle);
        bottomLeftCornerHandle.addEventListener("pointerdown", this._onBottomLeftHandlePointerDown);*/
        this.updateGizmo();
    }
    private _onRightHandlePointerDown(arg0: string, _onRightHandlePointerDown: any) {
        throw new Error("Method not implemented.");
    }


    render() {
        return (
            null
        );
    }
}
