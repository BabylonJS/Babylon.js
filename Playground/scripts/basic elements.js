var createScene = function () {
	var scene = new BABYLON.Scene(engine);

	var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 8, 50, BABYLON.Vector3.Zero(), scene);

	camera.attachControl(canvas, true);

	var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);

	//Creation of a box
	//(name of the box, size, scene)
	var box = BABYLON.Mesh.CreateBox("box", 6.0, scene);

	//Creation of a sphere 
	//(name of the sphere, segments, diameter, scene) 
	var sphere = BABYLON.Mesh.CreateSphere("sphere", 10.0, 10.0, scene);

	//Creation of a plan
	//(name of the plane, size, scene)
	var plan = BABYLON.Mesh.CreatePlane("plane", 10.0, scene);

	//Creation of a cylinder
	//(name, height, diameter, tessellation, scene, updatable)
	var cylinder = BABYLON.Mesh.CreateCylinder("cylinder", 3, 3, 3, 6, 1, scene, false);

	// Creation of a torus
	// (name, diameter, thickness, tessellation, scene, updatable)
	var torus = BABYLON.Mesh.CreateTorus("torus", 5, 1, 10, scene, false);

	// Creation of a knot
	// (name, radius, tube, radialSegments, tubularSegments, p, q, scene, updatable)
	var knot = BABYLON.Mesh.CreateTorusKnot("knot", 2, 0.5, 128, 64, 2, 3, scene);

	// Creation of a lines mesh
	var lines = BABYLON.Mesh.CreateLines("lines", [
        new BABYLON.Vector3(-10, 0, 0),
        new BABYLON.Vector3(10, 0, 0),
        new BABYLON.Vector3(0, 0, -10),
        new BABYLON.Vector3(0, 0, 10)
	], scene);

	// Creation of a ribbon
	// let's first create many paths along a maths exponential function as an example 
	var exponentialPath = function (p) {
		var path = [];
		for (var i = -10; i < 10; i++) {
			path.push(new BABYLON.Vector3(p, i, Math.sin(p / 3) * 5 * Math.exp(-(i - p) * (i - p) / 60) + i / 3));
		}
		return path;
	};
	// let's populate arrayOfPaths with all these different paths
	var arrayOfPaths = [];
	for (var p = 0; p < 20; p++) {
		arrayOfPaths[p] = exponentialPath(p);
	}

	// (name, array of paths, closeArray, closePath, offset, scene)
	var ribbon = BABYLON.Mesh.CreateRibbon("ribbon", arrayOfPaths, false, false, 0, scene);


	// Moving elements
	box.position = new BABYLON.Vector3(-10, 0, 0);   // Using a vector
	sphere.position = new BABYLON.Vector3(0, 10, 0); // Using a vector
	plan.position.z = 10;                            // Using a single coordinate component
	cylinder.position.z = -10;
	torus.position.x = 10;
	knot.position.y = -10;
	ribbon.position = new BABYLON.Vector3(-10, -10, 20);

	return scene;
}