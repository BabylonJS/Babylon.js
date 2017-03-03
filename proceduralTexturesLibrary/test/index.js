//UI
var gui = new dat.GUI();
var options = {
	texture: "standard",
	mesh: "sphere",
	hemisphericLight: true,
	pointLight: false,
	directionalLight: false,
	castShadows: false,
	spotLight: false,
	fog: false,
	skybox: false
}

var registeredUIs = {};
var textureui;

window.registerColorPicker = function(texture, name, color, onChange, onSet) {
    if (!registeredUIs[texture]) {
        registeredUIs[texture] = [];
    }

    registeredUIs[texture].push({
        name: name,
        color: "#ff0000",
        onChange: onChange,
        onSet: onSet
    });
};


window.registerRangeUI = function(texture, name, minValue, maxValue, onChange, onSet) {
	if (!registeredUIs[texture]) {
		registeredUIs[texture] = [];
	}
	
	registeredUIs[texture].push({
		name: name,
		minValue: minValue,
		maxValue: maxValue,
		onChange: onChange,
		onSet: onSet
	});
}

var setUi = function(ui) {
	options[ui.name] = ui.onSet();

    if (ui.color) {
        textureui.addColor(options, ui.name).onChange(function(value) {
            ui.onChange(value);
        });
    } else {
        textureui.add(options, ui.name, ui.minValue, ui.maxValue).onChange(function(value) {
            ui.onChange(value);
        });
    }
}

window.enableTexture = function(texture) {
	if (textureui) {
		textureui.domElement.parentElement.removeChild(textureui.domElement);	
		textureui = null;
	}
	
	if (registeredUIs[texture]) {
		textureui = new dat.GUI();
		for (var index = 0; index < registeredUIs[texture].length; index++) {
			var ui = registeredUIs[texture][index];
			
			setUi(ui);
		}	
	}
}