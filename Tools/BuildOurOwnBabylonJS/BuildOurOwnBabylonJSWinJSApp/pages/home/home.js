(function () {
    "use strict";

    var itemsList = new WinJS.Binding.List();

    function getGroupKey(dataItem){
        return dataItem.group;
    }

    function getGroupData(dataItem){
        return {
            title: dataItem.group
        };
    }

    var groupedItemsList = itemsList.createGrouped(getGroupKey, getGroupData);

    WinJS.Namespace.define("home.babylonScenes", {
        groupedItemsList: groupedItemsList
    });
    WinJS.Namespace.define("home.userScenes", {
        data: new WinJS.Binding.List()
    });

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            element.querySelector("#babylonScenesListView").addEventListener("iteminvoked", function (event) {
                event.detail.itemPromise.done(function (item) {
                    if (!item.data.file) {
                        WinJS.Navigation.navigate('/pages/sandbox/sandbox.html');
                        return;
                    }
                    WinJS.Navigation.navigate('/pages/babylonScene/babylonScene.html', { babylonFolder: item.data.folder, babylonFile: item.data.file });
                });
            });

            var className = "ListItem";

            var onSceneFolderOpenCallback = function (rootFolder) {
                rootFolder.getFoldersAsync().then(function (folders) {
                    var list = itemsList;
                    var group = (rootFolder.name == "BabylonJS-Demos") ? "BabylonJS demos scenes" : "Your scenes"
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
                                list.push({
                                    title: folder.displayName.charAt(0).toUpperCase() + folder.displayName.slice(1),
                                    text: file.name,
                                    group: group,
                                    folder: rootFolder.name + "/" + folder.name,
                                    file: file.name,
                                    className: className
                                });
                            }
                        });
                    });
                });
            };

            if (itemsList.length == 0) {
                itemsList.push({
                    title: "Sandbox",
                    text: "BabylonJS Sandbox",
                    group: "Sandbox",
                    folder: null,
                    file: null,
                    className: className + " sandbox"
                });
                Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("BabylonJS-Demos").then(onSceneFolderOpenCallback);
                Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("addToPackage").then(onSceneFolderOpenCallback);
            }
        }
    });
})();
