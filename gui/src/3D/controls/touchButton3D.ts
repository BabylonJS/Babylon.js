// Assumptions: absolute position of button mesh is inside the mesh

import { DeepImmutableObject } from "babylonjs/types";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Mesh } from "babylonjs/Meshes/mesh";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Ray } from "babylonjs/Culling/ray";

import { Button3D } from "./button3D";

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
    //private _buttonState: ButtonState;
    private _collisionMesh: Mesh;
    private _collidableFrontDirection: Vector3;
    private _lastTouchPoint: Vector3;

    private _collidableInitialized = false;

    private _offsetToFront = 0;
    private _offsetToBack = 0;
    private _hoverOffset = 0;

    private _activeInteractions = new Map<number, ButtonState>();
    private _previousHeight = new Map<number, number>();

    /**
     * Creates a new button
     * @param collisionMesh mesh to track collisions with
     * @param name defines the control name
     */
    constructor(name?: string, collisionMesh?: Mesh) {
        super(name);

        if (collisionMesh) {
            this.collisionMesh = collisionMesh;
        }
    }

    public set collidableFrontDirection(frontDir: Vector3) {
        this._collidableFrontDirection = frontDir.normalize();

        this._updateDistances();
    }

    public set collisionMesh(collisionMesh: Mesh) {
        if (this._collisionMesh) {
            this._collisionMesh.dispose();
        }

        this._collisionMesh = collisionMesh;
        this._collisionMesh.metadata = this;

        this.collidableFrontDirection = collisionMesh.forward;

        this._collidableInitialized = true;
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
        const heightPadding = (this._offsetToFront - this._offsetToBack) / 2;

        if (heightFromCenter > (this._hoverOffset + heightPadding) || heightFromCenter < (this._offsetToBack - heightPadding)) {
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

        // For now, set the hover height equal to the thickness of the button
        const buttonThickness = this._offsetToFront - this._offsetToBack;
        this._hoverOffset = buttonThickness + this._offsetToFront;
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

    private _updateButtonState(id: number, newState: ButtonState, pointOnButton: Vector3) {
        const dummyPointerId = 0;
        const buttonIndex = 0; // Left click
        const buttonStateForId = this._activeInteractions.get(id) || ButtonState.None;

        // Take into account all inputs interacting with the button to avoid state flickering
        let previousPushDepth = 0;
        this._activeInteractions.forEach(function(value, key) {
            previousPushDepth = Math.max(previousPushDepth, value);
        });

        if (buttonStateForId != newState) {
            if (newState == ButtonState.None) {
                this._activeInteractions.delete(id);
            }
            else {
                this._activeInteractions.set(id, newState);
            }
        }

        let newPushDepth = 0;
        this._activeInteractions.forEach(function(value, key) {
            newPushDepth = Math.max(newPushDepth, value);
        });

        if (newPushDepth == ButtonState.Press) {
            if (previousPushDepth == ButtonState.Hover) {
                this._onPointerDown(this, pointOnButton, dummyPointerId, buttonIndex);
            }
            else if (previousPushDepth == ButtonState.Press) {
                this._onPointerMove(this, pointOnButton);
            }
        }
        else if (newPushDepth == ButtonState.Hover) {
            if (previousPushDepth == ButtonState.None) {
                this._onPointerEnter(this);
            }
            else if (previousPushDepth == ButtonState.Press) {
                this._onPointerUp(this, pointOnButton, dummyPointerId, buttonIndex, false);
            }
            else {
                this._onPointerMove(this, pointOnButton);
            }
        }
        else if (newPushDepth == ButtonState.None) {
            if (previousPushDepth == ButtonState.Hover) {
                this._onPointerOut(this);
            }
            else if (previousPushDepth == ButtonState.Press) {
                this._onPointerUp(this, pointOnButton, dummyPointerId, buttonIndex, false);
                this._onPointerOut(this);
            }
        }
    }

    protected _getTypeName(): string {
        return "TouchButton3D";
    }

    protected _enableCollisions(scene: Scene, collisionMesh?: Mesh) {
        var _this = this;

        if (collisionMesh) {
            this.collisionMesh = collisionMesh;
        }

        // TODO?: Set distances appropriately:
        // Hover depth based on distance from front face of mesh, not center
        // (DONE)  Touch Depth based on actual collision with button
        // (DONE?) HitTestDistance based on distance from front face of button
        // (DONE)  For the hover/hitTest, compute point-plane distance, using button front for plane
        //           -> Right now only have front direction. Can't rely on mesh for getting front face
        //              since mesh might not be aligned properly... Make that a requirement?


        const onBeforeRender = function () {
            if (_this._collidableInitialized) {
                const touchMeshes = scene.getMeshesByTags("touchEnabled");

                touchMeshes.forEach(function (mesh: Mesh) {
                    const collidablePosition = mesh.getAbsolutePosition();
                    const inRange = _this._isPrimedForInteraction(collidablePosition);

                    const uniqueId = mesh.uniqueId;

                    if (inRange) {
                        const pointOnButton = _this._getPointOnButton(collidablePosition);
                        const heightFromCenter = _this._getHeightFromButtonCenter(collidablePosition);
                        const flickerDelta = 0.003;

                        _this._lastTouchPoint = pointOnButton;

                        const isGreater = function (compareHeight: number) {
                            return heightFromCenter >= (compareHeight + flickerDelta);
                        };

                        const isLower = function (compareHeight: number) {
                            return heightFromCenter <= (compareHeight - flickerDelta);
                        };

                        // Update button state and fire events
                        switch(_this._activeInteractions.get(uniqueId) || ButtonState.None) {
                            case ButtonState.None:
                                if (isGreater(_this._offsetToFront) &&
                                    isLower(_this._hoverOffset)) {
                                    _this._updateButtonState(uniqueId, ButtonState.Hover, pointOnButton);
                                }

                                break;
                            case ButtonState.Hover:
                                if (isGreater(_this._hoverOffset)) {
                                    _this._updateButtonState(uniqueId, ButtonState.None, pointOnButton);
                                }
                                else if (isLower(_this._offsetToFront)) {
                                    _this._updateButtonState(uniqueId, ButtonState.Press, pointOnButton);
                                }

                                break;
                            case ButtonState.Press:
                                if (isGreater(_this._offsetToFront)) {
                                    _this._updateButtonState(uniqueId, ButtonState.Hover, pointOnButton);
                                }
                                else if (isLower(_this._offsetToBack)) {
                                    _this._updateButtonState(uniqueId, ButtonState.None, pointOnButton);
                                }

                                break;
                        }

                        _this._previousHeight.set(uniqueId, heightFromCenter);
                    }
                    else {
                        _this._updateButtonState(uniqueId, ButtonState.None, _this._lastTouchPoint);
                        _this._previousHeight.delete(uniqueId);
                    }
                });
            }
        };
        
        scene.registerBeforeRender(onBeforeRender);
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