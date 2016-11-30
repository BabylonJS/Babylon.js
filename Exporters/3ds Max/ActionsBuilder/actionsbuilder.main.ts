/*
Global functions called by the plugins (3ds Max, etc.)
*/

// Elements

var list: ActionsBuilder.List = null;
var viewer: ActionsBuilder.Viewer = null;

var actionsBuilderJsonInput: HTMLInputElement = <HTMLInputElement>document.getElementById("ActionsBuilderJSON");

this.createJSON = () => {
    var structure = viewer.utils.createJSON(viewer.root);
    var asText = JSON.stringify(structure);
    actionsBuilderJsonInput.value = asText;
    console.log(asText);
};

this.loadFromJSON = () => {
    var json = actionsBuilderJsonInput.value;
    if (json !== "") {
        var structure = JSON.parse(json);
        viewer.utils.loadFromJSON(structure, null);
    }
};

this.updateObjectName = () => {
    var element = <HTMLInputElement>document.getElementById("ActionsBuilderObjectName");
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

this.resetList = () => {
    list.clearLists();
    list.createListsElements();
};

this.setMeshesNames = (...args: string[]) => {
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.MESHES.push(args[i]);
    }
};

this.setLightsNames = (...args: string[]) => {
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.LIGHTS.push(args[i]);
    }
};

this.setCamerasNames = (...args: string[]) => {
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.CAMERAS.push(args[i]);
    }
};

this.setSoundsNames = (...args: string[]) => {
    for (var i = 0; i < args.length; i++) {
        var sound = args[i];

        if (sound !== "" && ActionsBuilder.SceneElements.SOUNDS.indexOf(sound) === -1) {
            ActionsBuilder.SceneElements.SOUNDS.push(args[i]);
        }
    }
};

this.hideButtons = () => {
    // Empty
};

this.setIsObject = () => {
    viewer.root.type = ActionsBuilder.Type.OBJECT;
};

this.setIsScene = () => {
    viewer.root.type = ActionsBuilder.Type.SCENE;
};

this.run = () => {
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
