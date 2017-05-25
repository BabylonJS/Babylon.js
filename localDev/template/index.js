// <reference path="../../dist/preview release/babylon.d.ts"/>

var createScene = function() {
	var scene = new BABYLON.Scene(engine);
	var camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);
	camera.attachControl(canvas, true);

	return scene;
};