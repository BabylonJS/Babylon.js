import { HDRCubeTexture } from 'babylonjs/Materials/Textures/hdrCubeTexture';
import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';
import { Scene } from 'babylonjs/scene';
import { LocalStorageHelper } from './localStorageHelper';

export class EnvironmentTools {
    public static Skyboxes = [
        "https://assets.babylonjs.com/environments/environmentSpecular.env",
        "https://assets.babylonjs.com/environments/studio.env",
    ];
    
    public static SkyboxesNames = [
        "Default",
        "Studio",
    ];    

    public static LoadSkyboxPathTexture(scene: Scene) {                
        var defaultSkyboxIndex = LocalStorageHelper.ReadLocalStorageValue("defaultSkyboxId", 0);
        let path = this.Skyboxes[defaultSkyboxIndex];
        if (path.indexOf(".hdr") === (path.length - 4)) {
            return new HDRCubeTexture(path, scene, 256, false, true, false, true);
        }
        return CubeTexture.CreateFromPrefilteredData(path, scene);
    }
}