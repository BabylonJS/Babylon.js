
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

function displayDropdownContentEnv(display) {
    if (display) {
        dropdownContentEnv.classList.remove("hidden");
        btnEnvironment.classList.add("open");
    }
    else {
        dropdownContentEnv.classList.add("hidden");
        btnEnvironment.classList.remove("open");
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
        filesInput.reload();
    });

    return env;
}

for (var index = 0; index < skyboxes.length; index++) {
    var env = addEnvironmentLoader(index);
    dropdownContentEnv.appendChild(env);
}