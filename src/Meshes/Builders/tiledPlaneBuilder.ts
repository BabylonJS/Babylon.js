import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreateTiledPlane = function(options: { pattern?: number, tileSize?: number, tileWidth?: number, tileHeight?: number, size?: number, width?: number, height?: number, alignHorizontal?: number, alignVertical?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {

    var flipTile = options.pattern || Mesh.NO_FLIP;
    var tileWidth = options.tileWidth || options.tileSize || 1;
    var tileHeight = options.tileHeight || options.tileSize || 1;
    var alignH = options.alignHorizontal || 0;
    var alignV = options.alignVertical || 0;

    var width = options.width || options.size || 1;
    var tilesX = Math.floor(width / tileWidth);
    var offsetX = width - tilesX * tileWidth;

    var height = options.height || options.size || 1;
    var tilesY = Math.floor(height / tileHeight);
    var offsetY = height - tilesY * tileHeight;

    var halfWidth = tileWidth * tilesX / 2;
    var halfHeight = tileHeight * tilesY / 2;

    var adjustX = 0;
    var adjustY = 0;
    var startX = 0;
    var startY = 0;
    var endX = 0;
    var endY = 0;

    //Part Tiles
    if (offsetX > 0 || offsetY > 0) {
        startX = -halfWidth;
        startY = -halfHeight;
        var endX = halfWidth;
        var endY = halfHeight;

        switch (alignH) {
            case Mesh.CENTER:
                offsetX /= 2;
                startX -= offsetX;
                endX += offsetX;
                break;
            case Mesh.LEFT:
                endX += offsetX;
                adjustX = -offsetX / 2;
                break;
            case Mesh.RIGHT:
                startX -= offsetX;
                adjustX = offsetX / 2;
                break;
        }

        switch (alignV) {
            case Mesh.CENTER:
                offsetY /= 2;
                startY -= offsetY;
                endY += offsetY;
                break;
            case Mesh.BOTTOM:
                endY += offsetY;
                adjustY = -offsetY / 2;
                break;
            case Mesh.TOP:
                startY -= offsetY;
                adjustY = offsetY / 2;
                break;
        }
    }

    var positions = [];
    var normals = [];
    var uvBase = [];
    uvBase[0] = [0, 0, 1, 0, 1, 1, 0, 1];
    uvBase[1] = [0, 0, 1, 0, 1, 1, 0, 1];
    if (flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.ROTATE_ROW) {
        uvBase[1] = [1, 1, 0, 1, 0, 0, 1, 0];
    }
    if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.FLIP_ROW) {
        uvBase[1] = [1, 0, 0, 0, 0, 1, 1, 1];
    }
    if (flipTile === Mesh.FLIP_N_ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
        uvBase[1] = [0, 1, 1, 1, 1, 0, 0, 0];
    }
    var uvs: Array<number> = [];
    var colors = [];
    var indices = [];
    var index = 0;
    for (var y = 0; y < tilesY; y++) {
        for (var x = 0; x < tilesX; x++) {
            positions.push(-halfWidth + x * tileWidth + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
            positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
            positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
            positions.push(-halfWidth + x * tileWidth + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
            indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
            if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_TILE) {
                uvs = uvs.concat(uvBase[(x % 2 + y % 2) % 2]);
            }
            else if (flipTile === Mesh.FLIP_ROW || flipTile === Mesh.ROTATE_ROW || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvs = uvs.concat(uvBase[y % 2]);
            }
            else {

                uvs = uvs.concat(uvBase[0]);
            }
            colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            index += 4;
        }
    }

    //Part Tiles
    if (offsetX > 0 || offsetY > 0) {

        var partialBottomRow: boolean = (offsetY > 0 && (alignV === Mesh.CENTER || alignV === Mesh.TOP));
        var partialTopRow: boolean = (offsetY > 0 && (alignV === Mesh.CENTER || alignV === Mesh.BOTTOM));
        var partialLeftCol: boolean = (offsetX > 0 && (alignH === Mesh.CENTER || alignH === Mesh.RIGHT));
        var partialRightCol: boolean = (offsetX > 0 && (alignH === Mesh.CENTER || alignH === Mesh.LEFT));
        var uvPart: Array<number> = [];
        var a, b, c, d: number;

        //corners
        if (partialBottomRow && partialLeftCol) { //bottom left corner
            positions.push(startX + adjustX, startY + adjustY, 0);
            positions.push(-halfWidth + adjustX, startY + adjustY, 0);
            positions.push(-halfWidth + adjustX, startY + offsetY + adjustY, 0);
            positions.push(startX + adjustX, startY + offsetY + adjustY, 0);
            indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
            index += 4;
            a = 1 - offsetX / tileWidth;
            b = 1 - offsetY / tileHeight;
            c = 1;
            d = 1;
            uvPart = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_ROW) {
                uvPart = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_ROW) {
                uvPart = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvPart = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            uvs = uvs.concat(uvPart);
            colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
        }

        if (partialBottomRow && partialRightCol) { //bottom right corner
            positions.push(halfWidth + adjustX, startY + adjustY, 0);
            positions.push(endX + adjustX, startY + adjustY, 0);
            positions.push(endX + adjustX, startY + offsetY + adjustY, 0);
            positions.push(halfWidth + adjustX, startY + offsetY + adjustY, 0);
            indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
            index += 4;
            a = 0;
            b = 1 - offsetY / tileHeight;
            c = offsetX / tileWidth;
            d = 1;
            uvPart = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_ROW || (flipTile === Mesh.ROTATE_TILE && (tilesX % 2) === 0)) {
                uvPart = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_ROW || (flipTile === Mesh.FLIP_TILE && (tilesX % 2) === 0)) {
                uvPart = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_ROW || (flipTile === Mesh.FLIP_N_ROTATE_TILE && (tilesX % 2) === 0)) {
                uvPart = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            uvs = uvs.concat(uvPart);
            colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
        }

        if (partialTopRow && partialLeftCol) {//top left corner
            positions.push(startX + adjustX, halfHeight + adjustY, 0);
            positions.push(-halfWidth + adjustX, halfHeight + adjustY, 0);
            positions.push(-halfWidth + adjustX, endY + adjustY, 0);
            positions.push(startX + adjustX, endY + adjustY, 0);
            indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
            index += 4;
            a = 1 - offsetX / tileWidth;
            b = 0;
            c = 1;
            d = offsetY / tileHeight;
            uvPart = [a, b, c, b, c, d, a, d];
            if ((flipTile === Mesh.ROTATE_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.ROTATE_TILE && (tilesY % 1) === 0)) {
                uvPart = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if ((flipTile === Mesh.FLIP_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.FLIP_TILE && (tilesY % 2) === 0)) {
                uvPart = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if ((flipTile === Mesh.FLIP_N_ROTATE_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.FLIP_N_ROTATE_TILE && (tilesY % 2) === 0)) {
                uvPart = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            uvs = uvs.concat(uvPart);
            colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
        }

        if (partialTopRow && partialRightCol) { //top right corner
            positions.push(halfWidth + adjustX, halfHeight + adjustY, 0);
            positions.push(endX + adjustX, halfHeight + adjustY, 0);
            positions.push(endX + adjustX, endY + adjustY, 0);
            positions.push(halfWidth + adjustX, endY + adjustY, 0);
            indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
            index += 4;
            a = 0;
            b = 0;
            c = offsetX / tileWidth;
            d = offsetY / tileHeight;
            uvPart = [a, b, c, b, c, d, a, d];
            if ((flipTile === Mesh.ROTATE_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.ROTATE_TILE && (tilesY + tilesX) % 2 === 1)) {
                uvPart = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if ((flipTile === Mesh.FLIP_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.FLIP_TILE && (tilesY + tilesX) % 2 === 1)) {
                uvPart = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if ((flipTile === Mesh.FLIP_N_ROTATE_ROW && (tilesY % 2) === 1) || (flipTile === Mesh.FLIP_N_ROTATE_TILE && (tilesY + tilesX) % 2 === 1)) {
                uvPart = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            uvs = uvs.concat(uvPart);
            colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
            normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
        }

        //part rows
        if (partialBottomRow) {
            var uvBaseBR = [];
            a = 0;
            b = 1 - offsetY / tileHeight;
            c = 1;
            d = 1;
            uvBaseBR[0] = [a, b, c, b, c, d, a, d];
            uvBaseBR[1] = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.ROTATE_ROW) {
                uvBaseBR[1] = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.FLIP_ROW) {
                uvBaseBR[1] = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvBaseBR[1] = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            for (var x = 0; x < tilesX; x++) {
                positions.push(-halfWidth + x * tileWidth + adjustX, startY + adjustY, 0);
                positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, startY + adjustY, 0);
                positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, startY + offsetY + adjustY, 0);
                positions.push(-halfWidth + x * tileWidth + adjustX, startY + offsetY + adjustY, 0);
                indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
                index += 4;
                if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_TILE) {
                    uvs = uvs.concat(uvBaseBR[(x + 1) % 2]);
                }
                else if (flipTile === Mesh.FLIP_ROW || flipTile === Mesh.ROTATE_ROW || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                    uvs = uvs.concat(uvBaseBR[1]);
                }
                else {
                    uvs = uvs.concat(uvBaseBR[0]);
                }
                colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
                normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            }
        }

        if (partialTopRow) {
            var uvBaseTR = [];
            a = 0;
            b = 0;
            c = 1;
            d = offsetY / tileHeight;
            uvBaseTR[0] = [a, b, c, b, c, d, a, d];
            uvBaseTR[1] = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.ROTATE_ROW) {
                uvBaseTR[1] = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.FLIP_ROW) {
                uvBaseTR[1] = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvBaseTR[1] = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            for (var x = 0; x < tilesX; x++) {
                positions.push(-halfWidth + x * tileWidth + adjustX, endY - offsetY + adjustY, 0);
                positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, endY - offsetY + adjustY, 0);
                positions.push(-halfWidth + (x + 1) * tileWidth + adjustX, endY + adjustY, 0);
                positions.push(-halfWidth + x * tileWidth + adjustX, endY + adjustY, 0);
                indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
                index += 4;
                if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_TILE) {
                    uvs = uvs.concat(uvBaseTR[(x + tilesY) % 2]);
                }
                else if (flipTile === Mesh.FLIP_ROW || flipTile === Mesh.ROTATE_ROW || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                    uvs = uvs.concat(uvBaseTR[tilesY % 2]);
                }
                else {
                    uvs = uvs.concat(uvBaseTR[0]);
                }
                colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
                normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            }
        }

        if (partialLeftCol) {
            var uvBaseLC = [];
            a = 1 - offsetX / tileWidth;
            b = 0;
            c = 1;
            d = 1;
            uvBaseLC[0] = [a, b, c, b, c, d, a, d];
            uvBaseLC[1] = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.ROTATE_ROW) {
                uvBaseLC[1] = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.FLIP_ROW) {
                uvBaseLC[1] = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvBaseLC[1] = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            for (var y = 0; y < tilesY; y++) {
                positions.push(startX + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
                positions.push(startX + offsetX + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
                positions.push(startX + offsetX + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
                positions.push(startX + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
                indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
                index += 4;
                if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_TILE) {
                    uvs = uvs.concat(uvBaseLC[(y + 1) % 2]);
                }
                else if (flipTile === Mesh.FLIP_ROW || flipTile === Mesh.ROTATE_ROW || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                    uvs = uvs.concat(uvBaseLC[y % 2]);
                }
                else {
                    uvs = uvs.concat(uvBaseLC[0]);
                }
                colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
                normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            }
        }

        if (partialRightCol) {
            var uvBaseRC = [];
            a = 0;
            b = 0;
            c = offsetX / tileHeight;
            d = 1;
            uvBaseRC[0] = [a, b, c, b, c, d, a, d];
            uvBaseRC[1] = [a, b, c, b, c, d, a, d];
            if (flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.ROTATE_ROW) {
                uvBaseRC[1] = [1 - a, 1 - b, 1 - c, 1 - b, 1 - c, 1 - d, 1 - a, 1 - d];
            }
            if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.FLIP_ROW) {
                uvBaseRC[1] = [1 - a, b, 1 - c, b, 1 - c, d, 1 - a, d];
            }
            if (flipTile === Mesh.FLIP_N_ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                uvBaseRC[1] = [a, 1 - b, c, 1 - b, c, 1 - d, a, 1 - d];
            }
            for (var y = 0; y < tilesY; y++) {
                positions.push(endX - offsetX + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
                positions.push(endX + adjustX, -halfHeight + y * tileHeight + adjustY, 0);
                positions.push(endX + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
                positions.push(endX - offsetX + adjustX, -halfHeight + (y + 1) * tileHeight + adjustY, 0);
                indices.push(index, index + 1, index + 3, index + 1, index + 2, index + 3);
                index += 4;
                if (flipTile === Mesh.FLIP_TILE || flipTile === Mesh.ROTATE_TILE || flipTile === Mesh.FLIP_N_ROTATE_TILE) {
                    uvs = uvs.concat(uvBaseRC[(y + tilesX) % 2]);
                }
                else if (flipTile === Mesh.FLIP_ROW || flipTile === Mesh.ROTATE_ROW || flipTile === Mesh.FLIP_N_ROTATE_ROW) {
                    uvs = uvs.concat(uvBaseRC[y % 2]);
                }
                else {
                    uvs = uvs.concat(uvBaseRC[0]);
                }
                colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
                normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
            }
        }
    }

    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    // Result
    var vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    var totalColors = (sideOrientation === VertexData.DOUBLESIDE) ? colors.concat(colors) : colors;
    vertexData.colors = totalColors;

    return vertexData;
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class TiledPlaneBuilder {
    /**
     * Creates a tiled plane mesh
     * * The parameter `pattern` will, depending on value, do nothing or
     * * * flip (reflect about central vertical) alternate tiles across and up
     * * * flip every tile on alternate rows
     * * * rotate (180 degs) alternate tiles across and up
     * * * rotate every tile on alternate rows
     * * * flip and rotate alternate tiles across and up
     * * * flip and rotate every tile on alternate rows
     * * The parameter `tileSize` sets the size (float) of each tile side (default 1)
     * * You can set some different tile dimensions by using the parameters `tileWidth` and `tileHeight` (both by default have the same value of `tileSize`)
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @see https://doc.babylonjs.com/how_to/set_shapes#box
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the box mesh
     */
    public static CreateTiledPlane(name: string, options: { pattern?: number, tileSize?: number, tileWidth?: number, tileHeight?: number, size?: number, width?: number, height?: number, alignHorizontal?: number, alignVertical?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var plane = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        plane._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateTiledPlane(options);

        vertexData.applyToMesh(plane, options.updatable);

        return plane;
    }
}
