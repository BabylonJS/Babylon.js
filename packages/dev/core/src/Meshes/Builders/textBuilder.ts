import { Path2 } from "../../Maths/math.path";
import { Vector3 } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { Mesh } from "../mesh";
import { ExtrudePolygon } from "./polygonBuilder";

/**
 * Largely inspired by https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/FontLoader.js
 */

// Interfaces
export interface IGlyphData {
    // Commands
    o: string;
    ha: number;
}

export interface IFontData {
    resolution: number;
    underlineThickness: number;
    boundingBox: {
        yMax: number;
        yMin: number;
    }
    glyphs: {[key: string] : IGlyphData};
}

// Shape functions
class ShapePath {
    private _paths: Path2[] = [];
    private _currentPath: Path2;
    private _resolution: number;

    constructor(resolution: number) {
        this._resolution = resolution;
    }
    
    moveTo(x: number, y: number) {
        this._currentPath = new Path2(x, y);
        this._paths.push(this._currentPath);
    }

    lineTo(x: number, y: number) {
        this._currentPath.addLineTo(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        this._currentPath.addQuadraticCurveTo(cpx, cpy, x, y, this._resolution);
    }

    bezierCurveTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number) {
        this._currentPath.addBezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y, this._resolution);
    }

    get paths() {
        return this._paths;
    }
}

// Utility functions
function CreatePath(char: string, scale: number, offsetX: number, offsetY: number, resolution: number, fontData: IFontData): Nullable<{ offsetX: number, path: ShapePath }> {

	const glyph = fontData.glyphs[char] || fontData.glyphs['?'];

	if (!glyph) {
        // return if there is no glyph data
		return null;
	}

	const path = new ShapePath(resolution);

	if (glyph.o) {

		const outline = glyph.o.split(' ');

		for (let i = 0, l = outline.length; i < l;) {

			const action = outline[i ++];

			switch ( action ) {
				case 'm': { // moveTo 
					const x = parseInt(outline[i++]) * scale + offsetX;
					const y = parseInt(outline[i++]) * scale + offsetY;

					path.moveTo(x, y);
					break;
                }
				case 'l': { // lineTo
					const x = parseInt(outline[i++]) * scale + offsetX;
					const y = parseInt(outline[i++]) * scale + offsetY;

					path.lineTo(x, y);
					break;
                }
				case 'q': { // quadraticCurveTo
					const cpx = parseInt(outline[i++]) * scale + offsetX;
					const cpy = parseInt(outline[i++]) * scale + offsetY;
					const cpx1 = parseInt(outline[i++]) * scale + offsetX;
					const cpy1 = parseInt(outline[i++]) * scale + offsetY;

					path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);
					break;
                }
				case 'b':{ // bezierCurveTo
					const cpx = parseInt(outline[i++]) * scale + offsetX;
					const cpy = parseInt(outline[i++]) * scale + offsetY;
					const cpx1 = parseInt(outline[i++]) * scale + offsetX;
					const cpy1 = parseInt(outline[i++]) * scale + offsetY;
					const cpx2 = parseInt(outline[i++]) * scale + offsetX;
					const cpy2 = parseInt(outline[i++]) * scale + offsetY;

					path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);
					break;
                }
			}
		}
	}

	return { offsetX: glyph.ha * scale, path: path };
}

function CreatePaths(text: string, size: number, resolution: number, fontData: IFontData) {
	const chars = Array.from(text);
	const scale = size / fontData.resolution;
	const line_height = (fontData.boundingBox.yMax - fontData.boundingBox.yMin + fontData.underlineThickness ) * scale;

	const paths: ShapePath[] = [];

	let offsetX = 0, offsetY = 0;

	for ( let i = 0; i < chars.length; i ++ ) {

		const char = chars[ i ];

		if ( char === '\n' ) {
			offsetX = 0;
			offsetY -= line_height;
		} else {
    		const ret = CreatePath(char, scale, offsetX, offsetY, resolution, fontData);

            if (ret) {
			    offsetX += ret.offsetX;
			    paths.push( ret.path );
            }
		}

	}

	return paths;
}

function CreateListOfPaths(text: string, size: number, resolution: number, fontData: IFontData) {
    const shapes: Path2[][] = [];
    const paths = CreatePaths(text, size, resolution, fontData);

    for (const p of paths) {
        shapes.push(p.paths);
    }

    return shapes;
}


export function CreateText(
    name: string,
    text: string,
    fontData: IFontData,
    options: {
        size?: number,
        resolution?: number,
        depth?: number,        
        sideOrientation?: number;
    } = {
        size: 50,
        resolution: 8,
        depth: 1.0
    },
    scene: Nullable<Scene> = null
): Mesh {

    // First we need to generate the paths
    const listOfPaths = CreateListOfPaths(text, options.size || 50, options.resolution || 8, fontData);

    // Get the list of shapes
    const shapes: Vector3[][] = [];
    for (const paths of listOfPaths) {
        for (const path of paths) {
            const points = path.getPoints();
            const vectors: Vector3[] = [];
            for (const point of points) {
                vectors.push(new Vector3(point.x, 0, point.y)); // ExtrudePolygon expects data on the xz plane
            }
            shapes.push(vectors);
        }
    }

    // And extrude them
    const meshes: Mesh[] = [];
    for (const shape of shapes) {
        const mesh = ExtrudePolygon(name, { 
            shape: shape, 
            depth: options.depth || 1.0,
            sideOrientation: Mesh._GetDefaultSideOrientation(options.sideOrientation || Mesh.DOUBLESIDE)
        }, scene);
        meshes.push(mesh);
    }

    // Then we can merge everyone into one single mesh
    const newMesh = new Mesh(name, scene);

    return newMesh;
}