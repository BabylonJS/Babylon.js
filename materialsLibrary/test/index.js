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


window.registerRangeUI = function(material, name, minValue, maxValue, onChange, onSet) {
	if (!registeredUIs[material]) {
		registeredUIs[material] = [];
	}
	
	registeredUIs[material].push({
		name: name,
		minValue: minValue,
		maxValue: maxValue,
		onChange: onChange,
		onSet: onSet
	});
}

var setUi = function(ui) {
	options[ui.name] = ui.onSet();
	
	materialgui.add(options, ui.name, ui.minValue, ui.maxValue).onChange(function(value) {
		ui.onChange(value);
	});
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