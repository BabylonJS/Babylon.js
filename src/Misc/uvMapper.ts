import { Vector2, Vector3, Matrix } from "../Maths/math"

// Porting smart uv project code from blender
export class UvMapper {

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

	constructor() {
		this.debPointInTri2D();
	}
}
