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

const roundFactor = 100;
const round = (value: number) => Math.round(value * roundFactor) / roundFactor;

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {
    scalePoints: HTMLDivElement[] = [];
    public _scalePointIndex: number = -1;
    private _pointerData: { corners: Vector2[]; pointerDown: boolean };
    private _htmlPoints: Vector2[];
    private _matrixCache: Matrix2D[];
    private _responsive: boolean;

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;
        this._responsive = DataStorage.ReadBoolean("Responsive", true);
        this._pointerData = { corners: [new Vector2(), new Vector2(), new Vector2(), new Vector2()], pointerDown: false };
        this._htmlPoints = [new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2(), new Vector2()];
        this._matrixCache = [Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity()];

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
            this.updateGizmo(true);
        });

        this.props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            // TODO - no need to update on each frame.
            this.updateGizmo(true);
        });
    }

    componentDidMount() {}

    /**
     * Update the gizmo's corners positions
     * @param force should the update be forced. otherwise it will be updated only when the pointer is down
     */
    updateGizmo(force?: boolean) {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0 && (force || this._pointerData.pointerDown)) {
            const node = selectedGuiNodes[0];

            // Calculating the offsets for each scale point.
            const half = 1 / 2;
            this._htmlPoints[0].x = -node.widthInPixels * half;
            this._htmlPoints[0].y = node.heightInPixels * half;

            this._htmlPoints[1].x = -node.widthInPixels * half;
            this._htmlPoints[1].y = -node.heightInPixels * half;

            this._htmlPoints[2].x = node.widthInPixels * half;
            this._htmlPoints[2].y = -node.heightInPixels * half;

            this._htmlPoints[3].x = node.widthInPixels * half;
            this._htmlPoints[3].y = node.heightInPixels * half;

            this._htmlPoints[4].x = -node.widthInPixels * half;
            this._htmlPoints[5].y = -node.heightInPixels * half;
            this._htmlPoints[6].x = node.widthInPixels * half;
            this._htmlPoints[7].y = node.heightInPixels * half;

            // Calculate the pivot point
            const pivotX = (node.transformCenterX - 0.5) * 2;
            const pivotY = (node.transformCenterY - 0.5) * 2;
            this._htmlPoints[8].x = node.widthInPixels * half * pivotX;
            this._htmlPoints[8].y = node.heightInPixels * half * pivotY;

            this.scalePoints.forEach((scalePoint, index) => {
                // TODO optimize this - unify?
                const result = this._nodeToRTTSpace(node, this._htmlPoints[index].x, this._htmlPoints[index].y, undefined, false);
                const finalResult = this._rttToCanvasSpace(node, result.x, result.y);

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

    private _resetMatrixArray() {
        this._matrixCache.forEach((matrix) => {
            Matrix2D.IdentityToRef(matrix);
        });
    }

    /**
     * This function calculates a local matrix for a node, including it's full transformation and pivot point
     *
     * @param node the node to calculate the matrix for
     * @param useStoredValues should the stored (cached) values be used to calculate the matrix
     * @returns a new matrix for the control
     */
    private _getNodeMatrix(node: Control, useStoredValues?: boolean): Matrix2D {
        const size = this.props.globalState.guiTexture.getSize();
        // parent should always be defined, but stay safe
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
        this._resetMatrixArray();

        const m2d = this._matrixCache[0];
        const translateTo = this._matrixCache[1];
        // as this is used later it needs to persist
        const resultMatrix = Matrix2D.Identity();

        // the pivot point around which the object transforms
        let offsetX = width * node.transformCenterX - width / 2;
        let offsetY = height * node.transformCenterY - height / 2;
        // pivot changes this point's position! but only in legacy pivot mode
        if (!(node as any).descendantsOnlyPadding) {
            // TODO - padding needs to also take scaling into account?
            offsetX -= ((node.paddingRightInPixels - node.paddingLeftInPixels) * 1) / 2;
            offsetY -= ((node.paddingBottomInPixels - node.paddingTopInPixels) * 1) / 2;
        }

        // Set the translation
        Matrix2D.TranslationToRef(x + left, y + top, translateTo);
        // without parents scaling and rotation, calculate world matrix for each
        const rotation = this.getRotation(node, true);
        const scaling = this.getScale(node, true);
        // COmpose doesn't actually translate, but creates a form of pivot in a specific position
        Matrix2D.ComposeToRef(-offsetX, -offsetY, rotation, scaling.x, scaling.y, null, m2d);
        // actually compose the matrix
        resultMatrix.multiplyToRef(m2d, resultMatrix);
        resultMatrix.multiplyToRef(translateTo, resultMatrix);
        return resultMatrix;
    }

    /**
     * Using the node's tree, calculate its world matrix and return it
     * @param node the node to calculate the matrix for
     * @param useStoredValuesIfPossible used stored valued (cached when pointer down is clicked)
     * @returns the world matrix for this node
     */
    private _nodeToRTTWorldMatrix(node: Control, useStoredValuesIfPossible?: boolean): Matrix2D {
        const listOfNodes = [node];
        let p = node.parent;
        while (p) {
            listOfNodes.push(p);
            p = p.parent;
        }
        this._resetMatrixArray();
        const matrices = listOfNodes.map((node, index) => this._getNodeMatrix(node, index === 0 && this._pointerData.pointerDown && useStoredValuesIfPossible));
        return matrices.reduce((acc, cur) => {
            acc.multiplyToRef(cur, acc);
            return acc;
        }, this._matrixCache[2]);
    }


    private _nodeToRTTSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        worldMatrix.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
        return reference;
    }

    private _rttToLocalNodeSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        const inv = this._matrixCache[3];
        worldMatrix.invertToRef(inv);
        inv.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
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
        projected.x = round(projected.x);
        projected.y = round(projected.y);
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
        return new Vector2(round(newPosition.x), round(newPosition.z));
    }

    /**
     * Get the scaling of a specific GUI control
     * @param node the node for which we are getting the scaling
     * @param relative should we return only the relative scaling (relative to the parent)
     * @returns an X,Y vector of the scaling
     */
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
        this.updateGizmo();
    }

    public onUp(evt?: React.PointerEvent) {
        this._onUp(evt);
    }

    private _onUp = (evt?: React.PointerEvent | PointerEvent) => {
        // cleanup on pointer up
        this._pointerData.pointerDown = false;
        document.querySelectorAll(".ge-scalePoint").forEach((scalePoint) => {
            (scalePoint as HTMLElement).style.pointerEvents = "auto";
        });
        this._scalePointIndex = -1;
    };

    public onMove(evt: React.PointerEvent) {
        this._onMove();
    }

    private _initH = 0;
    private _initW = 0;
    private _initX = 0;
    private _initY = 0;

    private _onMove = () => {
        if (this._pointerData.pointerDown) {
            const scene = this.props.globalState.workbench._scene;
            const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
            if (selectedGuiNodes.length > 0) {
                const node = selectedGuiNodes[0];
                // get the mouse position in node space
                const inRTT = this._mousePointerToRTTSpace(node, scene.pointerX, scene.pointerY);
                const inNodeSpace = this._rttToLocalNodeSpace(node, inRTT.x, inRTT.y, undefined, true);
                // set the corner
                this._setNodeCorner(node, inNodeSpace, this._scalePointIndex);
                //convert to percentage
                if (this._responsive) {
                    this.props.globalState.workbench.convertToPercentage(node, false);
                }
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
    };

    /**
     * Calculate the 4 corners in node space
     * @param node The node to use
     */
    private _nodeToCorners(node: Control) {
        const half = 0.5;
        this._pointerData.corners[0].x = -node.widthInPixels * half;
        this._pointerData.corners[0].y = node.heightInPixels * half;

        this._pointerData.corners[1].x = -node.widthInPixels * half;
        this._pointerData.corners[1].y = -node.heightInPixels * half;

        this._pointerData.corners[2].x = node.widthInPixels * half;
        this._pointerData.corners[2].y = -node.heightInPixels * half;

        this._pointerData.corners[3].x = node.widthInPixels * half;
        this._pointerData.corners[3].y = node.heightInPixels * half;
    }

    /**
     * Computer the node's width, height, top and left, using the 4 corners
     * @param node the node we use
     */
    private _updateNodeFromCorners(node: Control) {
        const upperLeft = this._pointerData.corners[1];
        const lowerRight = this._pointerData.corners[3];
        const width = lowerRight.x - upperLeft.x;
        const height = lowerRight.y - upperLeft.y;
        const left = this._scalePointIndex === 0 || this._scalePointIndex === 1;
        const top = this._scalePointIndex === 1 || this._scalePointIndex === 2;
        // calculate the center point
        const localRotation = this.getRotation(node, true);
        const localScaling = this.getScale(node, true);
        const absoluteCenter = new Vector2(upperLeft.x + width * 0.5, upperLeft.y + height * 0.5);
        const center = absoluteCenter.clone();
        // move to pivot
        center.multiplyInPlace(localScaling);
        const cosRotation = Math.cos(localRotation);
        const sinRotation = Math.sin(localRotation);
        const cosRotation180 = Math.cos(localRotation + Math.PI);
        const sinRotation180 = Math.sin(localRotation + Math.PI);
        const widthDelta = (this._initW - width) * 0.5;
        const heightDelta = (this._initH - height) * 0.5;
        // alignment compensation
        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                center.x += (left ? widthDelta : -absoluteCenter.x) * cosRotation;
                center.y += (left ? -widthDelta : absoluteCenter.x) * sinRotation;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                center.x += (left ? -widthDelta : absoluteCenter.x) * cosRotation;
                center.y += (left ? widthDelta : -absoluteCenter.x) * sinRotation;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                center.y += (top ? -heightDelta : absoluteCenter.y) * cosRotation180;
                center.x += (top ? -heightDelta : absoluteCenter.y) * sinRotation180;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                center.y += (top ? heightDelta : -absoluteCenter.y) * cosRotation180;
                center.x += (top ? heightDelta : -absoluteCenter.y) * sinRotation180;
                break;
        }

        // rotate the center around 0,0
        const rotatedCenter = this._rotate(center.x, center.y, 0, 0, localRotation);
        // round the values and set them
        node.leftInPixels = round(this._initX + rotatedCenter.x);
        node.topInPixels = round(this._initY + rotatedCenter.y);
        node.widthInPixels = round(Math.max(10, width));
        node.heightInPixels = round(Math.max(10, height));
    }

    private _rotate(x: number, y: number, centerX: number, centerY: number, angle: number) {
        return {
            x: (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle) + centerX,
            y: (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle) + centerY,
        };
    }

    private _setNodeCorner(node: Control, corner: Vector2, cornerIndex: number) {
        // are we in a fixed-axis situation
        const fixedAxis = cornerIndex >=3;
        // the actual corner to update. This relies on the fact that the corners are in a specific order
        const toUpdate = cornerIndex % 4;
        if(fixedAxis) {
            // check which axis is fixed
            if(cornerIndex === 4 || cornerIndex === 6) {
                // set the corner's y axis correctly
                corner.y = this._pointerData.corners[toUpdate].y;
            } else {
                // set the corner's x axis correctly
                corner.x = this._pointerData.corners[toUpdate].x;
            }
        }
        this._pointerData.corners[toUpdate].copyFrom(corner);
        // also update the other corners
        const next = (cornerIndex + 1) % 4;
        const prev = (cornerIndex + 3) % 4;
        // Update the next and the previous points
        if (toUpdate % 2 === 0) {
            this._pointerData.corners[next].x = this._pointerData.corners[toUpdate].x;
            this._pointerData.corners[prev].y = this._pointerData.corners[toUpdate].y;
        } else {
            this._pointerData.corners[next].y = this._pointerData.corners[toUpdate].y;
            this._pointerData.corners[prev].x = this._pointerData.corners[toUpdate].x;
        }
        // update the transformation accordingly
        this._updateNodeFromCorners(node);
    }

    private _setMousePosition = (index: number) => {
        this._pointerData.pointerDown = true;
        this._scalePointIndex = index;
        document.querySelectorAll(".ge-scalePoint").forEach((scalePoint) => {
            (scalePoint as HTMLElement).style.pointerEvents = "none";
        });

        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];
            this._nodeToCorners(node);
            this._initW = node.widthInPixels;
            this._initH = node.heightInPixels;
            this._initY = node.topInPixels;
            this._initX = node.leftInPixels;
        }
    };

    render() {
        return null;
    }
}
