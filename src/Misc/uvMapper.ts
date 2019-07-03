import { Vector2, Vector3, Matrix } from "../Maths/math"
import { Nullable } from "../types";
import { Mesh } from "../meshes";
import { IndicesArray, FloatArray, VertexBuffer, MeshBuilder, Scene } from "../index";

class Face {
	area: number;
	uv: Vector2[];
	v: {
		v: Vector3,
		index: number
	}[];
	edge_keys: string[];
	no: Vector3;
	index: number;
	meshIndex: number;

	constructor(indexBegin: number, 
		indices: IndicesArray, 
		vertices: FloatArray,
		offset: number = 0,
		matrix?: Matrix) {
		this.v = [];
		this.uv = [];
		this.edge_keys = [];
		this.index = indexBegin;
		this.meshIndex = offset;
		for (let i = 0; i < 3; i++) {
			let idx = indices[i + indexBegin];
			let vertex = new Vector3(vertices[idx * 3], vertices[idx * 3 + 1], vertices[idx * 3 + 2]);
			if (matrix) {
				vertex = Vector3.TransformCoordinates(vertex, matrix);
			}
			this.v.push({
				v: vertex,
				index: idx
			});	
			this.uv.push(new Vector2());
			let firstIndex, secondIndex;

			if (indices[i + indexBegin] > indices[(i+1) % 3 + indexBegin]) {
				firstIndex = indices[(i+1) % 3 + indexBegin];
				secondIndex = indices[i + indexBegin];
			} else {
				firstIndex = indices[i + indexBegin];
				secondIndex = indices[(i+1) % 3 + indexBegin];
			}
			this.edge_keys.push(offset + "_" + firstIndex + "_" + secondIndex)
		}

		let faceNormal = Vector3.Cross(this.v[0].v.subtract(this.v[1].v), this.v[2].v.subtract(this.v[1].v));
		let area = faceNormal.length() / 2;
		faceNormal.scaleInPlace(1 / (area * 2));
		this.no = faceNormal;
		this.area = area;
	}
}

declare interface Edge {
	v0: Vector2,
	v1: Vector2,
}

declare interface MeasuredEdge { l: number, e: Nullable<Edge> };

declare type Island = Face[];

// 0: island
// 1: totFaceArea
// 2: efficiency
// 3: islandBoundsArea
// 4: w
// 5: h
// 6: edges
// 7: uniqueEdgesPoints
declare type IslandInfo = any[];

let intersect_line_line_2d = function () {

    var r, s,
        denominator,
        BAx, BAy, DCx, DCy;

    return function(A: Vector2, B: Vector2, C: Vector2, D: Vector2) {
                BAx = B.x - A.x;
                BAy = B.y - A.y;
                DCx = D.x - C.x;
                DCy = D.y - C.y;
                denominator = BAx * DCy - BAy * DCx;

                if (Math.abs(denominator) < 1e-6) return null;
                denominator = 1 / denominator;

                r = ((A.y - C.y) * DCx - (A.x - C.x) * DCy) * denominator;
                s = ((A.y - C.y) * BAx - (A.x - C.x) * BAy) * denominator;

                var P = new Vector2(A.x + r * BAx, A.y + r * BAy);

				if ((0 <= r) && (r <= 1) && (0 <= s) && (s <= 1)) {
					return P;
				}

				return null;
            };
}();

