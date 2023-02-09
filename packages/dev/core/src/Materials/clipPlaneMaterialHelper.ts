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
export function prepareDefinesForClipPlanes(primaryHolder: IClipPlanesHolder, secondaryHolder: IClipPlanesHolder, defines: string[] | Record<string, any>): boolean {
    let changed = false;
    let clipPlane = primaryHolder.clipPlane ?? secondaryHolder.clipPlane;
    changed = addDefine(clipPlane, defines, "CLIPPLANE", "#define CLIPPLANE") || changed;
    clipPlane = primaryHolder.clipPlane2 ?? secondaryHolder.clipPlane2;
    changed = addDefine(clipPlane, defines, "CLIPPLANE2", "#define CLIPPLANE2") || changed;
    clipPlane = primaryHolder.clipPlane3 ?? secondaryHolder.clipPlane3;
    changed = addDefine(clipPlane, defines, "CLIPPLANE3", "#define CLIPPLANE3") || changed;
    clipPlane = primaryHolder.clipPlane4 ?? secondaryHolder.clipPlane4;
    changed = addDefine(clipPlane, defines, "CLIPPLANE4", "#define CLIPPLANE4") || changed;
    clipPlane = primaryHolder.clipPlane5 ?? secondaryHolder.clipPlane5;
    changed = addDefine(clipPlane, defines, "CLIPPLANE5", "#define CLIPPLANE5") || changed;
    clipPlane = primaryHolder.clipPlane6 ?? secondaryHolder.clipPlane6;
    changed = addDefine(clipPlane, defines, "CLIPPLANE6", "#define CLIPPLANE6") || changed;
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

function addDefine(clipPlane: Nullable<Plane>, defines: string[] | Record<string, any>, defineName: string, defineString: string): boolean {
    const defineClipPlane = clipPlane ? true : false;

    let alreadySet: boolean;
    if (Array.isArray(defines)) {
        const defineIndex = defines.indexOf(defineString);
        alreadySet = defineIndex !== -1;
        if (!alreadySet && clipPlane) {
            defines.push(defineString);
        } else if (alreadySet && !clipPlane) {
            defines.splice(defineIndex, 1);
        }
    } else {
        alreadySet = defines[defineName];
        defines[defineName] = defineClipPlane;
    }

    const changed = alreadySet !== defineClipPlane;
    return changed;
}
