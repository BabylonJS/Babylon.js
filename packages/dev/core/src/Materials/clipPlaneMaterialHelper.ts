import type { Effect } from "./effect";
import type { IClipPlanesHolder } from "../Misc/interfaces/iClipPlanesHolder";
import type { Nullable } from "../types";
import type { Plane } from "../Maths/math.plane";

/** @internal */
export function addClipPlaneUniforms(uniforms: string[]): void {
    if (uniforms.indexOf("vClipPlane") === -1) {
        uniforms.push("vClipPlane");
    }
    if (uniforms.indexOf("vClipPlane2") === -1) {
        uniforms.push("vClipPlane2");
    }
    if (uniforms.indexOf("vClipPlane3") === -1) {
        uniforms.push("vClipPlane3");
    }
    if (uniforms.indexOf("vClipPlane4") === -1) {
        uniforms.push("vClipPlane4");
    }
    if (uniforms.indexOf("vClipPlane5") === -1) {
        uniforms.push("vClipPlane5");
    }
    if (uniforms.indexOf("vClipPlane6") === -1) {
        uniforms.push("vClipPlane6");
    }
}

/** @internal */
export function prepareStringDefinesForClipPlanes(primaryHolder: IClipPlanesHolder, secondaryHolder: IClipPlanesHolder, defines: string[]): void {
    const clipPlane = !!(primaryHolder.clipPlane ?? secondaryHolder.clipPlane);
    const clipPlane2 = !!(primaryHolder.clipPlane2 ?? secondaryHolder.clipPlane2);
    const clipPlane3 = !!(primaryHolder.clipPlane3 ?? secondaryHolder.clipPlane3);
    const clipPlane4 = !!(primaryHolder.clipPlane4 ?? secondaryHolder.clipPlane4);
    const clipPlane5 = !!(primaryHolder.clipPlane5 ?? secondaryHolder.clipPlane5);
    const clipPlane6 = !!(primaryHolder.clipPlane6 ?? secondaryHolder.clipPlane6);

    if (clipPlane) defines.push("#define CLIPPLANE");
    if (clipPlane2) defines.push("#define CLIPPLANE2");
    if (clipPlane3) defines.push("#define CLIPPLANE3");
    if (clipPlane4) defines.push("#define CLIPPLANE4");
    if (clipPlane5) defines.push("#define CLIPPLANE5");
    if (clipPlane6) defines.push("#define CLIPPLANE6");
}

/** @internal */
export function prepareDefinesForClipPlanes(primaryHolder: IClipPlanesHolder, secondaryHolder: IClipPlanesHolder, defines: Record<string, any>): boolean {
    let changed = false;

    const clipPlane = !!(primaryHolder.clipPlane ?? secondaryHolder.clipPlane);
    const clipPlane2 = !!(primaryHolder.clipPlane2 ?? secondaryHolder.clipPlane2);
    const clipPlane3 = !!(primaryHolder.clipPlane3 ?? secondaryHolder.clipPlane3);
    const clipPlane4 = !!(primaryHolder.clipPlane4 ?? secondaryHolder.clipPlane4);
    const clipPlane5 = !!(primaryHolder.clipPlane5 ?? secondaryHolder.clipPlane5);
    const clipPlane6 = !!(primaryHolder.clipPlane6 ?? secondaryHolder.clipPlane6);

    // Do not factorize this code, it breaks browsers optimizations.
    if (defines["CLIPPLANE"] !== clipPlane) {
        defines["CLIPPLANE"] = clipPlane;
        changed = true;
    }
    if (defines["CLIPPLANE2"] !== clipPlane2) {
        defines["CLIPPLANE2"] = clipPlane2;
        changed = true;
    }
    if (defines["CLIPPLANE3"] !== clipPlane3) {
        defines["CLIPPLANE3"] = clipPlane3;
        changed = true;
    }
    if (defines["CLIPPLANE4"] !== clipPlane4) {
        defines["CLIPPLANE4"] = clipPlane4;
        changed = true;
    }
    if (defines["CLIPPLANE5"] !== clipPlane5) {
        defines["CLIPPLANE5"] = clipPlane5;
        changed = true;
    }
    if (defines["CLIPPLANE6"] !== clipPlane6) {
        defines["CLIPPLANE6"] = clipPlane6;
        changed = true;
    }

    return changed;
}

/** @internal */
export function bindClipPlane(effect: Effect, primaryHolder: IClipPlanesHolder, secondaryHolder: IClipPlanesHolder): void {
    let clipPlane = primaryHolder.clipPlane ?? secondaryHolder.clipPlane;
    setClipPlane(effect, "vClipPlane", clipPlane);
    clipPlane = primaryHolder.clipPlane2 ?? secondaryHolder.clipPlane2;
    setClipPlane(effect, "vClipPlane2", clipPlane);
    clipPlane = primaryHolder.clipPlane3 ?? secondaryHolder.clipPlane3;
    setClipPlane(effect, "vClipPlane3", clipPlane);
    clipPlane = primaryHolder.clipPlane4 ?? secondaryHolder.clipPlane4;
    setClipPlane(effect, "vClipPlane4", clipPlane);
    clipPlane = primaryHolder.clipPlane5 ?? secondaryHolder.clipPlane5;
    setClipPlane(effect, "vClipPlane5", clipPlane);
    clipPlane = primaryHolder.clipPlane6 ?? secondaryHolder.clipPlane6;
    setClipPlane(effect, "vClipPlane6", clipPlane);
}

function setClipPlane(effect: Effect, uniformName: string, clipPlane: Nullable<Plane>): void {
    if (clipPlane) {
        effect.setFloat4(uniformName, clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
    }
}
