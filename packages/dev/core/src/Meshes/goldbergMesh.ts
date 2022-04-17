import type { Scene } from "../scene";
import type { Vector2 } from "../Maths/math.vector";
import { Vector3 } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { Mesh } from "../Meshes/mesh";
import { Color4 } from "../Maths/math.color";
import { Logger } from "../Misc/logger";
import type { FloatArray } from "../types";

Mesh._GoldbergMeshParser = (parsedMesh: any, scene: Scene): GoldbergMesh => {
    return GoldbergMesh.Parse(parsedMesh, scene);
};

/**
 * Defines the set of goldberg data used to create the polygon
 */
export type GoldbergData = {
    /**
     * The list of Goldberg faces colors
     */
    faceColors: Color4[];
    /**
     * The list of Goldberg faces centers
     */
    faceCenters: Vector3[];
    /**
     * The list of Goldberg faces Z axis
     */
    faceZaxis: Vector3[];
    /**
     * The list of Goldberg faces Y axis
     */
    faceXaxis: Vector3[];
    /**
     * The list of Goldberg faces X axis
     */
    faceYaxis: Vector3[];
    /**
     * Defines the number of shared faces
     */
    nbSharedFaces: number;
    /**
     * Defines the number of unshared faces
     */
    nbUnsharedFaces: number;
    /**
     * Defines the total number of goldberg faces
     */
    nbFaces: number;
    /**
     * Defines the number of goldberg faces at the pole
     */
    nbFacesAtPole: number;
    /**
     * Defines the number of adjacent faces per goldberg faces
     */
    adjacentFaces: number[][];
};

/**
 * Mesh for a Goldberg Polyhedron which is made from 12 pentagonal and the rest hexagonal faces
 * @see https://en.wikipedia.org/wiki/Goldberg_polyhedron
 */
export class GoldbergMesh extends Mesh {
    /**
     * Defines the specific Goldberg data used in this mesh construction.
     */
    public goldbergData: GoldbergData = {
        faceColors: [],
        faceCenters: [],
        faceZaxis: [],
        faceXaxis: [],
        faceYaxis: [],
        nbSharedFaces: 0,
        nbUnsharedFaces: 0,
        nbFaces: 0,
        nbFacesAtPole: 0,
        adjacentFaces: [],
    };

    /**
     * Gets the related Goldberg face from pole infos
     * @param poleOrShared Defines the pole index or the shared face index if the fromPole parameter is passed in
     * @param fromPole Defines an optional pole index to find the related info from
     * @returns the goldberg face number
     */
    public relatedGoldbergFace(poleOrShared: number, fromPole?: number): number {
        if (fromPole === void 0) {
            if (poleOrShared > this.goldbergData.nbUnsharedFaces - 1) {
                Logger.Warn("Maximum number of unshared faces used");
                poleOrShared = this.goldbergData.nbUnsharedFaces - 1;
            }
            return this.goldbergData.nbUnsharedFaces + poleOrShared;
        }
        if (poleOrShared > 11) {
            Logger.Warn("Last pole used");
            poleOrShared = 11;
        }
        if (fromPole > this.goldbergData.nbFacesAtPole - 1) {
            Logger.Warn("Maximum number of faces at a pole used");
            fromPole = this.goldbergData.nbFacesAtPole - 1;
        }

        return 12 + poleOrShared * this.goldbergData.nbFacesAtPole + fromPole;
    }

