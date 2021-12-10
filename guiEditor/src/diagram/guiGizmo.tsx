import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Axis } from "babylonjs/Maths/math.axis";
import { Plane } from "babylonjs/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";
import { DataStorage } from "babylonjs/Misc/dataStorage";

require("./workbenchCanvas.scss");
const gizmoPivotIcon: string = require("../../public/imgs/gizmoPivotIcon.svg");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {
    scalePoints: HTMLDivElement[] = [];
    private _mouseDown: boolean = false;
    private _scalePointIndex: number = -1;
    private _pointerData: { onDown: { x: number; y: number }; onMove: { x: number; y: number }; active: boolean };
    private _responsive: boolean;

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        // Set visibility
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

            let startingPositions = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

            // Calculating the offsets for each scale point.
            const half = 1 / 2;
            startingPositions[0].x -= node.widthInPixels * half;
            startingPositions[0].z += node.heightInPixels * half;

            startingPositions[1].x -= node.widthInPixels * half;
            startingPositions[1].z -= node.heightInPixels * half;

            startingPositions[2].x += node.widthInPixels * half;
            startingPositions[2].z -= node.heightInPixels * half;

            startingPositions[3].x += node.widthInPixels * half;
            startingPositions[3].z += node.heightInPixels * half;

            startingPositions[4].x -= node.widthInPixels * half;
            startingPositions[5].z -= node.heightInPixels * half;
            startingPositions[6].x += node.widthInPixels * half;
            startingPositions[7].z += node.heightInPixels * half;

            // Calculate the pivot point
            const pivotX = (node.transformCenterX - 0.5) * 2;
            const pivotY = (node.transformCenterY - 0.5) * 2;
            startingPositions[8].x += node.widthInPixels * half * pivotX;
            startingPositions[8].z += node.heightInPixels * half * pivotY;

            this.scalePoints.forEach((scalePoint, index) => {
                //we get the corner of the control with rotation 0
                let res = startingPositions[index];

                const result = new Vector2(res.x, res.z);
                // TODO optimize this - unify?
                this._nodeToRTTSpace(node, result.x, result.y, result, false);
                const finalResult = this._rttToCanvasSpace(node, result.x, result.y);

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
                    scalePoint.style.transform = "translate(-50%, -50%) rotate(" + rotate + "deg)";
                }
            });
        }
    }

    private _getNodeMatrix(node: Control, useStoredValues?: boolean): Matrix2D {
        const size = this.props.globalState.guiTexture.getSize();
        const parentWidth = node.parent ? node.parent._currentMeasure.width : size.width;
        const parentHeight = node.parent ? node.parent._currentMeasure.height : size.height;
        let x = 0;
        let y = 0;

        const width = useStoredValues ? this._initW : node.widthInPixels;
        const height = useStoredValues ? this._initH : node.heightInPixels;
        const left = useStoredValues ? this._initX : node.leftInPixels;
        const top = useStoredValues ? this._initY : node.topInPixels;

        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = -(parentWidth - width) / 2;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = (parentWidth - width) / 2;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = 0;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                y = -(parentHeight - height) / 2;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                y = (parentHeight - height) / 2;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                y = 0;
                break;
        }

        const m2d = Matrix2D.Identity();
        const translateTo = Matrix2D.Identity();
        const resultMatrix = Matrix2D.Identity();

        // Transform the coordinates into world space

        // the pivot point around which the object transforms
        let offsetX = width * node.transformCenterX - width / 2;
        let offsetY = height * node.transformCenterY - height / 2;
        // pivot changes this point's position! but only in legacy pivot mode
        if (!(node as any).descendantsOnlyPadding) {
            // TODO - padding needs to also take scaling into account?
            offsetX -= ((node.paddingRightInPixels - node.paddingLeftInPixels) * 1) / 2;
            offsetY -= ((node.paddingBottomInPixels - node.paddingTopInPixels) * 1) / 2;
        }

        Matrix2D.TranslationToRef(x + left, y + top, translateTo);
        // without parents, calculate world matrix for each
        const rotation = this.getRotation(node, true);
        const scaling = this.getScale(node, true);
        Matrix2D.ComposeToRef(-offsetX, -offsetY, rotation, scaling.x, scaling.y, null, m2d);
        resultMatrix.multiplyToRef(m2d, resultMatrix);
        resultMatrix.multiplyToRef(translateTo, resultMatrix);
        return resultMatrix;
    }

    private _nodeToRTTWorldMatrix(node: Control, useStoredValuesIfPossible?: boolean): Matrix2D {
        const listOfNodes = [node];
        let p = node.parent;
        while (p) {
            listOfNodes.push(p);
            p = p.parent;
        }
        const matrices = listOfNodes.map((node, index) => this._getNodeMatrix(node, index === 0 && this._mouseDown && useStoredValuesIfPossible));
        return matrices.reduce((acc, cur) => {
            acc.multiplyToRef(cur, acc);
            return acc;
        }, Matrix2D.Identity());
    }

    private _roundFactor = 1;

    private _nodeToRTTSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        worldMatrix.transformCoordinates(x, y, reference);
        // round
        reference.x = Math.round(reference.x * this._roundFactor) / this._roundFactor;
        reference.y = Math.round(reference.y * this._roundFactor) / this._roundFactor;
        return reference;
    }

    private _rttToLocalNodeSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        const inv = Matrix2D.Identity();
        worldMatrix.invertToRef(inv);
        inv.transformCoordinates(x, y, reference);
        // round
        reference.x = Math.round(reference.x * this._roundFactor) / this._roundFactor;
        reference.y = Math.round(reference.y * this._roundFactor) / this._roundFactor;
        return reference;
    }

    private _rttToCanvasSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2()) {
        const tmpVec = new Vector3(x, 0, -y);

        // Get the final projection in view space
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const engine = scene.getEngine();
        // TODO - to ref
        const projected = Vector3.Project(tmpVec, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
        // round to 1 decimal points
        projected.x = Math.round(projected.x * this._roundFactor) / this._roundFactor;
        projected.y = Math.round(projected.y * this._roundFactor) / this._roundFactor;
        return projected;
    }

    // private _canvasSpaceToRTTSpace(node: Control, projected: Vector3) {
    //     const camera = this.props.globalState.workbench._camera;
    //     const scene = this.props.globalState.workbench._scene;
    //     const engine = scene.getEngine();
    //     const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    //     const unproject = Vector3.Unproject(projected, viewport.width, viewport.height, Matrix.Identity(), camera.getViewMatrix(), scene.getProjectionMatrix());
    //     unproject.z *= -1;
    //     return new Vector2(Math.round(unproject.x * this._roundFactor) / this._roundFactor, Math.round(unproject.z * this._roundFactor) / this._roundFactor);
    // }

    private _plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
    private _mousePointerToRTTSpace(node: Control, x?: number, y?: number) {
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const newPosition = this.props.globalState.workbench.getPosition(scene, camera, this._plane, x ?? scene.pointerX, y || scene.pointerY);
        newPosition.z *= -1;
        return {
            x: Math.round(newPosition.x * this._roundFactor) / this._roundFactor,
            y: Math.round(newPosition.z * this._roundFactor) / this._roundFactor,
        };
    }

    getScale(node: Control, relative?: boolean): Vector2 {
        let x = node.scaleX;
        let y = node.scaleY;
        if (relative) {
            return new Vector2(x, y);
        }
        let parent = node.parent;
        while (parent) {
            x *= parent.scaleX;
            y *= parent.scaleY;
            parent = parent.parent;
        }
        return new Vector2(x, y);
    }

    getRotation(node: Control, relative?: boolean): number {
        // Gets rotate of a control account for all of it's parents rotations
        let rotation = node.rotation;
        if (relative) {
            return rotation;
        }
        let parent = node.parent;
        while (parent) {
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
            scalePoint.addEventListener("pointerdown", () => {
                this._setMousePosition(i);
            });
            scalePoint.ondragstart = (evt) => {
                evt.preventDefault();
            };
            scalePoint.draggable = true;
            scalePoint.addEventListener("pointerup", this._onUp);
            this.scalePoints.push(scalePoint);
            this._pointerData = {
                onDown: {
                    x: 0,
                    y: 0,
                },
                onMove: {
                    x: 0,
                    y: 0,
                },
                active: false,
            };
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
        this._pointerData = {
            onDown: {
                x: 0,
                y: 0,
            },
            onMove: {
                x: 0,
                y: 0,
            },
            active: false,
        };
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
            this._pointerData.onMove.x = scene.pointerX;
            this._pointerData.onMove.y = scene.pointerY;

            const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
            if (selectedGuiNodes.length > 0) {
                const node = selectedGuiNodes[0];
                const inRTT = this._mousePointerToRTTSpace(node, scene.pointerX, scene.pointerY);
                const inNodeSpace = this._rttToLocalNodeSpace(node, inRTT.x, inRTT.y, undefined, true);
                this._setNodeCorner(node, inNodeSpace, this._scalePointIndex);
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
    };

    private _corners: Vector2[] = [];

    private _nodeToCorners(node: Control) {
        // TODO optimize
        this._corners = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];

        const half = 1 / 2;
        this._corners[0].x -= node.widthInPixels * half;
        this._corners[0].y += node.heightInPixels * half;

        this._corners[1].x -= node.widthInPixels * half;
        this._corners[1].y -= node.heightInPixels * half;

        this._corners[2].x += node.widthInPixels * half;
        this._corners[2].y -= node.heightInPixels * half;

        this._corners[3].x += node.widthInPixels * half;
        this._corners[3].y += node.heightInPixels * half;
    }

    private _updateNodeFromCorners(node: Control) {
        // take point 0 and 2
        const upperLeft = this._corners[1];
        const lowerRight = this._corners[3];
        const width = lowerRight.x - upperLeft.x;
        const height = lowerRight.y - upperLeft.y;
        const left = this._scalePointIndex === 0 || this._scalePointIndex === 1;
        const top = this._scalePointIndex === 1 || this._scalePointIndex === 2;
        // calculate the center point
        const localRotation = this.getRotation(node, true);
        const localScaling = this.getScale(node, true);
        const absoluteCenter = new Vector2(upperLeft.x + width * 0.5, upperLeft.y + height * 0.5);
        const center = absoluteCenter.multiplyInPlace(localScaling);
        const cosRotation = Math.cos(localRotation);
        const sinRotation = Math.sin(localRotation);
        const cosRotation180 = Math.cos(localRotation + Math.PI);
        const sinRotation180 = Math.sin(localRotation + Math.PI);
        const widthDelta = this._initW - width;
        const heightDelta = this._initH - height;
        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                center.x += (left ? widthDelta * 0.5 : -absoluteCenter.x) * cosRotation;
                center.y += (left ? -(widthDelta * 0.5) : absoluteCenter.x) * sinRotation;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                center.x += (left ? -(widthDelta * 0.5) : absoluteCenter.x) * cosRotation;
                center.y += (left ? widthDelta * 0.5 : -absoluteCenter.x) * sinRotation;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                // x = upperLeft.x + width * 0.5;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                center.y += (top ? -(heightDelta * 0.5) : absoluteCenter.y) * cosRotation180;
                center.x += (top ? -(heightDelta * 0.5) : absoluteCenter.y) * sinRotation180;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                center.y += (top ? heightDelta * 0.5 : -absoluteCenter.y) * cosRotation180;
                center.x += (top ? heightDelta * 0.5 : -absoluteCenter.y) * sinRotation180;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                // y = upperLeft.y + height * 0.5;
                break;
        }
        // let offsetX = width * node.transformCenterX - width / 2;
        // let offsetY = height * node.transformCenterY - height / 2;
        // // pivot changes this point's position! but only in legacy pivot mode
        // if (!(node as any).descendantsOnlyPadding) {
        //     // padding needs to also take scaling into account
        //     offsetX -= ((node.paddingRightInPixels - node.paddingLeftInPixels) * 1) / 2;
        //     offsetY -= ((node.paddingBottomInPixels - node.paddingTopInPixels) * 1) / 2;
        // }
        // console.log("offset", offsetX, offsetY);

        // x = left ? -x : x;
        // y = top ? -y : y;
        // x = x * Math.cos(localRotation) - y * Math.sin(localRotation);
        // y = x * Math.sin(localRotation) + y * Math.cos(localRotation);
        // y = y * Math.cos(localRotation);

        const pivotX = 0.5; // (1 - node.transformCenterX);
        const pivotY = 0.5; // (1 - node.transformCenterY);
        // const center = new Vector2(x, y);
        // center.x *= localScaling.x;
        // center.y *= localScaling.y;
        // const multipliedCenterX = center.x * x;
        // const multipliedCenterY = center.y * y;
        // center.x += multipliedCenterX;
        // center.y += multipliedCenterY;
        console.log("center", center);
        const rotatedCenter = this._rotate(center.x, center.y, 0, 0, localRotation);

        // round
        rotatedCenter.x = Math.round(rotatedCenter.x);
        rotatedCenter.y = Math.round(rotatedCenter.y);
        node.leftInPixels = this._initX + rotatedCenter.x;
        node.topInPixels = this._initY + rotatedCenter.y;
        node.widthInPixels = Math.max(10, width);
        node.heightInPixels = Math.max(10, height);
    }

    private _rotate(x: number, y: number, centerX: number, centerY: number, angle: number) {
        return {
            x: (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle) + centerX,
            y: (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle) + centerY,
        };
    }

    private _setNodeCorner(node: Control, corner: Vector2, cornerIndex: number) {
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
        this._updateNodeFromCorners(node);
    }

    private _setMousePosition = (index: number) => {
        this._mouseDown = true;
        this._scalePointIndex = index;
        const scene = this.props.globalState.workbench._scene;
        this._pointerData.onDown.x = scene.pointerX;
        this._pointerData.onDown.y = scene.pointerY;
        this._pointerData.active = true;

        document.querySelectorAll(".ge-scalePoint").forEach((scalePoint) => {
            (scalePoint as HTMLElement).style.pointerEvents = "none";
        });

        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];
            this._nodeToCorners(node);
            console.log(this._corners);
            this._initW = node.widthInPixels;
            this._initH = node.heightInPixels;
            this._initY = node.topInPixels;
            this._initX = node.leftInPixels;
            this._updateNodeFromCorners(node);
        }
        this.forceUpdate();
    };

    render() {
        return null;
    }
}
