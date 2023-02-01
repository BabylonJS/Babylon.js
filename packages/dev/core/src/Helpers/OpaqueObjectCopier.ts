import { Engine, Scene } from "..";
import { copyFramebufferToTexture } from "./frameBufferHelper";
export class OpaqueObjectCopier {
    _engine: Engine;
    _scene: Scene;
    _texture: any;
    constructor(engine: Engine, scene: Scene) {
        this._engine = engine;
        this._scene = scene;
        // scene.onAfterRenderingGroupObservable = 
        scene.renderingManager.getRenderingGroup(0).onBeforeTransparentRendering = ()=>{
            this._texture = copyFramebufferToTexture(this._engine, this._scene);
        }
    }
  
    get texture() {
      return this._texture;
    }
  
    // Function to apply image processing post-processes (if required)
    applyPostProcesses(postProcesses: any) {
      // Implementation details will be discussed at implementation time
    }
  }