    private _changeGoldbergFaceColors(colorRange: (number | Color4)[][]): number[] {
        for (let i = 0; i < colorRange.length; i++) {
            const min: number = <number>colorRange[i][0];
            const max: number = <number>colorRange[i][1];
            const col: Color4 = <Color4>colorRange[i][2];
            for (let f = min; f < max + 1; f++) {
                this.goldbergData.faceColors[f] = col;
            }
        }

        const newCols: number[] = [];
        for (let f = 0; f < 12; f++) {
            for (let i = 0; i < 5; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        for (let f = 12; f < this.goldbergData.faceColors.length; f++) {
            for (let i = 0; i < 6; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        return newCols;
    }

    /**
     * Set new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    public setGoldbergFaceColors(colorRange: (number | Color4)[][]) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.setVerticesData(VertexBuffer.ColorKind, newCols);
    }

    /**
     * Updates new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    public updateGoldbergFaceColors(colorRange: (number | Color4)[][]) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.updateVerticesData(VertexBuffer.ColorKind, newCols);
    }

    private _changeGoldbergFaceUVs(uvRange: (number | Vector2)[][]): FloatArray {
        const uvs: FloatArray = this.getVerticesData(VertexBuffer.UVKind)!!;
        for (let i = 0; i < uvRange.length; i++) {
            const min: number = <number>uvRange[i][0];
            const max: number = <number>uvRange[i][1];
            const center: Vector2 = <Vector2>uvRange[i][2];
            const radius: number = <number>uvRange[i][3];
            const angle: number = <number>uvRange[i][4];
            const points5: number[] = [];
            const points6: number[] = [];
            let u: number;
            let v: number;
            for (let p = 0; p < 5; p++) {
                u = center.x + radius * Math.cos(angle + (p * Math.PI) / 2.5);
                v = center.y + radius * Math.sin(angle + (p * Math.PI) / 2.5);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points5.push(u, v);
            }
            for (let p = 0; p < 6; p++) {
                u = center.x + radius * Math.cos(angle + (p * Math.PI) / 3);
                v = center.y + radius * Math.sin(angle + (p * Math.PI) / 3);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points6.push(u, v);
            }
            for (let f = min; f < Math.min(12, max + 1); f++) {
                for (let p = 0; p < 5; p++) {
                    uvs[10 * f + 2 * p] = points5[2 * p];
                    uvs[10 * f + 2 * p + 1] = points5[2 * p + 1];
                }
            }
            for (let f = Math.max(12, min); f < max + 1; f++) {
                for (let p = 0; p < 6; p++) {
                    //120 + 12 * (f - 12) = 12 * f - 24
                    uvs[12 * f - 24 + 2 * p] = points6[2 * p];
                    uvs[12 * f - 23 + 2 * p] = points6[2 * p + 1];
                }
            }
        }
        return uvs;
    }

    /**
     * set new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    public setGoldbergFaceUVs(uvRange: (number | Vector2)[][]) {
        const newUVs: FloatArray = this._changeGoldbergFaceUVs(uvRange);
        this.setVerticesData(VertexBuffer.UVKind, newUVs);
    }

    /**
     * Updates new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    public updateGoldbergFaceUVs(uvRange: (number | Vector2)[][]) {
        const newUVs = this._changeGoldbergFaceUVs(uvRange);
        this.updateVerticesData(VertexBuffer.UVKind, newUVs);
    }

    /**
     * Places a mesh on a particular face of the goldberg polygon
     * @param mesh Defines the mesh to position
     * @param face Defines the face to position onto
     * @param position Defines the position relative to the face we are positioning the mesh onto
     */
    public placeOnGoldbergFaceAt(mesh: Mesh, face: number, position: Vector3) {
        const orientation = Vector3.RotationFromAxis(this.goldbergData.faceXaxis[face], this.goldbergData.faceYaxis[face], this.goldbergData.faceZaxis[face]);
        mesh.rotation = orientation;
        mesh.position = this.goldbergData.faceCenters[face]
            .add(this.goldbergData.faceXaxis[face].scale(position.x))
            .add(this.goldbergData.faceYaxis[face].scale(position.y))
            .add(this.goldbergData.faceZaxis[face].scale(position.z));
    }

    /**
     * Serialize current mesh
     * @param serializationObject defines the object which will receive the serialization data
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
        serializationObject.type = "GoldbergMesh";

        const goldbergData: any = {};
        goldbergData.adjacentFaces = this.goldbergData.adjacentFaces;
        goldbergData.nbSharedFaces = this.goldbergData.nbSharedFaces;
        goldbergData.nbUnsharedFaces = this.goldbergData.nbUnsharedFaces;
        goldbergData.nbFaces = this.goldbergData.nbFaces;
        goldbergData.nbFacesAtPole = this.goldbergData.nbFacesAtPole;

        if (this.goldbergData.faceColors) {
            goldbergData.faceColors = [];
            for (const color of this.goldbergData.faceColors) {
                goldbergData.faceColors.push(color.asArray());
            }
        }
        if (this.goldbergData.faceCenters) {
            goldbergData.faceCenters = [];
            for (const vector of this.goldbergData.faceCenters) {
                goldbergData.faceCenters.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceZaxis) {
            goldbergData.faceZaxis = [];
            for (const vector of this.goldbergData.faceZaxis) {
                goldbergData.faceZaxis.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceYaxis) {
            goldbergData.faceYaxis = [];
            for (const vector of this.goldbergData.faceYaxis) {
                goldbergData.faceYaxis.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceXaxis) {
            goldbergData.faceXaxis = [];
            for (const vector of this.goldbergData.faceXaxis) {
                goldbergData.faceXaxis.push(vector.asArray());
            }
        }

        serializationObject.goldbergData = goldbergData;
    }

    /**
     * Parses a serialized goldberg mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the goldberg mesh in
     * @returns the created goldberg mesh
     */
    public static Parse(parsedMesh: any, scene: Scene): GoldbergMesh {
        const goldbergData = parsedMesh.goldbergData;
        goldbergData.faceColors = goldbergData.faceColors.map((el: number[]) => Color4.FromArray(el));
        goldbergData.faceCenters = goldbergData.faceCenters.map((el: number[]) => Vector3.FromArray(el));
        goldbergData.faceZaxis = goldbergData.faceZaxis.map((el: number[]) => Vector3.FromArray(el));
        goldbergData.faceXaxis = goldbergData.faceXaxis.map((el: number[]) => Vector3.FromArray(el));
        goldbergData.faceYaxis = goldbergData.faceYaxis.map((el: number[]) => Vector3.FromArray(el));

        const goldberg = new GoldbergMesh(parsedMesh.name, scene);
        goldberg.goldbergData = goldbergData;

        return goldberg;
    }
}
