// Assumptions: absolute position of button mesh is inside the mesh

import { DeepImmutableObject } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { LinesMesh } from "babylonjs/Meshes/linesMesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Ray } from "babylonjs/Culling/ray";

import { Button3D } from "./button3D";
import { Color3 } from 'babylonjs/Maths/math.color';

/**
 * Enum for Button States
 */
export enum ButtonState {
    /** None */
    None = 0,
    /** Pointer Entered */
    Hover = 1,
    /** Pointer Down */
    Press = 2
}

/**
 * Class used to create a touchable button in 3D
 */
export class TouchButton3D extends Button3D {
    /** @hidden */
    protected _buttonState: ButtonState;
    protected _collisionMesh: Mesh;
    protected _collidableFrontDirection: Vector3;
    protected _pointOnFrontFace: Vector3;
    private _lastTouchPoint: Vector3;

    private _offsetToFront = 0;
    private _offsetToBack = 0;
    private _hoverOffset = 0;
    private _buttonDepth = 0;

    protected _drawDebugData = false;

    /**
     * Creates a new button
     * @param collisionMesh mesh to track collisions with
     * @param name defines the control name
     */
    constructor(collisionMesh: Mesh, name?: string) {
        super(name);

        this._buttonState = ButtonState.None;
        this._collisionMesh = collisionMesh;
        this._collidableFrontDirection = collisionMesh.forward;

        this._updateDistances();
    }

    /*
     * Given a point, and two points on a line, this returns the distance between
     * the point and the closest point on the line. The closest point on the line
     * does not have to be between the two given points.
     *
     * Based off the 3D point-line distance equation
     * 
     * Assumes lineDirection is normalized
     */
    private _getShortestDistancePointToLine(point: Vector3, linePoint: Vector3, lineDirection: Vector3) {
        const pointToLine = linePoint.subtract(point);
        const cross = lineDirection.cross(pointToLine);

        return cross.length();
    }

    /*
     * Checks to see if collidable is in a position to interact with the button
     *   - check if collidable has a plane height within tolerance (between back/front?)
     *   - check that collidable + normal ray intersect the bounding sphere
     */
    private _isPrimedForInteraction(collidable: Vector3): boolean {
        // Check if the collidable has an appropriate planar height
        const heightFromCenter = this._getHeightFromButtonCenter(collidable);

        if (heightFromCenter > this._hoverOffset || heightFromCenter < this._offsetToBack) {
            return false;
        }

        // Check if the collidable or its hover ray lands within the bounding sphere of the button
        const distanceFromCenter = this._getShortestDistancePointToLine(this._collisionMesh.getAbsolutePosition(),
                                                                        collidable,
                                                                        this._collidableFrontDirection);
        return distanceFromCenter <= this._collisionMesh.getBoundingInfo().boundingSphere.radiusWorld;
    }

    /*
     * Returns a Vector3 of the collidable's projected position on the button
     * Returns the collidable's position if it is inside the button
     */
    private _getPointOnButton(collidable: Vector3): Vector3 {
        const heightFromCenter = this._getHeightFromButtonCenter(collidable);

        if (heightFromCenter <= this._offsetToFront && heightFromCenter >= this._offsetToBack) {
            // The collidable is in the button, return its position
            return collidable;
        }
        else if (heightFromCenter > this._offsetToFront) {
            // The collidable is in front of the button, project it to the surface
            const collidableDistanceToFront = (this._offsetToFront - heightFromCenter);
            return collidable.add(this._collidableFrontDirection.scale(collidableDistanceToFront));
        }
        else {
            // The collidable is behind the button, project it to its back
            const collidableDistanceToBack = (this._offsetToBack - heightFromCenter);
            return collidable.add(this._collidableFrontDirection.scale(collidableDistanceToBack));
        }
    }

    /*
     * Updates the distance values.
     * Should be called when the front direction changes, or the mesh size changes
     * 
     * Sets the following values:
     *    _offsetToFront
     *    _offsetToBack
     *    _buttonDepth
     *
     * Requires population of:
     *    _collisionMesh
     *    _collidableFrontDirection
     */
    private _updateDistances() {
        const collisionMeshPos = this._collisionMesh.getAbsolutePosition();
        const normalRay = new Ray(collisionMeshPos, this._collidableFrontDirection);
        const frontPickingInfo = normalRay.intersectsMesh(this._collisionMesh as DeepImmutableObject<AbstractMesh>);
        normalRay.direction = normalRay.direction.negate();
        const backPickingInfo = normalRay.intersectsMesh(this._collisionMesh as DeepImmutableObject<AbstractMesh>);

        this._offsetToFront = 0;
        this._offsetToBack = 0;

        if (frontPickingInfo.hit && backPickingInfo.hit) {
            this._offsetToFront = this._getDistanceOffPlane(frontPickingInfo.pickedPoint!,
                                                              this._collidableFrontDirection,
                                                              collisionMeshPos);
            this._offsetToBack = this._getDistanceOffPlane(backPickingInfo.pickedPoint!,
                                                             this._collidableFrontDirection,
                                                             collisionMeshPos);
        }

        this._buttonDepth = this._offsetToFront - this._offsetToBack;
        this._hoverOffset = this._buttonDepth + this._offsetToFront;
    }

