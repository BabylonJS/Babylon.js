

(function universalModuleDefinition(root, factory) {
    var amdDependencies = [];
    var BABYLON = root.BABYLON || this.BABYLON;
    if(typeof exports === 'object' && typeof module === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        module.exports = factory(BABYLON);
    } else if(typeof define === 'function' && define.amd) {
         amdDependencies.push("babylonjs");

        define("babylonjs-loaders", amdDependencies, factory);
    } else if(typeof exports === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        exports["babylonjs-loaders"] = factory(BABYLON);
    } else {
        root["BABYLON"] = factory(BABYLON);
    }
})(this, function(BABYLON) {
  BABYLON = BABYLON || this.BABYLON;

var __decorate=this&&this.__decorate||function(e,t,r,c){var o,f=arguments.length,n=f<3?t:null===c?c=Object.getOwnPropertyDescriptor(t,r):c;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,c);else for(var l=e.length-1;l>=0;l--)(o=e[l])&&(n=(f<3?o(n):f>3?o(t,r,n):o(t,r))||n);return f>3&&n&&Object.defineProperty(t,r,n),n};
var __extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var n in o)o.hasOwnProperty(n)&&(t[n]=o[n])};return function(o,n){function r(){this.constructor=o}t(o,n),o.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();

var BABYLON;
(function (BABYLON) {
    var STLFileLoader = /** @class */ (function () {
        function STLFileLoader() {
            this.solidPattern = /solid (\S*)([\S\s]*)endsolid[ ]*(\S*)/g;
            this.facetsPattern = /facet([\s\S]*?)endfacet/g;
            this.normalPattern = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
            this.vertexPattern = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
            this.name = "stl";
            // force data to come in as an ArrayBuffer
            // we'll convert to string if it looks like it's an ASCII .stl
            this.extensions = {
                ".stl": { isBinary: true },
            };
        }
        STLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
            var matches;
            if (this.isBinary(data)) {
                // binary .stl
                var babylonMesh = new BABYLON.Mesh("stlmesh", scene);
                this.parseBinary(babylonMesh, data);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
                return true;
            }
            // ASCII .stl
            // convert to string
            var array_buffer = new Uint8Array(data);
            var str = '';
            for (var i = 0; i < data.byteLength; i++) {
                str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
            }
            data = str;
            while (matches = this.solidPattern.exec(data)) {
                var meshName = matches[1];
                var meshNameFromEnd = matches[3];
                if (meshName != meshNameFromEnd) {
                    BABYLON.Tools.Error("Error in STL, solid name != endsolid name");
                    return false;
                }
                // check meshesNames
                if (meshesNames && meshName) {
                    if (meshesNames instanceof Array) {
                        if (!meshesNames.indexOf(meshName)) {
                            continue;
                        }
                    }
                    else {
                        if (meshName !== meshesNames) {
                            continue;
                        }
                    }
                }
                // stl mesh name can be empty as well
                meshName = meshName || "stlmesh";
                var babylonMesh = new BABYLON.Mesh(meshName, scene);
                this.parseASCII(babylonMesh, matches[2]);
                if (meshes) {
                    meshes.push(babylonMesh);
                }
            }
            return true;
        };
        STLFileLoader.prototype.load = function (scene, data, rootUrl) {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);
            if (result) {
                scene.createDefaultCameraOrLight();
            }
            return result;
        };
        STLFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
            var container = new BABYLON.AssetContainer(scene);
            this.importMesh(null, scene, data, rootUrl, container.meshes, null, null);
            container.removeAllFromScene();
            return container;
        };
        STLFileLoader.prototype.isBinary = function (data) {
            // check if file size is correct for binary stl
            var faceSize, nFaces, reader;
            reader = new DataView(data);
            faceSize = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
            nFaces = reader.getUint32(80, true);
            if (80 + (32 / 8) + (nFaces * faceSize) === reader.byteLength) {
                return true;
            }
            // check characters higher than ASCII to confirm binary
            var fileLength = reader.byteLength;
            for (var index = 0; index < fileLength; index++) {
                if (reader.getUint8(index) > 127) {
                    return true;
                }
            }
            return false;
        };
        STLFileLoader.prototype.parseBinary = function (mesh, data) {
            var reader = new DataView(data);
            var faces = reader.getUint32(80, true);
            var dataOffset = 84;
            var faceLength = 12 * 4 + 2;
            var offset = 0;
            var positions = new Float32Array(faces * 3 * 3);
            var normals = new Float32Array(faces * 3 * 3);
            var indices = new Uint32Array(faces * 3);
            var indicesCount = 0;
            for (var face = 0; face < faces; face++) {
                var start = dataOffset + face * faceLength;
                var normalX = reader.getFloat32(start, true);
                var normalY = reader.getFloat32(start + 4, true);
                var normalZ = reader.getFloat32(start + 8, true);
                for (var i = 1; i <= 3; i++) {
                    var vertexstart = start + i * 12;
                    // ordering is intentional to match ascii import
                    positions[offset] = reader.getFloat32(vertexstart, true);
                    positions[offset + 2] = reader.getFloat32(vertexstart + 4, true);
                    positions[offset + 1] = reader.getFloat32(vertexstart + 8, true);
                    normals[offset] = normalX;
                    normals[offset + 2] = normalY;
                    normals[offset + 1] = normalZ;
                    offset += 3;
                }
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
                indices[indicesCount] = indicesCount++;
            }
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        };
        STLFileLoader.prototype.parseASCII = function (mesh, solidData) {
            var positions = [];
            var normals = [];
            var indices = [];
            var indicesCount = 0;
            //load facets, ignoring loop as the standard doesn't define it can contain more than vertices
            var matches;
            while (matches = this.facetsPattern.exec(solidData)) {
                var facet = matches[1];
                //one normal per face
                var normalMatches = this.normalPattern.exec(facet);
                this.normalPattern.lastIndex = 0;
                if (!normalMatches) {
                    continue;
                }
                var normal = [Number(normalMatches[1]), Number(normalMatches[5]), Number(normalMatches[3])];
                var vertexMatch;
                while (vertexMatch = this.vertexPattern.exec(facet)) {
                    positions.push(Number(vertexMatch[1]), Number(vertexMatch[5]), Number(vertexMatch[3]));
                    normals.push(normal[0], normal[1], normal[2]);
                }
                indices.push(indicesCount++, indicesCount++, indicesCount++);
                this.vertexPattern.lastIndex = 0;
            }
            this.facetsPattern.lastIndex = 0;
            mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            mesh.setIndices(indices);
            mesh.computeWorldMatrix(true);
        };
        return STLFileLoader;
    }());
    BABYLON.STLFileLoader = STLFileLoader;
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new STLFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.stlFileLoader.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * Class reading and parsing the MTL file bundled with the obj file.
     */
    var MTLFileLoader = /** @class */ (function () {
        function MTLFileLoader() {
            // All material loaded from the mtl will be set here
            this.materials = [];
        }
        /**
         * This function will read the mtl file and create each material described inside
         * This function could be improve by adding :
         * -some component missing (Ni, Tf...)
         * -including the specific options available
         *
         * @param scene
         * @param data
         * @param rootUrl
         */
        MTLFileLoader.prototype.parseMTL = function (scene, data, rootUrl) {
            if (data instanceof ArrayBuffer) {
                return;
            }
            //Split the lines from the file
            var lines = data.split('\n');
            //Space char
            var delimiter_pattern = /\s+/;
            //Array with RGB colors
            var color;
            //New material
            var material = null;
            //Look at each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                // Blank line or comment
                if (line.length === 0 || line.charAt(0) === '#') {
                    continue;
                }
                //Get the first parameter (keyword)
                var pos = line.indexOf(' ');
                var key = (pos >= 0) ? line.substring(0, pos) : line;
                key = key.toLowerCase();
                //Get the data following the key
                var value = (pos >= 0) ? line.substring(pos + 1).trim() : "";
                //This mtl keyword will create the new material
                if (key === "newmtl") {
                    //Check if it is the first material.
                    // Materials specifications are described after this keyword.
                    if (material) {
                        //Add the previous material in the material array.
                        this.materials.push(material);
                    }
                    //Create a new material.
                    // value is the name of the material read in the mtl file
                    material = new BABYLON.StandardMaterial(value, scene);
                }
                else if (key === "kd" && material) {
                    // Diffuse color (color under white light) using RGB values
                    //value  = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set tghe color into the material
                    material.diffuseColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ka" && material) {
                    // Ambient color (color under shadow) using RGB values
                    //value = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set tghe color into the material
                    material.ambientColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ks" && material) {
                    // Specular color (color when light is reflected from shiny surface) using RGB values
                    //value = "r g b"
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    //color = [r,g,b]
                    //Set the color into the material
                    material.specularColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ke" && material) {
                    // Emissive color using RGB values
                    color = value.split(delimiter_pattern, 3).map(parseFloat);
                    material.emissiveColor = BABYLON.Color3.FromArray(color);
                }
                else if (key === "ns" && material) {
                    //value = "Integer"
                    material.specularPower = parseFloat(value);
                }
                else if (key === "d" && material) {
                    //d is dissolve for current material. It mean alpha for BABYLON
                    material.alpha = parseFloat(value);
                    //Texture
                    //This part can be improved by adding the possible options of texture
                }
                else if (key === "map_ka" && material) {
                    // ambient texture map with a loaded image
                    //We must first get the folder of the image
                    material.ambientTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_kd" && material) {
                    // Diffuse texture map with a loaded image
                    material.diffuseTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_ks" && material) {
                    // Specular texture map with a loaded image
                    //We must first get the folder of the image
                    material.specularTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_ns") {
                    //Specular
                    //Specular highlight component
                    //We must first get the folder of the image
                    //
                    //Not supported by BABYLON
                    //
                    //    continue;
                }
                else if (key === "map_bump" && material) {
                    //The bump texture
                    material.bumpTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                }
                else if (key === "map_d" && material) {
                    // The dissolve of the material
                    material.opacityTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
                    //Options for illumination
                }
                else if (key === "illum") {
                    //Illumination
                    if (value === "0") {
                        //That mean Kd == Kd
                    }
                    else if (value === "1") {
                        //Color on and Ambient on
                    }
                    else if (value === "2") {
                        //Highlight on
                    }
                    else if (value === "3") {
                        //Reflection on and Ray trace on
                    }
                    else if (value === "4") {
                        //Transparency: Glass on, Reflection: Ray trace on
                    }
                    else if (value === "5") {
                        //Reflection: Fresnel on and Ray trace on
                    }
                    else if (value === "6") {
                        //Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
                    }
                    else if (value === "7") {
                        //Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
                    }
                    else if (value === "8") {
                        //Reflection on and Ray trace off
                    }
                    else if (value === "9") {
                        //Transparency: Glass on, Reflection: Ray trace off
                    }
                    else if (value === "10") {
                        //Casts shadows onto invisible surfaces
                    }
                }
                else {
                    // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
                }
            }
            //At the end of the file, add the last material
            if (material) {
                this.materials.push(material);
            }
        };
        /**
         * Gets the texture for the material.
         *
         * If the material is imported from input file,
         * We sanitize the url to ensure it takes the textre from aside the material.
         *
         * @param rootUrl The root url to load from
         * @param value The value stored in the mtl
         * @return The Texture
         */
        MTLFileLoader._getTexture = function (rootUrl, value, scene) {
            if (!value) {
                return null;
            }
            var url = rootUrl;
            // Load from input file.
            if (rootUrl === "file:") {
                var lastDelimiter = value.lastIndexOf("\\");
                if (lastDelimiter === -1) {
                    lastDelimiter = value.lastIndexOf("/");
                }
                if (lastDelimiter > -1) {
                    url += value.substr(lastDelimiter + 1);
                }
                else {
                    url += value;
                }
            }
            // Not from input file.
            else {
                url += value;
            }
            return new BABYLON.Texture(url, scene);
        };
        return MTLFileLoader;
    }());
    BABYLON.MTLFileLoader = MTLFileLoader;
    var OBJFileLoader = /** @class */ (function () {
        function OBJFileLoader() {
            this.name = "obj";
            this.extensions = ".obj";
            this.obj = /^o/;
            this.group = /^g/;
            this.mtllib = /^mtllib /;
            this.usemtl = /^usemtl /;
            this.smooth = /^s /;
            this.vertexPattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // vn float float float
            this.normalPattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // vt float float
            this.uvPattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
            // f vertex vertex vertex ...
            this.facePattern1 = /f\s+(([\d]{1,}[\s]?){3,})+/;
            // f vertex/uvs vertex/uvs vertex/uvs ...
            this.facePattern2 = /f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
            // f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal ...
            this.facePattern3 = /f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
            // f vertex//normal vertex//normal vertex//normal ...
            this.facePattern4 = /f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
        }
        /**
         * Calls synchronously the MTL file attached to this obj.
         * Load function or importMesh function don't enable to load 2 files in the same time asynchronously.
         * Without this function materials are not displayed in the first frame (but displayed after).
         * In consequence it is impossible to get material information in your HTML file
         *
         * @param url The URL of the MTL file
         * @param rootUrl
         * @param onSuccess Callback function to be called when the MTL file is loaded
         * @private
         */
        OBJFileLoader.prototype._loadMTL = function (url, rootUrl, onSuccess) {
            //The complete path to the mtl file
            var pathOfFile = BABYLON.Tools.BaseUrl + rootUrl + url;
            // Loads through the babylon tools to allow fileInput search.
            BABYLON.Tools.LoadFile(pathOfFile, onSuccess, undefined, undefined, false, function () { console.warn("Error - Unable to load " + pathOfFile); });
        };
        OBJFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
            //get the meshes from OBJ file
            var loadedMeshes = this._parseSolid(meshesNames, scene, data, rootUrl);
            //Push meshes from OBJ file into the variable mesh of this function
            if (meshes) {
                loadedMeshes.forEach(function (mesh) {
                    meshes.push(mesh);
                });
            }
            return true;
        };
        OBJFileLoader.prototype.load = function (scene, data, rootUrl) {
            //Get the 3D model
            return this.importMesh(null, scene, data, rootUrl, null, null, null);
        };
        OBJFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
            var container = new BABYLON.AssetContainer(scene);
            this.importMesh(null, scene, data, rootUrl, container.meshes, null, null);
            container.removeAllFromScene();
            return container;
        };
        /**
         * Read the OBJ file and create an Array of meshes.
         * Each mesh contains all information given by the OBJ and the MTL file.
         * i.e. vertices positions and indices, optional normals values, optional UV values, optional material
         *
         * @param meshesNames
         * @param scene BABYLON.Scene The scene where are displayed the data
         * @param data String The content of the obj file
         * @param rootUrl String The path to the folder
         * @returns Array<AbstractMesh>
         * @private
         */
        OBJFileLoader.prototype._parseSolid = function (meshesNames, scene, data, rootUrl) {
            var positions = []; //values for the positions of vertices
            var normals = []; //Values for the normals
            var uvs = []; //Values for the textures
            var meshesFromObj = []; //[mesh] Contains all the obj meshes
            var handledMesh; //The current mesh of meshes array
            var indicesForBabylon = []; //The list of indices for VertexData
            var wrappedPositionForBabylon = []; //The list of position in vectors
            var wrappedUvsForBabylon = []; //Array with all value of uvs to match with the indices
            var wrappedNormalsForBabylon = []; //Array with all value of normals to match with the indices
            var tuplePosNorm = []; //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
            var curPositionInIndices = 0;
            var hasMeshes = false; //Meshes are defined in the file
            var unwrappedPositionsForBabylon = []; //Value of positionForBabylon w/o Vector3() [x,y,z]
            var unwrappedNormalsForBabylon = []; //Value of normalsForBabylon w/o Vector3()  [x,y,z]
            var unwrappedUVForBabylon = []; //Value of uvsForBabylon w/o Vector3()      [x,y,z]
            var triangles = []; //Indices from new triangles coming from polygons
            var materialNameFromObj = ""; //The name of the current material
            var fileToLoad = ""; //The name of the mtlFile to load
            var materialsFromMTLFile = new MTLFileLoader();
            var objMeshName = ""; //The name of the current obj mesh
            var increment = 1; //Id for meshes created by the multimaterial
            var isFirstMaterial = true;
            /**
             * Search for obj in the given array.
             * This function is called to check if a couple of data already exists in an array.
             *
             * If found, returns the index of the founded tuple index. Returns -1 if not found
             * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
             * @param obj Array<number>
             * @returns {boolean}
             */
            var isInArray = function (arr, obj) {
                if (!arr[obj[0]])
                    arr[obj[0]] = { normals: [], idx: [] };
                var idx = arr[obj[0]].normals.indexOf(obj[1]);
                return idx === -1 ? -1 : arr[obj[0]].idx[idx];
            };
            var isInArrayUV = function (arr, obj) {
                if (!arr[obj[0]])
                    arr[obj[0]] = { normals: [], idx: [], uv: [] };
                var idx = arr[obj[0]].normals.indexOf(obj[1]);
                if (idx != 1 && (obj[2] == arr[obj[0]].uv[idx])) {
                    return arr[obj[0]].idx[idx];
                }
                return -1;
            };
            /**
             * This function set the data for each triangle.
             * Data are position, normals and uvs
             * If a tuple of (position, normal) is not set, add the data into the corresponding array
             * If the tuple already exist, add only their indice
             *
             * @param indicePositionFromObj Integer The index in positions array
             * @param indiceUvsFromObj Integer The index in uvs array
             * @param indiceNormalFromObj Integer The index in normals array
             * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
             * @param textureVectorFromOBJ Vector3 The value of uvs
             * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
             */
            var setData = function (indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positionVectorFromOBJ, textureVectorFromOBJ, normalsVectorFromOBJ) {
                //Check if this tuple already exists in the list of tuples
                var _index;
                if (OBJFileLoader.OPTIMIZE_WITH_UV) {
                    _index = isInArrayUV(tuplePosNorm, [
                        indicePositionFromObj,
                        indiceNormalFromObj,
                        indiceUvsFromObj
                    ]);
                }
                else {
                    _index = isInArray(tuplePosNorm, [
                        indicePositionFromObj,
                        indiceNormalFromObj
                    ]);
                }
                //If it not exists
                if (_index == -1) {
                    //Add an new indice.
                    //The array of indices is only an array with his length equal to the number of triangles - 1.
                    //We add vertices data in this order
                    indicesForBabylon.push(wrappedPositionForBabylon.length);
                    //Push the position of vertice for Babylon
                    //Each element is a BABYLON.Vector3(x,y,z)
                    wrappedPositionForBabylon.push(positionVectorFromOBJ);
                    //Push the uvs for Babylon
                    //Each element is a BABYLON.Vector3(u,v)
                    wrappedUvsForBabylon.push(textureVectorFromOBJ);
                    //Push the normals for Babylon
                    //Each element is a BABYLON.Vector3(x,y,z)
                    wrappedNormalsForBabylon.push(normalsVectorFromOBJ);
                    //Add the tuple in the comparison list
                    tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
                    tuplePosNorm[indicePositionFromObj].idx.push(curPositionInIndices++);
                    if (OBJFileLoader.OPTIMIZE_WITH_UV)
                        tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj);
                }
                else {
                    //The tuple already exists
                    //Add the index of the already existing tuple
                    //At this index we can get the value of position, normal and uvs of vertex
                    indicesForBabylon.push(_index);
                }
            };
            /**
             * Transform BABYLON.Vector() object onto 3 digits in an array
             */
            var unwrapData = function () {
                //Every array has the same length
                for (var l = 0; l < wrappedPositionForBabylon.length; l++) {
                    //Push the x, y, z values of each element in the unwrapped array
                    unwrappedPositionsForBabylon.push(wrappedPositionForBabylon[l].x, wrappedPositionForBabylon[l].y, wrappedPositionForBabylon[l].z);
                    unwrappedNormalsForBabylon.push(wrappedNormalsForBabylon[l].x, wrappedNormalsForBabylon[l].y, wrappedNormalsForBabylon[l].z);
                    unwrappedUVForBabylon.push(wrappedUvsForBabylon[l].x, wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
                }
                // Reset arrays for the next new meshes
                wrappedPositionForBabylon = [];
                wrappedNormalsForBabylon = [];
                wrappedUvsForBabylon = [];
                tuplePosNorm = [];
                curPositionInIndices = 0;
            };
            /**
             * Create triangles from polygons by recursion
             * The best to understand how it works is to draw it in the same time you get the recursion.
             * It is important to notice that a triangle is a polygon
             * We get 4 patterns of face defined in OBJ File :
             * facePattern1 = ["1","2","3","4","5","6"]
             * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
             * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
             * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
             * Each pattern is divided by the same method
             * @param face Array[String] The indices of elements
             * @param v Integer The variable to increment
             */
            var getTriangles = function (face, v) {
                //Work for each element of the array
                if (v + 1 < face.length) {
                    //Add on the triangle variable the indexes to obtain triangles
                    triangles.push(face[0], face[v], face[v + 1]);
                    //Incrementation for recursion
                    v += 1;
                    //Recursion
                    getTriangles(face, v);
                }
                //Result obtained after 2 iterations:
                //Pattern1 => triangle = ["1","2","3","1","3","4"];
                //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
                //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
                //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 1
             * In this pattern we get vertice positions
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern1 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                //For each element in the triangles array.
                //This var could contains 1 to an infinity of triangles
                for (var k = 0; k < triangles.length; k++) {
                    // Set position indice
                    var indicePositionFromObj = parseInt(triangles[k]) - 1;
                    setData(indicePositionFromObj, 0, 0, //In the pattern 1, normals and uvs are not defined
                    positions[indicePositionFromObj], //Get the vectors data
                    BABYLON.Vector2.Zero(), BABYLON.Vector3.Up() //Create default vectors
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 2
             * In this pattern we get vertice positions and uvsu
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern2 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1/1"
                    //Split the data for getting position and uv
                    var point = triangles[k].split("/"); // ["1", "1"]
                    //Set position indice
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    //Set uv indice
                    var indiceUvsFromObj = parseInt(point[1]) - 1;
                    setData(indicePositionFromObj, indiceUvsFromObj, 0, //Default value for normals
                    positions[indicePositionFromObj], //Get the values for each element
                    uvs[indiceUvsFromObj], BABYLON.Vector3.Up() //Default value for normals
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 3
             * In this pattern we get vertice positions, uvs and normals
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern3 = function (face, v) {
                //Get the indices of triangles for each polygon
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1/1/1"
                    //Split the data for getting position, uv, and normals
                    var point = triangles[k].split("/"); // ["1", "1", "1"]
                    // Set position indice
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    // Set uv indice
                    var indiceUvsFromObj = parseInt(point[1]) - 1;
                    // Set normal indice
                    var indiceNormalFromObj = parseInt(point[2]) - 1;
                    setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positions[indicePositionFromObj], uvs[indiceUvsFromObj], normals[indiceNormalFromObj] //Set the vector for each component
                    );
                }
                //Reset variable for the next line
                triangles = [];
            };
            /**
             * Create triangles and push the data for each polygon for the pattern 4
             * In this pattern we get vertice positions and normals
             * @param face
             * @param v
             */
            var setDataForCurrentFaceWithPattern4 = function (face, v) {
                getTriangles(face, v);
                for (var k = 0; k < triangles.length; k++) {
                    //triangle[k] = "1//1"
                    //Split the data for getting position and normals
                    var point = triangles[k].split("//"); // ["1", "1"]
                    // We check indices, and normals
                    var indicePositionFromObj = parseInt(point[0]) - 1;
                    var indiceNormalFromObj = parseInt(point[1]) - 1;
                    setData(indicePositionFromObj, 1, //Default value for uv
                    indiceNormalFromObj, positions[indicePositionFromObj], //Get each vector of data
                    BABYLON.Vector2.Zero(), normals[indiceNormalFromObj]);
                }
                //Reset variable for the next line
                triangles = [];
            };
            var addPreviousObjMesh = function () {
                //Check if it is not the first mesh. Otherwise we don't have data.
                if (meshesFromObj.length > 0) {
                    //Get the previous mesh for applying the data about the faces
                    //=> in obj file, faces definition append after the name of the mesh
                    handledMesh = meshesFromObj[meshesFromObj.length - 1];
                    //Set the data into Array for the mesh
                    unwrapData();
                    // Reverse tab. Otherwise face are displayed in the wrong sens
                    indicesForBabylon.reverse();
                    //Set the information for the mesh
                    //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
                    handledMesh.indices = indicesForBabylon.slice();
                    handledMesh.positions = unwrappedPositionsForBabylon.slice();
                    handledMesh.normals = unwrappedNormalsForBabylon.slice();
                    handledMesh.uvs = unwrappedUVForBabylon.slice();
                    //Reset the array for the next mesh
                    indicesForBabylon = [];
                    unwrappedPositionsForBabylon = [];
                    unwrappedNormalsForBabylon = [];
                    unwrappedUVForBabylon = [];
                }
            };
            //Main function
            //Split the file into lines
            var lines = data.split('\n');
            //Look at each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                var result;
                //Comment or newLine
                if (line.length === 0 || line.charAt(0) === '#') {
                    continue;
                    //Get information about one position possible for the vertices
                }
                else if ((result = this.vertexPattern.exec(line)) !== null) {
                    //Create a Vector3 with the position x, y, z
                    //Value of result:
                    // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    //Add the Vector in the list of positions
                    positions.push(new BABYLON.Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                }
                else if ((result = this.normalPattern.exec(line)) !== null) {
                    //Create a Vector3 with the normals x, y, z
                    //Value of result
                    // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                    //Add the Vector in the list of normals
                    normals.push(new BABYLON.Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                }
                else if ((result = this.uvPattern.exec(line)) !== null) {
                    //Create a Vector2 with the normals u, v
                    //Value of result
                    // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
                    //Add the Vector in the list of uvs
                    uvs.push(new BABYLON.Vector2(parseFloat(result[1]), parseFloat(result[2])));
                    //Identify patterns of faces
                    //Face could be defined in different type of pattern
                }
                else if ((result = this.facePattern3.exec(line)) !== null) {
                    //Value of result:
                    //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), // ["1/1/1", "2/2/2", "3/3/3"]
                    1);
                }
                else if ((result = this.facePattern4.exec(line)) !== null) {
                    //Value of result:
                    //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern4(result[1].trim().split(" "), // ["1//1", "2//2", "3//3"]
                    1);
                }
                else if ((result = this.facePattern2.exec(line)) !== null) {
                    //Value of result:
                    //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), // ["1/1", "2/2", "3/3"]
                    1);
                }
                else if ((result = this.facePattern1.exec(line)) !== null) {
                    //Value of result
                    //["f 1 2 3", "1 2 3"...]
                    //Set the data for this face
                    setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), // ["1", "2", "3"]
                    1);
                    //Define a mesh or an object
                    //Each time this keyword is analysed, create a new Object with all data for creating a babylonMesh
                }
                else if (this.group.test(line) || this.obj.test(line)) {
                    //Create a new mesh corresponding to the name of the group.
                    //Definition of the mesh
                    var objMesh = 
                    //Set the name of the current obj mesh
                    {
                        name: line.substring(2).trim(),
                        indices: undefined,
                        positions: undefined,
                        normals: undefined,
                        uvs: undefined,
                        materialName: ""
                    };
                    addPreviousObjMesh();
                    //Push the last mesh created with only the name
                    meshesFromObj.push(objMesh);
                    //Set this variable to indicate that now meshesFromObj has objects defined inside
                    hasMeshes = true;
                    isFirstMaterial = true;
                    increment = 1;
                    //Keyword for applying a material
                }
                else if (this.usemtl.test(line)) {
                    //Get the name of the material
                    materialNameFromObj = line.substring(7).trim();
                    //If this new material is in the same mesh
                    if (!isFirstMaterial) {
                        //Set the data for the previous mesh
                        addPreviousObjMesh();
                        //Create a new mesh
                        var objMesh = 
                        //Set the name of the current obj mesh
                        {
                            name: objMeshName + "_mm" + increment.toString(),
                            indices: undefined,
                            positions: undefined,
                            normals: undefined,
                            uvs: undefined,
                            materialName: materialNameFromObj
                        };
                        increment++;
                        //If meshes are already defined
                        meshesFromObj.push(objMesh);
                    }
                    //Set the material name if the previous line define a mesh
                    if (hasMeshes && isFirstMaterial) {
                        //Set the material name to the previous mesh (1 material per mesh)
                        meshesFromObj[meshesFromObj.length - 1].materialName = materialNameFromObj;
                        isFirstMaterial = false;
                    }
                    //Keyword for loading the mtl file
                }
                else if (this.mtllib.test(line)) {
                    //Get the name of mtl file
                    fileToLoad = line.substring(7).trim();
                    //Apply smoothing
                }
                else if (this.smooth.test(line)) {
                    // smooth shading => apply smoothing
                    //Toda  y I don't know it work with babylon and with obj.
                    //With the obj file  an integer is set
                }
                else {
                    //If there is another possibility
                    console.log("Unhandled expression at line : " + line);
                }
            }
            //At the end of the file, add the last mesh into the meshesFromObj array
            if (hasMeshes) {
                //Set the data for the last mesh
                handledMesh = meshesFromObj[meshesFromObj.length - 1];
                //Reverse indices for displaying faces in the good sens
                indicesForBabylon.reverse();
                //Get the good array
                unwrapData();
                //Set array
                handledMesh.indices = indicesForBabylon;
                handledMesh.positions = unwrappedPositionsForBabylon;
                handledMesh.normals = unwrappedNormalsForBabylon;
                handledMesh.uvs = unwrappedUVForBabylon;
            }
            //If any o or g keyword found, create a mesj with a random id
            if (!hasMeshes) {
                // reverse tab of indices
                indicesForBabylon.reverse();
                //Get positions normals uvs
                unwrapData();
                //Set data for one mesh
                meshesFromObj.push({
                    name: BABYLON.Geometry.RandomId(),
                    indices: indicesForBabylon,
                    positions: unwrappedPositionsForBabylon,
                    normals: unwrappedNormalsForBabylon,
                    uvs: unwrappedUVForBabylon,
                    materialName: materialNameFromObj
                });
            }
            //Create a BABYLON.Mesh list
            var babylonMeshesArray = []; //The mesh for babylon
            var materialToUse = new Array();
            //Set data for each mesh
            for (var j = 0; j < meshesFromObj.length; j++) {
                //check meshesNames (stlFileLoader)
                if (meshesNames && meshesFromObj[j].name) {
                    if (meshesNames instanceof Array) {
                        if (meshesNames.indexOf(meshesFromObj[j].name) == -1) {
                            continue;
                        }
                    }
                    else {
                        if (meshesFromObj[j].name !== meshesNames) {
                            continue;
                        }
                    }
                }
                //Get the current mesh
                //Set the data with VertexBuffer for each mesh
                handledMesh = meshesFromObj[j];
                //Create a BABYLON.Mesh with the name of the obj mesh
                var babylonMesh = new BABYLON.Mesh(meshesFromObj[j].name, scene);
                //Push the name of the material to an array
                //This is indispensable for the importMesh function
                materialToUse.push(meshesFromObj[j].materialName);
                var vertexData = new BABYLON.VertexData(); //The container for the values
                //Set the data for the babylonMesh
                vertexData.positions = handledMesh.positions;
                vertexData.normals = handledMesh.normals;
                vertexData.uvs = handledMesh.uvs;
                vertexData.indices = handledMesh.indices;
                //Set the data from the VertexBuffer to the current BABYLON.Mesh
                vertexData.applyToMesh(babylonMesh);
                if (OBJFileLoader.INVERT_Y) {
                    babylonMesh.scaling.y *= -1;
                }
                //Push the mesh into an array
                babylonMeshesArray.push(babylonMesh);
            }
            //load the materials
            //Check if we have a file to load
            if (fileToLoad !== "") {
                //Load the file synchronously
                this._loadMTL(fileToLoad, rootUrl, function (dataLoaded) {
                    //Create materials thanks MTLLoader function
                    materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl);
                    //Look at each material loaded in the mtl file
                    for (var n = 0; n < materialsFromMTLFile.materials.length; n++) {
                        //Three variables to get all meshes with the same material
                        var startIndex = 0;
                        var _indices = [];
                        var _index;
                        //The material from MTL file is used in the meshes loaded
                        //Push the indice in an array
                        //Check if the material is not used for another mesh
                        while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                            _indices.push(_index);
                            startIndex = _index + 1;
                        }
                        //If the material is not used dispose it
                        if (_index == -1 && _indices.length == 0) {
                            //If the material is not needed, remove it
                            materialsFromMTLFile.materials[n].dispose();
                        }
                        else {
                            for (var o = 0; o < _indices.length; o++) {
                                //Apply the material to the BABYLON.Mesh for each mesh with the material
                                babylonMeshesArray[_indices[o]].material = materialsFromMTLFile.materials[n];
                            }
                        }
                    }
                });
            }
            //Return an array with all BABYLON.Mesh
            return babylonMeshesArray;
        };
        OBJFileLoader.OPTIMIZE_WITH_UV = false;
        OBJFileLoader.INVERT_Y = false;
        return OBJFileLoader;
    }());
    BABYLON.OBJFileLoader = OBJFileLoader;
    if (BABYLON.SceneLoader) {
        //Add this loader into the register plugin
        BABYLON.SceneLoader.RegisterPlugin(new OBJFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.objFileLoader.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * Mode that determines the coordinate system to use.
     */
    var GLTFLoaderCoordinateSystemMode;
    (function (GLTFLoaderCoordinateSystemMode) {
        /**
         * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
        /**
         * Sets the useRightHandedSystem flag on the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 1] = "FORCE_RIGHT_HANDED";
    })(GLTFLoaderCoordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode || (BABYLON.GLTFLoaderCoordinateSystemMode = {}));
    /**
     * Mode that determines what animations will start.
     */
    var GLTFLoaderAnimationStartMode;
    (function (GLTFLoaderAnimationStartMode) {
        /**
         * No animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["NONE"] = 0] = "NONE";
        /**
         * The first animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["FIRST"] = 1] = "FIRST";
        /**
         * All animations will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["ALL"] = 2] = "ALL";
    })(GLTFLoaderAnimationStartMode = BABYLON.GLTFLoaderAnimationStartMode || (BABYLON.GLTFLoaderAnimationStartMode = {}));
    /**
     * Loader state.
     */
    var GLTFLoaderState;
    (function (GLTFLoaderState) {
        /**
         * The asset is loading.
         */
        GLTFLoaderState[GLTFLoaderState["LOADING"] = 0] = "LOADING";
        /**
         * The asset is ready for rendering.
         */
        GLTFLoaderState[GLTFLoaderState["READY"] = 1] = "READY";
        /**
         * The asset is completely loaded.
         */
        GLTFLoaderState[GLTFLoaderState["COMPLETE"] = 2] = "COMPLETE";
    })(GLTFLoaderState = BABYLON.GLTFLoaderState || (BABYLON.GLTFLoaderState = {}));
    /**
     * File loader for loading glTF files into a scene.
     */
    var GLTFFileLoader = /** @class */ (function () {
        function GLTFFileLoader() {
            // #region Common options
            /**
             * Raised when the asset has been parsed
             */
            this.onParsedObservable = new BABYLON.Observable();
            // #endregion
            // #region V2 options
            /**
             * The coordinate system mode. Defaults to AUTO.
             */
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            /**
            * The animation start mode. Defaults to FIRST.
            */
            this.animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
            /**
             * Defines if the loader should compile materials before raising the success callback. Defaults to false.
             */
            this.compileMaterials = false;
            /**
             * Defines if the loader should also compile materials with clip planes. Defaults to false.
             */
            this.useClipPlane = false;
            /**
             * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
             */
            this.compileShadowGenerators = false;
            /**
             * Defines if the Alpha blended materials are only applied as coverage.
             * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
             * If true, no extra effects are applied to transparent pixels.
             */
            this.transparencyAsCoverage = false;
            /** @hidden */
            this._normalizeAnimationGroupsToBeginAtZero = true;
            /**
             * Function called before loading a url referenced by the asset.
             */
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            /**
             * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            this.onMeshLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            this.onTextureLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a material after parsing the glTF properties of the material.
             */
            this.onMaterialLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            this.onCameraLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
             * For assets with LODs, raised when all of the LODs are complete.
             * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
             */
            this.onCompleteObservable = new BABYLON.Observable();
            /**
             * Observable raised after the loader is disposed.
             */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
             * Observable raised after a loader extension is created.
             * Set additional options for a loader extension in this event.
             */
            this.onExtensionLoadedObservable = new BABYLON.Observable();
            // #endregion
            this._loader = null;
            /**
             * Name of the loader ("gltf")
             */
            this.name = "gltf";
            /**
             * Supported file extensions of the loader (.gltf, .glb)
             */
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        Object.defineProperty(GLTFFileLoader.prototype, "onParsed", {
            /**
             * Raised when the asset has been parsed
             */
            set: function (callback) {
                if (this._onParsedObserver) {
                    this.onParsedObservable.remove(this._onParsedObserver);
                }
                this._onParsedObserver = this.onParsedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMeshLoaded", {
            /**
             * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            set: function (callback) {
                if (this._onMeshLoadedObserver) {
                    this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
                }
                this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onTextureLoaded", {
            /**
             * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            set: function (callback) {
                if (this._onTextureLoadedObserver) {
                    this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver);
                }
                this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMaterialLoaded", {
            /**
             * Callback raised when the loader creates a material after parsing the glTF properties of the material.
             */
            set: function (callback) {
                if (this._onMaterialLoadedObserver) {
                    this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
                }
                this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onCameraLoaded", {
            /**
             * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            set: function (callback) {
                if (this._onCameraLoadedObserver) {
                    this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver);
                }
                this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onComplete", {
            /**
             * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
             */
            set: function (callback) {
                if (this._onCompleteObserver) {
                    this.onCompleteObservable.remove(this._onCompleteObserver);
                }
                this._onCompleteObserver = this.onCompleteObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onDispose", {
            /**
             * Callback raised after the loader is disposed.
             */
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onExtensionLoaded", {
            /**
             * Callback raised after a loader extension is created.
             */
            set: function (callback) {
                if (this._onExtensionLoadedObserver) {
                    this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver);
                }
                this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns a promise that resolves when the asset is completely loaded.
         */
        GLTFFileLoader.prototype.whenCompleteAsync = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this.onCompleteObservable.add(function () {
                    resolve();
                }, undefined, undefined, undefined, true);
            });
        };
        Object.defineProperty(GLTFFileLoader.prototype, "loaderState", {
            /**
             * The loader state or null if the loader is not active.
             */
            get: function () {
                return this._loader ? this._loader.state : null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        GLTFFileLoader.prototype.dispose = function () {
            if (this._loader) {
                this._loader.dispose();
                this._loader = null;
            }
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
            this.onCameraLoadedObservable.clear();
            this.onCompleteObservable.clear();
            this.onExtensionLoadedObservable.clear();
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onProgress);
            });
        };
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.loadAsync(scene, loaderData, rootUrl, onProgress);
            });
        };
        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded asset container
         */
        GLTFFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(null, scene, loaderData, rootUrl, onProgress).then(function (result) {
                    var container = new BABYLON.AssetContainer(scene);
                    Array.prototype.push.apply(container.meshes, result.meshes);
                    Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                    Array.prototype.push.apply(container.skeletons, result.skeletons);
                    Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                    container.removeAllFromScene();
                    return container;
                });
            });
        };
        /**
         * If the data string can be loaded directly.
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        /**
         * Instantiates a glTF file loader plugin.
         * @returns the created plugin
         */
        GLTFFileLoader.prototype.createPlugin = function () {
            return new GLTFFileLoader();
        };
        GLTFFileLoader.prototype._parse = function (data) {
            var parsedData;
            if (data instanceof ArrayBuffer) {
                parsedData = GLTFFileLoader._parseBinary(data);
            }
            else {
                parsedData = {
                    json: JSON.parse(data),
                    bin: null
                };
            }
            this.onParsedObservable.notifyObservers(parsedData);
            this.onParsedObservable.clear();
            return parsedData;
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var _this = this;
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                throw new Error("Invalid version: " + asset.version);
            }
            if (asset.minVersion !== undefined) {
                var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
                if (!minVersion) {
                    throw new Error("Invalid minimum version: " + asset.minVersion);
                }
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    throw new Error("Incompatible minimum version: " + asset.minVersion);
                }
            }
            var createLoaders = {
                1: GLTFFileLoader.CreateGLTFLoaderV1,
                2: GLTFFileLoader.CreateGLTFLoaderV2
            };
            var createLoader = createLoaders[version.major];
            if (!createLoader) {
                throw new Error("Unsupported version: " + asset.version);
            }
            var loader = createLoader();
            loader.coordinateSystemMode = this.coordinateSystemMode;
            loader.animationStartMode = this.animationStartMode;
            loader.compileMaterials = this.compileMaterials;
            loader.useClipPlane = this.useClipPlane;
            loader.compileShadowGenerators = this.compileShadowGenerators;
            loader.transparencyAsCoverage = this.transparencyAsCoverage;
            loader._normalizeAnimationGroupsToBeginAtZero = this._normalizeAnimationGroupsToBeginAtZero;
            loader.preprocessUrlAsync = this.preprocessUrlAsync;
            loader.onMeshLoadedObservable.add(function (mesh) { return _this.onMeshLoadedObservable.notifyObservers(mesh); });
            loader.onTextureLoadedObservable.add(function (texture) { return _this.onTextureLoadedObservable.notifyObservers(texture); });
            loader.onMaterialLoadedObservable.add(function (material) { return _this.onMaterialLoadedObservable.notifyObservers(material); });
            loader.onCameraLoadedObservable.add(function (camera) { return _this.onCameraLoadedObservable.notifyObservers(camera); });
            loader.onExtensionLoadedObservable.add(function (extension) { return _this.onExtensionLoadedObservable.notifyObservers(extension); });
            loader.onCompleteObservable.add(function () {
                _this.onMeshLoadedObservable.clear();
                _this.onTextureLoadedObservable.clear();
                _this.onMaterialLoadedObservable.clear();
                _this.onCameraLoadedObservable.clear();
                _this.onExtensionLoadedObservable.clear();
                _this.onCompleteObservable.notifyObservers(_this);
                _this.onCompleteObservable.clear();
            });
            return loader;
        };
        GLTFFileLoader._parseBinary = function (data) {
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }
            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }
            throw new Error("Unsupported version: " + version);
        };
        GLTFFileLoader._parseV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
            switch (contentFormat) {
                case ContentFormat.JSON: {
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                }
                default: {
                    throw new Error("Unexpected content format: " + contentFormat);
                }
            }
            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);
            return {
                json: content,
                bin: body
            };
        };
        GLTFFileLoader._parseV2 = function (binaryReader) {
            var ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };
            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                throw new Error("First chunk format is not JSON");
            }
            var json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));
            // Look for BIN chunk
            var bin = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                var chunkLength_1 = binaryReader.readUint32();
                var chunkFormat_1 = binaryReader.readUint32();
                switch (chunkFormat_1) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        bin = binaryReader.readUint8Array(chunkLength_1);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength_1);
                        break;
                    }
                }
            }
            return {
                json: json,
                bin: bin
            };
        };
        GLTFFileLoader._parseVersion = function (version) {
            if (version === "1.0" || version === "1.0.1") {
                return {
                    major: 1,
                    minor: 0
                };
            }
            var match = (version + "").match(/^(\d+)\.(\d+)/);
            if (!match) {
                return null;
            }
            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2])
            };
        };
        GLTFFileLoader._compareVersion = function (a, b) {
            if (a.major > b.major)
                return 1;
            if (a.major < b.major)
                return -1;
            if (a.minor > b.minor)
                return 1;
            if (a.minor < b.minor)
                return -1;
            return 0;
        };
        GLTFFileLoader._decodeBufferToText = function (buffer) {
            var result = "";
            var length = buffer.byteLength;
            for (var i = 0; i < length; i++) {
                result += String.fromCharCode(buffer[i]);
            }
            return result;
        };
        // #endregion
        // #region V1 options
        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
         * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
         * Defaults to true.
         */
        GLTFFileLoader.IncrementalLoading = true;
        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
         * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
         */
        GLTFFileLoader.HomogeneousCoordinates = false;
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = /** @class */ (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getPosition = function () {
            return this._byteOffset;
        };
        BinaryReader.prototype.getLength = function () {
            return this._arrayBuffer.byteLength;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.readUint8Array = function (length) {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        BinaryReader.prototype.skipBytes = function (length) {
            this._byteOffset += length;
        };
        return BinaryReader;
    }());
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFFileLoader.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF1.EComponentType || (GLTF1.EComponentType = {}));
        var EShaderType;
        (function (EShaderType) {
            EShaderType[EShaderType["FRAGMENT"] = 35632] = "FRAGMENT";
            EShaderType[EShaderType["VERTEX"] = 35633] = "VERTEX";
        })(EShaderType = GLTF1.EShaderType || (GLTF1.EShaderType = {}));
        var EParameterType;
        (function (EParameterType) {
            EParameterType[EParameterType["BYTE"] = 5120] = "BYTE";
            EParameterType[EParameterType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EParameterType[EParameterType["SHORT"] = 5122] = "SHORT";
            EParameterType[EParameterType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EParameterType[EParameterType["INT"] = 5124] = "INT";
            EParameterType[EParameterType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EParameterType[EParameterType["FLOAT"] = 5126] = "FLOAT";
            EParameterType[EParameterType["FLOAT_VEC2"] = 35664] = "FLOAT_VEC2";
            EParameterType[EParameterType["FLOAT_VEC3"] = 35665] = "FLOAT_VEC3";
            EParameterType[EParameterType["FLOAT_VEC4"] = 35666] = "FLOAT_VEC4";
            EParameterType[EParameterType["INT_VEC2"] = 35667] = "INT_VEC2";
            EParameterType[EParameterType["INT_VEC3"] = 35668] = "INT_VEC3";
            EParameterType[EParameterType["INT_VEC4"] = 35669] = "INT_VEC4";
            EParameterType[EParameterType["BOOL"] = 35670] = "BOOL";
            EParameterType[EParameterType["BOOL_VEC2"] = 35671] = "BOOL_VEC2";
            EParameterType[EParameterType["BOOL_VEC3"] = 35672] = "BOOL_VEC3";
            EParameterType[EParameterType["BOOL_VEC4"] = 35673] = "BOOL_VEC4";
            EParameterType[EParameterType["FLOAT_MAT2"] = 35674] = "FLOAT_MAT2";
            EParameterType[EParameterType["FLOAT_MAT3"] = 35675] = "FLOAT_MAT3";
            EParameterType[EParameterType["FLOAT_MAT4"] = 35676] = "FLOAT_MAT4";
            EParameterType[EParameterType["SAMPLER_2D"] = 35678] = "SAMPLER_2D";
        })(EParameterType = GLTF1.EParameterType || (GLTF1.EParameterType = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF1.ETextureWrapMode || (GLTF1.ETextureWrapMode = {}));
        var ETextureFilterType;
        (function (ETextureFilterType) {
            ETextureFilterType[ETextureFilterType["NEAREST"] = 9728] = "NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR"] = 9728] = "LINEAR";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureFilterType = GLTF1.ETextureFilterType || (GLTF1.ETextureFilterType = {}));
        var ETextureFormat;
        (function (ETextureFormat) {
            ETextureFormat[ETextureFormat["ALPHA"] = 6406] = "ALPHA";
            ETextureFormat[ETextureFormat["RGB"] = 6407] = "RGB";
            ETextureFormat[ETextureFormat["RGBA"] = 6408] = "RGBA";
            ETextureFormat[ETextureFormat["LUMINANCE"] = 6409] = "LUMINANCE";
            ETextureFormat[ETextureFormat["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        })(ETextureFormat = GLTF1.ETextureFormat || (GLTF1.ETextureFormat = {}));
        var ECullingType;
        (function (ECullingType) {
            ECullingType[ECullingType["FRONT"] = 1028] = "FRONT";
            ECullingType[ECullingType["BACK"] = 1029] = "BACK";
            ECullingType[ECullingType["FRONT_AND_BACK"] = 1032] = "FRONT_AND_BACK";
        })(ECullingType = GLTF1.ECullingType || (GLTF1.ECullingType = {}));
        var EBlendingFunction;
        (function (EBlendingFunction) {
            EBlendingFunction[EBlendingFunction["ZERO"] = 0] = "ZERO";
            EBlendingFunction[EBlendingFunction["ONE"] = 1] = "ONE";
            EBlendingFunction[EBlendingFunction["SRC_COLOR"] = 768] = "SRC_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_COLOR"] = 769] = "ONE_MINUS_SRC_COLOR";
            EBlendingFunction[EBlendingFunction["DST_COLOR"] = 774] = "DST_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_COLOR"] = 775] = "ONE_MINUS_DST_COLOR";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA"] = 770] = "SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_ALPHA"] = 771] = "ONE_MINUS_SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["DST_ALPHA"] = 772] = "DST_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_ALPHA"] = 773] = "ONE_MINUS_DST_ALPHA";
            EBlendingFunction[EBlendingFunction["CONSTANT_COLOR"] = 32769] = "CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_COLOR"] = 32770] = "ONE_MINUS_CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["CONSTANT_ALPHA"] = 32771] = "CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_ALPHA"] = 32772] = "ONE_MINUS_CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA_SATURATE"] = 776] = "SRC_ALPHA_SATURATE";
        })(EBlendingFunction = GLTF1.EBlendingFunction || (GLTF1.EBlendingFunction = {}));
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Tokenizer. Used for shaders compatibility
        * Automatically map world, view, projection, worldViewProjection, attributes and so on
        */
        var ETokenType;
        (function (ETokenType) {
            ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
            ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
            ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
        })(ETokenType || (ETokenType = {}));
        var Tokenizer = /** @class */ (function () {
            function Tokenizer(toParse) {
                this._pos = 0;
                this.currentToken = ETokenType.UNKNOWN;
                this.currentIdentifier = "";
                this.currentString = "";
                this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
                this._toParse = toParse;
                this._maxPos = toParse.length;
            }
            Tokenizer.prototype.getNextToken = function () {
                if (this.isEnd())
                    return ETokenType.END_OF_INPUT;
                this.currentString = this.read();
                this.currentToken = ETokenType.UNKNOWN;
                if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
                    this.currentToken = ETokenType.IDENTIFIER;
                    this.currentIdentifier = this.currentString;
                    while (!this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_")) {
                        this.currentIdentifier += this.currentString;
                        this.forward();
                    }
                }
                return this.currentToken;
            };
            Tokenizer.prototype.peek = function () {
                return this._toParse[this._pos];
            };
            Tokenizer.prototype.read = function () {
                return this._toParse[this._pos++];
            };
            Tokenizer.prototype.forward = function () {
                this._pos++;
            };
            Tokenizer.prototype.isEnd = function () {
                return this._pos >= this._maxPos;
            };
            return Tokenizer;
        }());
        /**
        * Values
        */
        var glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
        var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];
        var glTFAnimationPaths = ["translation", "rotation", "scale"];
        var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];
        /**
        * Parse
        */
        var parseBuffers = function (parsedBuffers, gltfRuntime) {
            for (var buf in parsedBuffers) {
                var parsedBuffer = parsedBuffers[buf];
                gltfRuntime.buffers[buf] = parsedBuffer;
                gltfRuntime.buffersCount++;
            }
        };
        var parseShaders = function (parsedShaders, gltfRuntime) {
            for (var sha in parsedShaders) {
                var parsedShader = parsedShaders[sha];
                gltfRuntime.shaders[sha] = parsedShader;
                gltfRuntime.shaderscount++;
            }
        };
        var parseObject = function (parsedObjects, runtimeProperty, gltfRuntime) {
            for (var object in parsedObjects) {
                var parsedObject = parsedObjects[object];
                gltfRuntime[runtimeProperty][object] = parsedObject;
            }
        };
        /**
        * Utils
        */
        var normalizeUVs = function (buffer) {
            if (!buffer) {
                return;
            }
            for (var i = 0; i < buffer.length / 2; i++) {
                buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
            }
        };
        var getAttribute = function (attributeParameter) {
            if (attributeParameter.semantic === "NORMAL") {
                return "normal";
            }
            else if (attributeParameter.semantic === "POSITION") {
                return "position";
            }
            else if (attributeParameter.semantic === "JOINT") {
                return "matricesIndices";
            }
            else if (attributeParameter.semantic === "WEIGHT") {
                return "matricesWeights";
            }
            else if (attributeParameter.semantic === "COLOR") {
                return "color";
            }
            else if (attributeParameter.semantic && attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
                var channel = Number(attributeParameter.semantic.split("_")[1]);
                return "uv" + (channel === 0 ? "" : channel + 1);
            }
            return null;
        };
        /**
        * Loads and creates animations
        */
        var loadAnimations = function (gltfRuntime) {
            for (var anim in gltfRuntime.animations) {
                var animation = gltfRuntime.animations[anim];
                if (!animation.channels || !animation.samplers) {
                    continue;
                }
                var lastAnimation = null;
                for (var i = 0; i < animation.channels.length; i++) {
                    // Get parameters and load buffers
                    var channel = animation.channels[i];
                    var sampler = animation.samplers[channel.sampler];
                    if (!sampler) {
                        continue;
                    }
                    var inputData = null;
                    var outputData = null;
                    if (animation.parameters) {
                        inputData = animation.parameters[sampler.input];
                        outputData = animation.parameters[sampler.output];
                    }
                    else {
                        inputData = sampler.input;
                        outputData = sampler.output;
                    }
                    var bufferInput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                    var bufferOutput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
                    var targetID = channel.target.id;
                    var targetNode = gltfRuntime.scene.getNodeByID(targetID);
                    if (targetNode === null) {
                        targetNode = gltfRuntime.scene.getNodeByName(targetID);
                    }
                    if (targetNode === null) {
                        BABYLON.Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                        continue;
                    }
                    var isBone = targetNode instanceof BABYLON.Bone;
                    // Get target path (position, rotation or scaling)
                    var targetPath = channel.target.path;
                    var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                    if (targetPathIndex !== -1) {
                        targetPath = babylonAnimationPaths[targetPathIndex];
                    }
                    // Determine animation type
                    var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                    if (!isBone) {
                        if (targetPath === "rotationQuaternion") {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            targetNode.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        else {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        }
                    }
                    // Create animation and key frames
                    var babylonAnimation = null;
                    var keys = [];
                    var arrayOffset = 0;
                    var modifyKey = false;
                    if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                        babylonAnimation = lastAnimation;
                        modifyKey = true;
                    }
                    if (!modifyKey) {
                        babylonAnimation = new BABYLON.Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                    }
                    // For each frame
                    for (var j = 0; j < bufferInput.length; j++) {
                        var value = null;
                        if (targetPath === "rotationQuaternion") { // VEC4
                            value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                            arrayOffset += 4;
                        }
                        else { // Position and scaling are VEC3
                            value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                            arrayOffset += 3;
                        }
                        if (isBone) {
                            var bone = targetNode;
                            var translation = BABYLON.Vector3.Zero();
                            var rotationQuaternion = new BABYLON.Quaternion();
                            var scaling = BABYLON.Vector3.Zero();
                            // Warning on decompose
                            var mat = bone.getBaseMatrix();
                            if (modifyKey && lastAnimation) {
                                mat = lastAnimation.getKeys()[j].value;
                            }
                            mat.decompose(scaling, rotationQuaternion, translation);
                            if (targetPath === "position") {
                                translation = value;
                            }
                            else if (targetPath === "rotationQuaternion") {
                                rotationQuaternion = value;
                            }
                            else {
                                scaling = value;
                            }
                            value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
                        }
                        if (!modifyKey) {
                            keys.push({
                                frame: bufferInput[j],
                                value: value
                            });
                        }
                        else if (lastAnimation) {
                            lastAnimation.getKeys()[j].value = value;
                        }
                    }
                    // Finish
                    if (!modifyKey && babylonAnimation) {
                        babylonAnimation.setKeys(keys);
                        targetNode.animations.push(babylonAnimation);
                    }
                    lastAnimation = babylonAnimation;
                    gltfRuntime.scene.stopAnimation(targetNode);
                    gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                }
            }
        };
        /**
        * Returns the bones transformation matrix
        */
        var configureBoneTransformation = function (node) {
            var mat = null;
            if (node.translation || node.rotation || node.scale) {
                var scale = BABYLON.Vector3.FromArray(node.scale || [1, 1, 1]);
                var rotation = BABYLON.Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
                var position = BABYLON.Vector3.FromArray(node.translation || [0, 0, 0]);
                mat = BABYLON.Matrix.Compose(scale, rotation, position);
            }
            else {
                mat = BABYLON.Matrix.FromArray(node.matrix);
            }
            return mat;
        };
        /**
        * Returns the parent bone
        */
        var getParentBone = function (gltfRuntime, skins, jointName, newSkeleton) {
            // Try to find
            for (var i = 0; i < newSkeleton.bones.length; i++) {
                if (newSkeleton.bones[i].name === jointName) {
                    return newSkeleton.bones[i];
                }
            }
            // Not found, search in gltf nodes
            var nodes = gltfRuntime.nodes;
            for (var nde in nodes) {
                var node = nodes[nde];
                if (!node.jointName) {
                    continue;
                }
                var children = node.children;
                for (var i = 0; i < children.length; i++) {
                    var child = gltfRuntime.nodes[children[i]];
                    if (!child.jointName) {
                        continue;
                    }
                    if (child.jointName === jointName) {
                        var mat = configureBoneTransformation(node);
                        var bone = new BABYLON.Bone(node.name || "", newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                        bone.id = nde;
                        return bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the appropriate root node
        */
        var getNodeToRoot = function (nodesToRoot, id) {
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                    var child = nodeToRoot.node.children[j];
                    if (child === id) {
                        return nodeToRoot.bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the node with the joint name
        */
        var getJointNode = function (gltfRuntime, jointName) {
            var nodes = gltfRuntime.nodes;
            var node = nodes[jointName];
            if (node) {
                return {
                    node: node,
                    id: jointName
                };
            }
            for (var nde in nodes) {
                node = nodes[nde];
                if (node.jointName === jointName) {
                    return {
                        node: node,
                        id: nde
                    };
                }
            }
            return null;
        };
        /**
        * Checks if a nodes is in joints
        */
        var nodeIsInJoints = function (skins, id) {
            for (var i = 0; i < skins.jointNames.length; i++) {
                if (skins.jointNames[i] === id) {
                    return true;
                }
            }
            return false;
        };
        /**
        * Fills the nodes to root for bones and builds hierarchy
        */
        var getNodesToRoot = function (gltfRuntime, newSkeleton, skins, nodesToRoot) {
            // Creates nodes for root
            for (var nde in gltfRuntime.nodes) {
                var node = gltfRuntime.nodes[nde];
                var id = nde;
                if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                    continue;
                }
                // Create node to root bone
                var mat = configureBoneTransformation(node);
                var bone = new BABYLON.Bone(node.name || "", newSkeleton, null, mat);
                bone.id = id;
                nodesToRoot.push({ bone: bone, node: node, id: id });
            }
            // Parenting
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                var children = nodeToRoot.node.children;
                for (var j = 0; j < children.length; j++) {
                    var child = null;
                    for (var k = 0; k < nodesToRoot.length; k++) {
                        if (nodesToRoot[k].id === children[j]) {
                            child = nodesToRoot[k];
                            break;
                        }
                    }
                    if (child) {
                        child.bone._parent = nodeToRoot.bone;
                        nodeToRoot.bone.children.push(child.bone);
                    }
                }
            }
        };
        /**
        * Imports a skeleton
        */
        var importSkeleton = function (gltfRuntime, skins, mesh, newSkeleton, id) {
            if (!newSkeleton) {
                newSkeleton = new BABYLON.Skeleton(skins.name || "", "", gltfRuntime.scene);
            }
            if (!skins.babylonSkeleton) {
                return newSkeleton;
            }
            // Find the root bones
            var nodesToRoot = [];
            var nodesToRootToAdd = [];
            getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
            newSkeleton.bones = [];
            // Joints
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                var node = jointNode.node;
                if (!node) {
                    BABYLON.Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                    continue;
                }
                var id = jointNode.id;
                // Optimize, if the bone already exists...
                var existingBone = gltfRuntime.scene.getBoneByID(id);
                if (existingBone) {
                    newSkeleton.bones.push(existingBone);
                    continue;
                }
                // Search for parent bone
                var foundBone = false;
                var parentBone = null;
                for (var j = 0; j < i; j++) {
                    var jointNode_1 = getJointNode(gltfRuntime, skins.jointNames[j]);
                    if (!jointNode_1) {
                        continue;
                    }
                    var joint = jointNode_1.node;
                    if (!joint) {
                        BABYLON.Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                        continue;
                    }
                    var children = joint.children;
                    if (!children) {
                        continue;
                    }
                    foundBone = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k] === id) {
                            parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
                            foundBone = true;
                            break;
                        }
                    }
                    if (foundBone) {
                        break;
                    }
                }
                // Create bone
                var mat = configureBoneTransformation(node);
                if (!parentBone && nodesToRoot.length > 0) {
                    parentBone = getNodeToRoot(nodesToRoot, id);
                    if (parentBone) {
                        if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                            nodesToRootToAdd.push(parentBone);
                        }
                    }
                }
                var bone = new BABYLON.Bone(node.jointName || "", newSkeleton, parentBone, mat);
                bone.id = id;
            }
            // Polish
            var bones = newSkeleton.bones;
            newSkeleton.bones = [];
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                for (var j = 0; j < bones.length; j++) {
                    if (bones[j].id === jointNode.id) {
                        newSkeleton.bones.push(bones[j]);
                        break;
                    }
                }
            }
            newSkeleton.prepare();
            // Finish
            for (var i = 0; i < nodesToRootToAdd.length; i++) {
                newSkeleton.bones.push(nodesToRootToAdd[i]);
            }
            return newSkeleton;
        };
        /**
        * Imports a mesh and its geometries
        */
        var importMesh = function (gltfRuntime, node, meshes, id, newMesh) {
            if (!newMesh) {
                newMesh = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                newMesh.id = id;
            }
            if (!node.babylonNode) {
                return newMesh;
            }
            var subMaterials = [];
            var vertexData = null;
            var verticesStarts = new Array();
            var verticesCounts = new Array();
            var indexStarts = new Array();
            var indexCounts = new Array();
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                // Positions, normals and UVs
                for (var i = 0; i < mesh.primitives.length; i++) {
                    // Temporary vertex data
                    var tempVertexData = new BABYLON.VertexData();
                    var primitive = mesh.primitives[i];
                    if (primitive.mode !== 4) {
                        // continue;
                    }
                    var attributes = primitive.attributes;
                    var accessor = null;
                    var buffer = null;
                    // Set positions, normal and uvs
                    for (var semantic in attributes) {
                        // Link accessor and buffer view
                        accessor = gltfRuntime.accessors[attributes[semantic]];
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        if (semantic === "NORMAL") {
                            tempVertexData.normals = new Float32Array(buffer.length);
                            tempVertexData.normals.set(buffer);
                        }
                        else if (semantic === "POSITION") {
                            if (BABYLON.GLTFFileLoader.HomogeneousCoordinates) {
                                tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);
                                for (var j = 0; j < buffer.length; j += 4) {
                                    tempVertexData.positions[j] = buffer[j];
                                    tempVertexData.positions[j + 1] = buffer[j + 1];
                                    tempVertexData.positions[j + 2] = buffer[j + 2];
                                }
                            }
                            else {
                                tempVertexData.positions = new Float32Array(buffer.length);
                                tempVertexData.positions.set(buffer);
                            }
                            verticesCounts.push(tempVertexData.positions.length);
                        }
                        else if (semantic.indexOf("TEXCOORD_") !== -1) {
                            var channel = Number(semantic.split("_")[1]);
                            var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                            var uvs = new Float32Array(buffer.length);
                            uvs.set(buffer);
                            normalizeUVs(uvs);
                            tempVertexData.set(uvs, uvKind);
                        }
                        else if (semantic === "JOINT") {
                            tempVertexData.matricesIndices = new Float32Array(buffer.length);
                            tempVertexData.matricesIndices.set(buffer);
                        }
                        else if (semantic === "WEIGHT") {
                            tempVertexData.matricesWeights = new Float32Array(buffer.length);
                            tempVertexData.matricesWeights.set(buffer);
                        }
                        else if (semantic === "COLOR") {
                            tempVertexData.colors = new Float32Array(buffer.length);
                            tempVertexData.colors.set(buffer);
                        }
                    }
                    // Indices
                    accessor = gltfRuntime.accessors[primitive.indices];
                    if (accessor) {
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        tempVertexData.indices = new Int32Array(buffer.length);
                        tempVertexData.indices.set(buffer);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    else {
                        // Set indices on the fly
                        var indices = [];
                        for (var j = 0; j < tempVertexData.positions.length / 3; j++) {
                            indices.push(j);
                        }
                        tempVertexData.indices = new Int32Array(indices);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    if (!vertexData) {
                        vertexData = tempVertexData;
                    }
                    else {
                        vertexData.merge(tempVertexData);
                    }
                    // Sub material
                    var material_1 = gltfRuntime.scene.getMaterialByID(primitive.material);
                    subMaterials.push(material_1 === null ? GLTF1.GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material_1);
                    // Update vertices start and index start
                    verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                    indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
                }
            }
            var material;
            if (subMaterials.length > 1) {
                material = new BABYLON.MultiMaterial("multimat" + id, gltfRuntime.scene);
                material.subMaterials = subMaterials;
            }
            else {
                material = new BABYLON.StandardMaterial("multimat" + id, gltfRuntime.scene);
            }
            if (subMaterials.length === 1) {
                material = subMaterials[0];
            }
            if (!newMesh.material) {
                newMesh.material = material;
            }
            // Apply geometry
            new BABYLON.Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
            newMesh.computeWorldMatrix(true);
            // Apply submeshes
            newMesh.subMeshes = [];
            var index = 0;
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                for (var i = 0; i < mesh.primitives.length; i++) {
                    if (mesh.primitives[i].mode !== 4) {
                        //continue;
                    }
                    BABYLON.SubMesh.AddToMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                    index++;
                }
            }
            // Finish
            return newMesh;
        };
        /**
        * Configure node transformation from position, rotation and scaling
        */
        var configureNode = function (newNode, position, rotation, scaling) {
            if (newNode.position) {
                newNode.position = position;
            }
            if (newNode.rotationQuaternion || newNode.rotation) {
                newNode.rotationQuaternion = rotation;
            }
            if (newNode.scaling) {
                newNode.scaling = scaling;
            }
        };
        /**
        * Configures node from transformation matrix
        */
        var configureNodeFromMatrix = function (newNode, node, parent) {
            if (node.matrix) {
                var position = new BABYLON.Vector3(0, 0, 0);
                var rotation = new BABYLON.Quaternion();
                var scaling = new BABYLON.Vector3(0, 0, 0);
                var mat = BABYLON.Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
                configureNode(newNode, position, rotation, scaling);
            }
            else if (node.translation && node.rotation && node.scale) {
                configureNode(newNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.FromArray(node.rotation), BABYLON.Vector3.FromArray(node.scale));
            }
            newNode.computeWorldMatrix(true);
        };
        /**
        * Imports a node
        */
        var importNode = function (gltfRuntime, node, id, parent) {
            var lastNode = null;
            if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
                if (gltfRuntime.importMeshesNames && gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name || "") === -1) {
                    return null;
                }
            }
            // Meshes
            if (node.skin) {
                if (node.meshes) {
                    var skin = gltfRuntime.skins[node.skin];
                    var newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
                    newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(node.skin);
                    if (newMesh.skeleton === null) {
                        newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);
                        if (!skin.babylonSkeleton) {
                            skin.babylonSkeleton = newMesh.skeleton;
                        }
                    }
                    lastNode = newMesh;
                }
            }
            else if (node.meshes) {
                /**
                * Improve meshes property
                */
                var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
                lastNode = newMesh;
            }
            // Lights
            else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var light = gltfRuntime.lights[node.light];
                if (light) {
                    if (light.type === "ambient") {
                        var ambienLight = light[light.type];
                        var hemiLight = new BABYLON.HemisphericLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        hemiLight.name = node.name || "";
                        if (ambienLight.color) {
                            hemiLight.diffuse = BABYLON.Color3.FromArray(ambienLight.color);
                        }
                        lastNode = hemiLight;
                    }
                    else if (light.type === "directional") {
                        var directionalLight = light[light.type];
                        var dirLight = new BABYLON.DirectionalLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        dirLight.name = node.name || "";
                        if (directionalLight.color) {
                            dirLight.diffuse = BABYLON.Color3.FromArray(directionalLight.color);
                        }
                        lastNode = dirLight;
                    }
                    else if (light.type === "point") {
                        var pointLight = light[light.type];
                        var ptLight = new BABYLON.PointLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        ptLight.name = node.name || "";
                        if (pointLight.color) {
                            ptLight.diffuse = BABYLON.Color3.FromArray(pointLight.color);
                        }
                        lastNode = ptLight;
                    }
                    else if (light.type === "spot") {
                        var spotLight = light[light.type];
                        var spLight = new BABYLON.SpotLight(node.light, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, gltfRuntime.scene);
                        spLight.name = node.name || "";
                        if (spotLight.color) {
                            spLight.diffuse = BABYLON.Color3.FromArray(spotLight.color);
                        }
                        if (spotLight.fallOfAngle) {
                            spLight.angle = spotLight.fallOfAngle;
                        }
                        if (spotLight.fallOffExponent) {
                            spLight.exponent = spotLight.fallOffExponent;
                        }
                        lastNode = spLight;
                    }
                }
            }
            // Cameras
            else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var camera = gltfRuntime.cameras[node.camera];
                if (camera) {
                    if (camera.type === "orthographic") {
                        var orthoCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene, false);
                        orthoCamera.name = node.name || "";
                        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        lastNode = orthoCamera;
                    }
                    else if (camera.type === "perspective") {
                        var perspectiveCamera = camera[camera.type];
                        var persCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene, false);
                        persCamera.name = node.name || "";
                        persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        if (!perspectiveCamera.aspectRatio) {
                            perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                        }
                        if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                            persCamera.maxZ = perspectiveCamera.zfar;
                            persCamera.minZ = perspectiveCamera.znear;
                        }
                        lastNode = persCamera;
                    }
                }
            }
            // Empty node
            if (!node.jointName) {
                if (node.babylonNode) {
                    return node.babylonNode;
                }
                else if (lastNode === null) {
                    var dummy = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                    node.babylonNode = dummy;
                    lastNode = dummy;
                }
            }
            if (lastNode !== null) {
                if (node.matrix && lastNode instanceof BABYLON.Mesh) {
                    configureNodeFromMatrix(lastNode, node, parent);
                }
                else {
                    var translation = node.translation || [0, 0, 0];
                    var rotation = node.rotation || [0, 0, 0, 1];
                    var scale = node.scale || [1, 1, 1];
                    configureNode(lastNode, BABYLON.Vector3.FromArray(translation), BABYLON.Quaternion.FromArray(rotation), BABYLON.Vector3.FromArray(scale));
                }
                lastNode.updateCache(true);
                node.babylonNode = lastNode;
            }
            return lastNode;
        };
        /**
        * Traverses nodes and creates them
        */
        var traverseNodes = function (gltfRuntime, id, parent, meshIncluded) {
            if (meshIncluded === void 0) { meshIncluded = false; }
            var node = gltfRuntime.nodes[id];
            var newNode = null;
            if (gltfRuntime.importOnlyMeshes && !meshIncluded && gltfRuntime.importMeshesNames) {
                if (gltfRuntime.importMeshesNames.indexOf(node.name || "") !== -1 || gltfRuntime.importMeshesNames.length === 0) {
                    meshIncluded = true;
                }
                else {
                    meshIncluded = false;
                }
            }
            else {
                meshIncluded = true;
            }
            if (!node.jointName && meshIncluded) {
                newNode = importNode(gltfRuntime, node, id, parent);
                if (newNode !== null) {
                    newNode.id = id;
                    newNode.parent = parent;
                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
                }
            }
        };
        /**
        * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
        */
        var postLoad = function (gltfRuntime) {
            // Nodes
            var currentScene = gltfRuntime.currentScene;
            if (currentScene) {
                for (var i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
            else {
                for (var thing in gltfRuntime.scenes) {
                    currentScene = gltfRuntime.scenes[thing];
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
            }
            // Set animations
            loadAnimations(gltfRuntime);
            for (var i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
                var skeleton = gltfRuntime.scene.skeletons[i];
                gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
            }
        };
        /**
        * onBind shaderrs callback to set uniforms and matrices
        */
        var onBindShaderMaterial = function (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) {
            var materialValues = material.values || technique.parameters;
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                if (type === GLTF1.EParameterType.FLOAT_MAT2 || type === GLTF1.EParameterType.FLOAT_MAT3 || type === GLTF1.EParameterType.FLOAT_MAT4) {
                    if (uniform.semantic && !uniform.source && !uniform.node) {
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                    }
                    else if (uniform.semantic && (uniform.source || uniform.node)) {
                        var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node || "");
                        if (source === null) {
                            source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node || "");
                        }
                        if (source === null) {
                            continue;
                        }
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                    }
                }
                else {
                    var value = materialValues[technique.uniforms[unif]];
                    if (!value) {
                        continue;
                    }
                    if (type === GLTF1.EParameterType.SAMPLER_2D) {
                        var texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;
                        if (texture === null || texture === undefined) {
                            continue;
                        }
                        shaderMaterial.getEffect().setTexture(unif, texture);
                    }
                    else {
                        GLTF1.GLTFUtils.SetUniform((shaderMaterial.getEffect()), unif, value, type);
                    }
                }
            }
            onSuccess(shaderMaterial);
        };
        /**
        * Prepare uniforms to send the only one time
        * Loads the appropriate textures
        */
        var prepareShaderMaterialUniforms = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) {
            var materialValues = material.values || technique.parameters;
            var techniqueUniforms = technique.uniforms;
            /**
            * Prepare values here (not matrices)
            */
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                var value = materialValues[techniqueUniforms[unif]];
                if (value === undefined) {
                    // In case the value is the same for all materials
                    value = uniform.value;
                }
                if (!value) {
                    continue;
                }
                var onLoadTexture = function (uniformName) {
                    return function (texture) {
                        if (uniform.value && uniformName) {
                            // Static uniform
                            shaderMaterial.setTexture(uniformName, texture);
                            delete unTreatedUniforms[uniformName];
                        }
                    };
                };
                // Texture (sampler2D)
                if (type === GLTF1.EParameterType.SAMPLER_2D) {
                    GLTF1.GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), function () { return onLoadTexture(null); });
                }
                // Others
                else {
                    if (uniform.value && GLTF1.GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                        // Static uniform
                        delete unTreatedUniforms[unif];
                    }
                }
            }
        };
        /**
        * Shader compilation failed
        */
        var onShaderCompileError = function (program, shaderMaterial, onError) {
            return function (effect, error) {
                shaderMaterial.dispose(true);
                onError("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            };
        };
        /**
        * Shader compilation success
        */
        var onShaderCompileSuccess = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) {
            return function (_) {
                prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
                shaderMaterial.onBind = function (mesh) {
                    onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
                };
            };
        };
        /**
        * Returns the appropriate uniform if already handled by babylon
        */
        var parseShaderUniforms = function (tokenizer, technique, unTreatedUniforms) {
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter = technique.parameters[uniform];
                if (tokenizer.currentIdentifier === unif) {
                    if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            delete unTreatedUniforms[unif];
                            return babylonTransforms[transformIndex];
                        }
                    }
                }
            }
            return tokenizer.currentIdentifier;
        };
        /**
        * All shaders loaded. Create materials one by one
        */
        var importMaterials = function (gltfRuntime) {
            // Create materials
            for (var mat in gltfRuntime.materials) {
                GLTF1.GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, function (material) { }, function () { });
            }
        };
        /**
        * Implementation of the base glTF spec
        */
        var GLTFLoaderBase = /** @class */ (function () {
            function GLTFLoaderBase() {
            }
            GLTFLoaderBase.CreateRuntime = function (parsedData, scene, rootUrl) {
                var gltfRuntime = {
                    extensions: {},
                    accessors: {},
                    buffers: {},
                    bufferViews: {},
                    meshes: {},
                    lights: {},
                    cameras: {},
                    nodes: {},
                    images: {},
                    textures: {},
                    shaders: {},
                    programs: {},
                    samplers: {},
                    techniques: {},
                    materials: {},
                    animations: {},
                    skins: {},
                    extensionsUsed: [],
                    scenes: {},
                    buffersCount: 0,
                    shaderscount: 0,
                    scene: scene,
                    rootUrl: rootUrl,
                    loadedBufferCount: 0,
                    loadedBufferViews: {},
                    loadedShaderCount: 0,
                    importOnlyMeshes: false,
                    dummyNodes: []
                };
                // Parse
                if (parsedData.extensions) {
                    parseObject(parsedData.extensions, "extensions", gltfRuntime);
                }
                if (parsedData.extensionsUsed) {
                    parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
                }
                if (parsedData.buffers) {
                    parseBuffers(parsedData.buffers, gltfRuntime);
                }
                if (parsedData.bufferViews) {
                    parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
                }
                if (parsedData.accessors) {
                    parseObject(parsedData.accessors, "accessors", gltfRuntime);
                }
                if (parsedData.meshes) {
                    parseObject(parsedData.meshes, "meshes", gltfRuntime);
                }
                if (parsedData.lights) {
                    parseObject(parsedData.lights, "lights", gltfRuntime);
                }
                if (parsedData.cameras) {
                    parseObject(parsedData.cameras, "cameras", gltfRuntime);
                }
                if (parsedData.nodes) {
                    parseObject(parsedData.nodes, "nodes", gltfRuntime);
                }
                if (parsedData.images) {
                    parseObject(parsedData.images, "images", gltfRuntime);
                }
                if (parsedData.textures) {
                    parseObject(parsedData.textures, "textures", gltfRuntime);
                }
                if (parsedData.shaders) {
                    parseShaders(parsedData.shaders, gltfRuntime);
                }
                if (parsedData.programs) {
                    parseObject(parsedData.programs, "programs", gltfRuntime);
                }
                if (parsedData.samplers) {
                    parseObject(parsedData.samplers, "samplers", gltfRuntime);
                }
                if (parsedData.techniques) {
                    parseObject(parsedData.techniques, "techniques", gltfRuntime);
                }
                if (parsedData.materials) {
                    parseObject(parsedData.materials, "materials", gltfRuntime);
                }
                if (parsedData.animations) {
                    parseObject(parsedData.animations, "animations", gltfRuntime);
                }
                if (parsedData.skins) {
                    parseObject(parsedData.skins, "skins", gltfRuntime);
                }
                if (parsedData.scenes) {
                    gltfRuntime.scenes = parsedData.scenes;
                }
                if (parsedData.scene && parsedData.scenes) {
                    gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
                }
                return gltfRuntime;
            };
            GLTFLoaderBase.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                var buffer = gltfRuntime.buffers[id];
                if (BABYLON.Tools.IsBase64(buffer.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(BABYLON.Tools.DecodeBase64(buffer.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, function (data) { return onSuccess(new Uint8Array(data)); }, onProgress, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (!texture || !texture.source) {
                    onError("");
                    return;
                }
                if (texture.babylonTexture) {
                    onSuccess(null);
                    return;
                }
                var source = gltfRuntime.images[texture.source];
                if (BABYLON.Tools.IsBase64(source.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(BABYLON.Tools.DecodeBase64(source.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + source.uri, function (data) { return onSuccess(new Uint8Array(data)); }, undefined, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (texture.babylonTexture) {
                    onSuccess(texture.babylonTexture);
                    return;
                }
                var sampler = gltfRuntime.samplers[texture.sampler];
                var createMipMaps = (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR);
                var samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                var blob = new Blob([buffer]);
                var blobURL = URL.createObjectURL(blob);
                var revokeBlobURL = function () { return URL.revokeObjectURL(blobURL); };
                var newTexture = new BABYLON.Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
                if (sampler.wrapS !== undefined) {
                    newTexture.wrapU = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapS);
                }
                if (sampler.wrapT !== undefined) {
                    newTexture.wrapV = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapT);
                }
                newTexture.name = id;
                texture.babylonTexture = newTexture;
                onSuccess(newTexture);
            };
            GLTFLoaderBase.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (BABYLON.Tools.IsBase64(shader.uri)) {
                    var shaderString = atob(shader.uri.split(",")[1]);
                    if (onSuccess) {
                        onSuccess(shaderString);
                    }
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, undefined, undefined, false, function (request) {
                        if (request && onError) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material.technique) {
                    if (onError) {
                        onError("No technique found.");
                    }
                    return;
                }
                var technique = gltfRuntime.techniques[material.technique];
                if (!technique) {
                    var defaultMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                    defaultMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                    defaultMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                    onSuccess(defaultMaterial);
                    return;
                }
                var program = gltfRuntime.programs[technique.program];
                var states = technique.states;
                var vertexShader = BABYLON.Effect.ShadersStore[program.vertexShader + "VertexShader"];
                var pixelShader = BABYLON.Effect.ShadersStore[program.fragmentShader + "PixelShader"];
                var newVertexShader = "";
                var newPixelShader = "";
                var vertexTokenizer = new Tokenizer(vertexShader);
                var pixelTokenizer = new Tokenizer(pixelShader);
                var unTreatedUniforms = {};
                var uniforms = [];
                var attributes = [];
                var samplers = [];
                // Fill uniform, sampler2D and attributes
                for (var unif in technique.uniforms) {
                    var uniform = technique.uniforms[unif];
                    var uniformParameter = technique.parameters[uniform];
                    unTreatedUniforms[unif] = uniformParameter;
                    if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            uniforms.push(babylonTransforms[transformIndex]);
                            delete unTreatedUniforms[unif];
                        }
                        else {
                            uniforms.push(unif);
                        }
                    }
                    else if (uniformParameter.type === GLTF1.EParameterType.SAMPLER_2D) {
                        samplers.push(unif);
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                for (var attr in technique.attributes) {
                    var attribute = technique.attributes[attr];
                    var attributeParameter = technique.parameters[attribute];
                    if (attributeParameter.semantic) {
                        attributes.push(getAttribute(attributeParameter));
                    }
                }
                // Configure vertex shader
                while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
                    var tokenType = vertexTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newVertexShader += vertexTokenizer.currentString;
                        continue;
                    }
                    var foundAttribute = false;
                    for (var attr in technique.attributes) {
                        var attribute = technique.attributes[attr];
                        var attributeParameter = technique.parameters[attribute];
                        if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                            newVertexShader += getAttribute(attributeParameter);
                            foundAttribute = true;
                            break;
                        }
                    }
                    if (foundAttribute) {
                        continue;
                    }
                    newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
                }
                // Configure pixel shader
                while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                    var tokenType = pixelTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newPixelShader += pixelTokenizer.currentString;
                        continue;
                    }
                    newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
                }
                // Create shader material
                var shaderPath = {
                    vertex: program.vertexShader + id,
                    fragment: program.fragmentShader + id
                };
                var options = {
                    attributes: attributes,
                    uniforms: uniforms,
                    samplers: samplers,
                    needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1
                };
                BABYLON.Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
                BABYLON.Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
                var shaderMaterial = new BABYLON.ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
                shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
                shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
                shaderMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (states && states.functions) {
                    var functions = states.functions;
                    if (functions.cullFace && functions.cullFace[0] !== GLTF1.ECullingType.BACK) {
                        shaderMaterial.backFaceCulling = false;
                    }
                    var blendFunc = functions.blendFuncSeparate;
                    if (blendFunc) {
                        if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ONE && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ZERO && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.DST_COLOR && blendFunc[1] === GLTF1.EBlendingFunction.ZERO && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MAXIMIZED;
                        }
                    }
                }
            };
            return GLTFLoaderBase;
        }());
        GLTF1.GLTFLoaderBase = GLTFLoaderBase;
        /**
        * glTF V1 Loader
        */
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
                // #region Stubs for IGLTFLoader interface
                this.coordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode.AUTO;
                this.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.FIRST;
                this.compileMaterials = false;
                this.useClipPlane = false;
                this.compileShadowGenerators = false;
                this.transparencyAsCoverage = false;
                this._normalizeAnimationGroupsToBeginAtZero = true;
                this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
                this.onMeshLoadedObservable = new BABYLON.Observable();
                this.onTextureLoadedObservable = new BABYLON.Observable();
                this.onMaterialLoadedObservable = new BABYLON.Observable();
                this.onCameraLoadedObservable = new BABYLON.Observable();
                this.onCompleteObservable = new BABYLON.Observable();
                this.onDisposeObservable = new BABYLON.Observable();
                this.onExtensionLoadedObservable = new BABYLON.Observable();
                this.state = null;
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
            };
            GLTFLoader.prototype.dispose = function () { };
            // #endregion
            GLTFLoader.prototype._importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    gltfRuntime.importOnlyMeshes = true;
                    if (meshesNames === "") {
                        gltfRuntime.importMeshesNames = [];
                    }
                    else if (typeof meshesNames === "string") {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else if (meshesNames && !(meshesNames instanceof Array)) {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else {
                        gltfRuntime.importMeshesNames = [];
                        BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                    }
                    // Create nodes
                    _this._createNodes(gltfRuntime);
                    var meshes = new Array();
                    var skeletons = new Array();
                    // Fill arrays of meshes and skeletons
                    for (var nde in gltfRuntime.nodes) {
                        var node = gltfRuntime.nodes[nde];
                        if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                            meshes.push(node.babylonNode);
                        }
                    }
                    for (var skl in gltfRuntime.skins) {
                        var skin = gltfRuntime.skins[skl];
                        if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    }
                    // Load buffers, shaders, materials, etc.
                    _this._loadBuffersAsync(gltfRuntime, function () {
                        _this._loadShadersAsync(gltfRuntime, function () {
                            importMaterials(gltfRuntime);
                            postLoad(gltfRuntime);
                            if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                                onSuccess(meshes, skeletons);
                            }
                        });
                    }, onProgress);
                    if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, skeletons);
                    }
                }, onError);
                return true;
            };
            /**
            * Imports one or more meshes from a loaded gltf file and adds them to the scene
            * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
            * @param scene the scene the meshes should be added to
            * @param data gltf data containing information of the meshes in a loaded file
            * @param rootUrl root url to load from
            * @param onProgress event that fires when loading progress has occured
            * @returns a promise containg the loaded meshes, particles, skeletons and animations
            */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._importMeshAsync(meshesNames, scene, data, rootUrl, function (meshes, skeletons) {
                        resolve({
                            meshes: meshes,
                            particleSystems: [],
                            skeletons: skeletons,
                            animationGroups: []
                        });
                    }, onProgress, function (message) {
                        reject(new Error(message));
                    });
                });
            };
            GLTFLoader.prototype._loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    // Load runtime extensios
                    GLTF1.GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, function () {
                        // Create nodes
                        _this._createNodes(gltfRuntime);
                        // Load buffers, shaders, materials, etc.
                        _this._loadBuffersAsync(gltfRuntime, function () {
                            _this._loadShadersAsync(gltfRuntime, function () {
                                importMaterials(gltfRuntime);
                                postLoad(gltfRuntime);
                                if (!BABYLON.GLTFFileLoader.IncrementalLoading) {
                                    onSuccess();
                                }
                            });
                        });
                        if (BABYLON.GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    }, onError);
                }, onError);
            };
            /**
            * Imports all objects from a loaded gltf file and adds them to the scene
            * @param scene the scene the objects should be added to
            * @param data gltf data containing information of the meshes in a loaded file
            * @param rootUrl root url to load from
            * @param onProgress event that fires when loading progress has occured
            * @returns a promise which completes when objects have been loaded to the scene
            */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this._loadAsync(scene, data, rootUrl, function () {
                        resolve();
                    }, onProgress, function (message) {
                        reject(new Error(message));
                    });
                });
            };
            GLTFLoader.prototype._loadShadersAsync = function (gltfRuntime, onload) {
                var hasShaders = false;
                var processShader = function (sha, shader) {
                    GLTF1.GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, function (shaderString) {
                        if (shaderString instanceof ArrayBuffer) {
                            return;
                        }
                        gltfRuntime.loadedShaderCount++;
                        if (shaderString) {
                            BABYLON.Effect.ShadersStore[sha + (shader.type === GLTF1.EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                        }
                        if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                            onload();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                    });
                };
                for (var sha in gltfRuntime.shaders) {
                    hasShaders = true;
                    var shader = gltfRuntime.shaders[sha];
                    if (shader) {
                        processShader.bind(this, sha, shader)();
                    }
                    else {
                        BABYLON.Tools.Error("No shader named: " + sha);
                    }
                }
                if (!hasShaders) {
                    onload();
                }
            };
            ;
            GLTFLoader.prototype._loadBuffersAsync = function (gltfRuntime, onLoad, onProgress) {
                var hasBuffers = false;
                var processBuffer = function (buf, buffer) {
                    GLTF1.GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, function (bufferView) {
                        gltfRuntime.loadedBufferCount++;
                        if (bufferView) {
                            if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                                BABYLON.Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                            }
                            gltfRuntime.loadedBufferViews[buf] = bufferView;
                        }
                        if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                            onLoad();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                    });
                };
                for (var buf in gltfRuntime.buffers) {
                    hasBuffers = true;
                    var buffer = gltfRuntime.buffers[buf];
                    if (buffer) {
                        processBuffer.bind(this, buf, buffer)();
                    }
                    else {
                        BABYLON.Tools.Error("No buffer named: " + buf);
                    }
                }
                if (!hasBuffers) {
                    onLoad();
                }
            };
            GLTFLoader.prototype._createNodes = function (gltfRuntime) {
                var currentScene = gltfRuntime.currentScene;
                if (currentScene) {
                    // Only one scene even if multiple scenes are defined
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
                else {
                    // Load all scenes
                    for (var thing in gltfRuntime.scenes) {
                        currentScene = gltfRuntime.scenes[thing];
                        for (var i = 0; i < currentScene.nodes.length; i++) {
                            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                        }
                    }
                }
            };
            GLTFLoader.Extensions = {};
            return GLTFLoader;
        }());
        GLTF1.GLTFLoader = GLTFLoader;
        ;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV1 = function () { return new GLTFLoader(); };
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = /** @class */ (function () {
            function GLTFUtils() {
            }
            /**
             * Sets the given "parameter" matrix
             * @param scene: the {BABYLON.Scene} object
             * @param source: the source node where to pick the matrix
             * @param parameter: the GLTF technique parameter
             * @param uniformName: the name of the shader's uniform
             * @param shaderMaterial: the shader material
             */
            GLTFUtils.SetMatrix = function (scene, source, parameter, uniformName, shaderMaterial) {
                var mat = null;
                if (parameter.semantic === "MODEL") {
                    mat = source.getWorldMatrix();
                }
                else if (parameter.semantic === "PROJECTION") {
                    mat = scene.getProjectionMatrix();
                }
                else if (parameter.semantic === "VIEW") {
                    mat = scene.getViewMatrix();
                }
                else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
                }
                else if (parameter.semantic === "MODELVIEW") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
                }
                else if (parameter.semantic === "MODELVIEWPROJECTION") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
                }
                else if (parameter.semantic === "MODELINVERSE") {
                    mat = source.getWorldMatrix().invert();
                }
                else if (parameter.semantic === "VIEWINVERSE") {
                    mat = scene.getViewMatrix().invert();
                }
                else if (parameter.semantic === "PROJECTIONINVERSE") {
                    mat = scene.getProjectionMatrix().invert();
                }
                else if (parameter.semantic === "MODELVIEWINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
                }
                else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
                }
                else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().invert());
                }
                else {
                    debugger;
                }
                if (mat) {
                    switch (parameter.type) {
                        case GLTF1.EParameterType.FLOAT_MAT2:
                            shaderMaterial.setMatrix2x2(uniformName, BABYLON.Matrix.GetAsMatrix2x2(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT3:
                            shaderMaterial.setMatrix3x3(uniformName, BABYLON.Matrix.GetAsMatrix3x3(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT4:
                            shaderMaterial.setMatrix(uniformName, mat);
                            break;
                        default: break;
                    }
                }
            };
            /**
             * Sets the given "parameter" matrix
             * @param shaderMaterial: the shader material
             * @param uniform: the name of the shader's uniform
             * @param value: the value of the uniform
             * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
             */
            GLTFUtils.SetUniform = function (shaderMaterial, uniform, value, type) {
                switch (type) {
                    case GLTF1.EParameterType.FLOAT:
                        shaderMaterial.setFloat(uniform, value);
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC2:
                        shaderMaterial.setVector2(uniform, BABYLON.Vector2.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC3:
                        shaderMaterial.setVector3(uniform, BABYLON.Vector3.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC4:
                        shaderMaterial.setVector4(uniform, BABYLON.Vector4.FromArray(value));
                        return true;
                    default: return false;
                }
            };
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureFilterType.LINEAR:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF1.ETextureFilterType.NEAREST:
                    case GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                }
            };
            GLTFUtils.GetBufferFromBufferView = function (gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
                var byteOffset = bufferView.byteOffset + byteOffset;
                var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
                if (byteOffset + byteLength > loadedBufferView.byteLength) {
                    throw new Error("Buffer access is out of range");
                }
                var buffer = loadedBufferView.buffer;
                byteOffset += loadedBufferView.byteOffset;
                switch (componentType) {
                    case GLTF1.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                    default: return new Float32Array(buffer, byteOffset, byteLength);
                }
            };
            /**
             * Returns a buffer from its accessor
             * @param gltfRuntime: the GLTF runtime
             * @param accessor: the GLTF accessor
             */
            GLTFUtils.GetBufferFromAccessor = function (gltfRuntime, accessor) {
                var bufferView = gltfRuntime.bufferViews[accessor.bufferView];
                var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
                return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            /**
             * Returns the default material of gltf. Related to
             * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
             * @param scene: the Babylon.js scene
             */
            GLTFUtils.GetDefaultMaterial = function (scene) {
                if (!GLTFUtils._DefaultMaterial) {
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                        "precision highp float;",
                        "",
                        "uniform mat4 worldView;",
                        "uniform mat4 projection;",
                        "",
                        "attribute vec3 position;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_Position = projection * worldView * vec4(position, 1.0);",
                        "}"
                    ].join("\n");
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                        "precision highp float;",
                        "",
                        "uniform vec4 u_emission;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_FragColor = u_emission;",
                        "}"
                    ].join("\n");
                    var shaderPath = {
                        vertex: "GLTFDefaultMaterial",
                        fragment: "GLTFDefaultMaterial"
                    };
                    var options = {
                        attributes: ["position"],
                        uniforms: ["worldView", "projection", "u_emission"],
                        samplers: new Array(),
                        needAlphaBlending: false
                    };
                    GLTFUtils._DefaultMaterial = new BABYLON.ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
                    GLTFUtils._DefaultMaterial.setColor4("u_emission", new BABYLON.Color4(0.5, 0.5, 0.5, 1.0));
                }
                return GLTFUtils._DefaultMaterial;
            };
            // The GLTF default material
            GLTFUtils._DefaultMaterial = null;
            return GLTFUtils;
        }());
        GLTF1.GLTFUtils = GLTFUtils;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(name) {
                this._name = name;
            }
            Object.defineProperty(GLTFLoaderExtension.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            /**
            * Defines an override for loading the runtime
            * Return true to stop further extensions from loading the runtime
            */
            GLTFLoaderExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                return false;
            };
            /**
             * Defines an onverride for creating gltf runtime
             * Return true to stop further extensions from creating the runtime
             */
            GLTFLoaderExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading buffers
            * Return true to stop further extensions from loading this buffer
            */
            GLTFLoaderExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                return false;
            };
            /**
            * Defines an override for loading texture buffers
            * Return true to stop further extensions from loading this texture data
            */
            GLTFLoaderExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for creating textures
            * Return true to stop further extensions from loading this texture
            */
            GLTFLoaderExtension.prototype.createTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading shader strings
            * Return true to stop further extensions from loading this shader data
            */
            GLTFLoaderExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading materials
            * Return true to stop further extensions from loading this material
            */
            GLTFLoaderExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            // ---------
            // Utilities
            // ---------
            GLTFLoaderExtension.LoadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        if (!onSuccess) {
                            return;
                        }
                        onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                    });
                });
            };
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess();
                    });
                });
            };
            GLTFLoaderExtension.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                });
            };
            GLTFLoaderExtension.LoadTextureAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    if (buffer) {
                        GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                    }
                }, onError);
            };
            GLTFLoaderExtension.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.ApplyExtensions = function (func, defaultFunc) {
                for (var extensionName in GLTF1.GLTFLoader.Extensions) {
                    var loaderExtension = GLTF1.GLTFLoader.Extensions[extensionName];
                    if (func(loaderExtension)) {
                        return;
                    }
                }
                defaultFunc();
            };
            return GLTFLoaderExtension;
        }());
        GLTF1.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var BinaryExtensionBufferName = "binary_glTF";
        ;
        ;
        var GLTFBinaryExtension = /** @class */ (function (_super) {
            __extends(GLTFBinaryExtension, _super);
            function GLTFBinaryExtension() {
                return _super.call(this, "KHR_binary_glTF") || this;
            }
            GLTFBinaryExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                var extensionsUsed = data.json.extensionsUsed;
                if (!extensionsUsed || extensionsUsed.indexOf(this.name) === -1 || !data.bin) {
                    return false;
                }
                this._bin = data.bin;
                onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                return true;
            };
            GLTFBinaryExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                    return false;
                }
                if (id !== BinaryExtensionBufferName) {
                    return false;
                }
                onSuccess(this._bin);
                return true;
            };
            GLTFBinaryExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                var source = gltfRuntime.images[texture.source];
                if (!source.extensions || !(this.name in source.extensions)) {
                    return false;
                }
                var sourceExt = source.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
                var buffer = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                onSuccess(buffer);
                return true;
            };
            GLTFBinaryExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (!shader.extensions || !(this.name in shader.extensions)) {
                    return false;
                }
                var binaryExtensionShader = shader.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
                var shaderBytes = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                setTimeout(function () {
                    var shaderString = GLTF1.GLTFUtils.DecodeBufferToText(shaderBytes);
                    onSuccess(shaderString);
                });
                return true;
            };
            return GLTFBinaryExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFBinaryExtension = GLTFBinaryExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFBinaryExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFBinaryExtension.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        ;
        ;
        ;
        var GLTFMaterialsCommonExtension = /** @class */ (function (_super) {
            __extends(GLTFMaterialsCommonExtension, _super);
            function GLTFMaterialsCommonExtension() {
                return _super.call(this, "KHR_materials_common") || this;
            }
            GLTFMaterialsCommonExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                if (!gltfRuntime.extensions)
                    return false;
                var extension = gltfRuntime.extensions[this.name];
                if (!extension)
                    return false;
                // Create lights
                var lights = extension.lights;
                if (lights) {
                    for (var thing in lights) {
                        var light = lights[thing];
                        switch (light.type) {
                            case "ambient":
                                var ambientLight = new BABYLON.HemisphericLight(light.name, new BABYLON.Vector3(0, 1, 0), gltfRuntime.scene);
                                var ambient = light.ambient;
                                if (ambient) {
                                    ambientLight.diffuse = BABYLON.Color3.FromArray(ambient.color || [1, 1, 1]);
                                }
                                break;
                            case "point":
                                var pointLight = new BABYLON.PointLight(light.name, new BABYLON.Vector3(10, 10, 10), gltfRuntime.scene);
                                var point = light.point;
                                if (point) {
                                    pointLight.diffuse = BABYLON.Color3.FromArray(point.color || [1, 1, 1]);
                                }
                                break;
                            case "directional":
                                var dirLight = new BABYLON.DirectionalLight(light.name, new BABYLON.Vector3(0, -1, 0), gltfRuntime.scene);
                                var directional = light.directional;
                                if (directional) {
                                    dirLight.diffuse = BABYLON.Color3.FromArray(directional.color || [1, 1, 1]);
                                }
                                break;
                            case "spot":
                                var spot = light.spot;
                                if (spot) {
                                    var spotLight = new BABYLON.SpotLight(light.name, new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), spot.fallOffAngle || Math.PI, spot.fallOffExponent || 0.0, gltfRuntime.scene);
                                    spotLight.diffuse = BABYLON.Color3.FromArray(spot.color || [1, 1, 1]);
                                }
                                break;
                            default:
                                BABYLON.Tools.Warn("GLTF Material Common extension: light type \"" + light.type + "\” not supported");
                                break;
                        }
                    }
                }
                return false;
            };
            GLTFMaterialsCommonExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material || !material.extensions)
                    return false;
                var extension = material.extensions[this.name];
                if (!extension)
                    return false;
                var standardMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                standardMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (extension.technique === "CONSTANT") {
                    standardMaterial.disableLighting = true;
                }
                standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
                standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
                standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;
                // Ambient
                if (typeof extension.values.ambient === "string") {
                    this._loadTexture(gltfRuntime, extension.values.ambient, standardMaterial, "ambientTexture", onError);
                }
                else {
                    standardMaterial.ambientColor = BABYLON.Color3.FromArray(extension.values.ambient || [0, 0, 0]);
                }
                // Diffuse
                if (typeof extension.values.diffuse === "string") {
                    this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onError);
                }
                else {
                    standardMaterial.diffuseColor = BABYLON.Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
                }
                // Emission
                if (typeof extension.values.emission === "string") {
                    this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onError);
                }
                else {
                    standardMaterial.emissiveColor = BABYLON.Color3.FromArray(extension.values.emission || [0, 0, 0]);
                }
                // Specular
                if (typeof extension.values.specular === "string") {
                    this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onError);
                }
                else {
                    standardMaterial.specularColor = BABYLON.Color3.FromArray(extension.values.specular || [0, 0, 0]);
                }
                return true;
            };
            GLTFMaterialsCommonExtension.prototype._loadTexture = function (gltfRuntime, id, material, propertyPath, onError) {
                // Create buffer from texture url
                GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    // Create texture from buffer
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, function (texture) { return material[propertyPath] = texture; }, onError);
                }, onError);
            };
            return GLTFMaterialsCommonExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFMaterialsCommonExtension = GLTFMaterialsCommonExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialsCommonExtension.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /** @hidden */
        var _ArrayItem = /** @class */ (function () {
            function _ArrayItem() {
            }
            /** @hidden */
            _ArrayItem.Assign = function (values) {
                if (values) {
                    for (var index = 0; index < values.length; index++) {
                        values[index]._index = index;
                    }
                }
            };
            return _ArrayItem;
        }());
        GLTF2._ArrayItem = _ArrayItem;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtilities.js.map




