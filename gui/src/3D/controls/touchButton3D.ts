// Assumptions: absolute position of button mesh is inside the mesh

import { /*Nullable, */DeepImmutableObject } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
//import { LinesMesh } from "babylonjs/Meshes/linesMesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Ray } from "babylonjs/Culling/ray";

import { Button3D } from "./button3D";
//import { Color3 } from 'babylonjs/Maths/math.color';

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
    }

    /*
     * Returns the point on the surface plane of the button front that the collidable is hovering over
     * Returns null if the collidable is not over the front of the button
     *
     * Legacy function
     */
     /*
    private _getTouchPoint(collidable: Vector3, maxDist: number): Nullable<Vector3> {
        const frontToButton = this._collidableFrontDirection.negate();
        const collidableToButton = this._collisionMesh.getAbsolutePosition().subtract(collidable);

        const isInBoundingSphere = this._collisionMesh.getBoundingInfo().boundingSphere.intersectsPoint(collidable);
        const projectionScalar = Vector3.Dot(collidableToButton, frontToButton);
        if (projectionScalar <= 0 && !isInBoundingSphere) {
            // Collidable is behind the button
            return null;
        }

        const ray = new Ray(collidable, frontToButton, maxDist);
        const pickingInfo = ray.intersectsMesh(this._collisionMesh as DeepImmutableObject<AbstractMesh>);

        if (pickingInfo.hit && (pickingInfo.pickedMesh == this._collisionMesh)) {
            return pickingInfo.pickedPoint;
        }

        return null;
    }*/

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
     *
     * Q: Is there a way to avoid the ray creation/collision test?
     * A: Try using just the radius of the bounding sphere next pass
     */
    private _isPrimedForInteraction(collidable: Vector3): boolean {
        // Check if the collidable has an appropriate planar height
        const heightFromCenter = this._getHeightFromButtonCenter(collidable);

        if (heightFromCenter > this._hoverOffset || heightFromCenter < this._offsetToBack) {
            return false;
        }

        // Check if the collidable or its hover ray lands within the bounding sphere of the button
   //     const ray = new Ray(collidable, this._collidableFrontDirection.negate(), this._hoverOffset);
    //    const isInBoundingSphere = ray.intersectsMesh(this._collisionMesh.getBoundingInfo().boundingSphere);
   //     return isInBoundingSphere;

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

    // Returns a point on the surface of the button (front or back).
    // Very cheap
    //
    // Requires population of:
    //    _offsetToFront
    //    _offsetToBack
    //    _collidableFrontDirection
    //    _collisionMesh
    /*
    private _getPointOnFace(frontFace: boolean = true) {
        var offset: Vector3;

        if (frontFace) {
            offset = this._collidableFrontDirection.scale(this._offsetToFront);
        }
        else {
            offset = this._collidableFrontDirection.scale(this._offsetToBack);
        }

        return offset.add(this._collisionMesh.getAbsolutePosition());
    }*/

    /*
     * Requires mesh intersection on each frame called 
     *
     * Sets the following values:
     *    _pointOnFrontFace
     *    _buttonDepth
     *
     * Requires population of:
     *    _collisionMesh
     *    _collidableFrontDirection
     *//*
    private _updatePointOnFrontFace(calcButtonDepth: boolean) {//TODO ensure this stays synced with any updates to the collidable position
        // Cast a ray out from inside the collision mesh, to get the front face
        const collisionMeshPos = this._collisionMesh.getAbsolutePosition();
        const normalRay = new Ray(collisionMeshPos, this._collidableFrontDirection);
        const pickingInfo = normalRay.intersectsMesh(this._collisionMesh as DeepImmutableObject<AbstractMesh>);

        if (pickingInfo.hit) {
            this._pointOnFrontFace = pickingInfo.pickedPoint!;

            if (calcButtonDepth) {
                this._buttonDepth = Math.abs(2.0 * this._getHeightOffButton(collisionMeshPos));
            }
        }
        else {
            // Default to the center of the button - this shouldn't ever be reached
            this._pointOnFrontFace = collisionMeshPos;

            if (calcButtonDepth) {
                this._buttonDepth = 0;
            }
        }
    }*/

    // Returns the distance in front of the center of the button
    // Returned value is negative when collidable is past the center
    private _getHeightFromButtonCenter(collidablePos: Vector3) {
        return this._getDistanceOffPlane(collidablePos, this._collidableFrontDirection, this._collisionMesh.getAbsolutePosition());
    }

    // Returns the distance in front of the front face of the button
    // Returned value is negative when collidable is in the button/deeper than the front
/*    private _getHeightOffButton(collidablePos: Vector3) {
        return this._getDistanceOffPlane(collidablePos, this._collidableFrontDirection, this._pointOnFrontFace);
    }
*/
    // Gets depth into button as a number from 0 to 1
/*    private _getHeightFromButtonBack(collidablePos: Vector3) {
        //recalculate the back face point every call in case it moved
        const pointOnBackFace = this._collidableFrontDirection.negate()
                                                              .scale(this._buttonDepth)
                                                              .add(this._pointOnFrontFace);

        return this._getDistanceOffPlane(collidablePos, this._collidableFrontDirection, pointOnBackFace);
    }
*/
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
    //    this._updatePointOnFrontFace(true);

        const dummyPointerId = 0;
        const buttonIndex = 0; // Left click

/*
        const func_old = function () {
            //Check for collision with haaaaand
            const indexTipMeshes = scene.getMeshesByTags("indexTip");
            var debugLineMesh: LinesMesh;

            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const scale = 0.2;
                const touchDepth = 0.0;
                const touchBackDepth = -_this._buttonDepth;
                const hoverDepth = scale * 0.8;
                const hitTestDistance = scale * 1.0;

                // A delta to avoid state flickering when on the threshold
                const flickerDelta = scale * 0.05;

                var touchPoint: Nullable<Vector3> = null;
            //    var distance = Vector3.Distance(_this._collisionMesh.getAbsolutePosition(), indexMesh.getAbsolutePosition());
                var height = _this._getHeightOffButton(indexMesh.getAbsolutePosition());
                if (Math.abs(height) < hitTestDistance) {

                 //   var distance2 = 
                    console.log("before and after:");
                //    console.log(distance);
                    console.log(height);
               //     console.log(distance2);

                    // TODO: Set distances appropriately:
                    // Hover depth based on distance from front face of mesh, not center
                    // (Done) Touch Depth based on actual collision with button
                    // HitTestDistance based on distance from front face of button
                    // For the hover/hitTest, compute point-plane distance, using button front for plane
                    //    -> Right now only have front direction. Can't rely on mesh for getting front face
                    //       since mesh might not be aligned properly... Make that a requirement?
                
                    // We already know how far off the button it is,
                    // but we don't know where on the button it is
                    touchPoint = _this._getTouchPoint(indexMesh.getAbsolutePosition(), hoverDepth);
                }

                var debugButtonPoint = _this._collisionMesh.getAbsolutePosition();
                var debugColour = Color3.Red();

                if (touchPoint) {
                    var distance2 = Vector3.Distance(indexMesh.getAbsolutePosition(), touchPoint);
                    console.log(distance2);
                    debugButtonPoint = touchPoint;
                    _this._lastTouchPoint = touchPoint;

                    // Update button state and fire events
                    switch(_this._buttonState) {
                        case ButtonState.None:
                            if (height < hoverDepth - flickerDelta) {
                                console.log("Now hovering");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerEnter(_this);
                            }

                            break;
                        case ButtonState.Hover:
                            debugColour = Color3.Yellow();
                            if (height > hoverDepth + flickerDelta) {
                                console.log("Out of range");
                                _this._buttonState = ButtonState.None;
                                _this._onPointerOut(_this);
                            }
                            else if (height < touchDepth - flickerDelta) {
                                console.log("now pressing");
                                _this._buttonState = ButtonState.Press;
                                _this._onPointerDown(_this, touchPoint, dummyPointerId, buttonIndex);
                            }
                            else {
                                _this._onPointerMove(_this, touchPoint);
                            }

                            break;
                        case ButtonState.Press:
                            debugColour = Color3.Green();
                            if (height > touchDepth + flickerDelta) {
                                console.log("no longer pressing");
                                _this._buttonState = ButtonState.Hover;
                                _this._onPointerUp(_this, touchPoint, dummyPointerId, buttonIndex, false);
                            }
                            else if (height < touchBackDepth) {
                                console.log("Exiting out the back");
                                _this._buttonState = ButtonState.None;
                                _this._onPointerUp(_this, touchPoint, dummyPointerId, buttonIndex, false);
                                _this._onPointerOut(_this);
                            }
                            else {
                                _this._onPointerMove(_this, touchPoint);
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
        };*/

        const func_new = function () {
            const indexTipMeshes = scene.getMeshesByTags("indexTip");

            indexTipMeshes.forEach(function (indexMesh: Mesh) {
                const collidablePosition = indexMesh.getAbsolutePosition();
                const inRange = _this._isPrimedForInteraction(collidablePosition);

                if (inRange) {
                    const pointOnButton = _this._getPointOnButton(collidablePosition);
                    const heightFromCenter = _this._getHeightFromButtonCenter(collidablePosition);

                    _this._lastTouchPoint = pointOnButton;

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