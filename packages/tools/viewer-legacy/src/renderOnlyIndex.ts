import { RenderOnlyViewer } from "./viewer/renderOnlyViewer";

// Required side effects
import "loaders/glTF/2.0";
import "core/Lights/Shadows/shadowGeneratorSceneComponent";
import "core/Debug/debugLayer";
import "core/Meshes/Builders/planeBuilder";
import "core/Meshes/Builders/boxBuilder";
import "core/Materials/Textures/Loaders/ddsTextureLoader";
import "core/Materials/Textures/Loaders/envTextureLoader";
import "core/Materials/Textures/Loaders/ktxTextureLoader";
import "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

// Override default material factory to avoid the dependency on standard material
import { Scene } from "core/scene";
Scene.DefaultMaterialFactory = () => {
    return null as any;
};

export { RenderOnlyViewer };
