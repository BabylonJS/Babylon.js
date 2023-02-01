import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { FrameBufferHelper } from "./frameBufferHelper";
export class OpaqueObjectCopier {
    _engine: Engine;
    _scene: Scene;
    _texture: any;
    _frameBufferHelper: any;
    constructor(engine: Engine, scene: Scene) {
        this._engine = engine;
        this._scene = scene;
        this._frameBufferHelper = new FrameBufferHelper();
        scene.renderingManager.getRenderingGroup(0).onBeforeTransparentRendering = ()=>{
            this._texture = this._frameBufferHelper.copyFramebufferToTexture(this._engine, this._scene);
            this._scene.refractionTexture = this._texture;
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