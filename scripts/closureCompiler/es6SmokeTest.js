import { Light } from "./core/Lights/light.js";
import { FileTools } from "./core/Misc/fileTools.js";

let sortCount = 0;
const scene = {
    requireLightSorting: false,
    sortLightsByPriority() {
        sortCount++;
    },
};
const light = Object.create(Light.prototype);
light._scene = scene;
light.renderPriority = 1;

if (light.renderPriority !== 1 || sortCount !== 1 || !scene.requireLightSorting) {
    throw new Error("Babylon.js failed after Closure Compiler property renaming.");
}

FileTools.BaseUrl = "/closure-test/";
if (FileTools.BaseUrl !== "/closure-test/") {
    throw new Error("Babylon.js reflected property failed after Closure Compiler property renaming.");
}