//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map


/**
 * Defines the module used to import/export glTF 2.0 assets
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Loader for loading a glTF 2.0 asset
         */
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
                /** @hidden */
                this._completePromises = new Array();
                this._disposed = false;
                this._state = null;
                this._extensions = {};
                this._defaultSampler = {};
                this._defaultBabylonMaterials = {};
                this._requests = new Array();
                /**
                 * Mode that determines the coordinate system to use.
                 */
                this.coordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode.AUTO;
                /**
                 * Mode that determines what animations will start.
                 */
                this.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.FIRST;
                /**
                 * Defines if the loader should compile materials.
                 */
                this.compileMaterials = false;
                /**
                 * Defines if the loader should also compile materials with clip planes.
                 */
                this.useClipPlane = false;
                /**
                 * Defines if the loader should compile shadow generators.
                 */
                this.compileShadowGenerators = false;
                /**
                 * Defines if the Alpha blended materials are only applied as coverage.
                 * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
                 * If true, no extra effects are applied to transparent pixels.
                 */
                this.transparencyAsCoverage = false;
                /** @hidden */
                this._normalizeAnimationGroupsToBeginAtZero = true;
                /**
                 * Function called before loading a url referenced by the asset.
                 */
                this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
                /**
                 * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
                 */
                this.onMeshLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
                 */
                this.onTextureLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a material after parsing the glTF properties of the material.
                 */
                this.onMaterialLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
                 */
                this.onCameraLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
                 * For assets with LODs, raised when all of the LODs are complete.
                 * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
                 */
                this.onCompleteObservable = new BABYLON.Observable();
                /**
                 * Observable raised after the loader is disposed.
                 */
                this.onDisposeObservable = new BABYLON.Observable();
                /**
                 * Observable raised after a loader extension is created.
                 * Set additional options for a loader extension in this event.
                 */
                this.onExtensionLoadedObservable = new BABYLON.Observable();
            }
            /** @hidden */
            GLTFLoader._Register = function (name, factory) {
                if (GLTFLoader._ExtensionFactories[name]) {
                    BABYLON.Tools.Error("Extension with the name '" + name + "' already exists");
                    return;
                }
                GLTFLoader._ExtensionFactories[name] = factory;
                // Keep the order of registration so that extensions registered first are called first.
                GLTFLoader._ExtensionNames.push(name);
            };
            Object.defineProperty(GLTFLoader.prototype, "state", {
                /**
                 * Loader state or null if the loader is not active.
                 */
                get: function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Disposes the loader, releases resources during load, and cancels any outstanding requests.
             */
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this.onDisposeObservable.notifyObservers(this);
                this.onDisposeObservable.clear();
                this._clear();
            };
            /**
             * Imports one or more meshes from the loaded glTF data and adds them to the scene
             * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
             * @param scene the scene the meshes should be added to
             * @param data the glTF data to load
             * @param rootUrl root url to load from
             * @param onProgress event that fires when loading progress has occured
             * @returns a promise containg the loaded meshes, particles, skeletons and animations
             */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
                var _this = this;
                return Promise.resolve().then(function () {
                    var nodes = null;
                    if (meshesNames) {
                        var nodeMap_1 = {};
                        if (_this._gltf.nodes) {
                            for (var _i = 0, _a = _this._gltf.nodes; _i < _a.length; _i++) {
                                var node = _a[_i];
                                if (node.name) {
                                    nodeMap_1[node.name] = node;
                                }
                            }
                        }
                        var names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                        nodes = names.map(function (name) {
                            var node = nodeMap_1[name];
                            if (!node) {
                                throw new Error("Failed to find node '" + name + "'");
                            }
                            return node;
                        });
                    }
                    return _this._loadAsync(nodes, scene, data, rootUrl, onProgress).then(function () {
                        return {
                            meshes: _this._getMeshes(),
                            particleSystems: [],
                            skeletons: _this._getSkeletons(),
                            animationGroups: _this._getAnimationGroups()
                        };
                    });
                });
            };
            /**
             * Imports all objects from the loaded glTF data and adds them to the scene
             * @param scene the scene the objects should be added to
             * @param data the glTF data to load
             * @param rootUrl root url to load from
             * @param onProgress event that fires when loading progress has occured
             * @returns a promise which completes when objects have been loaded to the scene
             */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
                return this._loadAsync(null, scene, data, rootUrl, onProgress);
            };
            GLTFLoader.prototype._loadAsync = function (nodes, scene, data, rootUrl, onProgress) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this._babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._progressCallback = onProgress;
                    _this._state = BABYLON.GLTFLoaderState.LOADING;
                    _this._loadData(data);
                    _this._loadExtensions();
                    _this._checkExtensions();
                    var promises = new Array();
                    if (nodes) {
                        promises.push(_this._loadNodesAsync(nodes));
                    }
                    else {
                        var scene_1 = GLTFLoader._GetProperty("#/scene", _this._gltf.scenes, _this._gltf.scene || 0);
                        promises.push(_this._loadSceneAsync("#/scenes/" + scene_1._index, scene_1));
                    }
                    if (_this.compileMaterials) {
                        promises.push(_this._compileMaterialsAsync());
                    }
                    if (_this.compileShadowGenerators) {
                        promises.push(_this._compileShadowGeneratorsAsync());
                    }
                    var resultPromise = Promise.all(promises).then(function () {
                        _this._state = BABYLON.GLTFLoaderState.READY;
                        _this._startAnimations();
                    });
                    resultPromise.then(function () {
                        _this._rootBabylonMesh.setEnabled(true);
                        BABYLON.Tools.SetImmediate(function () {
                            if (!_this._disposed) {
                                Promise.all(_this._completePromises).then(function () {
                                    _this._state = BABYLON.GLTFLoaderState.COMPLETE;
                                    _this.onCompleteObservable.notifyObservers(_this);
                                    _this.onCompleteObservable.clear();
                                    _this._clear();
                                }).catch(function (error) {
                                    BABYLON.Tools.Error("glTF Loader: " + error.message);
                                    _this._clear();
                                });
                            }
                        });
                    });
                    return resultPromise;
                }).catch(function (error) {
                    if (!_this._disposed) {
                        BABYLON.Tools.Error("glTF Loader: " + error.message);
                        _this._clear();
                        throw error;
                    }
                });
            };
            GLTFLoader.prototype._loadData = function (data) {
                this._gltf = data.json;
                this._setupData();
                if (data.bin) {
                    var buffers = this._gltf.buffers;
                    if (buffers && buffers[0] && !buffers[0].uri) {
                        var binaryBuffer = buffers[0];
                        if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                            BABYLON.Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                        }
                        binaryBuffer._data = Promise.resolve(data.bin);
                    }
                    else {
                        BABYLON.Tools.Warn("Unexpected BIN chunk");
                    }
                }
            };
            GLTFLoader.prototype._setupData = function () {
                GLTF2._ArrayItem.Assign(this._gltf.accessors);
                GLTF2._ArrayItem.Assign(this._gltf.animations);
                GLTF2._ArrayItem.Assign(this._gltf.buffers);
                GLTF2._ArrayItem.Assign(this._gltf.bufferViews);
                GLTF2._ArrayItem.Assign(this._gltf.cameras);
                GLTF2._ArrayItem.Assign(this._gltf.images);
                GLTF2._ArrayItem.Assign(this._gltf.materials);
                GLTF2._ArrayItem.Assign(this._gltf.meshes);
                GLTF2._ArrayItem.Assign(this._gltf.nodes);
                GLTF2._ArrayItem.Assign(this._gltf.samplers);
                GLTF2._ArrayItem.Assign(this._gltf.scenes);
                GLTF2._ArrayItem.Assign(this._gltf.skins);
                GLTF2._ArrayItem.Assign(this._gltf.textures);
                if (this._gltf.nodes) {
                    var nodeParents = {};
                    for (var _i = 0, _a = this._gltf.nodes; _i < _a.length; _i++) {
                        var node = _a[_i];
                        if (node.children) {
                            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                                var index = _c[_b];
                                nodeParents[index] = node._index;
                            }
                        }
                    }
                    var rootNode = this._createRootNode();
                    for (var _d = 0, _e = this._gltf.nodes; _d < _e.length; _d++) {
                        var node = _e[_d];
                        var parentIndex = nodeParents[node._index];
                        node._parent = parentIndex === undefined ? rootNode : this._gltf.nodes[parentIndex];
                    }
                }
            };
            GLTFLoader.prototype._loadExtensions = function () {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    var extension = GLTFLoader._ExtensionFactories[name_1](this);
                    this._extensions[name_1] = extension;
                    this.onExtensionLoadedObservable.notifyObservers(extension);
                }
                this.onExtensionLoadedObservable.clear();
            };
            GLTFLoader.prototype._checkExtensions = function () {
                if (this._gltf.extensionsRequired) {
                    for (var _i = 0, _a = this._gltf.extensionsRequired; _i < _a.length; _i++) {
                        var name_2 = _a[_i];
                        var extension = this._extensions[name_2];
                        if (!extension || !extension.enabled) {
                            throw new Error("Require extension " + name_2 + " is not available");
                        }
                    }
                }
            };
            GLTFLoader.prototype._createRootNode = function () {
                this._rootBabylonMesh = new BABYLON.Mesh("__root__", this._babylonScene);
                this._rootBabylonMesh.setEnabled(false);
                var rootNode = { _babylonMesh: this._rootBabylonMesh };
                switch (this.coordinateSystemMode) {
                    case BABYLON.GLTFLoaderCoordinateSystemMode.AUTO: {
                        if (!this._babylonScene.useRightHandedSystem) {
                            rootNode.rotation = [0, 1, 0, 0];
                            rootNode.scale = [1, 1, -1];
                            GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                        this._babylonScene.useRightHandedSystem = true;
                        break;
                    }
                    default: {
                        throw new Error("Invalid coordinate system mode (" + this.coordinateSystemMode + ")");
                    }
                }
                this.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
                return rootNode;
            };
            GLTFLoader.prototype._loadNodesAsync = function (nodes) {
                var promises = new Array();
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var node = nodes_1[_i];
                    promises.push(this._loadNodeAsync("#/nodes/" + node._index, node));
                }
                promises.push(this._loadAnimationsAsync());
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadSceneAsync = function (context, scene) {
                var promise = GLTF2.GLTFLoaderExtension._LoadSceneAsync(this, context, scene);
                if (promise) {
                    return promise;
                }
                var promises = new Array();
                for (var _i = 0, _a = scene.nodes; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(context + "/nodes/" + index, this._gltf.nodes, index);
                    promises.push(this._loadNodeAsync("#/nodes/" + node._index, node));
                }
                promises.push(this._loadAnimationsAsync());
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._forEachPrimitive = function (node, callback) {
                if (node._primitiveBabylonMeshes) {
                    for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                        var babylonMesh = _a[_i];
                        callback(babylonMesh);
                    }
                }
                else {
                    callback(node._babylonMesh);
                }
            };
            GLTFLoader.prototype._getMeshes = function () {
                var meshes = new Array();
                // Root mesh is always first.
                meshes.push(this._rootBabylonMesh);
                var nodes = this._gltf.nodes;
                if (nodes) {
                    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                        var node = nodes_2[_i];
                        if (node._babylonMesh) {
                            meshes.push(node._babylonMesh);
                        }
                        if (node._primitiveBabylonMeshes) {
                            for (var _a = 0, _b = node._primitiveBabylonMeshes; _a < _b.length; _a++) {
                                var babylonMesh = _b[_a];
                                meshes.push(babylonMesh);
                            }
                        }
                    }
                }
                return meshes;
            };
            GLTFLoader.prototype._getSkeletons = function () {
                var skeletons = new Array();
                var skins = this._gltf.skins;
                if (skins) {
                    for (var _i = 0, skins_1 = skins; _i < skins_1.length; _i++) {
                        var skin = skins_1[_i];
                        if (skin._babylonSkeleton) {
                            skeletons.push(skin._babylonSkeleton);
                        }
                    }
                }
                return skeletons;
            };
            GLTFLoader.prototype._getAnimationGroups = function () {
                var animationGroups = new Array();
                var animations = this._gltf.animations;
                if (animations) {
                    for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                        var animation = animations_1[_i];
                        if (animation._babylonAnimationGroup) {
                            animationGroups.push(animation._babylonAnimationGroup);
                        }
                    }
                }
                return animationGroups;
            };
            GLTFLoader.prototype._startAnimations = function () {
                switch (this.animationStartMode) {
                    case BABYLON.GLTFLoaderAnimationStartMode.NONE: {
                        // do nothing
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.FIRST: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        if (babylonAnimationGroups.length !== 0) {
                            babylonAnimationGroups[0].start(true);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.ALL: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        for (var _i = 0, babylonAnimationGroups_1 = babylonAnimationGroups; _i < babylonAnimationGroups_1.length; _i++) {
                            var babylonAnimationGroup = babylonAnimationGroups_1[_i];
                            babylonAnimationGroup.start(true);
                        }
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Invalid animation start mode (" + this.animationStartMode + ")");
                        return;
                    }
                }
            };
            /** @hidden */
            GLTFLoader.prototype._loadNodeAsync = function (context, node) {
                var promise = GLTF2.GLTFLoaderExtension._LoadNodeAsync(this, context, node);
                if (promise) {
                    return promise;
                }
                if (node._babylonMesh) {
                    throw new Error(context + ": Invalid recursive node hierarchy");
                }
                var promises = new Array();
                var babylonMesh = new BABYLON.Mesh(node.name || "node" + node._index, this._babylonScene, node._parent._babylonMesh);
                node._babylonMesh = babylonMesh;
                GLTFLoader._LoadTransform(node, babylonMesh);
                if (node.mesh != undefined) {
                    var mesh = GLTFLoader._GetProperty(context + "/mesh", this._gltf.meshes, node.mesh);
                    promises.push(this._loadMeshAsync("#/meshes/" + mesh._index, node, mesh, babylonMesh));
                }
                if (node.camera != undefined) {
                    var camera = GLTFLoader._GetProperty(context + "/camera", this._gltf.cameras, node.camera);
                    this._loadCamera("#/cameras/" + camera._index, camera, babylonMesh);
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var index = _a[_i];
                        var childNode = GLTFLoader._GetProperty(context + "/children/" + index, this._gltf.nodes, index);
                        promises.push(this._loadNodeAsync("#/nodes/" + index, childNode));
                    }
                }
                this.onMeshLoadedObservable.notifyObservers(babylonMesh);
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMeshAsync = function (context, node, mesh, babylonMesh) {
                var _this = this;
                var promises = new Array();
                var primitives = mesh.primitives;
                if (!primitives || primitives.length === 0) {
                    throw new Error(context + ": Primitives are missing");
                }
                GLTF2._ArrayItem.Assign(primitives);
                if (primitives.length === 1) {
                    var primitive = primitives[0];
                    promises.push(this._loadPrimitiveAsync(context + "/primitives/" + primitive._index, node, mesh, primitive, babylonMesh));
                }
                else {
                    node._primitiveBabylonMeshes = [];
                    for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                        var primitive = primitives_1[_i];
                        var primitiveBabylonMesh = new BABYLON.Mesh((mesh.name || babylonMesh.name) + "_" + primitive._index, this._babylonScene, babylonMesh);
                        node._primitiveBabylonMeshes.push(primitiveBabylonMesh);
                        promises.push(this._loadPrimitiveAsync(context + "/primitives/" + primitive._index, node, mesh, primitive, primitiveBabylonMesh));
                        this.onMeshLoadedObservable.notifyObservers(babylonMesh);
                    }
                }
                if (node.skin != undefined) {
                    var skin = GLTFLoader._GetProperty(context + "/skin", this._gltf.skins, node.skin);
                    promises.push(this._loadSkinAsync("#/skins/" + skin._index, node, mesh, skin));
                }
                return Promise.all(promises).then(function () {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh._refreshBoundingInfo(true);
                    });
                });
            };
            GLTFLoader.prototype._loadPrimitiveAsync = function (context, node, mesh, primitive, babylonMesh) {
                var _this = this;
                var promises = new Array();
                this._createMorphTargets(context, node, mesh, primitive, babylonMesh);
                promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then(function (babylonGeometry) {
                    return _this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonGeometry).then(function () {
                        babylonGeometry.applyToMesh(babylonMesh);
                    });
                }));
                var babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
                if (primitive.material == undefined) {
                    babylonMesh.material = this._getDefaultMaterial(babylonDrawMode);
                }
                else {
                    var material = GLTFLoader._GetProperty(context + "/material}", this._gltf.materials, primitive.material);
                    promises.push(this._loadMaterialAsync("#/materials/" + material._index, material, babylonMesh, babylonDrawMode, function (babylonMaterial) {
                        babylonMesh.material = babylonMaterial;
                    }));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                var _this = this;
                var promise = GLTF2.GLTFLoaderExtension._LoadVertexDataAsync(this, context, primitive, babylonMesh);
                if (promise) {
                    return promise;
                }
                var attributes = primitive.attributes;
                if (!attributes) {
                    throw new Error(context + ": Attributes are missing");
                }
                var promises = new Array();
                var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, this._babylonScene);
                if (primitive.indices == undefined) {
                    babylonMesh.isUnIndexed = true;
                }
                else {
                    var accessor = GLTFLoader._GetProperty(context + "/indices", this._gltf.accessors, primitive.indices);
                    promises.push(this._loadIndicesAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        babylonGeometry.setIndices(data);
                    }));
                }
                var loadAttribute = function (attribute, kind, callback) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                    if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                        babylonMesh._delayInfo.push(kind);
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/attributes/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadVertexAccessorAsync("#/accessors/" + accessor._index, accessor, kind).then(function (babylonVertexBuffer) {
                        babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
                    }));
                    if (callback) {
                        callback(accessor);
                    }
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind, function (accessor) {
                    if (accessor.type === "VEC4" /* VEC4 */) {
                        babylonMesh.hasVertexAlpha = true;
                    }
                });
                return Promise.all(promises).then(function () {
                    return babylonGeometry;
                });
            };
            GLTFLoader.prototype._createMorphTargets = function (context, node, mesh, primitive, babylonMesh) {
                if (!primitive.targets) {
                    return;
                }
                if (node._numMorphTargets == undefined) {
                    node._numMorphTargets = primitive.targets.length;
                }
                else if (primitive.targets.length !== node._numMorphTargets) {
                    throw new Error(context + ": Primitives do not have the same number of targets");
                }
                babylonMesh.morphTargetManager = new BABYLON.MorphTargetManager();
                for (var index = 0; index < primitive.targets.length; index++) {
                    var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                    babylonMesh.morphTargetManager.addTarget(new BABYLON.MorphTarget("morphTarget" + index, weight));
                    // TODO: tell the target whether it has positions, normals, tangents
                }
            };
            GLTFLoader.prototype._loadMorphTargetsAsync = function (context, primitive, babylonMesh, babylonGeometry) {
                if (!primitive.targets) {
                    return Promise.resolve();
                }
                var promises = new Array();
                var morphTargetManager = babylonMesh.morphTargetManager;
                for (var index = 0; index < morphTargetManager.numTargets; index++) {
                    var babylonMorphTarget = morphTargetManager.getTarget(index);
                    promises.push(this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, babylonGeometry, primitive.targets[index], babylonMorphTarget));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, babylonGeometry, attributes, babylonMorphTarget) {
                var _this = this;
                var promises = new Array();
                var loadAttribute = function (attribute, kind, setData) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    var babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
                    if (!babylonVertexBuffer) {
                        return;
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadFloatAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        setData(babylonVertexBuffer, data);
                    }));
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setPositions(data);
                });
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setNormals(data);
                });
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind, function (babylonVertexBuffer, data) {
                    var dataIndex = 0;
                    babylonVertexBuffer.forEach(data.length / 3 * 4, function (value, index) {
                        // Tangent data for morph targets is stored as xyz delta.
                        // The vertexData.tangent is stored as xyzw.
                        // So we need to skip every fourth vertexData.tangent.
                        if (((index + 1) % 4) !== 0) {
                            data[dataIndex++] += value;
                        }
                    });
                    babylonMorphTarget.setTangents(data);
                });
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader._LoadTransform = function (node, babylonNode) {
                var position = BABYLON.Vector3.Zero();
                var rotation = BABYLON.Quaternion.Identity();
                var scaling = BABYLON.Vector3.One();
                if (node.matrix) {
                    var matrix = BABYLON.Matrix.FromArray(node.matrix);
                    matrix.decompose(scaling, rotation, position);
                }
                else {
                    if (node.translation)
                        position = BABYLON.Vector3.FromArray(node.translation);
                    if (node.rotation)
                        rotation = BABYLON.Quaternion.FromArray(node.rotation);
                    if (node.scale)
                        scaling = BABYLON.Vector3.FromArray(node.scale);
                }
                babylonNode.position = position;
                babylonNode.rotationQuaternion = rotation;
                babylonNode.scaling = scaling;
            };
            GLTFLoader.prototype._loadSkinAsync = function (context, node, mesh, skin) {
                var _this = this;
                var assignSkeleton = function (skeleton) {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh.skeleton = skeleton;
                    });
                    // Ignore the TRS of skinned nodes.
                    // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                    node._babylonMesh.parent = _this._rootBabylonMesh;
                    node._babylonMesh.position = BABYLON.Vector3.Zero();
                    node._babylonMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
                    node._babylonMesh.scaling = BABYLON.Vector3.One();
                };
                if (skin._loaded) {
                    return skin._loaded.then(function () {
                        assignSkeleton(skin._babylonSkeleton);
                    });
                }
                var skeletonId = "skeleton" + skin._index;
                var babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                skin._babylonSkeleton = babylonSkeleton;
                this._loadBones(context, skin);
                assignSkeleton(babylonSkeleton);
                return (skin._loaded = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(function (inverseBindMatricesData) {
                    _this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
                }));
            };
            GLTFLoader.prototype._loadBones = function (context, skin) {
                var babylonBones = {};
                for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(context + "/joints/" + index, this._gltf.nodes, index);
                    this._loadBone(node, skin, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, babylonBones) {
                var babylonBone = babylonBones[node._index];
                if (babylonBone) {
                    return babylonBone;
                }
                var babylonParentBone = null;
                if (node._parent._babylonMesh !== this._rootBabylonMesh) {
                    babylonParentBone = this._loadBone(node._parent, skin, babylonBones);
                }
                var boneIndex = skin.joints.indexOf(node._index);
                babylonBone = new BABYLON.Bone(node.name || "joint" + node._index, skin._babylonSkeleton, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
                babylonBones[node._index] = babylonBone;
                node._babylonBones = node._babylonBones || [];
                node._babylonBones.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadSkinInverseBindMatricesDataAsync = function (context, skin) {
                if (skin.inverseBindMatrices == undefined) {
                    return Promise.resolve(null);
                }
                var accessor = GLTFLoader._GetProperty(context + "/inverseBindMatrices", this._gltf.accessors, skin.inverseBindMatrices);
                return this._loadFloatAccessorAsync("#/accessors/" + accessor._index, accessor);
            };
            GLTFLoader.prototype._updateBoneMatrices = function (babylonSkeleton, inverseBindMatricesData) {
                for (var _i = 0, _a = babylonSkeleton.bones; _i < _a.length; _i++) {
                    var babylonBone = _a[_i];
                    var baseMatrix = BABYLON.Matrix.Identity();
                    var boneIndex = babylonBone._index;
                    if (inverseBindMatricesData && boneIndex !== -1) {
                        BABYLON.Matrix.FromArrayToRef(inverseBindMatricesData, boneIndex * 16, baseMatrix);
                        baseMatrix.invertToRef(baseMatrix);
                    }
                    var babylonParentBone = babylonBone.getParent();
                    if (babylonParentBone) {
                        baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                    }
                    babylonBone.updateMatrix(baseMatrix, false, false);
                    babylonBone._updateDifferenceMatrix(undefined, false);
                }
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
            };
            GLTFLoader.prototype._loadCamera = function (context, camera, babylonMesh) {
                var babylonCamera = new BABYLON.FreeCamera(camera.name || "camera" + camera._index, BABYLON.Vector3.Zero(), this._babylonScene, false);
                babylonCamera.parent = babylonMesh;
                babylonCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                switch (camera.type) {
                    case "perspective" /* PERSPECTIVE */: {
                        var perspective = camera.perspective;
                        if (!perspective) {
                            throw new Error(context + ": Camera perspective properties are missing");
                        }
                        babylonCamera.fov = perspective.yfov;
                        babylonCamera.minZ = perspective.znear;
                        babylonCamera.maxZ = perspective.zfar || Number.MAX_VALUE;
                        break;
                    }
                    case "orthographic" /* ORTHOGRAPHIC */: {
                        if (!camera.orthographic) {
                            throw new Error(context + ": Camera orthographic properties are missing");
                        }
                        babylonCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        babylonCamera.orthoLeft = -camera.orthographic.xmag;
                        babylonCamera.orthoRight = camera.orthographic.xmag;
                        babylonCamera.orthoBottom = -camera.orthographic.ymag;
                        babylonCamera.orthoTop = camera.orthographic.ymag;
                        babylonCamera.minZ = camera.orthographic.znear;
                        babylonCamera.maxZ = camera.orthographic.zfar;
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid camera type (" + camera.type + ")");
                    }
                }
                this.onCameraLoadedObservable.notifyObservers(babylonCamera);
            };
            GLTFLoader.prototype._loadAnimationsAsync = function () {
                var animations = this._gltf.animations;
                if (!animations) {
                    return Promise.resolve();
                }
                var promises = new Array();
                for (var index = 0; index < animations.length; index++) {
                    var animation = animations[index];
                    promises.push(this._loadAnimationAsync("#/animations/" + index, animation));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadAnimationAsync = function (context, animation) {
                var _this = this;
                var babylonAnimationGroup = new BABYLON.AnimationGroup(animation.name || "animation" + animation._index, this._babylonScene);
                animation._babylonAnimationGroup = babylonAnimationGroup;
                var promises = new Array();
                GLTF2._ArrayItem.Assign(animation.channels);
                GLTF2._ArrayItem.Assign(animation.samplers);
                for (var _i = 0, _a = animation.channels; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    promises.push(this._loadAnimationChannelAsync(context + "/channels/" + channel._index, context, animation, channel, babylonAnimationGroup));
                }
                return Promise.all(promises).then(function () {
                    babylonAnimationGroup.normalize(_this._normalizeAnimationGroupsToBeginAtZero ? 0 : null);
                });
            };
            GLTFLoader.prototype._loadAnimationChannelAsync = function (context, animationContext, animation, channel, babylonAnimationGroup) {
                var _this = this;
                var targetNode = GLTFLoader._GetProperty(context + "/target/node", this._gltf.nodes, channel.target.node);
                // Ignore animations that have no animation targets.
                if ((channel.target.path === "weights" /* WEIGHTS */ && !targetNode._numMorphTargets) ||
                    (channel.target.path !== "weights" /* WEIGHTS */ && !targetNode._babylonMesh)) {
                    return Promise.resolve();
                }
                // Ignore animations targeting TRS of skinned nodes.
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                if (targetNode.skin != undefined && channel.target.path !== "weights" /* WEIGHTS */) {
                    return Promise.resolve();
                }
                var sampler = GLTFLoader._GetProperty(context + "/sampler", animation.samplers, channel.sampler);
                return this._loadAnimationSamplerAsync(animationContext + "/samplers/" + channel.sampler, sampler).then(function (data) {
                    var targetPath;
                    var animationType;
                    switch (channel.target.path) {
                        case "translation" /* TRANSLATION */: {
                            targetPath = "position";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "rotation" /* ROTATION */: {
                            targetPath = "rotationQuaternion";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            break;
                        }
                        case "scale" /* SCALE */: {
                            targetPath = "scaling";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "weights" /* WEIGHTS */: {
                            targetPath = "influence";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                            break;
                        }
                        default: {
                            throw new Error(context + ": Invalid target path (" + channel.target.path + ")");
                        }
                    }
                    var outputBufferOffset = 0;
                    var getNextOutputValue;
                    switch (targetPath) {
                        case "position": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "rotationQuaternion": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Quaternion.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 4;
                                return value;
                            };
                            break;
                        }
                        case "scaling": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "influence": {
                            getNextOutputValue = function () {
                                var value = new Array(targetNode._numMorphTargets);
                                for (var i = 0; i < targetNode._numMorphTargets; i++) {
                                    value[i] = data.output[outputBufferOffset++];
                                }
                                return value;
                            };
                            break;
                        }
                    }
                    var getNextKey;
                    switch (data.interpolation) {
                        case "STEP" /* STEP */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue(),
                                interpolation: BABYLON.AnimationKeyInterpolation.STEP
                            }); };
                            break;
                        }
                        case "LINEAR" /* LINEAR */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue()
                            }); };
                            break;
                        }
                        case "CUBICSPLINE" /* CUBICSPLINE */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                inTangent: getNextOutputValue(),
                                value: getNextOutputValue(),
                                outTangent: getNextOutputValue()
                            }); };
                            break;
                        }
                    }
                    var keys = new Array(data.input.length);
                    for (var frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                        keys[frameIndex] = getNextKey(frameIndex);
                    }
                    if (targetPath === "influence") {
                        var _loop_1 = function (targetIndex) {
                            var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                            var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                            babylonAnimation.setKeys(keys.map(function (key) { return ({
                                frame: key.frame,
                                inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                value: key.value[targetIndex],
                                outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                            }); }));
                            _this._forEachPrimitive(targetNode, function (babylonMesh) {
                                var morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                                var babylonAnimationClone = babylonAnimation.clone();
                                morphTarget.animations.push(babylonAnimationClone);
                                babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                            });
                        };
                        for (var targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                            _loop_1(targetIndex);
                        }
                    }
                    else {
                        var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        if (targetNode._babylonBones) {
                            var babylonAnimationTargets = [targetNode._babylonMesh].concat(targetNode._babylonBones);
                            for (var _i = 0, babylonAnimationTargets_1 = babylonAnimationTargets; _i < babylonAnimationTargets_1.length; _i++) {
                                var babylonAnimationTarget = babylonAnimationTargets_1[_i];
                                babylonAnimationTarget.animations.push(babylonAnimation);
                            }
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, babylonAnimationTargets);
                        }
                        else {
                            targetNode._babylonMesh.animations.push(babylonAnimation);
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonMesh);
                        }
                    }
                });
            };
            GLTFLoader.prototype._loadAnimationSamplerAsync = function (context, sampler) {
                if (sampler._data) {
                    return sampler._data;
                }
                var interpolation = sampler.interpolation || "LINEAR" /* LINEAR */;
                switch (interpolation) {
                    case "STEP" /* STEP */:
                    case "LINEAR" /* LINEAR */:
                    case "CUBICSPLINE" /* CUBICSPLINE */: {
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid interpolation (" + sampler.interpolation + ")");
                    }
                }
                var inputAccessor = GLTFLoader._GetProperty(context + "/input", this._gltf.accessors, sampler.input);
                var outputAccessor = GLTFLoader._GetProperty(context + "/output", this._gltf.accessors, sampler.output);
                sampler._data = Promise.all([
                    this._loadFloatAccessorAsync("#/accessors/" + inputAccessor._index, inputAccessor),
                    this._loadFloatAccessorAsync("#/accessors/" + outputAccessor._index, outputAccessor)
                ]).then(function (_a) {
                    var inputData = _a[0], outputData = _a[1];
                    return {
                        input: inputData,
                        interpolation: interpolation,
                        output: outputData,
                    };
                });
                return sampler._data;
            };
            GLTFLoader.prototype._loadBufferAsync = function (context, buffer) {
                if (buffer._data) {
                    return buffer._data;
                }
                if (!buffer.uri) {
                    throw new Error(context + ": Uri is missing");
                }
                buffer._data = this._loadUriAsync(context, buffer.uri);
                return buffer._data;
            };
            /** @hidden */
            GLTFLoader.prototype._loadBufferViewAsync = function (context, bufferView) {
                if (bufferView._data) {
                    return bufferView._data;
                }
                var buffer = GLTFLoader._GetProperty(context + "/buffer", this._gltf.buffers, bufferView.buffer);
                bufferView._data = this._loadBufferAsync("#/buffers/" + buffer._index, buffer).then(function (data) {
                    try {
                        return new Uint8Array(data.buffer, data.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                });
                return bufferView._data;
            };
            GLTFLoader.prototype._loadIndicesAccessorAsync = function (context, accessor) {
                if (accessor.type !== "SCALAR" /* SCALAR */) {
                    throw new Error(context + ": Invalid type " + accessor.type);
                }
                if (accessor.componentType !== 5121 /* UNSIGNED_BYTE */ &&
                    accessor.componentType !== 5123 /* UNSIGNED_SHORT */ &&
                    accessor.componentType !== 5125 /* UNSIGNED_INT */) {
                    throw new Error(context + ": Invalid component type " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                accessor._data = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
                });
                return accessor._data;
            };
            GLTFLoader.prototype._loadFloatAccessorAsync = function (context, accessor) {
                // TODO: support normalized and stride
                var _this = this;
                if (accessor.componentType !== 5126 /* FLOAT */) {
                    throw new Error("Invalid component type " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
                var length = numComponents * accessor.count;
                if (accessor.bufferView == undefined) {
                    accessor._data = Promise.resolve(new Float32Array(length));
                }
                else {
                    var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                    accessor._data = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                        return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                    });
                }
                if (accessor.sparse) {
                    var sparse_1 = accessor.sparse;
                    accessor._data = accessor._data.then(function (data) {
                        var indicesBufferView = GLTFLoader._GetProperty(context + "/sparse/indices/bufferView", _this._gltf.bufferViews, sparse_1.indices.bufferView);
                        var valuesBufferView = GLTFLoader._GetProperty(context + "/sparse/values/bufferView", _this._gltf.bufferViews, sparse_1.values.bufferView);
                        return Promise.all([
                            _this._loadBufferViewAsync("#/bufferViews/" + indicesBufferView._index, indicesBufferView),
                            _this._loadBufferViewAsync("#/bufferViews/" + valuesBufferView._index, valuesBufferView)
                        ]).then(function (_a) {
                            var indicesData = _a[0], valuesData = _a[1];
                            var indices = GLTFLoader._GetTypedArray(context + "/sparse/indices", sparse_1.indices.componentType, indicesData, sparse_1.indices.byteOffset, sparse_1.count);
                            var values = GLTFLoader._GetTypedArray(context + "/sparse/values", accessor.componentType, valuesData, sparse_1.values.byteOffset, numComponents * sparse_1.count);
                            var valuesIndex = 0;
                            for (var indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                                var dataIndex = indices[indicesIndex] * numComponents;
                                for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                                    data[dataIndex++] = values[valuesIndex++];
                                }
                            }
                            return data;
                        });
                    });
                }
                return accessor._data;
            };
            /** @hidden */
            GLTFLoader.prototype._loadVertexBufferViewAsync = function (context, bufferView, kind) {
                var _this = this;
                if (bufferView._babylonBuffer) {
                    return bufferView._babylonBuffer;
                }
                bufferView._babylonBuffer = this._loadBufferViewAsync(context, bufferView).then(function (data) {
                    return new BABYLON.Buffer(_this._babylonScene.getEngine(), data, false);
                });
                return bufferView._babylonBuffer;
            };
            GLTFLoader.prototype._loadVertexAccessorAsync = function (context, accessor, kind) {
                var _this = this;
                if (accessor._babylonVertexBuffer) {
                    return accessor._babylonVertexBuffer;
                }
                if (accessor.sparse) {
                    accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(context, accessor).then(function (data) {
                        return new BABYLON.VertexBuffer(_this._babylonScene.getEngine(), data, kind, false);
                    });
                }
                else {
                    var bufferView_1 = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                    accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync("#/bufferViews/" + bufferView_1._index, bufferView_1, kind).then(function (buffer) {
                        var size = GLTFLoader._GetNumComponents(context, accessor.type);
                        return new BABYLON.VertexBuffer(_this._babylonScene.getEngine(), buffer, kind, false, false, bufferView_1.byteStride, false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
                    });
                }
                return accessor._babylonVertexBuffer;
            };
            GLTFLoader.prototype._getDefaultMaterial = function (drawMode) {
                var babylonMaterial = this._defaultBabylonMaterials[drawMode];
                if (!babylonMaterial) {
                    babylonMaterial = this._createMaterial("__gltf_default", drawMode);
                    babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                    babylonMaterial.metallic = 1;
                    babylonMaterial.roughness = 1;
                    this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                }
                return babylonMaterial;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessPropertiesAsync = function (context, material, babylonMaterial) {
                var promises = new Array();
                // Ensure metallic workflow
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                var properties = material.pbrMetallicRoughness;
                if (properties) {
                    if (properties.baseColorFactor) {
                        babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                        babylonMaterial.alpha = properties.baseColorFactor[3];
                    }
                    else {
                        babylonMaterial.albedoColor = BABYLON.Color3.White();
                    }
                    babylonMaterial.metallic = properties.metallicFactor == undefined ? 1 : properties.metallicFactor;
                    babylonMaterial.roughness = properties.roughnessFactor == undefined ? 1 : properties.roughnessFactor;
                    if (properties.baseColorTexture) {
                        promises.push(this._loadTextureAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.metallicRoughnessTexture) {
                        promises.push(this._loadTextureAsync(context + "/metallicRoughnessTexture", properties.metallicRoughnessTexture, function (texture) {
                            babylonMaterial.metallicTexture = texture;
                        }));
                        babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                        babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                        babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                    }
                }
                this._loadMaterialAlphaProperties(context, material, babylonMaterial);
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                var promise = GLTF2.GLTFLoaderExtension._LoadMaterialAsync(this, context, material, babylonMesh, babylonDrawMode, assign);
                if (promise) {
                    return promise;
                }
                material._babylonData = material._babylonData || {};
                var babylonData = material._babylonData[babylonDrawMode];
                if (!babylonData) {
                    var promises = new Array();
                    var name_3 = material.name || "materialSG_" + material._index;
                    var babylonMaterial = this._createMaterial(name_3, babylonDrawMode);
                    promises.push(this._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                    promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context, material, babylonMaterial));
                    this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    babylonData = {
                        material: babylonMaterial,
                        meshes: [],
                        loaded: Promise.all(promises).then(function () { })
                    };
                    material._babylonData[babylonDrawMode] = babylonData;
                }
                babylonData.meshes.push(babylonMesh);
                assign(babylonData.material);
                return babylonData.loaded;
            };
            /** @hidden */
            GLTFLoader.prototype._createMaterial = function (name, drawMode) {
                var babylonMaterial = new BABYLON.PBRMaterial(name, this._babylonScene);
                babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? BABYLON.Material.CounterClockWiseSideOrientation : BABYLON.Material.ClockWiseSideOrientation;
                babylonMaterial.fillMode = drawMode;
                babylonMaterial.enableSpecularAntiAliasing = true;
                babylonMaterial.useRadianceOverAlpha = !this.transparencyAsCoverage;
                babylonMaterial.useSpecularOverAlpha = !this.transparencyAsCoverage;
                return babylonMaterial;
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialBasePropertiesAsync = function (context, material, babylonMaterial) {
                var promises = new Array();
                babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.twoSidedLighting = true;
                }
                if (material.normalTexture) {
                    promises.push(this._loadTextureAsync(context + "/normalTexture", material.normalTexture, function (texture) {
                        babylonMaterial.bumpTexture = texture;
                    }));
                    babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                    babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                    if (material.normalTexture.scale != undefined) {
                        babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }
                if (material.occlusionTexture) {
                    promises.push(this._loadTextureAsync(context + "/occlusionTexture", material.occlusionTexture, function (texture) {
                        babylonMaterial.ambientTexture = texture;
                    }));
                    babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength != undefined) {
                        babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }
                if (material.emissiveTexture) {
                    promises.push(this._loadTextureAsync(context + "/emissiveTexture", material.emissiveTexture, function (texture) {
                        babylonMaterial.emissiveTexture = texture;
                    }));
                }
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialAlphaProperties = function (context, material, babylonMaterial) {
                var alphaMode = material.alphaMode || "OPAQUE" /* OPAQUE */;
                switch (alphaMode) {
                    case "OPAQUE" /* OPAQUE */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                        break;
                    }
                    case "MASK" /* MASK */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
                        babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                        }
                        break;
                    }
                    case "BLEND" /* BLEND */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                            babylonMaterial.useAlphaFromAlbedoTexture = true;
                        }
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid alpha mode (" + material.alphaMode + ")");
                    }
                }
            };
            /** @hidden */
            GLTFLoader.prototype._loadTextureAsync = function (context, textureInfo, assign) {
                var _this = this;
                var texture = GLTFLoader._GetProperty(context + "/index", this._gltf.textures, textureInfo.index);
                context = "#/textures/" + textureInfo.index;
                var promises = new Array();
                var sampler = (texture.sampler == undefined ? this._defaultSampler : GLTFLoader._GetProperty(context + "/sampler", this._gltf.samplers, texture.sampler));
                var samplerData = this._loadSampler("#/samplers/" + sampler._index, sampler);
                var deferred = new BABYLON.Deferred();
                var babylonTexture = new BABYLON.Texture(null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, function () {
                    if (!_this._disposed) {
                        deferred.resolve();
                    }
                }, function (message, exception) {
                    if (!_this._disposed) {
                        deferred.reject(new Error(context + ": " + ((exception && exception.message) ? exception.message : message || "Failed to load texture")));
                    }
                });
                promises.push(deferred.promise);
                babylonTexture.name = texture.name || "texture" + texture._index;
                babylonTexture.wrapU = samplerData.wrapU;
                babylonTexture.wrapV = samplerData.wrapV;
                babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
                var image = GLTFLoader._GetProperty(context + "/source", this._gltf.images, texture.source);
                promises.push(this._loadImageAsync("#/images/" + image._index, image).then(function (objectURL) {
                    babylonTexture.updateURL(objectURL);
                }));
                assign(babylonTexture);
                this.onTextureLoadedObservable.notifyObservers(babylonTexture);
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadSampler = function (context, sampler) {
                if (!sampler._data) {
                    sampler._data = {
                        noMipMaps: (sampler.minFilter === 9728 /* NEAREST */ || sampler.minFilter === 9729 /* LINEAR */),
                        samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler.magFilter, sampler.minFilter),
                        wrapU: GLTFLoader._GetTextureWrapMode(context, sampler.wrapS),
                        wrapV: GLTFLoader._GetTextureWrapMode(context, sampler.wrapT)
                    };
                }
                ;
                return sampler._data;
            };
            GLTFLoader.prototype._loadImageAsync = function (context, image) {
                if (image._objectURL) {
                    return image._objectURL;
                }
                var promise;
                if (image.uri) {
                    promise = this._loadUriAsync(context, image.uri);
                }
                else {
                    var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, image.bufferView);
                    promise = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView);
                }
                image._objectURL = promise.then(function (data) {
                    return URL.createObjectURL(new Blob([data], { type: image.mimeType }));
                });
                return image._objectURL;
            };
            /** @hidden */
            GLTFLoader.prototype._loadUriAsync = function (context, uri) {
                var _this = this;
                var promise = GLTF2.GLTFLoaderExtension._LoadUriAsync(this, context, uri);
                if (promise) {
                    return promise;
                }
                if (!GLTFLoader._ValidateUri(uri)) {
                    throw new Error(context + ": Uri '" + uri + "' is invalid");
                }
                if (BABYLON.Tools.IsBase64(uri)) {
                    return Promise.resolve(new Uint8Array(BABYLON.Tools.DecodeBase64(uri)));
                }
                return this.preprocessUrlAsync(this._rootUrl + uri).then(function (url) {
                    return new Promise(function (resolve, reject) {
                        if (!_this._disposed) {
                            var request_1 = BABYLON.Tools.LoadFile(url, function (data) {
                                if (!_this._disposed) {
                                    resolve(new Uint8Array(data));
                                }
                            }, function (event) {
                                if (!_this._disposed) {
                                    try {
                                        if (request_1 && _this._state === BABYLON.GLTFLoaderState.LOADING) {
                                            request_1._lengthComputable = event.lengthComputable;
                                            request_1._loaded = event.loaded;
                                            request_1._total = event.total;
                                            _this._onProgress();
                                        }
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                }
                            }, _this._babylonScene.database, true, function (request, exception) {
                                if (!_this._disposed) {
                                    reject(new BABYLON.LoadFileError(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""), request));
                                }
                            });
                            _this._requests.push(request_1);
                        }
                    });
                });
            };
            GLTFLoader.prototype._onProgress = function () {
                if (!this._progressCallback) {
                    return;
                }
                var lengthComputable = true;
                var loaded = 0;
                var total = 0;
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    if (request._lengthComputable === undefined || request._loaded === undefined || request._total === undefined) {
                        return;
                    }
                    lengthComputable = lengthComputable && request._lengthComputable;
                    loaded += request._loaded;
                    total += request._total;
                }
                this._progressCallback(new BABYLON.SceneLoaderProgressEvent(lengthComputable, loaded, lengthComputable ? total : 0));
            };
            /** @hidden */
            GLTFLoader._GetProperty = function (context, array, index) {
                if (!array || index == undefined || !array[index]) {
                    throw new Error(context + ": Failed to find index (" + index + ")");
                }
                return array[index];
            };
            GLTFLoader._GetTextureWrapMode = function (context, mode) {
                // Set defaults if undefined
                mode = mode == undefined ? 10497 /* REPEAT */ : mode;
                switch (mode) {
                    case 33071 /* CLAMP_TO_EDGE */: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case 33648 /* MIRRORED_REPEAT */: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case 10497 /* REPEAT */: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default:
                        BABYLON.Tools.Warn(context + ": Invalid texture wrap mode (" + mode + ")");
                        return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            GLTFLoader._GetTextureSamplingMode = function (context, magFilter, minFilter) {
                // Set defaults if undefined
                magFilter = magFilter == undefined ? 9729 /* LINEAR */ : magFilter;
                minFilter = minFilter == undefined ? 9987 /* LINEAR_MIPMAP_LINEAR */ : minFilter;
                if (magFilter === 9729 /* LINEAR */) {
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.LINEAR_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.LINEAR_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== 9728 /* NEAREST */) {
                        BABYLON.Tools.Warn(context + ": Invalid texture magnification filter (" + magFilter + ")");
                    }
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.NEAREST_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.NEAREST_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
                }
            };
            GLTFLoader._GetTypedArray = function (context, componentType, bufferView, byteOffset, length) {
                var buffer = bufferView.buffer;
                byteOffset = bufferView.byteOffset + (byteOffset || 0);
                try {
                    switch (componentType) {
                        case 5120 /* BYTE */: return new Int8Array(buffer, byteOffset, length);
                        case 5121 /* UNSIGNED_BYTE */: return new Uint8Array(buffer, byteOffset, length);
                        case 5122 /* SHORT */: return new Int16Array(buffer, byteOffset, length);
                        case 5123 /* UNSIGNED_SHORT */: return new Uint16Array(buffer, byteOffset, length);
                        case 5125 /* UNSIGNED_INT */: return new Uint32Array(buffer, byteOffset, length);
                        case 5126 /* FLOAT */: return new Float32Array(buffer, byteOffset, length);
                        default: throw new Error("Invalid component type " + componentType);
                    }
                }
                catch (e) {
                    throw new Error(context + ": " + e);
                }
            };
            GLTFLoader._GetNumComponents = function (context, type) {
                switch (type) {
                    case "SCALAR": return 1;
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                }
                throw new Error(context + ": Invalid type (" + type + ")");
            };
            GLTFLoader._ValidateUri = function (uri) {
                return (BABYLON.Tools.IsBase64(uri) || uri.indexOf("..") === -1);
            };
            GLTFLoader._GetDrawMode = function (context, mode) {
                if (mode == undefined) {
                    mode = 4 /* TRIANGLES */;
                }
                switch (mode) {
                    case 0 /* POINTS */: return BABYLON.Material.PointListDrawMode;
                    case 1 /* LINES */: return BABYLON.Material.LineListDrawMode;
                    case 2 /* LINE_LOOP */: return BABYLON.Material.LineLoopDrawMode;
                    case 3 /* LINE_STRIP */: return BABYLON.Material.LineStripDrawMode;
                    case 4 /* TRIANGLES */: return BABYLON.Material.TriangleFillMode;
                    case 5 /* TRIANGLE_STRIP */: return BABYLON.Material.TriangleStripDrawMode;
                    case 6 /* TRIANGLE_FAN */: return BABYLON.Material.TriangleFanDrawMode;
                }
                throw new Error(context + ": Invalid mesh primitive mode (" + mode + ")");
            };
            GLTFLoader.prototype._compileMaterialsAsync = function () {
                var promises = new Array();
                if (this._gltf.materials) {
                    for (var _i = 0, _a = this._gltf.materials; _i < _a.length; _i++) {
                        var material = _a[_i];
                        if (material._babylonData) {
                            for (var babylonDrawMode in material._babylonData) {
                                var babylonData = material._babylonData[babylonDrawMode];
                                for (var _b = 0, _c = babylonData.meshes; _b < _c.length; _b++) {
                                    var babylonMesh = _c[_b];
                                    // Ensure nonUniformScaling is set if necessary.
                                    babylonMesh.computeWorldMatrix(true);
                                    var babylonMaterial = babylonData.material;
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                    if (this.useClipPlane) {
                                        promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                    }
                                }
                            }
                        }
                    }
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._compileShadowGeneratorsAsync = function () {
                var promises = new Array();
                var lights = this._babylonScene.lights;
                for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
                    var light = lights_1[_i];
                    var generator = light.getShadowGenerator();
                    if (generator) {
                        promises.push(generator.forceCompilationAsync());
                    }
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._clear = function () {
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    request.abort();
                }
                this._requests.length = 0;
                if (this._gltf && this._gltf.images) {
                    for (var _b = 0, _c = this._gltf.images; _b < _c.length; _b++) {
                        var image = _c[_b];
                        if (image._objectURL) {
                            image._objectURL.then(function (value) {
                                URL.revokeObjectURL(value);
                            });
                            image._objectURL = undefined;
                        }
                    }
                }
                delete this._gltf;
                delete this._babylonScene;
                this._completePromises.length = 0;
                for (var name_4 in this._extensions) {
                    this._extensions[name_4].dispose();
                }
                this._extensions = {};
                delete this._rootBabylonMesh;
                delete this._progressCallback;
                this.onMeshLoadedObservable.clear();
                this.onTextureLoadedObservable.clear();
                this.onMaterialLoadedObservable.clear();
                this.onCameraLoadedObservable.clear();
            };
            /** @hidden */
            GLTFLoader.prototype._applyExtensions = function (actionAsync) {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_5 = _a[_i];
                    var extension = this._extensions[name_5];
                    if (extension.enabled) {
                        var promise = actionAsync(extension);
                        if (promise) {
                            return promise;
                        }
                    }
                }
                return null;
            };
            GLTFLoader._ExtensionNames = new Array();
            GLTFLoader._ExtensionFactories = {};
            return GLTFLoader;
        }());
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = function () { return new GLTFLoader(); };
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Abstract class that can be implemented to extend existing glTF loader behavior.
         */
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(loader) {
                this.enabled = true;
                this._loader = loader;
            }
            GLTFLoaderExtension.prototype.dispose = function () {
                delete this._loader;
            };
            // #region Overridable Methods
            /** Override this method to modify the default behavior for loading scenes. */
            GLTFLoaderExtension.prototype._loadSceneAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading nodes. */
            GLTFLoaderExtension.prototype._loadNodeAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
            GLTFLoaderExtension.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) { return null; };
            /** Override this method to modify the default behavior for loading materials. */
            GLTFLoaderExtension.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) { return null; };
            /** Override this method to modify the default behavior for loading uris. */
            GLTFLoaderExtension.prototype._loadUriAsync = function (context, uri) { return null; };
            // #endregion
            /** Helper method called by a loader extension to load an glTF extension. */
            GLTFLoaderExtension.prototype._loadExtensionAsync = function (context, property, actionAsync) {
                if (!property.extensions) {
                    return null;
                }
                var extensions = property.extensions;
                var extension = extensions[this.name];
                if (!extension) {
                    return null;
                }
                // Clear out the extension before executing the action to avoid recursing into the same property.
                delete extensions[this.name];
                try {
                    return actionAsync(context + "/extensions/" + this.name, extension);
                }
                finally {
                    // Restore the extension after executing the action.
                    extensions[this.name] = extension;
                }
            };
            /** Helper method called by the loader to allow extensions to override loading scenes. */
            GLTFLoaderExtension._LoadSceneAsync = function (loader, context, scene) {
                return loader._applyExtensions(function (extension) { return extension._loadSceneAsync(context, scene); });
            };
            /** Helper method called by the loader to allow extensions to override loading nodes. */
            GLTFLoaderExtension._LoadNodeAsync = function (loader, context, node) {
                return loader._applyExtensions(function (extension) { return extension._loadNodeAsync(context, node); });
            };
            /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
            GLTFLoaderExtension._LoadVertexDataAsync = function (loader, context, primitive, babylonMesh) {
                return loader._applyExtensions(function (extension) { return extension._loadVertexDataAsync(context, primitive, babylonMesh); });
            };
            /** Helper method called by the loader to allow extensions to override loading materials. */
            GLTFLoaderExtension._LoadMaterialAsync = function (loader, context, material, babylonMesh, babylonDrawMode, assign) {
                return loader._applyExtensions(function (extension) { return extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign); });
            };
            /** Helper method called by the loader to allow extensions to override loading uris. */
            GLTFLoaderExtension._LoadUriAsync = function (loader, context, uri) {
                return loader._applyExtensions(function (extension) { return extension._loadUriAsync(context, uri); });
            };
            return GLTFLoaderExtension;
        }());
        GLTF2.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_lod";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
             */
            var MSFT_lod = /** @class */ (function (_super) {
                __extends(MSFT_lod, _super);
                function MSFT_lod() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    /**
                     * Maximum number of LODs to load, starting from the lowest LOD.
                     */
                    _this.maxLODsToLoad = Number.MAX_VALUE;
                    _this._loadingNodeLOD = null;
                    _this._loadNodeSignals = {};
                    _this._loadingMaterialLOD = null;
                    _this._loadMaterialSignals = {};
                    return _this;
                }
                MSFT_lod.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (extensionContext, extension) {
                        var firstPromise;
                        var nodeLODs = _this._getLODs(extensionContext, node, _this._loader._gltf.nodes, extension.ids);
                        var _loop_1 = function (indexLOD) {
                            var nodeLOD = nodeLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingNodeLOD = nodeLOD;
                                if (!_this._loadNodeSignals[nodeLOD._index]) {
                                    _this._loadNodeSignals[nodeLOD._index] = new BABYLON.Deferred();
                                }
                            }
                            var promise = _this._loader._loadNodeAsync("#/nodes/" + nodeLOD._index, nodeLOD).then(function () {
                                if (indexLOD !== 0) {
                                    var previousNodeLOD = nodeLODs[indexLOD - 1];
                                    if (previousNodeLOD._babylonMesh) {
                                        previousNodeLOD._babylonMesh.dispose(false, true);
                                        delete previousNodeLOD._babylonMesh;
                                    }
                                }
                                if (indexLOD !== nodeLODs.length - 1) {
                                    var nodeIndex = nodeLODs[indexLOD + 1]._index;
                                    if (_this._loadNodeSignals[nodeIndex]) {
                                        _this._loadNodeSignals[nodeIndex].resolve();
                                        delete _this._loadNodeSignals[nodeIndex];
                                    }
                                }
                            });
                            if (indexLOD === 0) {
                                firstPromise = promise;
                            }
                            else {
                                _this._loader._completePromises.push(promise);
                                _this._loadingNodeLOD = null;
                            }
                        };
                        for (var indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                            _loop_1(indexLOD);
                        }
                        return firstPromise;
                    });
                };
                MSFT_lod.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    // Don't load material LODs if already loading a node LOD.
                    if (this._loadingNodeLOD) {
                        return null;
                    }
                    return this._loadExtensionAsync(context, material, function (extensionContext, extension) {
                        var firstPromise;
                        var materialLODs = _this._getLODs(extensionContext, material, _this._loader._gltf.materials, extension.ids);
                        var _loop_2 = function (indexLOD) {
                            var materialLOD = materialLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingMaterialLOD = materialLOD;
                                if (!_this._loadMaterialSignals[materialLOD._index]) {
                                    _this._loadMaterialSignals[materialLOD._index] = new BABYLON.Deferred();
                                }
                            }
                            var promise = _this._loader._loadMaterialAsync("#/materials/" + materialLOD._index, materialLOD, babylonMesh, babylonDrawMode, indexLOD === 0 ? assign : function () { }).then(function () {
                                if (indexLOD !== 0) {
                                    var babylonDataLOD = materialLOD._babylonData;
                                    assign(babylonDataLOD[babylonDrawMode].material);
                                    var previousBabylonDataLOD = materialLODs[indexLOD - 1]._babylonData;
                                    if (previousBabylonDataLOD[babylonDrawMode]) {
                                        previousBabylonDataLOD[babylonDrawMode].material.dispose();
                                        delete previousBabylonDataLOD[babylonDrawMode];
                                    }
                                }
                                if (indexLOD !== materialLODs.length - 1) {
                                    var materialIndex = materialLODs[indexLOD + 1]._index;
                                    if (_this._loadMaterialSignals[materialIndex]) {
                                        _this._loadMaterialSignals[materialIndex].resolve();
                                        delete _this._loadMaterialSignals[materialIndex];
                                    }
                                }
                            });
                            if (indexLOD === 0) {
                                firstPromise = promise;
                            }
                            else {
                                _this._loader._completePromises.push(promise);
                                _this._loadingMaterialLOD = null;
                            }
                        };
                        for (var indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                            _loop_2(indexLOD);
                        }
                        return firstPromise;
                    });
                };
                MSFT_lod.prototype._loadUriAsync = function (context, uri) {
                    var _this = this;
                    // Defer the loading of uris if loading a material or node LOD.
                    if (this._loadingMaterialLOD) {
                        var index = this._loadingMaterialLOD._index;
                        return this._loadMaterialSignals[index].promise.then(function () {
                            return _this._loader._loadUriAsync(context, uri);
                        });
                    }
                    else if (this._loadingNodeLOD) {
                        var index = this._loadingNodeLOD._index;
                        return this._loadNodeSignals[index].promise.then(function () {
                            return _this._loader._loadUriAsync(context, uri);
                        });
                    }
                    return null;
                };
                /**
                 * Gets an array of LOD properties from lowest to highest.
                 */
                MSFT_lod.prototype._getLODs = function (context, property, array, ids) {
                    if (this.maxLODsToLoad <= 0) {
                        throw new Error("maxLODsToLoad must be greater than zero");
                    }
                    var properties = new Array();
                    for (var i = ids.length - 1; i >= 0; i--) {
                        properties.push(GLTF2.GLTFLoader._GetProperty(context + "/ids/" + ids[i], array, ids[i]));
                        if (properties.length === this.maxLODsToLoad) {
                            return properties;
                        }
                    }
                    properties.push(property);
                    return properties;
                };
                return MSFT_lod;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_lod = MSFT_lod;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_lod(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_lod.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_minecraftMesh";
            /** @hidden */
            var MSFT_minecraftMesh = /** @class */ (function (_super) {
                __extends(MSFT_minecraftMesh, _super);
                function MSFT_minecraftMesh(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._onMaterialLoaded = function (material) {
                        if (material.needAlphaBlending()) {
                            material.forceDepthWrite = true;
                            material.separateCullingPass = true;
                        }
                        material.backFaceCulling = material.forceDepthWrite;
                        material.twoSidedLighting = true;
                    };
                    var meshes = loader._gltf.meshes;
                    if (meshes && meshes.length) {
                        for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                            var mesh = meshes_1[_i];
                            if (mesh && mesh.extras && mesh.extras.MSFT_minecraftMesh) {
                                _this._loader.onMaterialLoadedObservable.add(_this._onMaterialLoaded);
                                break;
                            }
                        }
                    }
                    return _this;
                }
                return MSFT_minecraftMesh;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_minecraftMesh = MSFT_minecraftMesh;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_minecraftMesh(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_minecraftMesh.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_sRGBFactors";
            /** @hidden */
            var MSFT_sRGBFactors = /** @class */ (function (_super) {
                __extends(MSFT_sRGBFactors, _super);
                function MSFT_sRGBFactors(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._onMaterialLoaded = function (material) {
                        if (!material.albedoTexture) {
                            material.albedoColor.toLinearSpaceToRef(material.albedoColor);
                        }
                        if (!material.reflectivityTexture) {
                            material.reflectivityColor.toLinearSpaceToRef(material.reflectivityColor);
                        }
                    };
                    var materials = loader._gltf.materials;
                    if (materials && materials.length) {
                        for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
                            var material = materials_1[_i];
                            if (material && material.extras && material.extras.MSFT_sRGBFactors) {
                                _this._loader.onMaterialLoadedObservable.add(_this._onMaterialLoaded);
                                break;
                            }
                        }
                    }
                    return _this;
                }
                return MSFT_sRGBFactors;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_sRGBFactors = MSFT_sRGBFactors;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_sRGBFactors(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_sRGBFactors.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_draco_mesh_compression";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
             */
            var KHR_draco_mesh_compression = /** @class */ (function (_super) {
                __extends(KHR_draco_mesh_compression, _super);
                function KHR_draco_mesh_compression(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._dracoCompression = null;
                    // Disable extension if decoder is not available.
                    if (!BABYLON.DracoCompression.DecoderAvailable) {
                        _this.enabled = false;
                    }
                    return _this;
                }
                KHR_draco_mesh_compression.prototype.dispose = function () {
                    if (this._dracoCompression) {
                        this._dracoCompression.dispose();
                    }
                    _super.prototype.dispose.call(this);
                };
                KHR_draco_mesh_compression.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                    var _this = this;
                    return this._loadExtensionAsync(context, primitive, function (extensionContext, extension) {
                        if (primitive.mode != undefined) {
                            if (primitive.mode !== 5 /* TRIANGLE_STRIP */ &&
                                primitive.mode !== 4 /* TRIANGLES */) {
                                throw new Error(context + ": Unsupported mode " + primitive.mode);
                            }
                            // TODO: handle triangle strips
                            if (primitive.mode === 5 /* TRIANGLE_STRIP */) {
                                throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                            }
                        }
                        var attributes = {};
                        var loadAttribute = function (name, kind) {
                            var uniqueId = extension.attributes[name];
                            if (uniqueId == undefined) {
                                return;
                            }
                            babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                            if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                                babylonMesh._delayInfo.push(kind);
                            }
                            attributes[kind] = uniqueId;
                        };
                        loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                        loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                        loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                        loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                        loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                        loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                        loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                        loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind);
                        var bufferView = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._loader._gltf.bufferViews, extension.bufferView);
                        if (!bufferView._dracoBabylonGeometry) {
                            bufferView._dracoBabylonGeometry = _this._loader._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                                if (!_this._dracoCompression) {
                                    _this._dracoCompression = new BABYLON.DracoCompression();
                                }
                                return _this._dracoCompression.decodeMeshAsync(data, attributes).then(function (babylonVertexData) {
                                    var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, _this._loader._babylonScene);
                                    babylonVertexData.applyToGeometry(babylonGeometry);
                                    return babylonGeometry;
                                }).catch(function (error) {
                                    throw new Error(context + ": " + error.message);
                                });
                            });
                        }
                        return bufferView._dracoBabylonGeometry;
                    });
                };
                return KHR_draco_mesh_compression;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_draco_mesh_compression = KHR_draco_mesh_compression;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_draco_mesh_compression(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_draco_mesh_compression.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_materials_pbrSpecularGlossiness";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
             */
            var KHR_materials_pbrSpecularGlossiness = /** @class */ (function (_super) {
                __extends(KHR_materials_pbrSpecularGlossiness, _super);
                function KHR_materials_pbrSpecularGlossiness() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_materials_pbrSpecularGlossiness.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function (extensionContext, extension) {
                        material._babylonData = material._babylonData || {};
                        var babylonData = material._babylonData[babylonDrawMode];
                        if (!babylonData) {
                            var promises = new Array();
                            var name_1 = material.name || "materialSG_" + material._index;
                            var babylonMaterial = _this._loader._createMaterial(name_1, babylonDrawMode);
                            promises.push(_this._loader._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                            promises.push(_this._loadSpecularGlossinessPropertiesAsync(extensionContext, material, extension, babylonMaterial));
                            _this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                            babylonData = {
                                material: babylonMaterial,
                                meshes: [],
                                loaded: Promise.all(promises).then(function () { })
                            };
                            material._babylonData[babylonDrawMode] = babylonData;
                        }
                        babylonData.meshes.push(babylonMesh);
                        assign(babylonData.material);
                        return babylonData.loaded;
                    });
                };
                KHR_materials_pbrSpecularGlossiness.prototype._loadSpecularGlossinessPropertiesAsync = function (context, material, properties, babylonMaterial) {
                    var promises = new Array();
                    if (properties.diffuseFactor) {
                        babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.diffuseFactor);
                        babylonMaterial.alpha = properties.diffuseFactor[3];
                    }
                    else {
                        babylonMaterial.albedoColor = BABYLON.Color3.White();
                    }
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : BABYLON.Color3.White();
                    babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        promises.push(this._loader._loadTextureAsync(context + "/diffuseTexture", properties.diffuseTexture, function (texture) {
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.specularGlossinessTexture) {
                        promises.push(this._loader._loadTextureAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, function (texture) {
                            babylonMaterial.reflectivityTexture = texture;
                        }));
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);
                    return Promise.all(promises).then(function () { });
                };
                return KHR_materials_pbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_materials_pbrSpecularGlossiness = KHR_materials_pbrSpecularGlossiness;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_materials_pbrSpecularGlossiness(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_materials_unlit";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
             */
            var KHR_materials_unlit = /** @class */ (function (_super) {
                __extends(KHR_materials_unlit, _super);
                function KHR_materials_unlit() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_materials_unlit.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function () {
                        material._babylonData = material._babylonData || {};
                        var babylonData = material._babylonData[babylonDrawMode];
                        if (!babylonData) {
                            var name_1 = material.name || "materialUnlit_" + material._index;
                            var babylonMaterial = _this._loader._createMaterial(name_1, babylonDrawMode);
                            babylonMaterial.unlit = true;
                            var promise = _this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
                            _this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                            babylonData = {
                                material: babylonMaterial,
                                meshes: [],
                                loaded: promise
                            };
                            material._babylonData[babylonDrawMode] = babylonData;
                        }
                        babylonData.meshes.push(babylonMesh);
                        assign(babylonData.material);
                        return babylonData.loaded;
                    });
                };
                KHR_materials_unlit.prototype._loadUnlitPropertiesAsync = function (context, material, babylonMaterial) {
                    var promises = new Array();
                    // Ensure metallic workflow
                    babylonMaterial.metallic = 1;
                    babylonMaterial.roughness = 1;
                    var properties = material.pbrMetallicRoughness;
                    if (properties) {
                        if (properties.baseColorFactor) {
                            babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                            babylonMaterial.alpha = properties.baseColorFactor[3];
                        }
                        else {
                            babylonMaterial.albedoColor = BABYLON.Color3.White();
                        }
                        if (properties.baseColorTexture) {
                            promises.push(this._loader._loadTextureAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                                babylonMaterial.albedoTexture = texture;
                            }));
                        }
                    }
                    if (material.doubleSided) {
                        babylonMaterial.backFaceCulling = false;
                        babylonMaterial.twoSidedLighting = true;
                    }
                    this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);
                    return Promise.all(promises).then(function () { });
                };
                return KHR_materials_unlit;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_materials_unlit = KHR_materials_unlit;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_materials_unlit(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));



