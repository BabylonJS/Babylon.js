window.prepareCell = function() {
    var cell = new BABYLON.CellMaterial("cell", scene);
	cell.diffuseTexture = new BABYLON.Texture("../assets/textures//amiga.jpg", scene);
	cell.diffuseTexture.uScale = cell.diffuseTexture.vScale = 3;
	cell.computeHighLevel = true;

    registerRangeUI("cell", "Hight Level Cell", false, true, function(value) {
        cell.computeHighLevel = value;
    }, function() {
        return cell.computeHighLevel;
    });

    registerColorPicker("cell", "Diffuse Color", "#FFFFFF", function(value) {		
		cell.diffuseColor.r = value.r/255;
		cell.diffuseColor.g = value.g/255;
		cell.diffuseColor.b = value.b/255;
	}, function() {
		return cell.diffuseColor;
	});

    return cell;
};
