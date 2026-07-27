import { type IResolvedCamera } from "../resolvedStage";
import { type ISdfPrimSpec } from "../sdf/index";
import { AsNumber, AsToken, AsVec2, GetAttribute, GetAttributeValue } from "./valueAccess";

/**
 * Maps a UsdGeomCamera prim into the resolved camera payload.
 * @param prim camera prim to map
 * @returns resolved camera payload, or undefined when the prim is not a Camera
 */
export function ResolveCamera(prim: ISdfPrimSpec): IResolvedCamera | undefined {
    if (prim.typeName !== "Camera") {
        return undefined;
    }

    const projectionToken = AsToken(GetAttributeValue(GetAttribute(prim, "projection")));
    const camera: IResolvedCamera = {
        projection: projectionToken === "orthographic" ? "orthographic" : "perspective",
        focalLength: AsNumber(GetAttributeValue(GetAttribute(prim, "focalLength"))) ?? 50,
        horizontalAperture: AsNumber(GetAttributeValue(GetAttribute(prim, "horizontalAperture"))) ?? 20.955,
        verticalAperture: AsNumber(GetAttributeValue(GetAttribute(prim, "verticalAperture"))) ?? 15.2908,
        clippingRange: AsVec2(GetAttributeValue(GetAttribute(prim, "clippingRange"))) ?? [1, 1000000],
    };

    const fStop = AsNumber(GetAttributeValue(GetAttribute(prim, "fStop")));
    if (fStop !== undefined) {
        camera.fStop = fStop;
    }

    const focusDistance = AsNumber(GetAttributeValue(GetAttribute(prim, "focusDistance")));
    if (focusDistance !== undefined) {
        camera.focusDistance = focusDistance;
    }

    return camera;
}
