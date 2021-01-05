import { AbstractMesh } from "../Meshes/abstractMesh";
import { Nullable } from "../types";
import { Sprite } from "../Sprites/sprite";
import { Scene } from "../scene";
import { Vector2 } from "../Maths/math.vector";
import { IEvent } from "../Events/deviceInputEvents";

/**
 * Interface used to define ActionEvent
 */
export interface IActionEvent {
    /** The mesh or sprite that triggered the action */
    source: any;
    /** The X mouse cursor position at the time of the event */
    pointerX: number;
    /** The Y mouse cursor position at the time of the event */
    pointerY: number;
    /** The mesh that is currently pointed at (can be null) */
    meshUnderPointer: Nullable<AbstractMesh>;
    /** the original (browser) event that triggered the ActionEvent */
    sourceEvent?: any;
    /** additional data for the event */
    additionalData?: any;
}

/**
 * ActionEvent is the event being sent when an action is triggered.
 */
export class ActionEvent implements IActionEvent {
    /**
     * Creates a new ActionEvent
     * @param source The mesh or sprite that triggered the action
     * @param pointerX The X mouse cursor position at the time of the event
     * @param pointerY The Y mouse cursor position at the time of the event
     * @param meshUnderPointer The mesh that is currently pointed at (can be null)
     * @param sourceEvent the original (browser) event that triggered the ActionEvent
     * @param additionalData additional data for the event
     */
    constructor(
        /** The mesh or sprite that triggered the action */
        public source: any,
        /** The X mouse cursor position at the time of the event */
        public pointerX: number,
        /** The Y mouse cursor position at the time of the event */
        public pointerY: number,
        /** The mesh that is currently pointed at (can be null) */
        public meshUnderPointer: Nullable<AbstractMesh>,
        /** the original (browser) event that triggered the ActionEvent */
        public sourceEvent?: any,
        /** additional data for the event */
        public additionalData?: any) {
    }

    /**
     * Helper function to auto-create an ActionEvent from a source mesh.
     * @param source The source mesh that triggered the event
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    public static CreateNew(source: AbstractMesh, evt?: IEvent, additionalData?: any): ActionEvent {
        var scene = source.getScene();
        return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer || source, evt, additionalData);
    }

    /**
     * Helper function to auto-create an ActionEvent from a source sprite
     * @param source The source sprite that triggered the event
     * @param scene Scene associated with the sprite
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    public static CreateNewFromSprite(source: Sprite, scene: Scene, evt?: IEvent, additionalData?: any): ActionEvent {
        return new ActionEvent(source, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt, additionalData);
    }

    /**
     * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
     * @param scene the scene where the event occurred
     * @param evt The original (browser) event
     * @returns the new ActionEvent
     */
    public static CreateNewFromScene(scene: Scene, evt: IEvent): ActionEvent {
        return new ActionEvent(null, scene.pointerX, scene.pointerY, scene.meshUnderPointer, evt);
    }

    /**
     * Helper function to auto-create an ActionEvent from a primitive
     * @param prim defines the target primitive
     * @param pointerPos defines the pointer position
     * @param evt The original (browser) event
     * @param additionalData additional data for the event
     * @returns the new ActionEvent
     */
    public static CreateNewFromPrimitive(prim: any, pointerPos: Vector2, evt?: Event, additionalData?: any): ActionEvent {
        return new ActionEvent(prim, pointerPos.x, pointerPos.y, null, evt, additionalData);
    }
}