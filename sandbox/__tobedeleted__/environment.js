
// Environments
var dropdownContentEnv = document.getElementById("dropdownContent-env");
var btnEnvironment = document.getElementById("btnEnvironment");

var skyboxes = [
    "https://assets.babylonjs.com/environments/environmentSpecular.env",
    "https://assets.babylonjs.com/environments/studio.env",
];

var skyboxesNames = [
    "Default",
    "Studio",
];

var readLocaStorageValue = function(key, defautlValue) {
    if (typeof (Storage) !== "undefined" && localStorage.getItem(key) !== null) {
        return parseInt(localStorage.getItem(key));
    }

    return defautlValue;
}

var defaultSkyboxIndex = readLocaStorageValue("defaultSkyboxId", 0);

function loadSkyboxPathTexture(path, scene) {
    if (path.indexOf(".hdr") === (path.length - 4)) {
        return new BABYLON.HDRCubeTexture(path, scene, 256, false, true, false, true);
    }
    return BABYLON.CubeTexture.CreateFromPrefilteredData(path, scene);
}

function displayDropdownContentEnv(display) {
    if (display) {
        dropdownContentEnv.classList.remove("hidden");
        btnEnvironment.classList.add("open");
        clickInterceptor.classList.remove("hidden");
    }
    else {
        dropdownContentEnv.classList.add("hidden");
        btnEnvironment.classList.remove("open");
        clickInterceptor.classList.add("hidden");
    }
}

btnEnvironment.addEventListener('click', function() {
    displayDropdownContentEnv(dropdownContentEnv.classList.contains("hidden"));
}, false);

addEnvironmentLoader = function(index) {
    var env = document.createElement("div");
    env.innerHTML = skyboxesNames[index];
    env.title = skyboxesNames[index];
    env.addEventListener("click", function() {
        // hide the content of the dropdown
        displayDropdownContentEnv(false);
        if (typeof (Storage) !== "undefined") {
            localStorage.setItem("defaultSkyboxId", index);
        }
        defaultSkyboxIndex = index;
        skyboxPath = skyboxes[defaultSkyboxIndex];
        if (filesInput) {
            filesInput.reload();
        }
        else {
            var currentScene = BABYLON.Engine.LastCreatedScene;
            currentScene.environmentTexture = loadSkyboxPathTexture(skyboxPath, currentScene);
            for (var i = 0; i < currentScene.materials.length; i++) {
                var material = currentScene.materials[i];
                if (material.name === "skyBox") {
                    var reflectionTexture = material.reflectionTexture;
                    if (reflectionTexture && reflectionTexture.coordinatesMode === BABYLON.Texture.SKYBOX_MODE) {
                        material.reflectionTexture = currentScene.environmentTexture.clone();
                        if (material.reflectionTexture) {
                            material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                        }
                    }
                }
            }
        }
    });

    return env;
}

for (var index = 0; index < skyboxes.length; index++) {
    var env = addEnvironmentLoader(index);
    dropdownContentEnv.appendChild(env);
}