function cross(a: Vector2, b: Vector2, o: Vector2) {
   return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/**
 * Avoid doing:
 *
 * angle = atan2f(dvec[0], dvec[1]);
 * angle_to_mat2(mat, angle);
 *
 * instead use a vector as a matrix.
 */
function mul_v2_v2_cw(mat: Vector2, vec: Vector2)
{
	return new Vector2(
		mat.x * vec.x + mat.y * vec.y,
		mat.y * vec.x - mat.x * vec.y
	);
}

function projectMat(vector: Vector3) {
	let lastAxis = vector.clone().normalize();

	let firstAxis: Vector3;

	if (Math.abs(lastAxis.x) < SMALL_NUM && Math.abs(lastAxis.y) < SMALL_NUM) {
		firstAxis = new Vector3(0, 1, 0);
	} else {
		firstAxis = new Vector3(0, 0, 1);
	}

	firstAxis = Vector3.Cross(lastAxis, firstAxis);
	firstAxis.normalize();
	let secondAxis = Vector3.Cross(lastAxis, firstAxis);
	secondAxis.normalize();
	let mat = new Matrix();

	Matrix.FromXYZAxesToRef(firstAxis, secondAxis, lastAxis, mat);

	return mat.transpose();
}

// TODO
const USER_FILL_HOLES = 1;
const USER_FILL_HOLES_QUALITY = 1;
const USER_ISLAND_MARGIN = 0;
const SMALL_NUM = 1e-12;

// Porting smart uv project code from blender
export class UvMapper {

	toV3(v: Vector2) {
		return new Vector3(v.x, v.y, 0);
	}

	// Straight port from blender, not memory efficient, can be improved
	public pointInTri2D(v: Vector3, v1: Vector3, v2: Vector3, v3: Vector3) {
		let side1 = v2.subtract(v1);
		let side2 = v3.subtract(v1);

		let nor = Vector3.Cross(side1, side2);
		let mtx = Matrix.FromValues(side1.x, side1.y, side1.z, 0,
									side2.x, side2.y, side2.z, 0,
									nor.x, nor.y, nor.z, 0,
									0, 0, 0, 1);

		let det = mtx.determinant();
		if (!det) {
			return false;
		}

		mtx.invert();
		let uvw = Vector3.TransformCoordinates(v.subtract(v1), mtx);
		return 0 <= uvw.x && 0 <= uvw.y && uvw.x + uvw.y <= 1;
	}

	debPointInTri2D() {
		let v1 = new Vector3(0, 0, 0);
		let v2 = new Vector3(1, 0, 0);
		let v3 = new Vector3(0, 1, 0);

		let V0 = new Vector3(0, 0, 0); // true
		let V1 = new Vector3(-1, 0, 0); // false
		let V2 = new Vector3(0, 0.1, 0.1); // true 
		let V3 = new Vector3(1, 0, 0); // true
		let V4 = new Vector3(0.5, 0.5, 0); // true
		let V5 = new Vector3(0.500001, 0.500001, 0); // false
		let V6 = new Vector3(1.000001, 0, 0); // false

		console.log(this.pointInTri2D(V0, v1, v2, v3) + " should be true");
		console.log(this.pointInTri2D(V1, v1, v2, v3) + " should be false");
		console.log(this.pointInTri2D(V2, v1, v2, v3) + " should be true");
		console.log(this.pointInTri2D(V3, v1, v2, v3) + " should be true");
		console.log(this.pointInTri2D(V4, v1, v2, v3) + " should be true");
		console.log(this.pointInTri2D(V5, v1, v2, v3) + " should be false");
		console.log(this.pointInTri2D(V6, v1, v2, v3) + " should be false");
	}

	boundsIslands(faces: Face[]) {
		let minx = faces[0].uv[0].x;
		let maxx = minx;
		let miny = faces[0].uv[0].y;
		let maxy = miny;

		for (let i = 0; i < faces.length; i++) {
			let f = faces[i];
			for (let j = 0; j < f.uv.length; j++) {
				let uv = f.uv[j];
				let x = uv.x;
				let y = uv.y;
				if (x < minx) {
					minx = x;
				}
				if (y < miny) {
					miny = y;
				}
				if (x > maxx) {
					maxx = x;
				}
				if (y > maxy) {
					maxy = y;
				}
			}
		}

		return [minx, miny, maxx, maxy];
	}

	island2Edge(island: Island) {
		let edges: Map<string, MeasuredEdge> = new Map();
		let unique_points_map: Map<string, Vector2> = new Map();
		let i1, i2;

		for (let i = 0; i < island.length; i++) {
			let f = island[i];
			let f_uvkey = f.uv;

			let l = f_uvkey.length;
			for (let vIdx = 0; vIdx < l; vIdx++) {
				unique_points_map.set(f_uvkey[vIdx].x + "_" + f_uvkey[vIdx].y, f.uv[vIdx]);

				if (f.v[vIdx].index > f.v[(vIdx - 1 + l) % l].index) {
					i1 = (vIdx - 1 + l) % l;
					i2 = vIdx;
				} else {
					i1 = vIdx;
					i2 = (vIdx - 1 + l) % l;
				}

				let key = f_uvkey[i1].x + "_" + f_uvkey[i1].y + "_" + f_uvkey[i2].x + "_" + f_uvkey[i2].y;

				if (typeof(edges.get(key)) === "undefined") {
					edges.set(key, {
						l: f.uv[i2].subtract(f.uv[i1]).length(),
						e: {
							v0: f.uv[i1],
							v1: f.uv[i2]
						}
					});
				} else {
					edges.set(key, {
						l: 0,
						e: null
					});
				}
			}
		}

		let length_sorted_edges: MeasuredEdge[] = [];

		let keys = edges.keys();
		let k = keys.next();
		while (!k.done) {
			let o = edges.get(k.value) as MeasuredEdge;

			let i = 0;
			while (i < length_sorted_edges.length && length_sorted_edges[i].l > o.l) {
				i++;
			}
			length_sorted_edges.splice(i, 0, o);
			k = keys.next();
		}

		let unique_points = [];
		let values = unique_points_map.values();
		let iter = values.next();
		while (!iter.done) {
			unique_points.push(this.toV3(iter.value));
			iter = values.next();
		}

		return {
			length_sorted_edges,
			unique_points
		}
	}

	pointInIsland(pt: Vector3, island: Island) : boolean {
		let vec1 = new Vector3();
		let vec2 = new Vector3();
		let vec3 = new Vector3();

		for (let i = 0; i < island.length; i++) {
			let f = island[i];

			// Why this copy ? could be optimised
			vec1.copyFromFloats(f.uv[0].x, f.uv[0].y, 0);
			vec2.copyFromFloats(f.uv[1].x, f.uv[1].y, 0);
			vec3.copyFromFloats(f.uv[2].x, f.uv[2].y, 0);

			if (this.pointInTri2D(pt, vec1, vec2, vec3)) {
				return true;
			}
		}

		return false;
	}

	// box is (left,bottom, right, top)
	islandIntersectUvIsland(source: IslandInfo, target: IslandInfo, SourceOffset: Vector2) : number {
		let edgeLoopsSource = source[6] as MeasuredEdge[];
		let edgeLoopsTarget = target[6] as MeasuredEdge[];

		for (let i = 0; i < edgeLoopsSource.length; i++) {
			let ed = edgeLoopsSource[i];
			if (!ed.e) {
				continue;
			}
			for (let j = 0; j < edgeLoopsTarget.length; j++) {
				let seg = edgeLoopsTarget[j];
				if (!seg.e) {
					continue;
				}
				let inter = intersect_line_line_2d((<Edge>seg.e).v0,
					(<Edge>seg.e).v1,
					SourceOffset.add((<Edge>ed.e).v0),
					SourceOffset.add((<Edge>ed.e).v1));

				if (inter) {
					return 1; // LINE INTERSECTION
				}
			}
		}

		// 1 test for source being totally inside target
		let SourceOffsetV3 = this.toV3(SourceOffset);
		for (let i = 0; i < source[7].length; i++) {
			let pv = source[7][i];
			if (this.pointInIsland(pv.add(SourceOffsetV3), target[0])) {
				return 2; // SOURCE INSIDE TARGET
			}
		}

		// 2 test for a part of the target being totally inside the source.
		for (let i = 0; i < target[7].length; i++) {
			let pv = target[7][i];
			if (this.pointInIsland(pv.subtract(SourceOffsetV3), source[0])) {
				return 3; // PART OF TARGET INSIDE SOURCE.
			}
		}

		return 0; // NO INTERSECTION
	}

	rotate_uvs(uv_points: Vector2[], angle: number) {
		// Unefficient v2 -> v3
		if (angle !== 0) {
			let mat = Matrix.RotationZ(angle);
			for (let i = 0; i < uv_points.length; i++) {
				let vec = this.toV3(uv_points[i]);
				let res = Vector3.TransformCoordinates(vec, mat);
				uv_points[i].copyFromFloats(res.x, res.y);
			}
		}
	}

	convexhull_2d(points: Vector2[]) : Vector2[] {
		if (points.length < 3) {
			return [];
		}

		points.sort((a: Vector2, b: Vector2) => a.x === b.x ? a.y - b.y : a.x - b.x);

		let lower: Vector2[] = [];

		for (let i = 0; i < points.length; i++) {
		   while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
		      lower.pop();
		   }
		   lower.push(points[i]);
		}
		let upper: Vector2[] = [];

		for (let i = points.length - 1; i >= 0; i--) {
		   while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
		      upper.pop();
		   }
		   upper.push(points[i]);
		}

		upper.pop();
		lower.pop();

		return lower.concat(upper);
	}

	fit_aabb_2d(hull: Vector2[]) {
		let area_best = +Infinity;
		let area = +Infinity;
		let dvec_best = new Vector2();
		let dvec = new Vector2();
		let min = new Vector2(+Infinity, +Infinity);
		let max = new Vector2(-Infinity, -Infinity);
		let minBest = new Vector2(+Infinity, +Infinity);
		let maxBest = new Vector2(-Infinity, -Infinity);
		let n = hull.length;

		let i_prev = n - 1;

		let ev_a, ev_b;
		for (let i = 0; i < n; i++) {
			ev_a = hull[i];
			ev_b = hull[i_prev];

			dvec.copyFrom(ev_a).subtractInPlace(ev_b);

			dvec.normalize();

			if (dvec.x > 1e-6) {
				min.copyFromFloats(+Infinity, +Infinity);
				max.copyFromFloats(-Infinity, -Infinity);


				for (let j = 0; j < n; j++) {
					let tvec = mul_v2_v2_cw(dvec, hull[j]);

					min.x = Math.min(min.x, tvec.x);
					min.y = Math.min(min.y, tvec.y);

					max.x = Math.max(max.x, tvec.x);
					max.y = Math.max(max.y, tvec.y);

					area = (max.x - min.x) * (max.y - min.y);

					if (area > area_best) {
						break;
					}
				}

				if (area < area_best) {
					area_best = area;
					dvec_best.copyFrom(dvec);
					minBest.copyFrom(min);
					maxBest.copyFrom(max);
				}
			}

			i_prev = i;
		}

		let angle = (area_best !== +Infinity) ? Math.atan2(dvec_best.y, dvec_best.x) : 0;

		return {
			angle,
			min: minBest,
			max: maxBest
		}
	}

	boxFit2D(points: Vector2[]) {
		let hull = this.convexhull_2d(points);
		let { angle } = this.fit_aabb_2d(hull);

		return angle;
	}

	debugFitAABB() {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		document.body.appendChild(canvas);
		canvas.width = 300;
		canvas.height = 300;
		canvas.style.position = "absolute";
		canvas.style.zIndex = "10";
		canvas.style.top = "0px";
		canvas.style.left = "0px";

		ctx.clearRect(0, 0, 300, 300);
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, 300, 300);
		ctx.fillStyle = "red";
		ctx.translate(150, 150);

		let points0 = [
			// new Vector2(0, 0),
			// new Vector2(25, 25),
			// new Vector2(-50, -35),
			// new Vector2(125, 32),
			// new Vector2(-85, 82),
			// new Vector2(0, 100),
		];

		for (let i = 0; i < 16; i++) {
			points0.push(new Vector2(Math.random() * 200 - 100, Math.random() * 200 - 100));
		}

		// Draw points
		for (let i = 0; i < points0.length; i++) {
			ctx.moveTo(points0[i].x, points0[i].y);
			ctx.arc(points0[i].x, points0[i].y, 3, 0, 2 * Math.PI);
			ctx.fill();
		}

		let hull = this.convexhull_2d(points0);
		let { angle, min, max } = this.fit_aabb_2d(hull);
		let rotation = new Vector2(Math.cos(angle), Math.sin(angle));

		ctx.strokeStyle = "green";
		ctx.beginPath();
		ctx.moveTo(hull[0].x, hull[0].y);
		for (let i = 1; i < hull.length; i++) {
			ctx.lineTo(hull[i].x, hull[i].y);
		}
		ctx.lineTo(hull[0].x, hull[0].y);

		ctx.stroke();

		ctx.strokeStyle = "blue";

		let tl = new Vector2(min.x, min.y);
		let bl = new Vector2(min.x, max.y);
		let br = new Vector2(max.x, max.y);
		let tr = new Vector2(max.x, min.y);
		let base = new Vector2(0, 0);
		let tip = new Vector2(50, 0);

		tip = mul_v2_v2_cw(rotation, tip); //.addInPlace(offset);
		tl = mul_v2_v2_cw(rotation, tl); //.addInPlace(offset);
		bl = mul_v2_v2_cw(rotation, bl); //.addInPlace(offset);
		br = mul_v2_v2_cw(rotation, br); //.addInPlace(offset);
		tr = mul_v2_v2_cw(rotation, tr); //.addInPlace(offset);

		ctx.beginPath();
		ctx.moveTo(tip.x, tip.y);
		ctx.lineTo(base.x, base.y);
		ctx.stroke();

		ctx.moveTo(tl.x, tl.y);
		ctx.lineTo(bl.x, bl.y);
		ctx.lineTo(br.x, br.y);
		ctx.lineTo(tr.x, tr.y);
		ctx.lineTo(tl.x, tl.y);
		ctx.stroke();
	}

	debugUvs(uvs: FloatArray, indices: IndicesArray) {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

		document.body.appendChild(canvas);
		canvas.width = 300;
		canvas.height = 300;
		canvas.style.position = "absolute";
		canvas.style.zIndex = "10";
		canvas.style.top = "0px";
		canvas.style.left = "0px";

		ctx.clearRect(0, 0, 300, 300);
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, 300, 300);
		ctx.fillStyle = "red";
		ctx.scale(300, 300);

		let points0 = [
			// new Vector2(0, 0),
			// new Vector2(25, 25),
			// new Vector2(-50, -35),
			// new Vector2(125, 32),
			// new Vector2(-85, 82),
			// new Vector2(0, 100),
		];

		for (let i = 0; i < 16; i++) {
			points0.push(new Vector2(Math.random(), Math.random()));
		}

		// Draw points
		ctx.lineWidth = 0.001
		// for (let i = 0; i < points0.length; i++) {
		// 	ctx.moveTo(points0[i].x, points0[i].y);
		// 	ctx.arc(points0[i].x, points0[i].y, 0.01, 0, 2 * Math.PI);
		// 	ctx.fill();
		// }

		ctx.strokeStyle = "green";
		for (let i = 0; i < indices.length; i += 3) {
			ctx.beginPath();
			ctx.moveTo(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
			ctx.lineTo(uvs[indices[i + 1] * 2], uvs[indices[i + 1] * 2 + 1]);
			ctx.lineTo(uvs[indices[i + 2] * 2], uvs[indices[i + 2] * 2 + 1]);
			ctx.lineTo(uvs[indices[i] * 2], uvs[indices[i] * 2 + 1]);
			ctx.stroke();
			// ctx.fill();
		}
	}

	optiRotateUvIsland(faces: Face[]) {
		let uv_points: Vector2[] = [];
		for (let i = 0; i < faces.length; i++) {
			for (let j = 0; j < faces[i].uv.length; j++) {
				uv_points.push(faces[i].uv[j]);
			}
		}

		let angle = this.boxFit2D(uv_points);

		if (angle !== 0) {
			this.rotate_uvs(uv_points, angle);
		}

		let [minx, miny, maxx, maxy] = this.boundsIslands(faces);
		let w = maxx - minx;
		let h = maxy - miny;

		if (h + 1e-5 < w) {
			angle = Math.PI / 2;
			this.rotate_uvs(uv_points, angle);
		}
	}

	mergeUvIslands(islandList: Island[]) {
		let decoratedIslandList: IslandInfo[] = [];

		let islandIdx = islandList.length;

		while (islandIdx) {
			islandIdx--;
			let [minx, miny, maxx, maxy] = this.boundsIslands(islandList[islandIdx]);
			let w = maxx - minx;
			let h = maxy - miny;

			let totFaceArea = 0;
			let offset = new Vector2(minx, miny);
			for (let i = 0; i < islandList[islandIdx].length; i++) {
				for (let j = 0; j < islandList[islandIdx][i].uv.length; j++) {
					islandList[islandIdx][i].uv[j].subtractInPlace(offset);
				}

				totFaceArea += islandList[islandIdx][i].area;
			}

			let islandBoundsArea = w * h;
			let efficiency = Math.abs(islandBoundsArea - totFaceArea);

			// UV Edge list used for intersections as well as unique points.
			let o = this.island2Edge(islandList[islandIdx]);
			let edges = o.length_sorted_edges;
			let uniqueEdgePoints = o.unique_points;

			decoratedIslandList.push([islandList[islandIdx], totFaceArea, efficiency, islandBoundsArea, w, h, edges, uniqueEdgePoints]);
		}

		// Sort by island bounding box area, smallest face area first.
		// no.. chance that to most simple edge loop first.

		let decoratedIslandListAreaSort = decoratedIslandList.slice();
		decoratedIslandListAreaSort.sort((a, b) => a[3] - b[3]);

		let decoratedIslandListEfficSort = decoratedIslandList.slice();
		decoratedIslandListEfficSort.sort((a, b) => b[2] - a[2]);

		const USER_STEP_QUALITY = ((USER_FILL_HOLES_QUALITY - 1) / 25) + 1;
		const USER_FREE_SPACE_TO_TEST_QUALITY = 1 + (((100 - USER_FILL_HOLES_QUALITY) / 100.0) * 5);

		// let removedCount = 0;
		let areaIslandIdx = 0;
		let BREAK = false;

		while (areaIslandIdx < decoratedIslandListAreaSort.length && !BREAK) {
			let sourceIsland = decoratedIslandListAreaSort[areaIslandIdx];

			if (!sourceIsland[0]) {
				areaIslandIdx++;
			} else {
				let efficIslandIdx = 0;
				while (efficIslandIdx < decoratedIslandListEfficSort.length && !BREAK) {
					let targetIsland = decoratedIslandListEfficSort[efficIslandIdx];

					if (sourceIsland[0] === targetIsland[0] || !targetIsland[0] || !sourceIsland[0]) {
						// pass
					} else {
	                    // ([island, totFaceArea, efficiency, islandArea, w,h])
	                    // Wasted space on target is greater then UV bounding island area.

	                    if (targetIsland[2] > (sourceIsland[1] * USER_FREE_SPACE_TO_TEST_QUALITY) &&
	                    	targetIsland[4] > sourceIsland[4] &&
	                    	targetIsland[5] > sourceIsland[5]) {
	                    	let blockTestXUnit = targetIsland[4] / sourceIsland[4];
	                    	let blockTestYUnit = targetIsland[5] / sourceIsland[5];

	                    	let boxLeft = 0;

	                    	let testWidth = targetIsland[4] - sourceIsland[4];
	                    	let testHeight = targetIsland[5] - sourceIsland[5];

	                    	let xIncrement = testWidth / (blockTestXUnit * ((USER_STEP_QUALITY / 50) + 0.1));
	                    	let yIncrement = testHeight / (blockTestYUnit * ((USER_STEP_QUALITY / 50) + 0.1));

	                    	// Make sure were not moving less then a 3rg of our width/height
	                    	if (xIncrement < sourceIsland[4] / 3) {
	                    		xIncrement = sourceIsland[4];
	                    	}
	                    	if (yIncrement < sourceIsland[5] / 3) {
	                    		yIncrement = sourceIsland[5]
	                    	}

	                    	boxLeft = 0;
	                    	let boxBottom = 0;

	                    	while (boxBottom < testHeight) {
	                    		let Intersect = this.islandIntersectUvIsland(sourceIsland, targetIsland, new Vector2(boxLeft, boxBottom));
	                    		if (Intersect === 1) {
	                    			// pass
	                    		}
	                    		if (Intersect === 2) {
	                    			boxLeft += sourceIsland[4];
	                    		}
	                    		else if (Intersect === 0) {
	                    			// removedCount++;

	                    			targetIsland[0] = targetIsland[0].concat(sourceIsland[0]);
	                    			let offset = new Vector2(boxLeft, boxBottom);

	                    			for (let faceIdx = 0; faceIdx < sourceIsland[0].length; faceIdx++) {
	                    				for (let uvIdx = 0; uvIdx < sourceIsland[0][faceIdx].uv.length; uvIdx++) {
	                    					sourceIsland[0][faceIdx].uv[uvIdx] += offset;
	                    				}
	                    			}

	                    			sourceIsland[0].length = 0;
	                    			sourceIsland[0] = null;

	                    			for (let k = 0; k < sourceIsland[6].length; k++) {
	                    				let e = sourceIsland[6][k] as MeasuredEdge;
	                    				if (!e.e) {
	                    					continue;
	                    				}
	                    				targetIsland[6].push(<MeasuredEdge>{
	                    					e: {
	                    						v0: (<Edge>e.e).v0.add(offset), 
	                    						v1: (<Edge>e.e).v1.add(offset)
	                    						}, 
	                    					l: e.l
	                    				})
	                    			}

	                    			sourceIsland[6].length = 0;
	                    			sourceIsland[6] = null;

	                    			// Sort by edge length, reverse so biggest are first.
	                    			targetIsland[6].sort((a: MeasuredEdge, b: MeasuredEdge) => b.l - a.l);

	                    			targetIsland[7] = targetIsland[7].concat(sourceIsland[7]);
	                    			let offsetV3 = new Vector3(boxLeft, boxBottom, 0);

	                    			for (let k = 0; k < sourceIsland[7].length; k++) {
	                    				sourceIsland[7][k].addInPlace(offsetV3);
	                    			}

	                    			sourceIsland[7].length = 0;
	                    			sourceIsland[7] = null;

	                    			targetIsland[1] += sourceIsland[1];
	                    			targetIsland[2] -= sourceIsland[1];

	                    			sourceIsland[2] = 0;

	                    			break;
	                    		}

	                    		if (boxLeft > testWidth) {
	                    			boxBottom += yIncrement;
	                    			boxLeft = 0;
	                    		} else {
	                    			boxLeft += xIncrement;
	                    		}
	                    	}
	                    }
					}
					efficIslandIdx++;
				}
			}

			areaIslandIdx++;
		}

		let i = islandList.length;

		while (i) {
			i--;
			if (!islandList[i] || !islandList[i].length) {
				islandList.splice(i, 1);
			}
		}
	}

	getUvIslands(faceGroups: Face[][]) {
		let islandList: Island[] = [];

		let faceGroupIdx = faceGroups.length;

		while (faceGroupIdx) {
			faceGroupIdx--;
			let faces = faceGroups[faceGroupIdx];

			if (!faces) {
				continue;
			}

			let edge_users: {[key:string] : number[]} = {};

			for (let i = 0; i < faces.length; i++) {
				let f = faces[i];

				for (let j = 0; j < f.edge_keys.length; j++) {
					let ed_key = f.edge_keys[j];
					edge_users[ed_key] = edge_users[ed_key] || [];
					edge_users[ed_key].push(i);
				}
			}

			let face_modes = new Uint8Array(faces.length);
			face_modes[0] = 1;

			let newIsland: Island = [];
			newIsland.push(faces[0]);

			let ok = true;

			// Build connexity groups
			while (ok) {
				ok = true;
				while (ok) {
					ok = false;
					for (let i = 0; i < faces.length; i++) {
						if (face_modes[i] === 1) {
							for (let j = 0; j < faces[i].edge_keys.length; j++) {
								let ed_key = faces[i].edge_keys[j];
								for (let k = 0; k < edge_users[ed_key].length; k++) {
									let ii = edge_users[ed_key][k];

									if (i !== ii && face_modes[ii] === 0) {
										face_modes[ii] = 1;
										ok = true;
										newIsland.push(faces[ii]);
									}
								}
							}
							face_modes[i] = 2;
						}
					}
				}

				islandList.push(newIsland);

				ok = false;

				for (let i = 0; i < faces.length; i++) {
					if (face_modes[i] === 0) {
						newIsland = [];
						newIsland.push(faces[i]);

						face_modes[i] = 1;
						ok = true;
						break;
					}
				}
			}
		}

		for (let i = 0; i < islandList.length; i++) {
			this.optiRotateUvIsland(islandList[i]);
		}

		return islandList;
	}

	main(obList: Mesh[],
		island_margin: number = 0, 
		projection_limit: number = 25,
		user_area_weight: number = 0,
		use_aspect: boolean = false,
		strech_to_bounds: boolean = false) {
		const USER_PROJECTION_LIMIT_CONVERTED = Math.cos(projection_limit * Math.PI / 180);
		const USER_PROJECTION_LIMIT_HALF_CONVERTED = Math.cos(projection_limit / 2 * Math.PI / 180);
		const USER_SHARE_SPACE = true;

		let collected_islandList: Island[] = [];
		if (USER_SHARE_SPACE) {
			// Sort by name so we get consistent results
			obList.sort((a: Mesh, b: Mesh) => a.name.localeCompare(b.name));
		}

		for (let i = 0; i < obList.length; i++) {
			let meshFaces: Face[] = [];
			let m = obList[i];
			let indices = m.getIndices() as IndicesArray;
			let vertices = m.getVerticesData(VertexBuffer.PositionKind) as FloatArray;
			let matrix = m.getWorldMatrix();
			for (let j = 0; j < indices.length; j+= 3) {
				meshFaces.push(new Face(j, indices, vertices, i, matrix));
			}

			meshFaces.sort((a, b) => b.area - a.area);

			while (meshFaces.length && meshFaces[meshFaces.length - 1].area <= SMALL_NUM) {
				for (let j = 0; j < meshFaces[meshFaces.length-1].uv.length; j++) {
					let uv = meshFaces[meshFaces.length-1].uv[j];
					uv.copyFromFloats(0, 0);
				}
				meshFaces.pop();
			}

			if (!meshFaces.length) {
				continue;
			}

			let projectVecs: Vector3[] = [];
			let newProjectVec: Vector3 = meshFaces[0].no;
			let newProjectMeshFaces: Face[] = [];

			let mostUniqueAngle: number = -1;
			let mostUniqueIndex: number;

			let tempMeshFaces = meshFaces.slice();

			// This while only gathers projection vecs, faces are assigned later on.
			while (true) {
				for (let fIdx = tempMeshFaces.length - 1; fIdx >= 0; fIdx--) {
					if (Vector3.Dot(newProjectVec, tempMeshFaces[fIdx].no) > USER_PROJECTION_LIMIT_HALF_CONVERTED) {
						newProjectMeshFaces.push(tempMeshFaces.splice(fIdx, 1)[0]);
					}
				}

				let averageVec = new Vector3(0, 0, 0);
				if (user_area_weight === 0) {
					for (let j = 0; j < newProjectMeshFaces.length; j++) {
						averageVec.addInPlace(newProjectMeshFaces[j].no);
					}
				} else if (user_area_weight === 1) {
					for (let j = 0; j < newProjectMeshFaces.length; j++) {
						averageVec.addInPlace(newProjectMeshFaces[j].no.scale(newProjectMeshFaces[j].area));
					}
				} else {
					for (let j = 0; j < newProjectMeshFaces.length; j++) {
						averageVec.addInPlace(
							newProjectMeshFaces[j].no.scale(
								newProjectMeshFaces[j].area * user_area_weight + (1 - user_area_weight)));
					}
				}

				if (averageVec.x !== 0 || averageVec.y !== 0 || averageVec.z !== 0) {
					// avoid NAN
					projectVecs.push(averageVec.normalize());
				}

				mostUniqueAngle = 1;
				mostUniqueIndex = 0;

				for (let fIdx = tempMeshFaces.length - 1; fIdx >= 0; fIdx--) {
					let angleDifference = -1; // 180° difference

					// Get the closest vec angle we are to.
					for (let j = 0; j < projectVecs.length; j++) {
						let p = projectVecs[j];
						let temp_angle_diff = Vector3.Dot(p, tempMeshFaces[fIdx].no);

						if (angleDifference < temp_angle_diff) {
							angleDifference = temp_angle_diff;
						}
					}

					if (angleDifference < mostUniqueAngle) {
						// We have a new most different angle
						mostUniqueIndex = fIdx;
						mostUniqueAngle = angleDifference;
					}
				}

				if (mostUniqueAngle < USER_PROJECTION_LIMIT_CONVERTED) {
					newProjectVec = tempMeshFaces[mostUniqueIndex].no;
					newProjectMeshFaces = tempMeshFaces.splice(mostUniqueIndex, 1);
				} else {
					if (projectVecs.length) {
						break;
					}
				}
			}

			if (!projectVecs.length) {
				// Error
				console.log("error, no projection vecs where generated, 0 area faces can cause this.");
			}

			let faceProjectionGroupList: Face[][] = [];
			for (let i = 0; i < projectVecs.length; i++) {
				faceProjectionGroupList.push([]);
			}

			for (let fIdx = meshFaces.length - 1; fIdx >= 0; fIdx--) {
				let fvec = meshFaces[fIdx].no;
				let i = projectVecs.length;

				let bestAng = Vector3.Dot(fvec, projectVecs[0]);
				let bestAngIdx = 0;

				while (i - 1) {
					i--;

					let newAng = Vector3.Dot(fvec, projectVecs[i]);
					if (newAng > bestAng) {
						bestAng = newAng;
						bestAngIdx = i;
					}
				}

				faceProjectionGroupList[bestAngIdx].push(meshFaces[fIdx]);
			}

			for (let i = 0; i < projectVecs.length; i++) {
				if (!faceProjectionGroupList[i].length) {
					continue;
				}

				let mat = projectMat(projectVecs[i]);

				for (let j = 0; j < faceProjectionGroupList[i].length; j++) {
					let f = faceProjectionGroupList[i][j];
					for (let k = 0; k < f.uv.length; k++) {
						let proj = Vector3.TransformCoordinates(f.v[k].v, mat);
						f.uv[k].copyFromFloats(proj.x, proj.y);
					}
				}
			}

			if (USER_SHARE_SPACE) {
				let islandList = this.getUvIslands(faceProjectionGroupList);
				collected_islandList = collected_islandList.concat(islandList);
			} else {
				collected_islandList = this.getUvIslands(faceProjectionGroupList);
				this.packIslands(collected_islandList);
			}
		}

		if (USER_SHARE_SPACE) {
			this.packIslands(collected_islandList);
		}

		// Aspect TODO... not necessary

		let newUvs: FloatArray[] = [];
		let indices: IndicesArray[] = [];
		let vertices: FloatArray[] = [];
		let additionnalUvs : Vector2[][] = [];
		let additionnalVertices : Vector3[][] = [];

		for (let i = 0; i < obList.length; i++) {
			newUvs.push(new Float32Array(obList[i].getTotalVertices() * 2));
			// Init to -1
			for (let j = 0; j < newUvs[newUvs.length - 1].length; j++) {
				newUvs[newUvs.length-1][j] = -1;
			}
			indices.push(<IndicesArray>obList[i].getIndices());
			vertices.push(<FloatArray>obList[i].getVerticesData(VertexBuffer.PositionKind));
			additionnalUvs.push([]);
			additionnalVertices.push([]);
		}

		// TODO : normals
		// let additionnalNormals = [];

		for (let i = 0; i < collected_islandList.length; i++) {
			for (let j = 0; j < collected_islandList[i].length; j++) {
				let f = collected_islandList[i][j];
				for (let k = 0; k < 3; k++) {
					if (newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2] === -1) {
						// this vertex doesn't have uv yet, we assign them
						newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2] = f.uv[k].x
						newUvs[f.meshIndex][indices[f.meshIndex][(f.index + k)] * 2 + 1] = f.uv[k].y						
					} else {
						// This vertex already has uvs, we create a seam

						// Search existing created vertices 
						let newUv = new Vector2(f.uv[k].x, f.uv[k].y);
						let newPosition = new Vector3(f.v[k].v.x, f.v[k].v.y, f.v[k].v.z);
						let index = -1;
						for (let h = 0; h < additionnalUvs[f.meshIndex].length; h++) {
							if (additionnalUvs[f.meshIndex][h].equals(newUv) && 
								additionnalVertices[f.meshIndex][h].equals(newPosition)) {
								index = h;
								break;
							}
						}

						if (index === -1) {
							// could not find one, we add to the list
							additionnalUvs[f.meshIndex].push(newUv);
							additionnalVertices[f.meshIndex].push(newPosition);
							index = additionnalUvs[f.meshIndex].length - 1;
						}

						indices[f.meshIndex][f.index + k] = index + vertices[f.meshIndex].length / 3;
					}
				}
			}
		}

		// Adding created vertices to the list
		for (let meshIndex = 0; meshIndex < additionnalUvs.length; meshIndex++) {
			if (additionnalUvs[meshIndex].length) {
				let oldVertices = vertices[meshIndex] as Float32Array;
				let tempUvs = new Float32Array(newUvs[meshIndex].length + additionnalUvs[meshIndex].length * 2);
				let tempVertices = new Float32Array(vertices.length + additionnalUvs[meshIndex].length * 3);

				let l = newUvs[meshIndex].length;
				for (let i = 0; i < l; i++) {
					tempUvs[i] = newUvs[meshIndex][i];
				}

				for (let i = 0; i < additionnalUvs[meshIndex].length; i++) {
					tempUvs[i * 2 + l] = additionnalUvs[meshIndex][i].x;
					tempUvs[i * 2 + 1 + l] = additionnalUvs[meshIndex][i].y;
				}

				l = vertices.length;
				for (let i = 0; i < l; i++) {
					tempVertices[i] = oldVertices[i];
				}

				for (let i = 0; i < additionnalVertices[meshIndex].length; i++) {
					tempVertices[i * 3 + l] = additionnalVertices[meshIndex][i].x;
					tempVertices[i * 3 + 1 + l] = additionnalVertices[meshIndex][i].y;
					tempVertices[i * 3 + 2 + l] = additionnalVertices[meshIndex][i].z;
				}

				newUvs[meshIndex] = tempUvs;
			}
		}

		this.debugUvs(newUvs[0], indices[0]);
	}

	packIslands(islandList: Island[]) {
		if (USER_FILL_HOLES) {
			this.mergeUvIslands(islandList);
		}

		let packBoxes = [];
		let islandOffsetList = [];
		let islandIdx = 0;

		while(islandIdx < islandList.length) {
			let [minx, miny, maxx, maxy] = this.boundsIslands(islandList[islandIdx]);

			let w = maxx - minx;
			let h = maxy - miny;

			if (USER_ISLAND_MARGIN) {
				minx -= USER_ISLAND_MARGIN * w / 2;
				miny -= USER_ISLAND_MARGIN * h / 2;
				maxx += USER_ISLAND_MARGIN * w / 2;
				maxy += USER_ISLAND_MARGIN * h / 2;

				w = maxx - minx;
				h = maxy - miny;
			}

			if (w < SMALL_NUM) {
				w = SMALL_NUM;
			}
			if (h < SMALL_NUM) {
				h = SMALL_NUM;
			}

			islandOffsetList.push(new Vector2(minx, miny));

			packBoxes.push({
				x: 0, 
				y: 0, 
				w, 
				h,
				islandIdx: islandIdx
			});
			islandIdx++;
		}

		let packDimension = BoxPacker.Box_pack_2d(packBoxes);

		islandIdx = islandList.length;
		let xFactor = 1, yFactor = 1;

		if (islandIdx) {
			xFactor = 1.0 / Math.max(packDimension.w, packDimension.h);
			yFactor = xFactor;
		}

		for (let boxIdx = 0; boxIdx < packBoxes.length; boxIdx++) {
			let box = packBoxes[boxIdx];
			let islandIdx = box.islandIdx;

			let xOffset = box.x - islandOffsetList[islandIdx].x;
			let yOffset = box.y - islandOffsetList[islandIdx].y;

			for (let i = 0; i < islandList[islandIdx].length; i++) {
				let f = islandList[islandIdx][i];
				for (let j = 0; j < f.uv.length; j++) {
					let uv = f.uv[j];
					uv.x = (uv.x + xOffset) * xFactor;
					uv.y = (uv.y + yOffset) * yFactor;
				}
			}

			console.log(packBoxes[islandIdx]);
			console.log(this.boundsIslands(islandList[islandIdx]));
		}
	}

	constructor(scene: Scene) {
		// this.debPointInTri2D();
		// this.debugFitAABB();
		let sphere = MeshBuilder.CreateSphere("aa", { diameter: 1, segments: 10 }, scene);
		this.main([sphere]);
	}
}

