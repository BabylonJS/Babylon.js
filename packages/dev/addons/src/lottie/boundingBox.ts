/* eslint-disable jsdoc/require-jsdoc */
import { Vector2 } from "core/Maths";
import type { RawBezier, RawGroupShape, RawPathShape, RawRectangleShape } from "./types/rawLottie";

export type BoundingBox = {
    height: number;
    width: number;
};

export function GetBoundingBox(rawGroup: RawGroupShape): BoundingBox {
    const vertices: Vector2[] = [];
    for (const shape of rawGroup.it || []) {
        if (shape.ty == "rc") {
            GetRectangleVertices(vertices, shape as RawRectangleShape);
        }

        if (shape.ty == "sh") {
            GetPathVertices(vertices, shape as RawPathShape);
        }
    }

    return GetBoundingBoxFromVertices(vertices);
}

function GetRectangleVertices(vertices: Vector2[], rect: RawRectangleShape): void {
    const size = rect.s.k as number[];
    const position = rect.p.k as number[];

    // Calculate the four corners of the rectangle
    vertices.push(new Vector2(position[0] - size[0] / 2, position[1] - size[1] / 2));
    vertices.push(new Vector2(position[0] + size[0] / 2, position[1] - size[1] / 2));
    vertices.push(new Vector2(position[0] + size[0] / 2, position[1] + size[1] / 2));
    vertices.push(new Vector2(position[0] - size[0] / 2, position[1] + size[1] / 2));
}

function GetPathVertices(vertices: Vector2[], path: RawPathShape): void {
    const rawVertices = (path.ks.k as RawBezier).v as number[][];
    for (const vertex of rawVertices) {
        vertices.push(new Vector2(vertex[0], vertex[1]));
    }

    // TODO: find the vertices at tangent 0 of the cuve using the derivative
}

function GetBoundingBoxFromVertices(vertices: Vector2[]): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of vertices) {
        minX = Math.min(minX, vertex.x);
        minY = Math.min(minY, vertex.y);
        maxX = Math.max(maxX, vertex.x);
        maxY = Math.max(maxY, vertex.y);
    }

    return {
        width: maxX - minX,
        height: maxY - minY,
    };
}