var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_lights";
            var LightType;
            (function (LightType) {
                LightType["AMBIENT"] = "ambient";
                LightType["DIRECTIONAL"] = "directional";
                LightType["POINT"] = "point";
                LightType["SPOT"] = "spot";
            })(LightType || (LightType = {}));
            /**
             * [Specification](https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights) (Experimental)
             */
            var KHR_lights = /** @class */ (function (_super) {
                __extends(KHR_lights, _super);
                function KHR_lights() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_lights.prototype._loadSceneAsync = function (context, scene) {
                    var _this = this;
                    return this._loadExtensionAsync(context, scene, function (extensionContext, extension) {
                        var promise = _this._loader._loadSceneAsync(extensionContext, scene);
                        var light = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._lights, extension.light);
                        if (light.type !== LightType.AMBIENT) {
                            throw new Error(extensionContext + ": Only ambient lights are allowed on a scene");
                        }
                        _this._loader._babylonScene.ambientColor = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.Black();
                        return promise;
                    });
                };
                KHR_lights.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (extensionContext, extension) {
                        var promise = _this._loader._loadNodeAsync(extensionContext, node);
                        var babylonLight;
                        var light = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._lights, extension.light);
                        var name = node._babylonMesh.name;
                        switch (light.type) {
                            case LightType.AMBIENT: {
                                throw new Error(extensionContext + ": Ambient lights are not allowed on a node");
                            }
                            case LightType.DIRECTIONAL: {
                                babylonLight = new BABYLON.DirectionalLight(name, BABYLON.Vector3.Forward(), _this._loader._babylonScene);
                                break;
                            }
                            case LightType.POINT: {
                                babylonLight = new BABYLON.PointLight(name, BABYLON.Vector3.Zero(), _this._loader._babylonScene);
                                break;
                            }
                            case LightType.SPOT: {
                                var spotLight = light;
                                // TODO: support inner and outer cone angles
                                //const innerConeAngle = spotLight.innerConeAngle || 0;
                                var outerConeAngle = spotLight.outerConeAngle || Math.PI / 4;
                                babylonLight = new BABYLON.SpotLight(name, BABYLON.Vector3.Zero(), BABYLON.Vector3.Forward(), outerConeAngle, 2, _this._loader._babylonScene);
                                break;
                            }
                            default: {
                                throw new Error(extensionContext + ": Invalid light type (" + light.type + ")");
                            }
                        }
                        babylonLight.diffuse = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.White();
                        babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                        babylonLight.parent = node._babylonMesh;
                        return promise;
                    });
                };
                Object.defineProperty(KHR_lights.prototype, "_lights", {
                    get: function () {
                        var extensions = this._loader._gltf.extensions;
                        if (!extensions || !extensions[this.name]) {
                            throw new Error("#/extensions: '" + this.name + "' not found");
                        }
                        var extension = extensions[this.name];
                        return extension.lights;
                    },
                    enumerable: true,
                    configurable: true
                });
                return KHR_lights;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_lights = KHR_lights;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_lights(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

    

    return BABYLON;
});
