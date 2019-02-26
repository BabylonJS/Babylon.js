import { Mesh } from "babylonjs/Meshes/mesh";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { Vector3 } from "babylonjs/Maths/math";

/**
* Class for generating STL data from a Babylon scene.
*/
export class STLExport {
    /**
    * Exports the geometry of a Mesh array in .STL file format (ASCII)
    * @param meshes list defines the mesh to serialize
    * @param download triggers the automatic download of the file.
    * @param fileName changes the downloads fileName.
    * @param binary changes the STL to a binary type.
    * @returns the STL as UTF8 string
    */
	public static CreateSTL(meshes: Mesh[], download:boolean=true, fileName:string='STL_Mesh', binary:boolean=false): any {

		let data;
		let multiMesh = false;
		if(meshes.length>1){
			multiMesh=true;
		}
		if(!binary){
			data = 'solid exportedMesh\r\n';		
			for(let i=0; i<meshes.length; i++){
				let mesh = meshes[i];
				mesh.bakeCurrentTransformIntoVertices();
				let vertices = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
				let indices = mesh.getIndices() || [];

				for (let i = 0; i < indices.length; i += 3) {
					let id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
					let v = [
						new Vector3(vertices[id[0]], vertices[id[0] + 1], vertices[id[0] + 2]),
						new Vector3(vertices[id[1]], vertices[id[1] + 1], vertices[id[1] + 2]),
						new Vector3(vertices[id[2]], vertices[id[2] + 1], vertices[id[2] + 2])
					];
				let p1p2 = v[0].subtract(v[1]);
				let p3p2 = v[2].subtract(v[1]);
				let n = (Vector3.Cross(p1p2, p3p2)).normalize();

				data += 'facet normal ' + n.x + ' ' + n.y + ' ' + n.z + '\r\n';
				data += '\touter loop\r\n';
				data += '\t\tvertex ' + v[0].x + ' ' + v[0].y + ' ' + v[0].z + '\r\n';
				data += '\t\tvertex ' + v[1].x + ' ' + v[1].y + ' ' + v[1].z + '\r\n';
				data += '\t\tvertex ' + v[2].x + ' ' + v[2].y + ' ' + v[2].z + '\r\n';
				data += '\tendloop\r\n';
				data += 'endfacet\r\n';
				}			
			}	

			data += 'endsolid exportedMesh';

		}else{	

			//Adapted from https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61			
			let faceCount = 0;
			for(let i=0; i<meshes.length; i++){
				let mesh = meshes[i];
				faceCount += mesh.getIndices().length;			
			}

			let isLittleEndian = true;

			let bufferSize = 84 + (50 * faceCount);
			let buffer = new ArrayBuffer(bufferSize);			
			data = new DataView(buffer);
			let offset = 0;			

			let writeVector = function(dataview:any, offset:number, vector:Vector3, isLittleEndian:boolean){
				offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
				offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
				return writeFloat(dataview, offset, vector.z, isLittleEndian);
			};

			let writeFloat = function(dataview:any, offset:number, value:number, isLittleEndian:boolean) {
				dataview.setFloat32(offset, value, isLittleEndian);
				return offset + 4;
			};

			//Allow later for binary Messages to be passed in the header for now offset by 80.
			offset += 80;			
			data.setUint32(offset, faceCount, isLittleEndian);
			offset += 4;			

			for(let i=0; i<meshes.length; i++){
				let mesh = meshes[i];
				mesh.bakeCurrentTransformIntoVertices();
				let vertices = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
				let indices = mesh.getIndices() || [];

				for (let i = 0; i < indices.length; i += 3) {
					let id = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
					let v = [
						new Vector3(vertices[id[0]], vertices[id[0] + 1], vertices[id[0] + 2]),
						new Vector3(vertices[id[1]], vertices[id[1] + 1], vertices[id[1] + 2]),
						new Vector3(vertices[id[2]], vertices[id[2] + 1], vertices[id[2] + 2])
					];
					let p1p2 = v[0].subtract(v[1]);
					let p3p2 = v[2].subtract(v[1]);
					let n = (Vector3.Cross(p1p2, p3p2)).normalize();

					offset = writeVector(data, offset, n, isLittleEndian);
					offset = writeVector(data, offset, v[0], isLittleEndian);
					offset = writeVector(data, offset, v[1], isLittleEndian);
					offset = writeVector(data, offset, v[2], isLittleEndian);
					offset += 2;
				}	
			}		
		}	

		if (download) {
			let a = document.createElement('a');
			let blob = new Blob([data], {'type': 'application/octet-stream'});
			a.href = window.URL.createObjectURL(blob);

			if (!fileName) {
				fileName = "STL_Mesh";
			}
			a.download = fileName + ".stl";
			a.click();
		}

	return data;
	}
}
