window.prepareGrid = function() {
	var grid = new BABYLON.GridMaterial("grid", scene);
	grid.opacityTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/backgroundGround.png", scene);

	registerRangeUI("grid", "LineColorR", 0, 1, function(value) {
		grid.lineColor.r = value;
	}, function() {
		return grid.lineColor.r;
	});

	registerRangeUI("grid", "LineColorG", 0, 1, function(value) {
		grid.lineColor.g = value;
	}, function() {
		return grid.lineColor.g;
	});

	registerRangeUI("grid", "LineColorB", 0, 1, function(value) {
		grid.lineColor.b = value;
	}, function() {
		return grid.lineColor.b;
	});

	registerRangeUI("grid", "MainColorR", 0, 1, function(value) {
		grid.mainColor.r = value;
	}, function() {
		return grid.mainColor.r;
	});

	registerRangeUI("grid", "MainColorG", 0, 1, function(value) {
		grid.mainColor.g = value;
	}, function() {
		return grid.mainColor.g;
	});

	registerRangeUI("grid", "MainColorB", 0, 1, function(value) {
		grid.mainColor.b = value;
	}, function() {
		return grid.mainColor.b;
	});

	registerRangeUI("grid", "GridRatio", 0, 10, function(value) {
		grid.gridRatio = value;
	}, function() {
		return grid.gridRatio;
	});

	registerRangeUI("grid", "OffsetX", 0, 2, function(value) {
		grid.gridOffset.x = value;
	}, function() {
		return grid.gridOffset.x;
	});

	registerRangeUI("grid", "OffsetY", 0, 2, function(value) {
		grid.gridOffset.y = value;
	}, function() {
		return grid.gridOffset.y;
	});

	registerRangeUI("grid", "OffsetZ", 0, 2, function(value) {
		grid.gridOffset.z = value;
	}, function() {
		return grid.gridOffset.z;
	});


	registerRangeUI("grid", "MajorUnitFrequency", 1, 10, function(value) {
		grid.majorUnitFrequency = value;
	}, function() {
		return grid.majorUnitFrequency;
	});

	registerRangeUI("grid", "MinorUnitVisibility", 0, 1, function(value) {
		grid.minorUnitVisibility = value;
	}, function() {
		return grid.minorUnitVisibility;
	});

	registerRangeUI("grid", "Opacity", 0, 1, function(value) {
		grid.opacity = value;
	}, function() {
		return grid.opacity;
	});

	return grid;
}