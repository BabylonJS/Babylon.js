var meshes = [];
var cameras = [];
var lights = [];
var materials = [];

var BabylonMesh = function(obj)
{
	var core = obj.core();
	if(core == null)
	{
		this.notMesh = true;
		return;
	}
    if(obj.materialTags() && obj.materialTags().length > 0)
    {
        var matId = obj.materialTags()[0].linkedToMaterial();
        this.materialId = materials[matId].id;
        if(materials[matId].diffuseTexture)
        {        
            var vec2 = obj.materialTags()[0].getParameter("UVOffset");
            materials[matId].diffuseTexture.uOffset = vec2.x;
            materials[matId].diffuseTexture.vOffset = vec2.y;
            vec2 = obj.materialTags()[0].getParameter("UVScale");
            materials[matId].diffuseTexture.uScale = vec2.x;
            materials[matId].diffuseTexture.vScale = vec2.y;
            var vec3 = obj.materialTags()[0].getParameter("shadingRotation");
            materials[matId].diffuseTexture.uAng = vec3.x;
            materials[matId].diffuseTexture.vAng = vec3.y;
            materials[matId].diffuseTexture.wAng = vec3.z;
        } 
    } else
        this.materialId = "";

	this.name = obj.getParameter("name");
    this.id = obj.getParameter("name");
    var vec3 = obj.getParameter("position");
    this.position = [-vec3.x, vec3.y, vec3.z];
    vec3 = obj.getParameter("rotation");
    this.rotation = [vec3.y* Math.PI/ 180, -vec3.x* Math.PI/ 180, -vec3.z* Math.PI/ 180];
    vec3 = obj.getParameter("scale");
    this.scaling = [vec3.x, vec3.y, vec3.z];
    this.isVisible = true;
    this.isEnabled = true;
    this.checkCollisions = false;
    this.billboardMode = 0;
    this.receiveShadows = true;

    this.positions = [];
    this.indices = [];
    this.uvs = [];
    this.uvs2 = [];
    this.normals = [];
    var tmpnormals = [];
    var tmpuv = [];

    for (var v = 0; v < core.vertexCount(); v++) {
    	var vertex = core.vertex(v);
    	this.positions.push(vertex.x);
    	this.positions.push(vertex.y);
    	this.positions.push(vertex.z);
    };

    for (var p = 0; p < core.polygonCount(); p++) {
    	for (var t = 0; t < core.polygonSize(p) - 2; t++) {
    		var triangle = core.triangle(p,t);
    		for (var i = 0; i < 3; i++) {
    			this.indices.push(core.vertexIndex(p,triangle[i]));
    			tmpnormals[core.vertexIndex(p,triangle[i])] = core.normal(p,triangle[i]);
                // textcoord0 is [x,y], textcoord1 is [z,w]. Awesome doc work btw Cheetah3D
                tmpuv[core.vertexIndex(p,triangle[i])] = core.uvCoord(p, triangle[i]);
    		};
    	};
    };

    for (var n = 0; n < tmpnormals.length; n++) {
    	var normal = tmpnormals[n];
    	if(normal == null) // sometimes normals get randomly nulled, wth cheetah3d
    	{
    		normal = {};
    		normal.x = 0;
    		normal.y = 0;
    		normal.z = 0;
    	}
    	this.normals.push(normal.x);
    	this.normals.push(normal.y);
    	this.normals.push(normal.z);
    };
    for (var n = 0; n < tmpuv.length; n++) {
        var uvCoords = tmpuv[n];
        if(uvCoords == null) // sometimes normals get randomly nulled, wth cheetah3d
        {
            uvCoords = {};
            uvCoords.x = 0;
            uvCoords.y = 0;
            uvCoords.z = 0;
            uvCoords.w = 0;
        }
        this.uvs.push(1 - uvCoords.x);
        this.uvs.push(1 - uvCoords.y);
        this.uvs2.push(1- uvCoords.z);
        this.uvs2.push(1 - uvCoords.w);
    };
    // no multiple submesh for now
    this.subMeshes = [
                {
                    "materialIndex": 0,
                    "verticesStart": 0,
                    "verticesCount": core.vertexCount(),
                    "indexStart": 0,
                    "indexCount": core.triangleCount() * 3
                }
            ];
}

var BabylonCamera = function(cheetahCam)
{
    this.name=cheetahCam.getParameter("name");
    this.id=cheetahCam.getParameter("name");
    var vec3 = cheetahCam.getParameter("position");
    this.position = [-vec3.x, vec3.y, vec3.z];
    this.fov=cheetahCam.getParameter("fieldOfView") * Math.PI/ 180;
    this.minZ=cheetahCam.getParameter("clipNear");
    this.maxZ=cheetahCam.getParameter("clipFar");
    // default values until we can find if cheetah3d has such data
    this.target=[0,0,0];
    this.speed=1;
    this.inertia=0.9;
    this.checkCollisions=false;
    this.applyGravity=false;
    this.ellipsoid=[
        0.2,
        0.9,
        0.2
    ];  
}