declare interface Box {
	x: number,
	y: number,
	w: number,
	h: number,
	islandIdx?: number
}

class BoxPacker {

	public static Box_pack_2d(boxes: Box[]) {
	    // calculate total box area and maximum box width
	    let area = 0;
	    let maxWidth = 0;

	    for (const box of boxes) {
	        area += box.w * box.h;
	        maxWidth = Math.max(maxWidth, box.w);
	    }

	    // sort the boxes for insertion by height, descending
	    boxes.sort((a, b) => b.h - a.h);

	    // aim for a squarish resulting container,
	    // slightly adjusted for sub-100% space utilization
	    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

	    // start with a single empty space, unbounded at the bottom
	    const spaces : Box[] = [{x: 0, y: 0, w: startWidth, h: Infinity}];

	    let width = 0;
	    let height = 0;

	    for (const box of boxes) {
	        // look through spaces backwards so that we check smaller spaces first
	        for (let i = spaces.length - 1; i >= 0; i--) {
	            const space = spaces[i];

	            // look for empty spaces that can accommodate the current box
	            if (box.w > space.w || box.h > space.h) continue;

	            // found the space; add the box to its top-left corner
	            // |-------|-------|
	            // |  box  |       |
	            // |_______|       |
	            // |         space |
	            // |_______________|
	            box.x = space.x;
	            box.y = space.y;

	            height = Math.max(height, box.y + box.h);
	            width = Math.max(width, box.x + box.w);

	            if (box.w === space.w && box.h === space.h) {
	                // space matches the box exactly; remove it
	                const last = spaces.pop();
	                if (i < spaces.length) spaces[i] = last as Box;

	            } else if (box.h === space.h) {
	                // space matches the box height; update it accordingly
	                // |-------|---------------|
	                // |  box  | updated space |
	                // |_______|_______________|
	                space.x += box.w;
	                space.w -= box.w;

	            } else if (box.w === space.w) {
	                // space matches the box width; update it accordingly
	                // |---------------|
	                // |      box      |
	                // |_______________|
	                // | updated space |
	                // |_______________|
	                space.y += box.h;
	                space.h -= box.h;

	            } else {
	                // otherwise the box splits the space into two spaces
	                // |-------|-----------|
	                // |  box  | new space |
	                // |_______|___________|
	                // | updated space     |
	                // |___________________|
	                spaces.push({
	                    x: space.x + box.w,
	                    y: space.y,
	                    w: space.w - box.w,
	                    h: box.h
	                });
	                space.y += box.h;
	                space.h -= box.h;
	            }
	            break;
	        }
	    }

	    return {
	        w: width, // container width
	        h: height, // container height
	        fill: (area / (width * height)) || 0 // space utilization
	    };
	}
}