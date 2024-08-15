import "core/Materials/standardMaterial";
import "core/Rendering/depthRendererSceneComponent";
import "core/Engines/WebGPU/Extensions/engine.alpha";
import "core/Engines/WebGPU/Extensions/engine.renderTarget";

// uncomment the following lines will resolve the issue
// import "core/ShadersWGSL/postprocess.vertex";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Vector3 } from "core/Maths/math.vector";
import { CreateCapsule } from "core/Meshes/Builders/capsuleBuilder";
import { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "core/scene";

export const createScene = async function (engine) {  
    const scene = new Scene(engine);
    const camera = new ArcRotateCamera("Camera", Math.PI / 4, 0, 100, new Vector3(0, 0, 0), scene);
    
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    
    CreateCapsule("capsule", { radius: 5, height: 10, tessellation: 20 }, scene);
    
    new DefaultRenderingPipeline("default", true, scene, [camera]);
    
    return scene;
};