    // Returns the distance in front of the center of the button
    // Returned value is negative when collidable is past the center
    private _getHeightFromButtonCenter(collidablePos: Vector3) {
        return this._getDistanceOffPlane(collidablePos, this._collidableFrontDirection, this._collisionMesh.getAbsolutePosition());
    }

    // Returns the distance from pointOnPlane to point along planeNormal
    // Very cheap
    private _getDistanceOffPlane(point: Vector3, planeNormal: Vector3, pointOnPlane: Vector3) {
        const d = Vector3.Dot(pointOnPlane, planeNormal);
        const abc = Vector3.Dot(point, planeNormal);

        return abc - d;
    }

    public set collidableFrontDirection(frontDir: Vector3) {
        this._collidableFrontDirection = frontDir.normalize();

        //this._updatePointOnFrontFace(true);
        this._updateDistances();
    }

    protected _getTypeName(): string {
        return "TouchButton3D";
    }

    protected _enableCollisions(scene: Scene) {
        var _this = this;

        const dummyPointerId = 0;
        const buttonIndex = 0; // Left click

        // TODO?: Set distances appropriately:
        // Hover depth based on distance from front face of mesh, not center
        // (Done) Touch Depth based on actual collision with button
        // HitTestDistance based on distance from front face of button
        // For the hover/hitTest, compute point-plane distance, using button front for plane
        //    -> Right now only have front direction. Can't rely on mesh for getting front face
        //       since mesh might not be aligned properly... Make that a requirement?
                
        const func_new = function () {
            const indexTipMeshes = scene.getMeshesByTags("indexTip");

            var debugLineMesh: LinesMesh;

            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const collidablePosition = indexMesh.getAbsolutePosition();
                const inRange = _this._isPrimedForInteraction(collidablePosition);

                var debugButtonPoint = _this._collisionMesh.getAbsolutePosition();
                var debugColour = Color3.Red();

                if (inRange) {
                    const pointOnButton = _this._getPointOnButton(collidablePosition);
                    const heightFromCenter = _this._getHeightFromButtonCenter(collidablePosition);

                    _this._lastTouchPoint = pointOnButton;
                    debugButtonPoint = pointOnButton;

                    const isGreater = function (height: number, compareHeight: number) {
                        const flickerDelta = 0.01;
                        return height >= (compareHeight + flickerDelta);
                    };

                    const isLower = function (height: number, compareHeight: number) {
                        const flickerDelta = 0.01;
                        return height <= (compareHeight - flickerDelta);
                    };

                    // Update button state and fire events
                    switch(_this._buttonState) {
                        case ButtonState.None:
                            if (isGreater(heightFromCenter, _this._offsetToBack) &&
                                isLower(heightFromCenter, _this._hoverOffset)) {
                                console.log("Now hovering");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerEnter(_this);
                            }

                            break;
                        case ButtonState.Hover:
                            debugColour = Color3.Yellow();
                            if (isGreater(heightFromCenter, _this._hoverOffset)) {
                                console.log("Out of range");
                                _this._buttonState = ButtonState.None;
                                _this._onPointerOut(_this);
                            }
                            else if (isLower(heightFromCenter, _this._offsetToFront)) {
                                console.log("now pressing");
                                _this._buttonState = ButtonState.Press;
                                _this._onPointerDown(_this, pointOnButton, dummyPointerId, buttonIndex);
                            }
                            else {
                                _this._onPointerMove(_this, pointOnButton);
                            }

                            break;
                        case ButtonState.Press:
                            debugColour = Color3.Green();
                            if (isGreater(heightFromCenter, _this._offsetToFront)) {
                                console.log("no longer pressing");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerUp(_this, pointOnButton, dummyPointerId, buttonIndex, false);
                            }
                            else if (isLower(heightFromCenter, _this._offsetToBack)) {
                                console.log("Exiting out the back");
                                _this._buttonState = ButtonState.None;
                                _this._onPointerUp(_this, pointOnButton, dummyPointerId, buttonIndex, false);
                                _this._onPointerOut(_this);
                            }
                            else {
                                _this._onPointerMove(_this, pointOnButton);
                            }

                            break;
                    }
                }
                else {
                    // Safely return to ButtonState.None
                    switch(_this._buttonState) {
                        case ButtonState.Hover:
                            _this._buttonState = ButtonState.None;
                            _this._onPointerOut(_this);
                            break;
                        case ButtonState.Press:
                            _this._buttonState = ButtonState.Hover;
                            _this._onPointerUp(_this, _this._lastTouchPoint, dummyPointerId, buttonIndex, false);
                            break;
                    }
                }

                
                if (_this._drawDebugData) {
                    // Debug line mesh
                    if (debugLineMesh) {
                        // remove the previous line before drawing the new one
                        // Commented out as it causes memory crashes
                   //     debugLineMesh.dispose();
                    }
                    
                    // Draw a line from the button front to the button to the hand
                    debugLineMesh = Mesh.CreateLines("debug_line", [
                  //      _this._collisionMesh.getAbsolutePosition().add(_this._collidableFrontDirection).scale(scale),
                        debugButtonPoint,
                        indexMesh.getAbsolutePosition()
                    ], scene);
                    debugLineMesh.color = debugColour;
                }
                else if (debugLineMesh) {
                    debugLineMesh.dispose();
                }
                
            });
        };
        
        scene.registerBeforeRender(func_new);
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        this._enableCollisions(scene);

        return super._createNode(scene);
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();

        if (this._collisionMesh) {
            this._collisionMesh.dispose();
        }
    }
}