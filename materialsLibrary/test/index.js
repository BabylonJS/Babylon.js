//UI
var gui = new dat.GUI();
var options = {
	material: "standard",
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
var materialgui;

window.registerColorPicker = function(material, name, color, onChange, onSet) {
    if (!registeredUIs[material]) {
        registeredUIs[material] = [];
    }

    registeredUIs[material].push({
        name: name,
        color: "#ff0000",
        onChange: onChange,
        onSet: onSet,
        type: "Color"
    });
};


window.registerRangeUI = function(material, name, minValue, maxValue, onChange, onSet) {
	if (!registeredUIs[material]) {
		registeredUIs[material] = [];
	}
	
	registeredUIs[material].push({
		name: name,
		minValue: minValue,
		maxValue: maxValue,
		onChange: onChange,
		onSet: onSet,
		type: "Range"
	});
}

window.setRangeValues = function(json) {
	for (var key in json) {
		if (json.hasOwnProperty(key)) {
			setRangeValue(key, json[key]);
		}
	}
}

window.setRangeValue = function(name, value) {
	if (!materialgui) {
		return;
	}
	
	var controllers = materialgui.__controllers;
	for (var i = 0; i < controllers.length; i++) {
		if (controllers[i].property == name) {
			controllers[i].setValue(value);
		}
	}
}

window.registerButtonUI = function(material, name, onClick) {
	if (!registeredUIs[material]) {
		registeredUIs[material] = [];
	}
	
	registeredUIs[material].push({
		name: name, 
		onClick: onClick,
		type: "Button"
	});
}

var setUi = function(ui) {
	if (ui.type == "Range") {
		options[ui.name] = ui.onSet();
		var test = materialgui.add(options, ui.name, ui.minValue, ui.maxValue).onChange(function(value) {
			ui.onChange(value);
		});
	}
    else if (ui.type == "Color") {
        options[ui.name] = ui.onSet();
        materialgui.addColor(options, ui.name).onChange(function (value) {
            ui.onChange(value);
        })
    }
	else if (ui.type == "Button") {
		options[ui.name] = ui.onClick;
		materialgui.add(options, ui.name);
	}
}

window.enableMaterial = function(material) {
	if (materialgui) {
		materialgui.domElement.parentElement.removeChild(materialgui.domElement);	
		materialgui = null;
	}
	
	if (registeredUIs[material]) {
		materialgui = new dat.GUI();
		for (var index = 0; index < registeredUIs[material].length; index++) {
			var ui = registeredUIs[material][index];
			
			setUi(ui);
		}
	}
}