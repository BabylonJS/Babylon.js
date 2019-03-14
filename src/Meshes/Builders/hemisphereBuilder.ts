import { Mesh, _CreationDataStorage } from "../mesh";
import { Scene } from "../../scene";
import { SphereBuilder } from '../Builders/sphereBuilder';

/**
 * Creates a hemispheric light
 */
Mesh.CreateHemisphere = (name: string, segments: number, diameter: number, scene?: Scene): Mesh => {
    var options = {
        segments: segments,
        diameter: diameter
    };

    return HemisphereBuilder.CreateHemisphere(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class HemisphereBuilder {
    /**
     * Creates a hemisphere mesh
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the hemisphere mesh
     */
    public static CreateHemisphere(name: string, options: { segments?: number, diameter?: number, sideOrientation?: number }, scene: any): Mesh {
        if (!options.diameter) {
            options.diameter = 1;
        }
        if (!options.segments) {
            options.segments = 16;
        }

        var halfSphere = SphereBuilder.CreateSphere("", {slice: 0.5, diameter: options.diameter, segments: options.segments}, scene);
        var disc = Mesh.CreateDisc("", options.diameter / 2, (options.segments * 3) + (4 - options.segments), scene);
        disc.rotation.x = -Math.PI / 2;
        disc.parent = halfSphere;

        var merged = <Mesh>Mesh.MergeMeshes([disc, halfSphere], true);
        merged.name = name;

        return merged;
    }
}