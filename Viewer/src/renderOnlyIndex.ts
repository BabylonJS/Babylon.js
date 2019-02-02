import { RenderOnlyViewer } from './viewer/renderOnlyViewer';

// Required side effects
import '@babylonjs/loaders/glTF/2.0';
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader"
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader"
import "@babylonjs/core/Materials/Textures/Loaders/ktxTextureLoader"
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

// Override default material factory to avoid the dependency on standard material
import { Scene } from '@babylonjs/core/scene';
Scene.DefaultMaterialFactory = (scene:Scene)=>{return null as any};

export { RenderOnlyViewer };
