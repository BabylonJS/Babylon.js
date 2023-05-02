import { Vector3 } from "../../Maths/math.vector";
import type { Vector4 } from "../../Maths/math.vector";
import type { Color4 } from "../../Maths/math.color";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { Mesh } from "../mesh";
import { ExtrudePolygon } from "./polygonBuilder";


function CreatePaths(text: string, size: number, fontInfo: any) {

}


export function CreateText(
    name: string,
    text: string,
    fontInfo: any,
    options: {
        size?: number;
        depth?: number;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        wrap?: boolean;
        topBaseAt?: number;
        bottomBaseAt?: number;
        updatable?: boolean;
    } = {},
    scene: Nullable<Scene> = null
): Mesh {
    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);

    const shape = [];
    const paths = CreatePaths( text, options.size || 50, fontInfo);

    // for ( let p = 0, pl = paths.length; p < pl; p ++ ) {
    //     shape.push(...paths[p].toShapes());
    // }

    return ExtrudePolygon(name, {
        shape: shape,
        depth: options.depth,
        faceUV: options.faceUV,
        faceColors: options.faceColors,
        updatable: options.updatable,
        sideOrientation: options.sideOrientation,
        frontUVs: options.frontUVs,
        backUVs: options.backUVs,
        wrap: options.wrap,        
    }, scene);
}