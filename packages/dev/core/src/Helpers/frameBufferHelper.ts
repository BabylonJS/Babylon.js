
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Engine } from "../Engines/engine";
import { Scene } from "../scene";

export class FrameBufferHelper {
  texture: RenderTargetTexture;
  copyFramebufferToTexture(engine: Engine, scene: Scene) {
    if(!this.texture) {
      // Create a render target texture
      this.texture = new RenderTargetTexture("framebufferTexture", {
        width: engine.getRenderWidth(),
        height: engine.getRenderHeight()
      }, scene, false, false, Engine.TEXTURETYPE_UNSIGNED_INT);
    }
    //copy to existing variable
    this.texture = <RenderTargetTexture>engine._currentFramebuffer;
    return this.texture;
  }
}
