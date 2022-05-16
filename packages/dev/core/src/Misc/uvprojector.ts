import { VertexBuffer } from "../Buffers";
import { Ray } from "../Culling/ray";
import { Vector3 } from "../Maths";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { CreateBox } from "../Meshes/Builders/boxBuilder";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";
import { FloatArray, Nullable } from "../types";

export class Uvprojector {
    /**
     * Project uv from a reference mesh
     * @param target the mesh to project the uv to
     * @param reference the reference mesh to project the uv from
     * @param scalefact the bounding box scale for the reference mesh
     * @param scene
     */
     public static ProjectUV(target: Mesh, reference: Nullable<Mesh>, scalefact: number, scene: Scene): void {
        target.bakeCurrentTransformIntoVertices();
        const positions = target.getVerticesData(VertexBuffer.PositionKind) as Nullable<FloatArray>;
        
        const vec = [];
        if(positions){
            for(let k = 0; k < positions.length / 3; k++){
                vec.push(new Vector3(positions[k * 3], positions[k * 3 + 1], positions[k * 3 + 2]))
            }
        }
        /**
         * This assumes meshA does not have a uv data yet
         */
        const indices = target.getIndices() as any;

        const uvs = new Array(indices.length * 2);
        target.computeWorldMatrix();

        const boundingBox = target.getBoundingInfo().boundingBox
        const _width = (boundingBox.maximum.x - boundingBox.minimum.x) * scalefact;
        const _height = (boundingBox.maximum.y - boundingBox.minimum.y) * scalefact;
        const _depth = (boundingBox.maximum.z - boundingBox.minimum.z) * scalefact;

        if(!reference){
            reference = CreateBox("box-unwrap", {width: _width, height: _height, depth: _depth})
            reference.position.copyFrom(boundingBox.center);
            reference.bakeCurrentTransformIntoVertices();
            reference.visibility = 0.3;
        }else{
            reference.scaling.set(_width, _height, _depth);
            reference.position.copyFrom(boundingBox.center);
            reference.bakeCurrentTransformIntoVertices();
            reference.visibility = 0.3;
        }

        function getFaceNormal(pt1: any, pt2: any, pt3: any): any{ 
            let convertToArray = false;
            if(pt1 instanceof Array || pt1 instanceof Float32Array){
                pt1 = new Vector3().fromArray(pt1, 0);
                pt2 = new Vector3().fromArray(pt2, 0);
                pt3 = new Vector3().fromArray(pt3, 0);
                convertToArray = true;
            }    
            const normal = Vector3.Zero();
            Vector3.CrossToRef(pt2.subtract(pt1), pt3.subtract(pt1), normal)
            normal.normalize();

            if(convertToArray){
                return normal.asArray();
            }else{
                return normal;
            }
        }


        function predicate(mesh: AbstractMesh): boolean{
            if (mesh == reference){
                return true;
            }
            return false;
        }
        
        //use ray to project the uv data from the reference mesh to the target mesh
        for(let i = 0; i < indices.length; i++){
    
            if(i % 3 == 0){
                let rayDir = new Vector3(0, 1, 0);
    
                let faceDir = getFaceNormal(vec[indices[i]], vec[indices[i + 1]], vec[indices[i + 2]]);
                faceDir.normalize();
                faceDir = new Vector3(Math.abs(faceDir.x), Math.abs(faceDir.y), Math.abs(faceDir.z))
                
                if(faceDir.x > faceDir.y && faceDir.x > faceDir.z){
                    rayDir = new Vector3(1, 0, 0);
                }else if(faceDir.y > faceDir.x && faceDir.y > faceDir.z){
                    rayDir = new Vector3(0, 1, 0);
                }else if(faceDir.z > faceDir.x && faceDir.z > faceDir.y){
                    rayDir = new Vector3(0, 0, 1);
                }
    
                rayDir = rayDir.normalize();
                const rayLength = rayDir.length() * Math.abs(_width * _height * _depth);
    
                const faceVerts = [vec[indices[i]], vec[indices[i + 1]], vec[indices[i + 2]]];
                const trigInd = [indices[i], indices[i + 1], indices[i + 2]]
                
                for(let n = 0; n < faceVerts.length; n++){
                    
                    let id = trigInd[n] || 0;
                    id *= 2;
    
                    const origin = new Vector3(faceVerts[n].x, faceVerts[n].y, faceVerts[n].z);
                    let ray =  new Ray(origin, rayDir, rayLength);
                    let hit = scene.pickWithRay(ray, predicate);
                    
                    if(!hit?.pickedMesh){
                        ray = new Ray(origin, rayDir.scale(-1), rayLength);
                        hit = scene.pickWithRay(ray, predicate);
                    }  
    
                    if(!hit?.pickedMesh){ continue; }
    
                    const uvh = hit.getTextureCoordinates();
    
                    uvs[id] = uvh?.x;
                    uvs[id + 1] = uvh?.y;
                }
            }
        };
        target.setVerticesData(VertexBuffer.UVKind, uvs);
    }
    /**
     * Get class name
     * @returns "UvProjector"
     */
     public getClassName(): string {
        return "UvProjector";
    }
}