(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("BabylonJS-Demos").then(function (folder) {
                folder.getFoldersAsync().then(function (folders) {
                    var ul = document.getElementById("babylonScenes");
                    folders.forEach(function (folder) {
                        folder.getFilesAsync().then(function (files) {
                            for (var j in files) {
                                var file = files[j];
                                if (file.fileType != ".babylon") {
                                    continue;
                                }
                                var incremental = false;
                                if (file.name.indexOf(".incremental.babylon") !== -1) {
                                    incremental = true;
                                }
                                var li = document.createElement("li");
                                var button = document.createElement("button");
                                button.className = "sceneButton";
                                button.setAttribute("data-scene-folder", folder.name);
                                button.setAttribute("data-scene-file", file.name);
                                button.textContent = folder.displayName + ((incremental) ? " (incremental)" : "");
                                li.innerHTML = button;
                                ul.appendChild(button);

                                button.addEventListener("click", onButtonClick)
                            }
                        });
                    });
                });
            }, function (error) {
                var test = true;
            });

            var onButtonClick = function (event) {
                var dataFolder = event.srcElement.getAttribute("data-scene-folder");
                var dataFile = event.srcElement.getAttribute("data-scene-file")
                WinJS.Navigation.navigate('/pages/babylonScene/babylonScene.html', { babylonFolder: dataFolder, babylonFile: dataFile });
            };
        }
    });
})();