var BabylonLight = function(cheetahLight, type)
{
    this.name = cheetahLight.getParameter("name");
    this.id = cheetahLight.getParameter("name");
    this.type = type;
    var vec3 = cheetahLight.getParameter("position");
    this.position = [-vec3.x, vec3.y, vec3.z];

    vec3 = cheetahLight.getParameter("rotation");
    var angles = [vec3.y* Math.PI/ 180, -vec3.x* Math.PI/ 180, -vec3.z* Math.PI/ 180];
    // shamefully copied from http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToQuaternion/
    // using quaternion x vector multiplication from http://molecularmusings.wordpress.com/2013/05/24/a-faster-quaternion-vector-multiplication/
    var c1 = Math.cos(angles[1]);
    var s1 = Math.sin(angles[1]);
    var c2 = Math.cos(angles[2]);
    var s2 = Math.sin(angles[2]);
    var c3 = Math.cos(angles[0]);
    var s3 = Math.sin(angles[0]);
    var w = Math.sqrt(1.0 + c1 * c2 + c1*c3 - s1 * s2 * s3 + c2*c3) / 2.0;
    var w4 = (4.0 * w);
    var x = (c2 * s3 + c1 * s3 + s1 * s2 * c3) / w4 ;
    var y = (s1 * c2 + s1 * c3 + c1 * s2 * s3) / w4 ;
    var z = (-s1 * s3 + c1 * s2 * c3 +s2) / w4 ;
    var qv = new Vec3D(x,y,z);
    var up = new Vec3D(0,1,0);
    var t = qv.cross(up).multiply(2);
    var vf = up.add(t.multiply(w).add(qv.cross(t)));
    this.direction = [-vf.x,-vf.y,-vf.z];
    this.intensity = cheetahLight.getParameter("intensity");
    var color4 = cheetahLight.getParameter("color");
    this.diffuse = [color4.x,color4.y,color4.z];
    this.groundColor = [color4.x, color4.y, color4.z];
    this.specular = [1,1,1];
    if(type == 2)
    {
        this.angle = cheetahLight.getParameter("cutOffAngle")* Math.PI/ 180;
        this.exponent = cheetahLight.getParameter("cutOffAttenuation");
    }
}

var BabylonMaterial = function(material)
{
    this.name = material.getParameter("name");
    this.id = material.getParameter("name");
    this.ambient =[1,1,1]; // ambient does not exist in cheetah3d
    var color4 = material.color();
    this.diffuse = [color4.x, color4.y, color4.z];
    color4 = material.specular();
    this.specular = [color4.x, color4.y, color4.z];
    this.specularPower = material.shininess();
    color4 = material.emission();
    this.emissive = [color4.x, color4.y, color4.z];
    this.alpha = 1;
    this.backFaceCulling = true;

    // diffuse texture info available only... this is edgy
    if(material.colorMap() != "none")
    {
        var name = material.colorMap().split("/");
        this.diffuseTexture = {
            name: name[name.length - 1],
            level: 1,
            hasAlpha: 0,
            coordinatesMode: 0,
            uOffset: 0,
            vOffset: 0,
            uScale: 1,
            vScale: 1,
            uAng: 0,
            vAng: 0,
            wAng: 0,
            wrapU: true,
            wrapV: true,
            coordinatesIndex: 0
        };}
}

function getChildren(obj, parentId)
{
	for (var i = 0; i < obj.childCount(); i++) {
		var child = obj.childAtIndex(i);
        switch(child.type())
        {
            case LIGHT:
                switch(child.getParameter("lightType"))
                {
                    case 0:
                        var light = new BabylonLight(child, 3);
                        lights.push(light);
                        break;
                    case 2:
                        var light = new BabylonLight(child, 1);
                        lights.push(light);
                        break;
                    case 4:
                        var light = new BabylonLight(child, 2);
                        lights.push(light);
                        break;
                    default:
                        var light = new BabylonLight(child, 0);
                        lights.push(light);
                        break;
                }
                break;
            case CAMERA:
                var camera = new BabylonCamera(child);
                cameras.push(camera);
                break;
            default:
                var mesh = new BabylonMesh(child);
                if(parentId)
                    mesh.parentId = parentId;
                parentId = mesh.id;
                if(!mesh.notMesh)
                {
                    meshes.push(mesh);
                }
                break;
        }
		if(child.childCount() > 0)
			getChildren(child, parentId);
	};
}

function main(doc){
	var obj = doc.root();

    for(var i = 0; i < doc.materialCount(); i++)
    {
        var mat = new BabylonMaterial(doc.materialAtIndex(i));
        materials.push(mat);
    }
    getChildren(obj, 0);

    var scene = {};
	scene.autoClear=true;
	scene.clearColor=[1,1,1];
	scene.ambientColor=[0,0,0];
	scene.gravity=[0,0,0];
	scene.cameras=cameras;
	scene.activeCamera_=cameras[0].id;
	scene.lights=lights;
	scene.materials = materials;
	scene.meshes=meshes;
	scene.multiMaterials=[];
	scene.shadowGenerators=[];
	scene.skeletons=[];

    var path=OS.runSavePanel("babylon");
    if(path==null){
	return;
	}
    
    //open file
    var file = new File(path);
    file.open(WRITE_MODE);
    file.write(JSON.stringify(scene));
    file.close();

    print(materials.length + " materials");
    print(meshes.length + " meshes");
    print(cameras.length + " cameras");
    print(lights.length + " lights");
    print("\n\n");
}