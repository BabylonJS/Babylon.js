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
    private _previousPositions: Vector2[] = [];
    private _responsive: boolean;

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        // Set visablity
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

        this.props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo();
        })
    }

    componentDidMount() {
    }

    updateGizmo() {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            // Getting the global center point of the control.
            let size = this.props.globalState.guiTexture.getSize();
            let tempMeasure = new Measure(0, 0, 0, 0);
            node._currentMeasure.transformToRef(node._transformMatrix, tempMeasure);

            var ox = tempMeasure.left;
            var oy = tempMeasure.top;

            let startingPositions = [new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),
            new Vector3(ox, 0, oy),]

            // Calculating the offsets for each scale point.
            const halfScaleX = node.scaleX / 2;;
            const halfScaleY = node.scaleY / 2;;
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
            const pivot = pivotX !== 0 || pivotY !== 0;
            startingPositions[8].x += node._currentMeasure.width * halfScaleX * pivotX;
            startingPositions[8].z += node._currentMeasure.height * halfScaleY * pivotY;

            const center = node.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER &&
                node.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER;

            let index = 0;
            this.scalePoints.forEach(scalePoint => {
                //we get the corner of the control with rotation 0
                let res = startingPositions[index];

                let result = new Vector2(res.x, res.z);
                let m2d = Matrix2D.Identity();
                let m2dP = Matrix2D.Identity();
                let s2dP = Matrix2D.Identity();
                let translateBack = Matrix2D.Identity();
                let translateTo = Matrix2D.Identity();
                let resultMatrix = Matrix2D.Identity();

                // Transform the cordinats into world space
                Matrix2D.TranslationToRef(ox, oy, translateBack);
                Matrix2D.TranslationToRef(-ox, -oy, translateTo);
                Matrix2D.RotationToRef(node.rotation, m2d);
                let parent = node.parent;
                while (parent) {
                    let parentRot = parent.rotation;
                    Matrix2D.ScalingToRef(parent.scaleX, parent.scaleY, s2dP);
                    Matrix2D.RotationToRef(parentRot, m2dP);
                    m2d.multiplyToRef(m2dP, m2d);
                    m2d.multiplyToRef(s2dP, m2d);
                    parent = parent.parent;
                }

                translateTo.multiplyToRef(m2d, resultMatrix);
                resultMatrix.multiplyToRef(translateBack, resultMatrix);
                resultMatrix.transformCoordinates(result.x, result.y, result);

                // Vector(x,0,y); 
                res.x = result.x;
                res.z = result.y;

                // Project to screen space
                res.x -= (size.width / 2) - tempMeasure.width / 2;
                res.z -= (size.height / 2) - tempMeasure.height / 2;
                res.z *= -1;

                // Do not update the previous position in these conditions or it will flicker
                if (this._scalePointIndex != index || (center && !pivot && node.typeName != "ColorPicker")) {
                    // this._previousPositions[index].x = res.x;
                    // this._previousPositions[index].y = res.z;
                }

                // Get the final projection in view space
                const camera = this.props.globalState.workbench._camera;
                const scene = this.props.globalState.workbench._scene;
                const engine = scene.getEngine();
                let finalResult = Vector3.Project(res,
                    Matrix.Identity(),
                    scene.getTransformMatrix(),
                    camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

                // If the scale point is outside the viewport, do not render
                scalePoint.style.display = finalResult.x < 0 || finalResult.x < 0 ||
                    finalResult.x > engine.getRenderWidth() || finalResult.y > engine.getRenderHeight() ? "none" : "flex";
                if (scalePoint.style.display === "flex") {
                    scalePoint.style.left = finalResult.x + "px";
                    scalePoint.style.top = finalResult.y + "px";

                    const rotate = this.getRotation(node) * (180 / Math.PI);
                    scalePoint.style.transform = 'translate(-50%, -50%) rotate(' + rotate + 'deg)';
                }

                ++index;

            });
        }
    }

    getRotation(node: Control): number {
        // Gets rotate of a control account for all of it's parents rotations
        let rotation = node.rotation;
        let parent = node.parent;
        while (parent) { //#S69ESC
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
            scalePoint.style.left = i * 100 + 'px';
            scalePoint.style.top = i * 100 + 'px';
            scalePoint.style.transform = "translate(-50%, -50%)";
            scalePoint.addEventListener("pointerdown", () => { this._setMousePosition(i); });
            scalePoint.ondragstart = (evt) => { evt.preventDefault();};
            scalePoint.draggable = true;
            scalePoint.addEventListener("pointermove", this._onMove);
            scalePoint.addEventListener("pointerup", this._onUp);
            this.scalePoints.push(scalePoint);
            this._previousPositions.push(new Vector2(0, 0));

        }

        // Create the pivot point which is special
        let pivotPoint = canvas.ownerDocument!.createElement("img");
        pivotPoint.src = gizmoPivotIcon;
        pivotPoint.className = "ge-pivotPoint";
        canvas.parentElement?.appendChild(pivotPoint);
        pivotPoint.style.position = "absolute";
        pivotPoint.style.display = "none";
        this.scalePoints.push(pivotPoint);
        pivotPoint.ondragstart = (evt) => { evt.preventDefault();};
        pivotPoint.draggable = true;
        this._previousPositions.push(new Vector2(0, 0));
        this.updateGizmo();
    }

    public onMove(evt: React.PointerEvent) {
        if (this._mouseDown) {
            this._updateScale();
        }
    }

    
    public _onMove() {
        if (this._mouseDown) {
            this._updateScale();
        }
    }

    private _updateScale() {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];

            // Get the new position on the screen where the mouse was clicked.
            const camera = this.props.globalState.workbench._camera;
            const scene = this.props.globalState.workbench._scene;
            const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
            const newPosition = this.props.globalState.workbench.getPosition(scene, camera, plane);

            // Get the delta of the mouse positions
            let dx = newPosition.x - this._previousPositions[this._scalePointIndex].x;
            let dy = newPosition.z - this._previousPositions[this._scalePointIndex].y;

            // Calculate offsets from the alignment
            let offsetX = [1, 1, 1, 1];
            let offsetY = [1, 1, 1, 1]
            const alignmentFactor = -2;
            switch (node.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    offsetX = [-alignmentFactor, -alignmentFactor, 0, 0];
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    offsetX = [0, 0, -alignmentFactor, -alignmentFactor];
                    break;
            }
            switch (node.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    offsetY = [0, -alignmentFactor, -alignmentFactor, 0];
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    offsetY = [-alignmentFactor, 0, 0, -alignmentFactor];
                    break;
            }

            // Calculate the pivot
            const pivotX = (node.transformCenterX - 0.5) * 2;
            const pivotY = (node.transformCenterY - 0.5) * 2;

            // Are we locked on a specific axis?
            let lockX = 1;
            let lockY = 1;
            switch (this._scalePointIndex) {
                case 4:
                case 6:
                    lockY = 0;
                    break;
                case 5:
                case 7:
                    lockX = 0;
                    break;
            }

            // Get the rotation quadrant which will determine the directions we are scaling 
            let rotation = this.getRotation(node);
            rotation = rotation % 6.28; // 360 degrees //TODO: use actual PI numbers
            rotation += 0.785398; // 45 degrees
            let rotationIndex = Math.floor(rotation / 1.5708);
            const alpha = this.getRotation(node);;

            let rotationOffset = rotationIndex === 2 ? 1 : 0;
            if (rotationIndex % 2 == 0) { // 0 and 180 degreess

                const index = (this._scalePointIndex + rotationIndex) % 4; // If we're rotated calculate the offset for scalePoint
                //console.log("even ", index);
                //console.log("dx ", dx);
                //console.log("dy ", dy);

                const deltaWidth = dx * lockX;
                const deltaHieght = dy * lockY;

                // x = dy *sin(rotation) + x*cos(rotation);
                let deltaPivotX = (deltaWidth * pivotX * rotationOffset);
                let deltaPivotY = (deltaHieght * pivotY * rotationOffset);
                
                let deltaLeft = (deltaWidth / 2 * Math.cos(alpha) * offsetX[index]) + (deltaHieght / 2 * Math.sin(alpha) * offsetX[index]);
                let deltaTop = (deltaHieght / 2 * Math.cos(alpha) * offsetY[index]) + (deltaWidth / 2 * Math.sin(alpha) * offsetY[index]);

                const invert = rotationIndex === 2 ? -1 : 1;
                switch (index) {
                    case 0:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, -1, 1 * invert, -1 * invert);
                        break;
                    case 1:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, 1, 1 * invert, -1 * invert);
                        break;
                    case 2:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, 1, 1 * invert, -1 * invert);
                        break;
                    case 3:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, -1, 1 * invert, -1 * invert);
                        break;
                    default:
                        break;
                }
            }
            else {

                //const invert = rotationIndex === 1 ? -1 : 1;
                const alignmentFactor = 2;
                offsetX = [1, 1, 1, 1 ];
                offsetY = [1, 1, 1, 1]
                switch (node.horizontalAlignment) {
                    case Control.HORIZONTAL_ALIGNMENT_LEFT:
                        offsetX = [-1, -alignmentFactor, alignmentFactor, 0];
                        break;
                    case Control.HORIZONTAL_ALIGNMENT_RIGHT: ;
                        offsetX = [alignmentFactor, alignmentFactor, 0, 0];
                        break;
                }
                switch (node.verticalAlignment) {
                    case Control.VERTICAL_ALIGNMENT_TOP:
                        offsetY = [alignmentFactor, -alignmentFactor, -alignmentFactor, 0];
                        break;
                    case Control.VERTICAL_ALIGNMENT_BOTTOM:
                        offsetY = [alignmentFactor, 0, 0, -alignmentFactor];
                        break;
                }
                //#3FTIKL

                /*let newWidth = dy * 2 * lockX;
                const newHieght = dx * 2 * lockY;
                const newLeft = dy * offsetX[0] * lockX - (invert * dy * lockX * pivotX) - (invert * dx * lockY * pivotY);
                const newTop = dx * offsetY[0] * lockY - (invert * dy * lockX * pivotX) - (invert * dx * lockY * pivotY);
                */
                const index = (this._scalePointIndex + rotationIndex - 1) % 4; // If we're rotated calculate the offset for scalePoint
                const invert = rotationIndex === 3 ? -1 : 1;

                const deltaWidth = dy * lockX;
                const deltaHieght = dx * lockY;

                let deltaPivotX = (deltaWidth  * pivotX * rotationOffset);
                let deltaPivotY = (deltaHieght* pivotY * rotationOffset);

                let deltaLeft = (deltaWidth/2 *  Math.cos(alpha) * offsetX[index]) + ( deltaHieght/ 2 * Math.sin(alpha) * offsetX[index]);
                let deltaTop = (deltaHieght / 2 * Math.cos(alpha) * offsetY[index]) + ( deltaWidth / 2 * Math.sin(alpha) * offsetY[index]);

                //console.log("odd", index);
                switch (index) {
                    case 0:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, -1, 1 * invert, -1 * invert);
                        break;
                    case 1:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, 1, 1, 1 * invert, -1 * invert);
                        break;
                    case 2:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, 1, 1 * invert, -1 * invert);
                        break;
                    case 3:
                        this._calculateScaling(node, deltaWidth, deltaHieght, deltaLeft, deltaTop, -1, -1, 1 * invert, -1 * invert);
                        break;
                    default:
                        break;
                }
            }

            if (this._responsive) {
                this.props.globalState.workbench.convertToPercentage(node, true);
            }

            this._previousPositions[this._scalePointIndex].x = newPosition.x;
            this._previousPositions[this._scalePointIndex].y = newPosition.z;
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            this.updateGizmo();
        }
    }

    private _calculateScaling(node: Control, width: number, height: number, left: number, top: number,
        directionW: number, directionH: number, directionL: number, directionT: number) {

        node.widthInPixels += width * directionW;
        node.heightInPixels += height * directionH;

        if (node.widthInPixels <= 0) {
            node.widthInPixels = 0;
        }
        else {
            node.leftInPixels += left * directionL;
        }

        if (node.heightInPixels <= 0) {
            node.heightInPixels = 0;
        }
        else {
            node.topInPixels += top * directionT;
        }

        if (node.typeName === "Image") {
            (node as Image).autoScale = false;
        }
        if (node.typeName === "TextBlock") {
            (node as TextBlock).resizeToFit = false;
        }

    }

    public onUp() {
        this._mouseDown = false;
        this._scalePointIndex = -1;
    }

    private _onUp = (evt: PointerEvent) => {
        this._mouseDown = false;
        this._scalePointIndex = -1;
    }

    private _setMousePosition = (index: number) => {
        this._mouseDown = true;
        this._scalePointIndex = index;

        // Get the new position on the screen where the mouse was clicked.
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
        const newPosition = this.props.globalState.workbench.getPosition(scene, camera, plane);
        this._previousPositions[this._scalePointIndex].x = newPosition.x;
        this._previousPositions[this._scalePointIndex].y = newPosition.z;
    }

    render() {
        return (
            null
        );
    }
}
