
import { AbstractMesh } from "./abstractMesh";
import { Mesh } from "./mesh";
import { Material } from "../Materials/material";
import { VertexBuffer } from "./buffer";
import { VertexData } from "./mesh.vertexData";
import { Vector3 } from "../Maths/math";
import { Scene } from "../scene";

/**
 * Class used to create a trail following a mesh
 */
export class TrailMesh extends Mesh {
	private _generator: AbstractMesh;
	private _diameter: number;
	private _length: number;
	private _sectionPolygonPointsCount: number = 4;
	private _sectionVectors: Array<Vector3>;
	private _sectionNormalVectors: Array<Vector3>;

    /**
     * @constructor
     * @param name The value used by scene.getMeshByName() to do a lookup.
     * @param generator The mesh to generate a trail.
     * @param scene The scene to add this mesh to.
     * @param diameter Diameter of trailing mesh. Default is 1.
     * @param length Length of trailing mesh. Default is 60.
     * @param material Material to apply to trailing mesh. Defaults to scene default.
     */
	constructor(name: string, generator: AbstractMesh, scene: Scene, diameter: number = 1, length: number = 60, material: Material) {
		super(name, scene);
		scene = this.getScene();

		this.layerMask = 2;
		this._generator = generator;
		this._diameter = diameter;
		this._length = length;
		this._sectionVectors = [];
		this._sectionNormalVectors = [];
		for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
			this._sectionVectors[i] = Vector3.Zero();
			this._sectionNormalVectors[i] = Vector3.Zero();
		}
		if (material instanceof Material) {
			this.material = material;
		} else {
			this.material = scene.defaultMaterial;
		}
		this._createMesh();
	}

	private _createMesh(): void {
		let data: VertexData = new VertexData();
		let positions: Array<number> = [];
		let normals: Array<number> = [];
		let indices: Array<number> = [];

		let alpha: number = 2 * Math.PI / this._sectionPolygonPointsCount;
		for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
			positions.push(
				Math.cos(i * alpha) * this._diameter,
				Math.sin(i * alpha) * this._diameter,
				-this._length
			);
			normals.push(
				Math.cos(i * alpha),
				Math.sin(i * alpha),
				0
			);
		}
		for (let i: number = 1; i <= this._length; i++) {
			for (let j: number = 0; j < this._sectionPolygonPointsCount; j++) {
				positions.push(
					Math.cos(j * alpha) * this._diameter,
					Math.sin(j * alpha) * this._diameter,
					-this._length + i
				);
				normals.push(
					Math.cos(j * alpha),
					Math.sin(j * alpha),
					0
				);
			}
			let l: number = positions.length / 3 - 2 * this._sectionPolygonPointsCount;
			for (let j: number = 0; j < this._sectionPolygonPointsCount - 1; j++) {
				indices.push(
					l + j,
					l + j + this._sectionPolygonPointsCount,
					l + j + this._sectionPolygonPointsCount + 1,
				);
				indices.push(
					l + j,
					l + j + this._sectionPolygonPointsCount + 1,
					l + j + 1
				);
			}
			indices.push(
				l + this._sectionPolygonPointsCount - 1,
				l + this._sectionPolygonPointsCount - 1 + this._sectionPolygonPointsCount,
				l + this._sectionPolygonPointsCount,
			);
			indices.push(
				l + this._sectionPolygonPointsCount - 1,
				l + this._sectionPolygonPointsCount,
				l
			);
		}

		data.positions = positions;
		data.normals = normals;
		data.indices = indices;
		data.applyToMesh(this, true);
	}

    /**
     * Update trailing mesh geometry.
     */
	public update() {
		let positions = this.getVerticesData(VertexBuffer.PositionKind);
		let normals = this.getVerticesData(VertexBuffer.NormalKind);
		if (positions && normals) {
			for (let i: number = 3 * this._sectionPolygonPointsCount; i < positions.length; i++) {
				positions[i - 3 * this._sectionPolygonPointsCount] = positions[i] - normals[i] / this._length * this._diameter;
			}
			for (let i: number = 3 * this._sectionPolygonPointsCount; i < normals.length; i++) {
				normals[i - 3 * this._sectionPolygonPointsCount] = normals[i];
			}
			let l: number = positions.length - 3 * this._sectionPolygonPointsCount;
			let alpha: number = 2 * Math.PI / this._sectionPolygonPointsCount;
			for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
				this._sectionVectors[i].copyFromFloats(
					Math.cos(i * alpha) * this._diameter,
					Math.sin(i * alpha) * this._diameter,
					0
				);
				this._sectionNormalVectors[i].copyFromFloats(
					Math.cos(i * alpha),
					Math.sin(i * alpha),
					0
				);
				Vector3.TransformCoordinatesToRef(this._sectionVectors[i], this._generator.getWorldMatrix(), this._sectionVectors[i]);
				Vector3.TransformNormalToRef(this._sectionNormalVectors[i], this._generator.getWorldMatrix(), this._sectionNormalVectors[i]);
			}
			for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
				positions[l + 3 * i] = this._sectionVectors[i].x;
				positions[l + 3 * i + 1] = this._sectionVectors[i].y;
				positions[l + 3 * i + 2] = this._sectionVectors[i].z;
				normals[l + 3 * i] = this._sectionNormalVectors[i].x;
				normals[l + 3 * i + 1] = this._sectionNormalVectors[i].y;
				normals[l + 3 * i + 2] = this._sectionNormalVectors[i].z;
			}
			this.updateVerticesData(VertexBuffer.PositionKind, positions, true, false);
			this.updateVerticesData(VertexBuffer.NormalKind, normals, true, false);
		}
	}
}