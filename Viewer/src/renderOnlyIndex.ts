import { RenderOnlyViewer } from './viewer/renderOnlyViewer';

// Required side effects
import 'babylonjs-loaders/glTF/2.0';
import "babylonjs/Lights/Shadows/shadowGeneratorSceneComponent"
import "babylonjs/Debug/debugLayer";
import "babylonjs/Meshes/Builders/planeBuilder";
import "babylonjs/Meshes/Builders/boxBuilder";
import "babylonjs/Materials/Textures/Loaders/ddsTextureLoader"
import "babylonjs/Materials/Textures/Loaders/envTextureLoader"
import "babylonjs/Materials/Textures/Loaders/ktxTextureLoader"
import "babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

// Override default material factory to avoid the dependency on standard material
import { Scene } from 'babylonjs/scene';
Scene.DefaultMaterialFactory = (scene:Scene)=>{return null as any};

export { RenderOnlyViewer };
