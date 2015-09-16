module BABYLON {
    export interface IGetSetVerticesData {
        isVerticesDataPresent(kind: string): boolean;
        getVerticesData(kind: string, copyWhenShared?: boolean): number[];
        getIndices(copyWhenShared?: boolean): number[];
        setVerticesData(kind: string, data: number[], updatable?: boolean): void;
        updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void;
        setIndices(indices: number[]): void;
    }

    export class VertexData {
        public positions: number[];
        public normals: number[];
        public uvs: number[];
        public uvs2: number[];
        public uvs3: number[];
        public uvs4: number[];
        public uvs5: number[];
        public uvs6: number[];
        public colors: number[];
        public matricesIndices: number[];
        public matricesWeights: number[];
        public indices: number[];

        public set(data: number[], kind: string) {
            switch (kind) {
                case VertexBuffer.PositionKind:
                    this.positions = data;
                    break;
                case VertexBuffer.NormalKind:
                    this.normals = data;
                    break;
                case VertexBuffer.UVKind:
                    this.uvs = data;
                    break;
                case VertexBuffer.UV2Kind:
                    this.uvs2 = data;
                    break;
                case VertexBuffer.UV3Kind:
                    this.uvs3 = data;
                    break;
                case VertexBuffer.UV4Kind:
                    this.uvs4 = data;
                    break;
                case VertexBuffer.UV5Kind:
                    this.uvs5 = data;
                    break;
                case VertexBuffer.UV6Kind:
                    this.uvs6 = data;
                    break;
                case VertexBuffer.ColorKind:
                    this.colors = data;
                    break;
                case VertexBuffer.MatricesIndicesKind:
                    this.matricesIndices = data;
                    break;
                case VertexBuffer.MatricesWeightsKind:
                    this.matricesWeights = data;
                    break;
            }
        }

        public applyToMesh(mesh: Mesh, updatable?: boolean): void {
            this._applyTo(mesh, updatable);
        }

        public applyToGeometry(geometry: Geometry, updatable?: boolean): void {
            this._applyTo(geometry, updatable);
        }

        public updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): void {
            this._update(mesh);
        }

        public updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): void {
            this._update(geometry);
        }

        private _applyTo(meshOrGeometry: IGetSetVerticesData, updatable?: boolean) {
            if (this.positions) {
                meshOrGeometry.setVerticesData(VertexBuffer.PositionKind, this.positions, updatable);
            }

            if (this.normals) {
                meshOrGeometry.setVerticesData(VertexBuffer.NormalKind, this.normals, updatable);
            }

            if (this.uvs) {
                meshOrGeometry.setVerticesData(VertexBuffer.UVKind, this.uvs, updatable);
            }

            if (this.uvs2) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV2Kind, this.uvs2, updatable);
            }

            if (this.uvs3) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV3Kind, this.uvs3, updatable);
            }

            if (this.uvs4) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV4Kind, this.uvs4, updatable);
            }

            if (this.uvs5) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV5Kind, this.uvs5, updatable);
            }

            if (this.uvs6) {
                meshOrGeometry.setVerticesData(VertexBuffer.UV6Kind, this.uvs6, updatable);
            }

            if (this.colors) {
                meshOrGeometry.setVerticesData(VertexBuffer.ColorKind, this.colors, updatable);
            }

            if (this.matricesIndices) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updatable);
            }

            if (this.matricesWeights) {
                meshOrGeometry.setVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updatable);
            }

            if (this.indices) {
                meshOrGeometry.setIndices(this.indices);
            }
        }

        private _update(meshOrGeometry: IGetSetVerticesData, updateExtends?: boolean, makeItUnique?: boolean) {
            if (this.positions) {
                meshOrGeometry.updateVerticesData(VertexBuffer.PositionKind, this.positions, updateExtends, makeItUnique);
            }

            if (this.normals) {
                meshOrGeometry.updateVerticesData(VertexBuffer.NormalKind, this.normals, updateExtends, makeItUnique);
            }

            if (this.uvs) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UVKind, this.uvs, updateExtends, makeItUnique);
            }

            if (this.uvs2) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV2Kind, this.uvs2, updateExtends, makeItUnique);
            }

            if (this.uvs3) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV3Kind, this.uvs3, updateExtends, makeItUnique);
            }

            if (this.uvs4) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV4Kind, this.uvs4, updateExtends, makeItUnique);
            }

            if (this.uvs5) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV5Kind, this.uvs5, updateExtends, makeItUnique);
            }

            if (this.uvs6) {
                meshOrGeometry.updateVerticesData(VertexBuffer.UV6Kind, this.uvs6, updateExtends, makeItUnique);
            }

            if (this.colors) {
                meshOrGeometry.updateVerticesData(VertexBuffer.ColorKind, this.colors, updateExtends, makeItUnique);
            }

            if (this.matricesIndices) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesIndicesKind, this.matricesIndices, updateExtends, makeItUnique);
            }

            if (this.matricesWeights) {
                meshOrGeometry.updateVerticesData(VertexBuffer.MatricesWeightsKind, this.matricesWeights, updateExtends, makeItUnique);
            }

            if (this.indices) {
                meshOrGeometry.setIndices(this.indices);
            }
        }

        public transform(matrix: Matrix): void {
            var transformed = Vector3.Zero();
            var index: number;
            if (this.positions) {
                var position = Vector3.Zero();

                for (index = 0; index < this.positions.length; index += 3) {
                    Vector3.FromArrayToRef(this.positions, index, position);

                    Vector3.TransformCoordinatesToRef(position, matrix, transformed);
                    this.positions[index] = transformed.x;
                    this.positions[index + 1] = transformed.y;
                    this.positions[index + 2] = transformed.z;
                }
            }

            if (this.normals) {
                var normal = Vector3.Zero();

                for (index = 0; index < this.normals.length; index += 3) {
                    Vector3.FromArrayToRef(this.normals, index, normal);

                    Vector3.TransformNormalToRef(normal, matrix, transformed);
                    this.normals[index] = transformed.x;
                    this.normals[index + 1] = transformed.y;
                    this.normals[index + 2] = transformed.z;
                }
            }
        }

        public merge(other: VertexData): void {
            var index: number;
            if (other.indices) {
                if (!this.indices) {
                    this.indices = [];
                }

                var offset = this.positions ? this.positions.length / 3 : 0;
                for (index = 0; index < other.indices.length; index++) {
                    this.indices.push(other.indices[index] + offset);
                }
            }

            if (other.positions) {
                if (!this.positions) {
                    this.positions = [];
                }

                for (index = 0; index < other.positions.length; index++) {
                    this.positions.push(other.positions[index]);
                }
            }

            if (other.normals) {
                if (!this.normals) {
                    this.normals = [];
                }
                for (index = 0; index < other.normals.length; index++) {
                    this.normals.push(other.normals[index]);
                }
            }

            if (other.uvs) {
                if (!this.uvs) {
                    this.uvs = [];
                }
                for (index = 0; index < other.uvs.length; index++) {
                    this.uvs.push(other.uvs[index]);
                }
            }

            if (other.uvs2) {
                if (!this.uvs2) {
                    this.uvs2 = [];
                }
                for (index = 0; index < other.uvs2.length; index++) {
                    this.uvs2.push(other.uvs2[index]);
                }
            }

            if (other.uvs3) {
                if (!this.uvs3) {
                    this.uvs3 = [];
                }
                for (index = 0; index < other.uvs3.length; index++) {
                    this.uvs3.push(other.uvs3[index]);
                }
            }

            if (other.uvs4) {
                if (!this.uvs4) {
                    this.uvs4 = [];
                }
                for (index = 0; index < other.uvs4.length; index++) {
                    this.uvs4.push(other.uvs4[index]);
                }
            }

            if (other.uvs5) {
                if (!this.uvs5) {
                    this.uvs5 = [];
                }
                for (index = 0; index < other.uvs5.length; index++) {
                    this.uvs5.push(other.uvs5[index]);
                }
            }

            if (other.uvs6) {
                if (!this.uvs6) {
                    this.uvs6 = [];
                }
                for (index = 0; index < other.uvs6.length; index++) {
                    this.uvs6.push(other.uvs6[index]);
                }
            }

            if (other.matricesIndices) {
                if (!this.matricesIndices) {
                    this.matricesIndices = [];
                }
                for (index = 0; index < other.matricesIndices.length; index++) {
                    this.matricesIndices.push(other.matricesIndices[index]);
                }
            }

            if (other.matricesWeights) {
                if (!this.matricesWeights) {
                    this.matricesWeights = [];
                }
                for (index = 0; index < other.matricesWeights.length; index++) {
                    this.matricesWeights.push(other.matricesWeights[index]);
                }
            }

            if (other.colors) {
                if (!this.colors) {
                    this.colors = [];
                }
                for (index = 0; index < other.colors.length; index++) {
                    this.colors.push(other.colors[index]);
                }
            }
        }

        // Statics
        public static ExtractFromMesh(mesh: Mesh, copyWhenShared?: boolean): VertexData {
            return VertexData._ExtractFrom(mesh, copyWhenShared);
        }

        public static ExtractFromGeometry(geometry: Geometry, copyWhenShared?: boolean): VertexData {
            return VertexData._ExtractFrom(geometry, copyWhenShared);
        }

        private static _ExtractFrom(meshOrGeometry: IGetSetVerticesData, copyWhenShared?: boolean): VertexData {
            var result = new VertexData();

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                result.positions = meshOrGeometry.getVerticesData(VertexBuffer.PositionKind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                result.normals = meshOrGeometry.getVerticesData(VertexBuffer.NormalKind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UVKind)) {
                result.uvs = meshOrGeometry.getVerticesData(VertexBuffer.UVKind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                result.uvs2 = meshOrGeometry.getVerticesData(VertexBuffer.UV2Kind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV3Kind)) {
                result.uvs3 = meshOrGeometry.getVerticesData(VertexBuffer.UV3Kind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV4Kind)) {
                result.uvs4 = meshOrGeometry.getVerticesData(VertexBuffer.UV4Kind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV5Kind)) {
                result.uvs5 = meshOrGeometry.getVerticesData(VertexBuffer.UV5Kind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.UV6Kind)) {
                result.uvs6 = meshOrGeometry.getVerticesData(VertexBuffer.UV6Kind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                result.colors = meshOrGeometry.getVerticesData(VertexBuffer.ColorKind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)) {
                result.matricesIndices = meshOrGeometry.getVerticesData(VertexBuffer.MatricesIndicesKind, copyWhenShared);
            }

            if (meshOrGeometry.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)) {
                result.matricesWeights = meshOrGeometry.getVerticesData(VertexBuffer.MatricesWeightsKind, copyWhenShared);
            }

            result.indices = meshOrGeometry.getIndices(copyWhenShared);

            return result;
        }

        public static CreateRibbon(pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            closeArray = closeArray || false;
            closePath = closePath || false;
            var defaultOffset = Math.floor(pathArray[0].length / 2);
            offset = offset || defaultOffset;
            offset = offset > defaultOffset ? defaultOffset : Math.floor(offset); // offset max allowed : defaultOffset

            var positions: number[] = [];
            var indices: number[] = [];
            var normals: number[] = [];
            var uvs: number[] = [];

            var us: number[][] = [];        		// us[path_id] = [uDist1, uDist2, uDist3 ... ] distances between points on path path_id
            var vs: number[][] = [];        		// vs[i] = [vDist1, vDist2, vDist3, ... ] distances between points i of consecutives paths from pathArray
            var uTotalDistance: number[] = []; 		// uTotalDistance[p] : total distance of path p
            var vTotalDistance: number[] = []; 		//  vTotalDistance[i] : total distance between points i of first and last path from pathArray
            var minlg: number;          	        // minimal length among all paths from pathArray
            var lg: number[] = [];        		    // array of path lengths : nb of vertex per path
            var idx: number[] = [];       		    // array of path indexes : index of each path (first vertex) in the total vertex number
            var p: number;							// path iterator
            var i: number;							// point iterator
            var j: number;							// point iterator

            // if single path in pathArray
            if (pathArray.length < 2) {
                var ar1: Vector3[] = [];
                var ar2: Vector3[] = [];
                for (i = 0; i < pathArray[0].length - offset; i++) {
                    ar1.push(pathArray[0][i]);
                    ar2.push(pathArray[0][i + offset]);
                }
                pathArray = [ar1, ar2];
            }

            // positions and horizontal distances (u)
            var idc: number = 0;
            var closePathCorr: number = (closePath) ? 1 : 0;
            var path: Vector3[];
            var l: number;
            minlg = pathArray[0].length;
            var vectlg: number;
            var dist: number;
            for (p = 0; p < pathArray.length; p++) {
                uTotalDistance[p] = 0;
                us[p] = [0];
                path = pathArray[p];
                l = path.length;
                minlg = (minlg < l) ? minlg : l;

                j = 0;
                while (j < l) {
                    positions.push(path[j].x, path[j].y, path[j].z);
                    if (j > 0) {
                        vectlg = path[j].subtract(path[j - 1]).length();
                        dist = vectlg + uTotalDistance[p];
                        us[p].push(dist);
                        uTotalDistance[p] = dist;
                    }
                    j++;
                }

                if (closePath) {
                    j--;
                    positions.push(path[0].x, path[0].y, path[0].z);
                    vectlg = path[j].subtract(path[0]).length();
                    dist = vectlg + uTotalDistance[p];
                    us[p].push(dist);
                    uTotalDistance[p] = dist;
                }

                lg[p] = l + closePathCorr;
                idx[p] = idc;
                idc += (l + closePathCorr);
            }

            // vertical distances (v)
            var path1: Vector3[];
            var path2: Vector3[];
            var vertex1: Vector3;
            var vertex2: Vector3;
            for (i = 0; i < minlg + closePathCorr; i++) {
                vTotalDistance[i] = 0;
                vs[i] = [0];
                for (p = 0; p < pathArray.length - 1; p++) {
                    path1 = pathArray[p];
                    path2 = pathArray[p + 1];
                    if (i === minlg) {   // closePath
                        vertex1 = path1[0];
                        vertex2 = path2[0];
                    }
                    else {
                        vertex1 = path1[i];
                        vertex2 = path2[i];
                    }
                    vectlg = vertex2.subtract(vertex1).length();
                    dist = vectlg + vTotalDistance[i];
                    vs[i].push(dist);
                    vTotalDistance[i] = dist;
                }
                if (closeArray) {
                    path1 = pathArray[p];
                    path2 = pathArray[0];
                    vectlg = path2[i].subtract(path1[i]).length();
                    dist = vectlg + vTotalDistance[i];
                    vTotalDistance[i] = dist;
                }
            }


            // uvs            
            var u: number;
            var v: number;
            for (p = 0; p < pathArray.length; p++) {
                for (i = 0; i < minlg + closePathCorr; i++) {
                    u = us[p][i] / uTotalDistance[p];
                    v = vs[i][p] / vTotalDistance[i];
                    uvs.push(u, v);
                }
            }

            // indices
            p = 0;                    					// path index
            var pi: number = 0;                    		// positions array index
            var l1: number = lg[p] - 1;           		// path1 length
            var l2: number = lg[p + 1] - 1;         	// path2 length
            var min: number = (l1 < l2) ? l1 : l2;   	// current path stop index
            var shft: number = idx[1] - idx[0];         // shift 
            var path1nb: number = closeArray ? lg.length : lg.length - 1;     // number of path1 to iterate	on

            while (pi <= min && p < path1nb) {       	//  stay under min and don't go over next to last path
                // draw two triangles between path1 (p1) and path2 (p2) : (p1.pi, p2.pi, p1.pi+1) and (p2.pi+1, p1.pi+1, p2.pi) clockwise

                indices.push(pi, pi + shft, pi + 1);
                indices.push(pi + shft + 1, pi + 1, pi + shft);
                pi += 1;
                if (pi === min) {                   			// if end of one of two consecutive paths reached, go to next existing path
                    p++;
                    if (p === lg.length - 1) {                 // last path of pathArray reached <=> closeArray == true
                        shft = idx[0] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[0] - 1;
                    }
                    else {
                        shft = idx[p + 1] - idx[p];
                        l1 = lg[p] - 1;
                        l2 = lg[p + 1] - 1;
                    }
                    pi = idx[p];
                    min = (l1 < l2) ? l1 + pi : l2 + pi;
                }
            }

            // normals
            VertexData.ComputeNormals(positions, indices, normals);

            if (closePath) {
                var indexFirst: number = 0;
                var indexLast: number = 0;
                for (p = 0; p < pathArray.length; p++) {
                    indexFirst = idx[p] * 3;
                    if (p + 1 < pathArray.length) {
                        indexLast = (idx[p + 1] - 1) * 3;
                    }
                    else {
                        indexLast = normals.length - 3;
                    }
                    normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                    normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                    normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                    normals[indexLast] = normals[indexFirst];
                    normals[indexLast + 1] = normals[indexFirst + 1];
                    normals[indexLast + 2] = normals[indexFirst + 2];
                }
            }
            
            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            if (closePath) {
                (<any>vertexData)._idx = idx;
            }

            return vertexData;
        }

        public static CreateBox(options: { width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number }): VertexData;
        public static CreateBox(size: number, sideOrientation?: number): VertexData;
        public static CreateBox(options: any, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            var normalsSource = [
                new Vector3(0, 0, 1),
                new Vector3(0, 0, -1),
                new Vector3(1, 0, 0),
                new Vector3(-1, 0, 0),
                new Vector3(0, 1, 0),
                new Vector3(0, -1, 0)
            ];

            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var width = 1;
            var height = 1;
            var depth = 1;
            var faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
            var faceColors: Color4[];
            var colors = [];

            if (options.faceColors) {
                faceColors = options.faceColors;
            }

            if (options.width !== undefined) {
                width = options.width || 1;
                height = options.height || 1;
                depth = options.depth || 1;
            } else { // back-compat with size parameter
                width = options || 1;
                height = options || 1;
                depth = options || 1;
            }

            sideOrientation = sideOrientation || options.sideOrientation || Mesh.DEFAULTSIDE;

            for (var f = 0; f < 6; f++) {
                if (faceUV[f] === undefined) {
                    faceUV[f] = new Vector4(0, 0, 1, 1);
                }
                if (faceColors && faceColors[f] === undefined) {
                    faceColors[f] = new Color4(1, 1, 1, 1);
                }
            }

            var scaleVector = new Vector3(width / 2, height / 2, depth / 2);

            // Create each face in turn.
            for (var index = 0; index < normalsSource.length; index++) {
                var normal = normalsSource[index];

                // Get two vectors perpendicular to the face normal and to each other.
                var side1 = new Vector3(normal.y, normal.z, normal.x);
                var side2 = Vector3.Cross(normal, side1);

                // Six indices (two triangles) per face.
                var verticesLength = positions.length / 3;
                indices.push(verticesLength);
                indices.push(verticesLength + 1);
                indices.push(verticesLength + 2);

                indices.push(verticesLength);
                indices.push(verticesLength + 2);
                indices.push(verticesLength + 3);

                // Four vertices per face.
                var vertex = normal.subtract(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.subtract(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].w);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.add(side1).add(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].x, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }

                vertex = normal.add(side1).subtract(side2).multiply(scaleVector);
                positions.push(vertex.x, vertex.y, vertex.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(faceUV[index].z, faceUV[index].y);
                if (faceColors) {
                    colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
                }
            }

            // sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            if (faceColors) {
                var totalColors = (sideOrientation === Mesh.DOUBLESIDE) ? colors.concat(colors) : colors;
                vertexData.colors = totalColors;
            }

            return vertexData;
        }
        public static CreateSphere(options: { segments?: number, diameterX?: number, diameterY?: number, diameterZ?: number, sideOrientation?: number }): VertexData;
        public static CreateSphere(segments: number, diameter?: number, sideOrientation?: number): VertexData;
        public static CreateSphere(options: any, diameter?: number, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            var segments: number;
            var diameterX: number;
            var diameterY: number;
            var diameterZ: number;

            if (options.segments) {
                segments = options.segments || 32;
                diameterX = options.diameterX || 1;
                diameterY = options.diameterY || 1;
                diameterZ = options.diameterZ || 1;
            } else { // Back-compat
                segments = options || 32;
                diameterX = diameter || 1;
                diameterY = diameterX;
                diameterZ = diameterX;
            }

            sideOrientation = sideOrientation || options.sideOrientation || Mesh.DEFAULTSIDE;

            var radius = new Vector3(diameterX / 2, diameterY / 2, diameterZ / 2);

            var totalZRotationSteps = 2 + segments;
            var totalYRotationSteps = 2 * totalZRotationSteps;

            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
                var normalizedZ = zRotationStep / totalZRotationSteps;
                var angleZ = (normalizedZ * Math.PI);

                for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
                    var normalizedY = yRotationStep / totalYRotationSteps;

                    var angleY = normalizedY * Math.PI * 2;

                    var rotationZ = Matrix.RotationZ(-angleZ);
                    var rotationY = Matrix.RotationY(angleY);
                    var afterRotZ = Vector3.TransformCoordinates(Vector3.Up(), rotationZ);
                    var complete = Vector3.TransformCoordinates(afterRotZ, rotationY);

                    var vertex = complete.multiply(radius);
                    var normal = Vector3.Normalize(vertex);

                    positions.push(vertex.x, vertex.y, vertex.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(normalizedZ, normalizedY);
                }

                if (zRotationStep > 0) {
                    var verticesCount = positions.length / 3;
                    for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1); (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                        indices.push((firstIndex));
                        indices.push((firstIndex + 1));
                        indices.push(firstIndex + totalYRotationSteps + 1);

                        indices.push((firstIndex + totalYRotationSteps + 1));
                        indices.push((firstIndex + 1));
                        indices.push((firstIndex + totalYRotationSteps + 2));
                    }
                }
            }

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        // Cylinder and cone (made using ribbons)
        public static CreateCylinder(height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: number = 1, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {

            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var angle_step = Math.PI * 2 / tessellation;
            var angle: number;
            var h: number;
            var radius: number;
            var tan = (diameterBottom - diameterTop) / 2 / height;
            var ringVertex: Vector3 = Vector3.Zero();
            var ringNormal: Vector3 = Vector3.Zero();

            // positions, normals, uvs
            var i: number;
            var j: number;
            for (i = 0; i <= subdivisions; i++) {
                h = i / subdivisions;
                radius = (h * (diameterTop - diameterBottom) + diameterBottom) / 2;
                for (j = 0; j <= tessellation; j++) {
                    angle = j * angle_step;
                    ringVertex.x = Math.cos(-angle) * radius;
                    ringVertex.y = -height / 2 + h * height;
                    ringVertex.z = Math.sin(-angle) * radius;
                    if (diameterTop === 0 && i === subdivisions) {
                        // if no top cap, reuse former normals
                        ringNormal.x = normals[normals.length - (tessellation + 1) * 3];
                        ringNormal.y = normals[normals.length - (tessellation + 1) * 3 + 1];
                        ringNormal.z = normals[normals.length - (tessellation + 1) * 3 + 2];
                    }
                    else {
                        ringNormal.x = ringVertex.x;
                        ringNormal.z = ringVertex.z;
                        ringNormal.y = Math.sqrt(ringNormal.x * ringNormal.x + ringNormal.z * ringNormal.z) * tan;
                        ringNormal.normalize();
                    }
                    positions.push(ringVertex.x, ringVertex.y, ringVertex.z);
                    normals.push(ringNormal.x, ringNormal.y, ringNormal.z);
                    uvs.push(j / tessellation, 1 - h);
                }
            }

            // indices
            for (i = 0; i < subdivisions; i++) {
                for (j = 0; j < tessellation; j++) {
                    var i0 = i * (tessellation + 1) + j;
                    var i1 = (i + 1) * (tessellation + 1) + j;
                    var i2 = i * (tessellation + 1) + (j + 1);
                    var i3 = (i + 1) * (tessellation + 1) + (j + 1);
                    indices.push(i0, i1, i2);
                    indices.push(i3, i2, i1);
                }
            }

            // Caps
            var createCylinderCap = isTop => {
                var radius = isTop ? diameterTop / 2 : diameterBottom / 2;
                if (radius === 0) {
                    return;
                }
                var vbase = positions.length / 3;
                var offset = new Vector3(0, isTop ? height / 2 : -height / 2, 0);
                var textureScale = new Vector2(0.5, 0.5);
                // Cap positions, normals & uvs
                var angle;
                var circleVector;
                var i: number;
                for (i = 0; i < tessellation; i++) {
                    angle = Math.PI * 2 * i / tessellation;
                    circleVector = new Vector3(Math.cos(-angle), 0, Math.sin(-angle));
                    var position = circleVector.scale(radius).add(offset);
                    var textureCoordinate = new Vector2(circleVector.x * textureScale.x + 0.5, circleVector.z * textureScale.y + 0.5);
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, isTop ? 1 : -1, 0);
                    uvs.push(textureCoordinate.x, textureCoordinate.y);
                }
                // Cap indices
                for (i = 0; i < tessellation - 2; i++) {
                    if (!isTop) {
                        indices.push(vbase);
                        indices.push(vbase + (i + 1) % tessellation);
                        indices.push(vbase + (i + 2) % tessellation);
                    }
                    else {
                        indices.push(vbase);
                        indices.push(vbase + (i + 2) % tessellation);
                        indices.push(vbase + (i + 1) % tessellation);
                    }
                }
            };
            
            // add caps to geometry
            createCylinderCap(true);
            createCylinderCap(false);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        public static CreateTorus(diameter, thickness, tessellation, sideOrientation: number = Mesh.DEFAULTSIDE) {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            diameter = diameter || 1;
            thickness = thickness || 0.5;
            tessellation = tessellation || 16;

            var stride = tessellation + 1;

            for (var i = 0; i <= tessellation; i++) {
                var u = i / tessellation;

                var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

                var transform = Matrix.Translation(diameter / 2.0, 0, 0).multiply(Matrix.RotationY(outerAngle));

                for (var j = 0; j <= tessellation; j++) {
                    var v = 1 - j / tessellation;

                    var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
                    var dx = Math.cos(innerAngle);
                    var dy = Math.sin(innerAngle);

                    // Create a vertex.
                    var normal = new Vector3(dx, dy, 0);
                    var position = normal.scale(thickness / 2);
                    var textureCoordinate = new Vector2(u, v);

                    position = Vector3.TransformCoordinates(position, transform);
                    normal = Vector3.TransformNormal(normal, transform);

                    positions.push(position.x, position.y, position.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(textureCoordinate.x, textureCoordinate.y);

                    // And create indices for two triangles.
                    var nextI = (i + 1) % stride;
                    var nextJ = (j + 1) % stride;

                    indices.push(i * stride + j);
                    indices.push(i * stride + nextJ);
                    indices.push(nextI * stride + j);

                    indices.push(i * stride + nextJ);
                    indices.push(nextI * stride + nextJ);
                    indices.push(nextI * stride + j);
                }
            }

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();


            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        public static CreateLines(points: Vector3[]): VertexData {
            var indices = [];
            var positions = [];

            for (var index = 0; index < points.length; index++) {
                positions.push(points[index].x, points[index].y, points[index].z);

                if (index > 0) {
                    indices.push(index - 1);
                    indices.push(index);
                }
            }

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;

            return vertexData;
        }

        public static CreateDashedLines(points: Vector3[], dashSize: number, gapSize: number, dashNb: number): VertexData {
            dashSize = dashSize || 3;
            gapSize = gapSize || 1;
            dashNb = dashNb || 200;

            var positions = new Array<number>();
            var indices = new Array<number>();

            var curvect = Vector3.Zero();
            var lg = 0;
            var nb = 0;
            var shft = 0;
            var dashshft = 0;
            var curshft = 0;
            var idx = 0;
            var i = 0;
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                lg += curvect.length();
            }
            shft = lg / dashNb;
            dashshft = dashSize * shft / (dashSize + gapSize);
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                nb = Math.floor(curvect.length() / shft);
                curvect.normalize();
                for (var j = 0; j < nb; j++) {
                    curshft = shft * j;
                    positions.push(points[i].x + curshft * curvect.x, points[i].y + curshft * curvect.y, points[i].z + curshft * curvect.z);
                    positions.push(points[i].x + (curshft + dashshft) * curvect.x, points[i].y + (curshft + dashshft) * curvect.y, points[i].z + (curshft + dashshft) * curvect.z);
                    indices.push(idx, idx + 1);
                    idx += 2;
                }
            }

            // Result
            var vertexData = new VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;

            return vertexData;
        }

        public static CreateGround(options: { width?: number, height?: number, subdivisions?: number, sideOrientation?: number }): VertexData;
        public static CreateGround(width: number, height: number, subdivisions?: number): VertexData;
        public static CreateGround(options: any, height?: number, subdivisions?: number): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row: number, col: number;

            var width: number;

            if (options.width) {
                width = options.width || 1;
                height = options.height || 1;
                subdivisions = options.subdivisions || 1;
            } else {
                width = options || 1;
                height = height || 1;
                subdivisions = subdivisions || 1;
            }

            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
                    var normal = new Vector3(0, 1.0, 0);

                    positions.push(position.x, position.y, position.z);
                    normals.push(normal.x, normal.y, normal.z);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }

            for (row = 0; row < subdivisions; row++) {
                for (col = 0; col < subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + row * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));

                    indices.push(col + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));
                }
            }

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        public static CreateTiledGround(xmin: number, zmin: number, xmax: number, zmax: number, subdivisions = { w: 1, h: 1 }, precision = { w: 1, h: 1 }): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row: number, col: number, tileRow: number, tileCol: number;

            subdivisions.h = (subdivisions.w < 1) ? 1 : subdivisions.h;
            subdivisions.w = (subdivisions.w < 1) ? 1 : subdivisions.w;
            precision.w = (precision.w < 1) ? 1 : precision.w;
            precision.h = (precision.h < 1) ? 1 : precision.h;

            var tileSize = {
                'w': (xmax - xmin) / subdivisions.w,
                'h': (zmax - zmin) / subdivisions.h
            };

            function applyTile(xTileMin: number, zTileMin: number, xTileMax: number, zTileMax: number) {
                // Indices
                var base = positions.length / 3;
                var rowLength = precision.w + 1;
                for (row = 0; row < precision.h; row++) {
                    for (col = 0; col < precision.w; col++) {
                        var square = [
                            base + col + row * rowLength,
                            base + (col + 1) + row * rowLength,
                            base + (col + 1) + (row + 1) * rowLength,
                            base + col + (row + 1) * rowLength
                        ];

                        indices.push(square[1]);
                        indices.push(square[2]);
                        indices.push(square[3]);
                        indices.push(square[0]);
                        indices.push(square[1]);
                        indices.push(square[3]);
                    }
                }

                // Position, normals and uvs
                var position = Vector3.Zero();
                var normal = new Vector3(0, 1.0, 0);
                for (row = 0; row <= precision.h; row++) {
                    position.z = (row * (zTileMax - zTileMin)) / precision.h + zTileMin;
                    for (col = 0; col <= precision.w; col++) {
                        position.x = (col * (xTileMax - xTileMin)) / precision.w + xTileMin;
                        position.y = 0;

                        positions.push(position.x, position.y, position.z);
                        normals.push(normal.x, normal.y, normal.z);
                        uvs.push(col / precision.w, row / precision.h);
                    }
                }
            }

            for (tileRow = 0; tileRow < subdivisions.h; tileRow++) {
                for (tileCol = 0; tileCol < subdivisions.w; tileCol++) {
                    applyTile(
                        xmin + tileCol * tileSize.w,
                        zmin + tileRow * tileSize.h,
                        xmin + (tileCol + 1) * tileSize.w,
                        zmin + (tileRow + 1) * tileSize.h
                        );
                }
            }

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        public static CreateGroundFromHeightMap(width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, buffer: Uint8Array, bufferWidth: number, bufferHeight: number): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;

            // Vertices
            for (row = 0; row <= subdivisions; row++) {
                for (col = 0; col <= subdivisions; col++) {
                    var position = new Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));

                    // Compute height
                    var heightMapX = (((position.x + width / 2) / width) * (bufferWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + height / 2) / height) * (bufferHeight - 1)) | 0;

                    var pos = (heightMapX + heightMapY * bufferWidth) * 4;
                    var r = buffer[pos] / 255.0;
                    var g = buffer[pos + 1] / 255.0;
                    var b = buffer[pos + 2] / 255.0;

                    var gradient = r * 0.3 + g * 0.59 + b * 0.11;

                    position.y = minHeight + (maxHeight - minHeight) * gradient;

                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / subdivisions, 1.0 - row / subdivisions);
                }
            }

            // Indices
            for (row = 0; row < subdivisions; row++) {
                for (col = 0; col < subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + row * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));

                    indices.push(col + (row + 1) * (subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (subdivisions + 1));
                    indices.push(col + row * (subdivisions + 1));
                }
            }

            // Normals
            VertexData.ComputeNormals(positions, indices, normals);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }
        public static CreatePlane(options: { width?: number, height?: number, sideOrientation?: number }): VertexData;
        public static CreatePlane(size: number, sideOrientation?: number): VertexData;
        public static CreatePlane(options: any, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            var width: number;
            var height: number;

            if (options.width) {
                width = options.width || 1;
                height = options.height || 1;
                sideOrientation = options.sideOrientation || Mesh.DEFAULTSIDE;
            } else {
                width = options || 1;
                height = options || 1;
            }

            // Vertices
            var halfWidth = width / 2.0;
            var halfHeight = height / 2.0;

            positions.push(-halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(0.0, 0.0);

            positions.push(halfWidth, -halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 0.0);

            positions.push(halfWidth, halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(1.0, 1.0);

            positions.push(-halfWidth, halfHeight, 0);
            normals.push(0, 0, -1.0);
            uvs.push(0.0, 1.0);

            // Indices
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        public static CreateDisc(radius: number, tessellation: number, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            var positions = [];
            var indices = [];
            var normals = [];
            var uvs = [];

            // positions and uvs
            positions.push(0, 0, 0);    // disc center first
            uvs.push(0.5, 0.5);

            var step = Math.PI * 2 / tessellation;
            for (var a = 0; a < Math.PI * 2; a += step) {
                var x = Math.cos(a);
                var y = Math.sin(a);
                var u = (x + 1) / 2;
                var v = (1 - y) / 2;
                positions.push(radius * x, radius * y, 0);
                uvs.push(u, v);
            }
            positions.push(positions[3], positions[4], positions[5]); // close the circle
            uvs.push(uvs[2], uvs[3]);

            //indices
            var vertexNb = positions.length / 3;
            for (var i = 1; i < vertexNb - 1; i++) {
                indices.push(i + 1, 0, i);
            }

            // result
            VertexData.ComputeNormals(positions, indices, normals);
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        // based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
        public static CreateTorusKnot(radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, sideOrientation: number = Mesh.DEFAULTSIDE): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];

            radius = radius || 2;
            tube = tube || 0.5;
            radialSegments = radialSegments || 32;
            tubularSegments = tubularSegments || 32;
            p = p || 2;
            q = q || 3;

            // Helper
            var getPos = (angle) => {

                var cu = Math.cos(angle);
                var su = Math.sin(angle);
                var quOverP = q / p * angle;
                var cs = Math.cos(quOverP);

                var tx = radius * (2 + cs) * 0.5 * cu;
                var ty = radius * (2 + cs) * su * 0.5;
                var tz = radius * Math.sin(quOverP) * 0.5;

                return new Vector3(tx, ty, tz);
            };

            // Vertices
            var i: number;
            var j: number;
            for (i = 0; i <= radialSegments; i++) {
                var modI = i % radialSegments;
                var u = modI / radialSegments * 2 * p * Math.PI;
                var p1 = getPos(u);
                var p2 = getPos(u + 0.01);
                var tang = p2.subtract(p1);
                var n = p2.add(p1);

                var bitan = Vector3.Cross(tang, n);
                n = Vector3.Cross(bitan, tang);

                bitan.normalize();
                n.normalize();

                for (j = 0; j < tubularSegments; j++) {
                    var modJ = j % tubularSegments;
                    var v = modJ / tubularSegments * 2 * Math.PI;
                    var cx = -tube * Math.cos(v);
                    var cy = tube * Math.sin(v);

                    positions.push(p1.x + cx * n.x + cy * bitan.x);
                    positions.push(p1.y + cx * n.y + cy * bitan.y);
                    positions.push(p1.z + cx * n.z + cy * bitan.z);

                    uvs.push(i / radialSegments);
                    uvs.push(j / tubularSegments);
                }
            }

            for (i = 0; i < radialSegments; i++) {
                for (j = 0; j < tubularSegments; j++) {
                    var jNext = (j + 1) % tubularSegments;
                    var a = i * tubularSegments + j;
                    var b = (i + 1) * tubularSegments + j;
                    var c = (i + 1) * tubularSegments + jNext;
                    var d = i * tubularSegments + jNext;

                    indices.push(d); indices.push(b); indices.push(a);
                    indices.push(d); indices.push(c); indices.push(b);
                }
            }

            // Normals
            VertexData.ComputeNormals(positions, indices, normals);

            // Sides
            VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        // Tools
        /**
         * @param {any} - positions (number[] or Float32Array)
         * @param {any} - indices   (number[] or Uint16Array)
         * @param {any} - normals   (number[] or Float32Array)
         */
        public static ComputeNormals(positions: any, indices: any, normals: any) {
            var index = 0;
            
            // temp Vector3
            var p1p2 = Vector3.Zero();
            var p3p2 = Vector3.Zero();
            var faceNormal = Vector3.Zero();

            var vertexNormali1 = Vector3.Zero();

            for (index = 0; index < positions.length; index++) {
                normals[index] = 0.0;
            }

            // indice triplet = 1 face
            var nbFaces = indices.length / 3;
            for (index = 0; index < nbFaces; index++) {
                var i1 = indices[index * 3];
                var i2 = indices[index * 3 + 1];
                var i3 = indices[index * 3 + 2];

                p1p2.x = positions[i1 * 3] - positions[i2 * 3];
                p1p2.y = positions[i1 * 3 + 1] - positions[i2 * 3 + 1];
                p1p2.z = positions[i1 * 3 + 2] - positions[i2 * 3 + 2];

                p3p2.x = positions[i3 * 3] - positions[i2 * 3];
                p3p2.y = positions[i3 * 3 + 1] - positions[i2 * 3 + 1];
                p3p2.z = positions[i3 * 3 + 2] - positions[i2 * 3 + 2];

                Vector3.CrossToRef(p1p2, p3p2, faceNormal);
                faceNormal.normalize();

                normals[i1 * 3] += faceNormal.x;
                normals[i1 * 3 + 1] += faceNormal.y;
                normals[i1 * 3 + 2] += faceNormal.z;
                normals[i2 * 3] += faceNormal.x;
                normals[i2 * 3 + 1] += faceNormal.y;
                normals[i2 * 3 + 2] += faceNormal.z;
                normals[i3 * 3] += faceNormal.x;
                normals[i3 * 3 + 1] += faceNormal.y;
                normals[i3 * 3 + 2] += faceNormal.z;
            }
            
            // last normalization
            for (index = 0; index < normals.length / 3; index++) {
                Vector3.FromFloatsToRef(normals[index * 3], normals[index * 3 + 1], normals[index * 3 + 2], vertexNormali1);
                vertexNormali1.normalize();
                normals[index * 3] = vertexNormali1.x;
                normals[index * 3 + 1] = vertexNormali1.y;
                normals[index * 3 + 2] = vertexNormali1.z;
            }
        }

        private static _ComputeSides(sideOrientation: number, positions: number[], indices: number[], normals: number[], uvs: number[]) {
            var li: number = indices.length;
            var ln: number = normals.length;
            var i: number;
            var n: number;
            sideOrientation = sideOrientation || Mesh.DEFAULTSIDE;

            switch (sideOrientation) {

                case Mesh.FRONTSIDE:
                    // nothing changed
                    break;

                case Mesh.BACKSIDE:
                    var tmp: number;
                    // indices
                    for (i = 0; i < li; i += 3) {
                        tmp = indices[i];
                        indices[i] = indices[i + 2];
                        indices[i + 2] = tmp;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[n] = -normals[n];
                    }
                    break;

                case Mesh.DOUBLESIDE:
                    // positions 
                    var lp: number = positions.length;
                    var l: number = lp / 3;
                    for (var p = 0; p < lp; p++) {
                        positions[lp + p] = positions[p];
                    }
                    // indices
                    for (i = 0; i < li; i += 3) {
                        indices[i + li] = indices[i + 2] + l;
                        indices[i + 1 + li] = indices[i + 1] + l;
                        indices[i + 2 + li] = indices[i] + l;
                    }
                    // normals
                    for (n = 0; n < ln; n++) {
                        normals[ln + n] = -normals[n];
                    }

                    // uvs
                    var lu: number = uvs.length;
                    for (var u: number = 0; u < lu; u++) {
                        uvs[u + lu] = uvs[u];
                    }
                    break;
            }
        }
    }
} 







