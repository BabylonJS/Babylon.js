import { RenderOnlyViewer } from './viewer/renderOnlyViewer';
// Required side effects
import '@babylonjs/loaders/glTF/2.0';
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/core/Meshes/meshBuilder";
// TODO bad error message without this
import '@babylonjs/core/Loading/Plugins'
import "@babylonjs/core/Materials/Textures/Loaders"
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
// This was needed at some point but no longer?
// import "@babylonjs/core/Gamepads/gamepadSceneComponent"


export { RenderOnlyViewer };
