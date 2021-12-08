import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Measure } from "babylonjs-gui/2D/measure";
import { Axis } from "babylonjs/Maths/math.axis";
import { Plane } from "babylonjs/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";
import { Image } from "babylonjs-gui/2D/controls/image";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";

require("./workbenchCanvas.scss");
const gizmoPivotIcon: string = require("../../public/imgs/gizmoPivotIcon.svg");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {
    scalePoints: HTMLDivElement[] = [];
    private _mouseDown: boolean = false;
    private _scalePointIndex: number = -1;
    private _pointerData: { onDown: { x: number; y: number }; onMove: { x: number; y: number }; active: boolean }[] = [];
    private _responsive: boolean;

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        // Set visablity
        props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection) {
                this.scalePoints.forEach((scalePoint) => {
                    scalePoint.style.display = "flex";
                });
            } else {
                this.scalePoints.forEach((scalePoint) => {
                    scalePoint.style.display = "none";
                });
            }
            this.updateGizmo();
        });

        this.props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo();
        });
    }

    componentDidMount() {}

    updateGizmo() {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            // Getting the global center point of the control.
            let tempMeasure = new Measure(0, 0, 0, 0);
            node._currentMeasure.transformToRef(node._transformMatrix, tempMeasure);

            var ox = tempMeasure.left;
            var oy = tempMeasure.top;

            let startingPositions = [
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
                new Vector3(ox, 0, oy),
            ];

            // Calculating the offsets for each scale point.
            const scale = this.getScale(node, true);
            const halfScaleX = scale.x / 2;
            const halfScaleY = scale.y / 2;
            startingPositions[0].x -= node._currentMeasure.width * halfScaleX;
            startingPositions[0].z += node._currentMeasure.height * halfScaleY;

            startingPositions[1].x -= node._currentMeasure.width * halfScaleX;
            startingPositions[1].z -= node._currentMeasure.height * halfScaleY;

            startingPositions[2].x += node._currentMeasure.width * halfScaleX;
            startingPositions[2].z -= node._currentMeasure.height * halfScaleY;

            startingPositions[3].x += node._currentMeasure.width * halfScaleX;
            startingPositions[3].z += node._currentMeasure.height * halfScaleY;

            startingPositions[4].x -= node._currentMeasure.width * halfScaleX;
            startingPositions[5].z -= node._currentMeasure.height * halfScaleY;
            startingPositions[6].x += node._currentMeasure.width * halfScaleX;
            startingPositions[7].z += node._currentMeasure.height * halfScaleY;

            // Calculate the pivot point
            const pivotX = (node.transformCenterX - 0.5) * 2;
            const pivotY = (node.transformCenterY - 0.5) * 2;
            startingPositions[8].x += node._currentMeasure.width * halfScaleX * pivotX;
            startingPositions[8].z += node._currentMeasure.height * halfScaleY * pivotY;

            this.scalePoints.forEach((scalePoint, index) => {
                //we get the corner of the control with rotation 0
                let res = startingPositions[index];

                const result = new Vector2(res.x, res.z);
                // TODO optimize this - unify?
                this._nodeToRTTSpace(node, result.x, result.y, result);
                const finalResult = this._rttSpaceToCanvasSpace(node, result.x, result.y);

                // check if back-conversion works
                // const backToRTT = this._canvasSpaceToRTTSpace(node, finalResult);
                // const mouseBased = this._mousePointerToRTTSpace(node, finalResult.x, finalResult.y);
                // if (index === 0) {
                //     console.log(backToRTT, mouseBased);
                // }
                // const backToLocalNode = this._rttToLocalNodeSpace(node, backToRTT.x, backToRTT.y);
                // console.log(res, backToLocalNode);

                // TODO - is that needed?
                const scene = this.props.globalState.workbench._scene;
                const engine = scene.getEngine();

                // If the scale point is outside the viewport, do not render
                scalePoint.style.display =
                    finalResult.x < 0 || finalResult.x < 0 || finalResult.x > engine.getRenderWidth() || finalResult.y > engine.getRenderHeight() ? "none" : "flex";
                if (scalePoint.style.display === "flex") {
                    scalePoint.style.left = finalResult.x + "px";
                    scalePoint.style.top = finalResult.y + "px";

                    const rotate = this.getRotation(node) * (180 / Math.PI);
                    scalePoint.style.transform = "rotate(" + rotate + "deg) translate(-50%, -50%)";
                }
            });
        }
    }

    private _tempMeasure = new Measure(0, 0, 0, 0);

    private _nodeToRTTWorldMatrix(node: Control) {
        node._currentMeasure.transformToRef(node._transformMatrix, this._tempMeasure);
        const m2d = Matrix2D.Identity();
        const m2dP = Matrix2D.Identity();
        const s2dP = Matrix2D.Identity();
        const translateBack = Matrix2D.Identity();
        const translateTo = Matrix2D.Identity();
        const resultMatrix = Matrix2D.Identity();

        // Transform the coordinates into world space
        Matrix2D.TranslationToRef(this._tempMeasure.left, this._tempMeasure.top, translateBack);
        Matrix2D.TranslationToRef(-this._tempMeasure.left, -this._tempMeasure.top, translateTo);
        Matrix2D.RotationToRef(node.rotation, m2d);
        let parentNode = node.parent;
        while (parentNode) {
            const parentRot = parentNode.rotation;
            Matrix2D.ScalingToRef(parentNode.scaleX, parentNode.scaleY, s2dP);
            Matrix2D.RotationToRef(parentRot, m2dP);
            m2d.multiplyToRef(m2dP, m2d);
            m2d.multiplyToRef(s2dP, m2d);
            parentNode = parentNode.parent;
        }

        translateTo.multiplyToRef(m2d, resultMatrix);
        resultMatrix.multiplyToRef(translateBack, resultMatrix);
        return resultMatrix;
    }

    private _nodeToRTTSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2()) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node);
        worldMatrix.transformCoordinates(x, y, reference);
        return reference;
    }

    private _rttToLocalNodeSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2()) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node);
        const inv = Matrix2D.Identity();
        worldMatrix.invertToRef(inv);
        inv.transformCoordinates(x, y, reference);
        // round to 1 decimal points
        reference.x = Math.round(reference.x * 10) / 10;
        reference.y = Math.round(reference.y * 10) / 10;
        return reference;
    }

    private _rttSpaceToCanvasSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2()) {
        node._currentMeasure.transformToRef(node._transformMatrix, this._tempMeasure);
        let size = this.props.globalState.guiTexture.getSize();
        const tmpVec = new Vector3(x, 0, y);
        // Project to screen space
        tmpVec.x -= size.width / 2 - this._tempMeasure.width / 2;
        tmpVec.z -= size.height / 2 - this._tempMeasure.height / 2;
        tmpVec.z *= -1;

        // Get the final projection in view space
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const engine = scene.getEngine();
        // TODO - to ref
        return Vector3.Project(tmpVec, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
    }

    private _canvasSpaceToRTTSpace(node: Control, projected: Vector3) {
        node._currentMeasure.transformToRef(node._transformMatrix, this._tempMeasure);
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const engine = scene.getEngine();
        const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
        const unproject = Vector3.Unproject(projected, viewport.width, viewport.height, Matrix.Identity(), camera.getViewMatrix(), scene.getProjectionMatrix());
        let size = this.props.globalState.guiTexture.getSize();
        unproject.z *= -1;
        unproject.x += size.width / 2 - this._tempMeasure.width / 2;
        unproject.z += size.height / 2 - this._tempMeasure.height / 2;
        // round to 2 decimal points
        return new Vector2(Math.round(unproject.x * 10) / 10, Math.round(unproject.z * 10) / 10);
    }

    private _plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
    private _mousePointerToRTTSpace(node: Control, x?: number, y?: number) {
        node._currentMeasure.transformToRef(node._transformMatrix, this._tempMeasure);
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const newPosition = this.props.globalState.workbench.getPosition(scene, camera, this._plane, x ?? scene.pointerX, y || scene.pointerY);
        let size = this.props.globalState.guiTexture.getSize();
        newPosition.z *= -1;
        newPosition.x += size.width / 2 - this._tempMeasure.width / 2;
        newPosition.z += size.height / 2 - this._tempMeasure.height / 2;
        // round to 10
        return {
            x: Math.round(newPosition.x * 10) / 10,
            y: Math.round(newPosition.z * 10) / 10,
        };
    }

    getScale(node: Control, relative?: boolean): { x: number; y: number } {
        let x = node.scaleX;
        let y = node.scaleY;
        if (relative) {
            return { x, y };
        }
        let parent = node.parent;
        while (parent) {
            x *= parent.scaleX;
            y *= parent.scaleY;
            parent = parent.parent;
        }
        return { x, y };
    }

    getRotation(node: Control, relative?: boolean): number {
        // Gets rotate of a control account for all of it's parents rotations
        let rotation = node.rotation;
        if (relative) {
            return rotation;
        }
        let parent = node.parent;
        while (parent) {
            //#S69ESC
            rotation += parent.rotation;
            parent = parent.parent;
        }
        return rotation;
    }

    createBaseGizmo() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("workbench-canvas") as HTMLCanvasElement;

        for (let i = 0; i < 8; ++i) {
            let scalePoint = canvas.ownerDocument!.createElement("div");
            scalePoint.className = "ge-scalePoint";
            canvas.parentElement?.appendChild(scalePoint);
            scalePoint.style.position = "absolute";
            scalePoint.style.display = "none";
            scalePoint.style.left = i * 100 + "px";
            scalePoint.style.top = i * 100 + "px";
            scalePoint.style.transform = "translate(-50%, -50%)";
            scalePoint.addEventListener("pointerdown", (event) => {
                this._setMousePosition(i);
                scalePoint.style.pointerEvents = "none";
            });
            scalePoint.ondragstart = (evt) => {
                evt.preventDefault();
            };
            scalePoint.draggable = true;
            // scalePoint.addEventListener("pointermove", this._onMove);
            scalePoint.addEventListener("pointerup", this._onUp);
            this.scalePoints.push(scalePoint);
            this._pointerData.push({
                onDown: {
                    x: 0,
                    y: 0,
                },
                onMove: {
                    x: 0,
                    y: 0,
                },
                active: false,
            });
        }

        // Create the pivot point which is special
        let pivotPoint = canvas.ownerDocument!.createElement("img");
        pivotPoint.src = gizmoPivotIcon;
        pivotPoint.className = "ge-pivotPoint";
        canvas.parentElement?.appendChild(pivotPoint);
        pivotPoint.style.position = "absolute";
        pivotPoint.style.display = "none";
        this.scalePoints.push(pivotPoint);
        pivotPoint.ondragstart = (evt) => {
            evt.preventDefault();
        };
        pivotPoint.draggable = true;
        this._pointerData.push({
            onDown: {
                x: 0,
                y: 0,
            },
            onMove: {
                x: 0,
                y: 0,
            },
            active: false,
        });
        this.updateGizmo();
    }

    public onUp(evt?: React.PointerEvent) {
        this._onUp(evt);
    }

    private _onUp = (evt?: React.PointerEvent | PointerEvent) => {
        this._mouseDown = false;
        // TODO - reinstate
        // this._corners.length = 0;
        document.querySelectorAll(".ge-scalePoint").forEach((scalePoint) => {
            (scalePoint as HTMLElement).style.pointerEvents = "auto";
        });
        // TODO - this fails
        // this._pointerData[this._scalePointIndex].active = false;
        this._scalePointIndex = -1;
    };

    public onMove(evt: React.PointerEvent) {
        this._onMove(evt);
    }

    private _initH = 0;
    private _initW = 0;
    private _initX = 0;
    private _initY = 0;

    private _onMove = (evt: React.PointerEvent | PointerEvent) => {
        if (this._mouseDown) {
            const scene = this.props.globalState.workbench._scene;
            this._pointerData[this._scalePointIndex].onMove.x = scene.pointerX;
            this._pointerData[this._scalePointIndex].onMove.y = scene.pointerY;

            const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
            if (selectedGuiNodes.length > 0) {
                const node = selectedGuiNodes[0];
                this._nodeToCorners(node);
                const inRTT = this._mousePointerToRTTSpace(node, scene.pointerX, scene.pointerY);
                const inNodeSpace = this._rttToLocalNodeSpace(node, inRTT.x, inRTT.y);
                // console.log(inNodeSpace);
                this._setNodeCorner(node, inNodeSpace, this._scalePointIndex);
                // const backToRTT = this._nodeToRTTSpace(node, inNodeSpace.x, inNodeSpace.y);
                // const backToCanvas = this._rttSpaceToCanvasSpace(node, backToRTT.x, backToRTT.y);
                // console.log(scene.pointerX, scene.pointerY, backToCanvas, inRTT, backToRTT);

                // HTML-based
                // const dx = this._pointerData[this._scalePointIndex].onMove.x - this._pointerData[this._scalePointIndex].onDown.x;
                // const dy = this._pointerData[this._scalePointIndex].onMove.y - this._pointerData[this._scalePointIndex].onDown.y;
                // const left = this._scalePointIndex === 0 || this._scalePointIndex === 1 || this._scalePointIndex === 4;
                // const top = this._scalePointIndex === 1 || this._scalePointIndex === 2 || this._scalePointIndex === 5;
                // const yResize = !(this._scalePointIndex === 4 || this._scalePointIndex === 6);
                // const xResize = !(this._scalePointIndex === 5 || this._scalePointIndex === 7);
                // const rotation = this.getRotation(node);
                // const cosFraction = Math.cos(rotation);
                // const sinFraction = Math.sin(rotation);
                // const wDiff = dx;
                // const hDiff = dy;
                // let rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
                // let rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;

                // let newW = this._initW;
                // let newH = this._initH;
                // let newX = this._initX;
                // let newY = this._initY;

                // const pivotX = node.transformCenterX;
                // const pivotY = node.transformCenterY;

                // if (xResize) {
                //     if (left) {
                //         newW = this._initW - rotatedWDiff;
                //         // min width
                //         if (newW < 10) {
                //             newW = 10;
                //             rotatedWDiff = this._initW - 10;
                //         }
                //     } else {
                //         newW = this._initW + rotatedWDiff;
                //         // min width
                //         if (newW < 10) {
                //             newW = 10;
                //             rotatedWDiff = 10 - this._initW;
                //         }
                //     }
                //     newX += pivotX * rotatedWDiff * cosFraction;
                //     newY += pivotY * rotatedWDiff * sinFraction;
                // }

                // if (yResize) {
                //     if (top) {
                //         newH = this._initH - rotatedHDiff;
                //         if (newH < 10) {
                //             newH = 10;
                //             rotatedHDiff = this._initH - 10;
                //         }
                //     } else {
                //         newH = this._initH + rotatedHDiff;
                //         if (newH < 10) {
                //             newH = 10;
                //             rotatedHDiff = 10 - this._initH;
                //         }
                //     }
                //     newX -= pivotX * rotatedHDiff * sinFraction;
                //     newY += pivotY * rotatedHDiff * cosFraction;
                // }

                // node.widthInPixels = newW;
                // node.heightInPixels = newH;
                // node.topInPixels = newY;
                // node.leftInPixels = newX;

                // if (this._responsive) {
                //     this.props.globalState.workbench.convertToPercentage(node, true);
                // }
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
    };

    private _corners: Vector2[] = [];

    private _nodeToCorners(node: Control) {
        // Getting the global center point of the control.
        let tempMeasure = new Measure(0, 0, 0, 0);
        node._currentMeasure.transformToRef(node._transformMatrix, tempMeasure);

        console.log(node._currentMeasure, tempMeasure);

        var ox = tempMeasure.left;
        var oy = tempMeasure.top;

        console.log(ox, oy, node._currentMeasure.left, node._currentMeasure.top, node.leftInPixels, node.topInPixels);

        // TODO optimize
        this._corners = [
            new Vector2(ox, oy),
            new Vector2(ox, oy),
            new Vector2(ox, oy),
            new Vector2(ox, oy),
        ];

        // Calculating the offsets for each scale point.
        const scale = this.getScale(node, true);
        const halfScaleX = scale.x / 2;
        const halfScaleY = scale.y / 2;
        this._corners[0].x -= node._currentMeasure.width * halfScaleX;
        this._corners[0].y += node._currentMeasure.height * halfScaleY;

        this._corners[1].x -= node._currentMeasure.width * halfScaleX;
        this._corners[1].y -= node._currentMeasure.height * halfScaleY;

        this._corners[2].x += node._currentMeasure.width * halfScaleX;
        this._corners[2].y -= node._currentMeasure.height * halfScaleY;

        this._corners[3].x += node._currentMeasure.width * halfScaleX;
        this._corners[3].y += node._currentMeasure.height * halfScaleY;

        // Calculate the pivot point
        // const pivotX = (node.transformCenterX - 0.5) * 2;
        // const pivotY = (node.transformCenterY - 0.5) * 2;
        // this._corners[4].x += node._currentMeasure.width * halfScaleX * pivotX;
        // this._corners[4].y += node._currentMeasure.height * halfScaleY * pivotY;
        console.log(this._corners);
    }

    private _updateNodeFromCorners(node: Control) {
        // take point 0 and 2
        const upperLeft = this._corners[1];
        const lowerRight = this._corners[3];
        const scale = this.getScale(node, true);
        const width = (lowerRight.x - upperLeft.x) / scale.x;
        const height = (lowerRight.y - upperLeft.y) / scale.y;
        console.log("new size", width, height);
        // node.widthInPixels = width;
        // node.heightInPixels = height;

        // use upper left to calculate the top/left
        const clone = upperLeft.clone();
        const halfScaleX = scale.x / 2;
        const halfScaleY = scale.y / 2;
        clone.x += width * halfScaleX;
        clone.y += height * halfScaleY;
        const invMat = Matrix2D.Identity();
        node._transformMatrix.invertToRef(invMat);

        // TODO will probably need to inverse-matrix clone, as this is the transformed measure's left/top

        const size = this.props.globalState.guiTexture.getSize();
        const parentWidth = node.parent ? node.parent._currentMeasure.width : size.width;
        const parentHeight = node.parent ? node.parent._currentMeasure.height : size.height;
        let x = 0;
        let y = 0;
        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = parentWidth - width;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = (parentWidth - width) / 2;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                y = 0;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                y = parentHeight - height;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                y = (parentHeight - height) / 2;
                break;
        }
        console.log("top right", clone.x, clone.y);
        console.log("alignment adjustment", x, y);
        const left = clone.x - x;
        const top = clone.y - y;
        console.log("new left top", left, top);

        // // set the node
        // node.leftInPixels = left;
        // node.topInPixels = top;
        node.widthInPixels = Math.max(10, width);
        node.heightInPixels = Math.max(10, height);

        // let tempMeasure = new Measure(0, 0, 0, 0);
        // node._currentMeasure.transformToRef(node._transformMatrix, tempMeasure);
        // node.leftInPixels = clone.x;
        // node.topInPixels = clone.y;
        // let left = width / 2 + upperLeft.x;
        // let top = height / 2 + upperLeft.y;
        // if(node.verticalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER) {
        //     left -= width / 2;
        // } else if(node.verticalAlignment === Control.HORIZONTAL_ALIGNMENT_RIGHT) {
        //     left -= width;
        // }
        // if(node.horizontalAlignment === Control.VERTICAL_ALIGNMENT_CENTER) {
        //     top -= height / 2;
        // } else if(node.horizontalAlignment === Control.VERTICAL_ALIGNMENT_BOTTOM) {
        //     top -= height;
        // }

        // Setting it
        // node.leftInPixels = left;
        // node.topInPixels = top;
    }

    private _setNodeCorner(node: Control, corner: Vector2, cornerIndex: number) {
        console.log(corner, this._corners[cornerIndex]);
        this._corners[cornerIndex].copyFrom(corner);
        // also update the other corners
        const next = (cornerIndex + 1) % 4;
        const prev = (cornerIndex + 3) % 4;
        if (cornerIndex % 2 === 0) {
            this._corners[next].x = this._corners[cornerIndex].x;
            this._corners[prev].y = this._corners[cornerIndex].y;
        } else {
            this._corners[next].y = this._corners[cornerIndex].y;
            this._corners[prev].x = this._corners[cornerIndex].x;
        }
        console.log(this._corners);
        this._updateNodeFromCorners(node);
    }

    private _setMousePosition = (index: number) => {
        this._mouseDown = true;
        this._scalePointIndex = index;
        const scene = this.props.globalState.workbench._scene;
        this._pointerData[this._scalePointIndex].onDown.x = scene.pointerX;
        this._pointerData[this._scalePointIndex].onDown.y = scene.pointerY;
        this._pointerData[this._scalePointIndex].active = true;

        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];
            this._nodeToCorners(node);
            this._updateNodeFromCorners(node);
            this._initW = node.widthInPixels;
            this._initH = node.heightInPixels;
            this._initY = node.topInPixels;
            this._initX = node.leftInPixels;
        }
        this.forceUpdate();
    };

    // private rotate(x: number, y: number, cx: number, cy: number, angleInRadians: number = 0) {
    //     // const radians = angle * (Math.PI / 180);
    //     const cos = Math.cos(angleInRadians);
    //     const sin = Math.sin(angleInRadians);
    //     return {
    //         x: (x - cx) * cos - (y - cy) * sin + cx,
    //         y: (x - cx) * sin + (y - cy) * cos + cy,
    //     };
    // }

    // private _transformPoint(
    //     component: { x: number; y: number; width: number; height: number },
    //     center: { x: number; y: number },
    //     topLeft: { x: number; y: number },
    //     bottomRight: { x: number; y: number },
    //     angle: number
    // ) {
    //     // const center = {
    //     //     x: component.x + component.width / 2,
    //     //     y: component.y + component.height / 2,
    //     // };
    //     const rotatedA = this.rotate(component.x, component.y, center.x, center.y);
    //     const newCenter = {
    //         x: (rotatedA.x + bottomRight.x) / 2,
    //         y: (rotatedA.y + bottomRight.y) / 2,
    //     };
    //     const newTopLeft = this.rotate(rotatedA.x, rotatedA.y, newCenter.x, newCenter.y, -angle);
    //     const newBottomRight = this.rotate(bottomRight.x, bottomRight.y, newCenter.x, newCenter.y, -angle);
    //     return {
    //         x: newTopLeft.x,
    //         y: newTopLeft.y,
    //         width: newBottomRight.x - newTopLeft.x,
    //         height: newBottomRight.y - newTopLeft.y,
    //     };
    // }

    // private _updateScale() {
    //     const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
    //     if (selectedGuiNodes.length > 0) {
    //         const node = selectedGuiNodes[0];

    //         // Get the new position on the screen where the mouse was clicked.
    //         const camera = this.props.globalState.workbench._camera;
    //         const scene = this.props.globalState.workbench._scene;
    //         const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
    //         const newPosition = this.props.globalState.workbench.getPosition(scene, camera, plane);

    //         // Get the delta of the mouse positions
    //         let dx = 0; // newPosition.x - this._previousPositions[this._scalePointIndex].x;
    //         let dy = 0; // newPosition.z - this._previousPositions[this._scalePointIndex].y;

    //         // Calculate offsets from the alignment
    //         let offsetX = [1, 1, 1, 1];
    //         let offsetY = [1, 1, 1, 1]
    //         const alignmentFactor = -2;
    //         switch (node.horizontalAlignment) {
    //             case Control.HORIZONTAL_ALIGNMENT_LEFT:
    //                 offsetX = [-alignmentFactor, -alignmentFactor, 0, 0];
    //                 break;
    //             case Control.HORIZONTAL_ALIGNMENT_RIGHT:
    //                 offsetX = [0, 0, -alignmentFactor, -alignmentFactor];
    //                 break;
    //         }
    //         switch (node.verticalAlignment) {
    //             case Control.VERTICAL_ALIGNMENT_TOP:
    //                 offsetY = [0, -alignmentFactor, -alignmentFactor, 0];
    //                 break;
    //             case Control.VERTICAL_ALIGNMENT_BOTTOM:
    //                 offsetY = [-alignmentFactor, 0, 0, -alignmentFactor];
    //                 break;
    //         }

    //         // Calculate the pivot
    //         const pivotX = (node.transformCenterX - 0.5) * 2;
    //         const pivotY = (node.transformCenterY - 0.5) * 2;

    //         // Are we locked on a specific axis?
    //         let lockX = 1;
    //         let lockY = 1;
    //         switch (this._scalePointIndex) {
    //             case 4:
    //             case 6:
    //                 lockY = 0;
    //                 break;
    //             case 5:
    //             case 7:
    //                 lockX = 0;
    //                 break;
    //         }

    //         // Get the rotation quadrant which will determine the directions we are scaling 
    //         let rotation = this.getRotation(node);
    //         rotation = rotation % 6.28; // 360 degrees //TODO: use actual PI numbers
    //         rotation += 0.785398; // 45 degrees
    //         let rotationIndex = Math.floor(rotation / 1.5708);
    //         const alpha = this.getRotation(node);

    //         if (rotationIndex % 2 == 0) { // 0 and 180 degreess

    //             const index = (this._scalePointIndex + rotationIndex) % 4; // If we're rotated calculate the offset for scalePoint

    //             const deltaWidth = dx * lockX;
    //             const deltaHieght = dy * lockY;
                
    //             //need to account for pivots
    //             const deltaPivotX = (deltaWidth * pivotX);
    //             const deltaPivotY = (deltaHieght * pivotY);
    //             // x = dy *sin(rotation) + x*cos(rotation);
    //             const deltaLeft = (deltaWidth / 2 * Math.cos(alpha) * offsetX[index]) + (deltaHieght / 2 * Math.sin(alpha) * offsetX[index]);
    //             const deltaTop = (deltaHieght / 2 * Math.cos(alpha) * offsetY[index]) + (deltaWidth / 2 * Math.sin(alpha) * offsetY[index]);

    //             const invert = rotationIndex === 2 ? -1 : 1;
    //             switch (index) {
    //                 case 0:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, -1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 1:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, 1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 2:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, 1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 3:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, -1, 1 * invert, -1 * invert);
    //                     break;
    //                 default:
    //                     break;
    //             }
    //         }
    //         else {

    //             const alignmentFactor = 2;
    //             offsetX = [1, 1, 1, 1];
    //             offsetY = [1, 1, 1, 1]
    //             switch (node.horizontalAlignment) {
    //                 case Control.HORIZONTAL_ALIGNMENT_LEFT:
    //                     offsetX = [-1, -alignmentFactor, alignmentFactor, 0];
    //                     break;
    //                 case Control.HORIZONTAL_ALIGNMENT_RIGHT: ;
    //                     offsetX = [alignmentFactor, alignmentFactor, 0, 0];
    //                     break;
    //             }
    //             switch (node.verticalAlignment) {
    //                 case Control.VERTICAL_ALIGNMENT_TOP:
    //                     offsetY = [alignmentFactor, -alignmentFactor, -alignmentFactor, 0];
    //                     break;
    //                 case Control.VERTICAL_ALIGNMENT_BOTTOM:
    //                     offsetY = [alignmentFactor, 0, 0, -alignmentFactor];
    //                     break;
    //             }

    //             const index = (this._scalePointIndex + rotationIndex - 1) % 4; // If we're rotated calculate the offset for scalePoint
    //             const invert = rotationIndex === 3 ? -1 : 1;

    //             const deltaWidth = dy * lockX;
    //             const deltaHieght = dx * lockY;

    //             //need to account for pivots
    //             const deltaPivotX = (deltaWidth * pivotX);
    //             const deltaPivotY = (deltaHieght * pivotY);

    //             const deltaLeft = (deltaWidth / 2 * Math.cos(alpha) * offsetX[index]) + (deltaHieght / 2 * Math.sin(alpha) * offsetX[index]);
    //             const deltaTop = (deltaHieght / 2 * Math.cos(alpha) * offsetY[index]) + (deltaWidth / 2 * Math.sin(alpha) * offsetY[index]);

    //             switch (index) {
    //                 case 0:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, -1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 1:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, 1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 2:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, 1, 1 * invert, -1 * invert);
    //                     break;
    //                 case 3:
    //                     this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, -1, 1 * invert, -1 * invert);
    //                     break;
    //                 default:
    //                     break;
    //             }
    //         }

    //         if (this._responsive) {
    //             this.props.globalState.workbench.convertToPercentage(node, true);
    //         }

    //         // this._previousPositions[this._scalePointIndex].x = newPosition.x;
    //         // this._previousPositions[this._scalePointIndex].y = newPosition.z;
    //         this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    //         this.updateGizmo();
    //     }
    // }

    // private _calculateScaling(node: Control, width: number, height: number, left: number, top: number,
    //     directionW: number, directionH: number, directionL: number, directionT: number) {

    //     node.widthInPixels += width * directionW;
    //     node.heightInPixels += height * directionH;

    //     if (node.widthInPixels <= 0) {
    //         node.widthInPixels = 0;
    //     }
    //     else {
    //         node.leftInPixels += left * directionL;
    //     }

    //     if (node.heightInPixels <= 0) {
    //         node.heightInPixels = 0;
    //     }
    //     else {
    //         node.topInPixels += top * directionT;
    //     }

    //     if (node.typeName === "Image") {
    //         (node as Image).autoScale = false;
    //     }
    //     if (node.typeName === "TextBlock") {
    //         (node as TextBlock).resizeToFit = false;
    //     }

    // }

    render() {
        return null;
    }
}
