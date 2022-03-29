import { HDRCubeTexture } from "core/Materials/Textures/hdrCubeTexture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import type { Scene } from "core/scene";
import { LocalStorageHelper } from "./localStorageHelper";
import type { GlobalState } from "../globalState";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { EngineStore } from "core/Engines/engineStore";

export class EnvironmentTools {
    public static SkyboxPath = "";
    public static Skyboxes = ["https://assets.babylonjs.com/environments/environmentSpecular.env", "https://assets.babylonjs.com/environments/studio.env"];

    public static SkyboxesNames = ["Default", "Studio"];

    public static LoadSkyboxPathTexture(scene: Scene) {
        const defaultSkyboxIndex = Math.max(0, LocalStorageHelper.ReadLocalStorageValue("defaultSkyboxId", 0));
        const path = this.SkyboxPath || this.Skyboxes[defaultSkyboxIndex];
        if (path.indexOf(".hdr") === path.length - 4) {
            return new HDRCubeTexture(path, scene, 256, false, true, false, true);
        }
        return CubeTexture.CreateFromPrefilteredData(path, scene);
    }

    public static GetActiveSkyboxName() {
        const defaultSkyboxIndex = Math.max(0, LocalStorageHelper.ReadLocalStorageValue("defaultSkyboxId", 0));
        return this.SkyboxesNames[defaultSkyboxIndex];
    }

    public static HookWithEnvironmentChange(globalState: GlobalState) {
        globalState.onEnvironmentChanged.add((option) => {
            this.SkyboxPath = "";
            const index = EnvironmentTools.SkyboxesNames.indexOf(option);

            if (typeof Storage !== "undefined") {
                localStorage.setItem("defaultSkyboxId", index.toString());
            }

            const currentScene = EngineStore.LastCreatedScene!;
            currentScene.environmentTexture = this.LoadSkyboxPathTexture(currentScene);
            for (let i = 0; i < currentScene.materials.length; i++) {
                const material = currentScene.materials[i] as StandardMaterial | PBRMaterial;
                if (material.name === "skyBox") {
                    const reflectionTexture = material.reflectionTexture;
                    if (reflectionTexture && reflectionTexture.coordinatesMode === Texture.SKYBOX_MODE) {
                        material.reflectionTexture = currentScene.environmentTexture.clone();
                        if (material.reflectionTexture) {
                            material.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
                        }
                    }
                }
            }
        });
    }
}
