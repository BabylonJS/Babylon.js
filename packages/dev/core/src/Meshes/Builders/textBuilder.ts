import { Path2 } from "../../Maths/math.path";
import { Vector2 } from "../../Maths/math.vector";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { Mesh } from "../mesh";

/**
 * Hugely inspired by https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/FontLoader.js
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
    private _startingPoint: Vector2;
    private _paths: Path2[] = [];
    private _currentPath: Path2;
    private _resolution: number;

    constructor(resolution: number) {
        this._resolution = resolution;
    }
    
    moveTo(x: number, y: number) {
        this._startingPoint = new Vector2(x, y);
        this._currentPath = new Path2(x, y);
        this._paths.push(this._currentPath);
    }

    lineTo(x: number, y: number) {
        this._currentPath.addLineTo(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        this._currentPath.addArcTo(cpx, cpy, x, y, this._resolution);
    }

    bezierCurveTo(cpx1: number, cpy1: number, cpx2: number, cpy2: number, x: number, y: number) {
        this._currentPath.addBezierTo(cpx1, cpy1, cpx2, cpy2, x, y, this._resolution);
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

function CreateShapes(text: string, size: number, resolution: number, fontData: IFontData) {
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
        size: number,
        resolution: number,
    },
    scene: Nullable<Scene> = null
): Mesh {

    // First we need to generate the shapes
    const shapes = CreateShapes(text, options.size || 50, options.resolution || 8, fontData);

    // Then we need to triangulate the shapes
    

    // And extrude them

    // Then we can build the mesh
    const newMesh = new Mesh(name, scene);

    return newMesh;
}