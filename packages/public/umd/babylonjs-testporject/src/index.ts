import * as BABYLON from "babylonjs";
import * as BABYLONGUI from "babylonjs-gui";
import "babylonjs-loaders";
import "babylonjs-materials";
import "babylonjs-serializers";

const engine = new BABYLON.NullEngine();
engine.dispose();

BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("test");
