/* eslint-disable @typescript-eslint/naming-convention */
import { type WebXRNearInteractionPickMeshWithSphere } from "./WebXRNearInteraction.pure";

type WebXRNearInteractionPickMeshWithSphereType = typeof WebXRNearInteractionPickMeshWithSphere;

declare module "./WebXRNearInteraction.pure" {
    namespace WebXRNearInteraction {
        export let PickMeshWithSphere: WebXRNearInteractionPickMeshWithSphereType;
    }
}
