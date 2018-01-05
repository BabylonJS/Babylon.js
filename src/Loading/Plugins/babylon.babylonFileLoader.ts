module BABYLON.Internals {

    var parseMaterialById = (id: string, parsedData: any, scene: Scene, rootUrl: string) => {
        for (var index = 0, cache = parsedData.materials.length; index < cache; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return Material.Parse(parsedMaterial, scene, rootUrl);
            }
        }
        return null;
    };

    var isDescendantOf = (mesh: any, names: Array<any>, hierarchyIds: Array<number>) => {
        for (var i in names) {
            if (mesh.name === names[i]) {
                hierarchyIds.push(mesh.id);
                return true;
            }
        }
        if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
            hierarchyIds.push(mesh.id);
            return true;
        }
        return false;
    };

    var logOperation = (operation: string, producer: { file: string, name: string, version: string, exporter_version: string }) => {
        return operation + " of " + (producer ? producer.file + " from " + producer.name + " version: " + producer.version + ", exporter version: " + producer.exporter_version : "unknown");
    }

    SceneLoader.RegisterPlugin({
        name: "babylon.js",
        extensions: ".babylon",
        canDirectLoad: (data: string) => {
            if (data.indexOf("babylon") !== -1) { // We consider that the producer string is filled
                return true;
            }

            return false;
        },
        loadAssets: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): SceneAssetContainer =>{
            var container = new SceneAssetContainer(scene);
            // TODO
            return container;
        }
    });
}
