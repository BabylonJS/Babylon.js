/*
Global functions called by the plugins (3ds Max, etc.)
*/
// Elements
var list = null;
var viewer = null;
var actionsBuilderJsonInput = document.getElementById("ActionsBuilderJSON");
this.createJSON = function () {
    var structure = viewer.utils.createJSON(viewer.root);
    var asText = JSON.stringify(structure);
    actionsBuilderJsonInput.value = asText;
    console.log(asText);
};
this.loadFromJSON = function () {
    var json = actionsBuilderJsonInput.value;
    if (json !== "") {
        var structure = JSON.parse(json);
        viewer.utils.loadFromJSON(structure, null);
    }
};
this.updateObjectName = function () {
    var element = document.getElementById("ActionsBuilderObjectName");
    var name = element.value;
    viewer.objectName = name;
    if (viewer.root.type === ActionsBuilder.Type.OBJECT) {
        name += " - Mesh";
    }
    else {
        name += " - Scene";
    }
    viewer.root.node.text.attr("text", name);
};
this.resetList = function () {
    list.clearLists();
    list.createListsElements();
};
this.setMeshesNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.MESHES.push(args[i]);
    }
};
this.setLightsNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.LIGHTS.push(args[i]);
    }
};
this.setCamerasNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.CAMERAS.push(args[i]);
    }
};
this.setSoundsNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        var sound = args[i];
        if (sound !== "" && ActionsBuilder.SceneElements.SOUNDS.indexOf(sound) === -1) {
            ActionsBuilder.SceneElements.SOUNDS.push(args[i]);
        }
    }
};
this.hideButtons = function () {
    // Empty
};
this.setIsObject = function () {
    viewer.root.type = ActionsBuilder.Type.OBJECT;
};
this.setIsScene = function () {
    viewer.root.type = ActionsBuilder.Type.SCENE;
};
this.run = function () {
    // Configure viewer
    viewer = new ActionsBuilder.Viewer(ActionsBuilder.Type.OBJECT);
    viewer.setColorTheme("-ms-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("-webkit-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("-o-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.onResize();
    viewer.update();
    // Configure list
    list = new ActionsBuilder.List(viewer);
    list.setColorTheme("rgb(64, 64, 64)");
    list.createListsElements();
    list.onResize();
    // 3ds Max fix
    viewer.onResize();
};
//# sourceMappingURL=actionsbuilder.main.js.map