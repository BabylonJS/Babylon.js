import { Mesh, _CreationDataStorage } from "../mesh";
import { Scene } from "../../scene";
import { CreateSphere } from '../Builders/sphereBuilder';
import { CreateDisc } from "./discBuilder";

/**
 * Creates a hemisphere mesh
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the hemisphere mesh
 */
export function CreateHemisphere(name: string, options: { segments?: number, diameter?: number, sideOrientation?: number } = {}, scene: any): Mesh {
    if (!options.diameter) {
        options.diameter = 1;
    }
    if (!options.segments) {
        options.segments = 16;
    }

    var halfSphere = CreateSphere("", { slice: 0.5, diameter: options.diameter, segments: options.segments }, scene);
    var disc = CreateDisc("", { radius: options.diameter / 2, tessellation: (options.segments * 3) + (4 - options.segments) }, scene);
    disc.rotation.x = -Math.PI / 2;
    disc.parent = halfSphere;

    var merged = <Mesh>Mesh.MergeMeshes([disc, halfSphere], true);
    merged.name = name;

    return merged;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const HemisphereBuilder = {
    CreateHemisphere
};

/**
 * Creates a hemispheric light
 */
Mesh.CreateHemisphere = (name: string, segments: number, diameter: number, scene?: Scene): Mesh => {
    var options = {
        segments: segments,
        diameter: diameter
    };

    return CreateHemisphere(name, options, scene);
};