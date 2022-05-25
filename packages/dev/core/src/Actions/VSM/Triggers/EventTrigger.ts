import { BaseTrigger } from "./BaseTrigger";
import { AbstractMesh } from "../../../Meshes/abstractMesh";

// Hover trigger is basically OnPointerOver trigger (and OnPointerOut trigger)

export interface IEventTriggerOptions {
    subject: AbstractMesh; // Could be node?
}

export class EventTrigger extends BaseTrigger<IEventTriggerOptions> {

}
