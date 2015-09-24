module BABYLON {
    /**
    * Enums
    */
    export enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        FLOAT = 5126
    }

    export enum EShaderType {
        FRAGMENT = 35632,
        VERTEX = 35633
    }

    export enum EParameterType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        INT = 5124,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
        FLOAT_VEC2 = 35664,
        FLOAT_VEC3 = 35665,
        FLOAT_VEC4 = 35666,
        INT_VEC2 = 35667,
        INT_VEC3 = 35668,
        INT_VEC4 = 35669,
        BOOL = 35670,
        BOOL_VEC2 = 35671,
        BOOL_VEC3 = 35672,
        BOOL_VEC4 = 35673,
        FLOAT_MAT2 = 35674,
        FLOAT_MAT3 = 35675,
        FLOAT_MAT4 = 35676,
        SAMPLER_2D = 35678
    }

    export enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497
    }

    export enum ETextureFilterType {
        NEAREST = 9728,
        LINEAR = 9728,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987
    }

    export enum ETextureFormat {
        ALPHA = 6406,
        RGB = 6407,
        RGBA = 6408,
        LUMINANCE = 6409,
        LUMINANCE_ALPHA = 6410 
    }

    /**
    * Tokenizer. Used for shaders compatibility
    * Automatically map world, view, projection, worldViewProjection and attributes
    */
    enum ETokenType {
        IDENTIFIER = 1,

        UNKNOWN = 2,
        END_OF_INPUT = 3
    }

    class Tokenizer {
        private _toParse: string;
        private _pos: number = 0;
        private _maxPos: number;

        public currentToken: ETokenType;
        public currentIdentifier: string;
        public currentString: string;
        public isLetterOrDigitPattern: RegExp = /^[a-zA-Z0-9]+$/;

        constructor(toParse: string) {
            this._toParse = toParse;
            this._maxPos = toParse.length;
        }

        public getNextToken(): ETokenType {
            if (this.isEnd()) return ETokenType.END_OF_INPUT;

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
        }

        public peek(): string {
            return this._toParse[this._pos];
        }

        public read(): string {
            return this._toParse[this._pos++];
        }

        public forward(): void {
            this._pos++;
        }

        public isEnd(): boolean {
            return this._pos >= this._maxPos;
        }
    }

    /**
    * Values
    */
    var glTFTransforms =    ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
    var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];

    var glTFAnimationPaths =    ["translation", "rotation",           "scale"];
    var babylonAnimationPaths = ["position",    "rotationQuaternion", "scaling"];

    /**
    * Parse
    */
    var parseBuffers = (parsedBuffers: any, gltfRuntime: IGLTFRuntime) => {
        for (var buf in parsedBuffers) {
            var parsedBuffer = parsedBuffers[buf];
            gltfRuntime.buffers[buf] = parsedBuffer;
            gltfRuntime.buffersCount++;
        }
    };

    var parseShaders = (parsedShaders: any, gltfRuntime: IGLTFRuntime) => {
        for (var sha in parsedShaders) {
            var parsedShader = parsedShaders[sha];
            gltfRuntime.shaders[sha] = parsedShader;
            gltfRuntime.shaderscount++;
        }
    };

    var parseObject = (parsedObjects: any, runtimeProperty: string, gltfRuntime: IGLTFRuntime) => {
        for (var object in parsedObjects) {
            var parsedObject = parsedObjects[object];
            gltfRuntime[runtimeProperty][object] = parsedObject;
        }
    };

    /**
    * Utils
    */
    var getByteStrideFromType = (accessor: IGLTFAccessor): number => {
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

    var setMatrix = (scene: Scene, source: Node, parameter: IGLTFTechniqueParameter, uniformName: string, shaderMaterial: any) => {
        var mat: Matrix = null;

        if (parameter.semantic === "MODEL") {
            mat = source.getWorldMatrix();
        }
        else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
            mat = Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
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
            mat = Matrix.Transpose(source.getWorldMatrix().invert());
        }

        switch (parameter.type) {
            case EParameterType.FLOAT_MAT2: shaderMaterial.setMatrix2x2(uniformName, Matrix.GetAsMatrix2x2(mat)); break;
            case EParameterType.FLOAT_MAT3: shaderMaterial.setMatrix3x3(uniformName, Matrix.GetAsMatrix3x3(mat)); break;
            case EParameterType.FLOAT_MAT4: shaderMaterial.setMatrix(uniformName, mat); break;
            default: break;
        }
    };

    var setUniform = (shaderMaterial: any, uniform: string, value: any, type: number): boolean => {
        switch (type) {
            case EParameterType.FLOAT: shaderMaterial.setFloat(uniform, value); return true;
            case EParameterType.FLOAT_VEC2: shaderMaterial.setVector2(uniform, Vector2.FromArray(value)); return true;
            case EParameterType.FLOAT_VEC3: shaderMaterial.setVector3(uniform, Vector3.FromArray(value)); return true;
            case EParameterType.FLOAT_VEC4: shaderMaterial.setVector4(uniform, Vector4.FromArray(value)); return true;
            default: return false;
        }
    };

    var getWrapMode = (mode: number): ETextureWrapMode => {
        switch (mode) {
            case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
            case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
            case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
            default: return Texture.WRAP_ADDRESSMODE;
        }
    };

    var getTextureFilterMode = (mode: number): ETextureFilterType => {
        switch (mode) {
            case ETextureFilterType.LINEAR:
            case ETextureFilterType.LINEAR_MIPMAP_NEAREST:
            case ETextureFilterType.LINEAR_MIPMAP_LINEAR: return Texture.TRILINEAR_SAMPLINGMODE;
            case ETextureFilterType.NEAREST:
            case ETextureFilterType.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_SAMPLINGMODE;
            default: return Texture.BILINEAR_SAMPLINGMODE;
        }
    };

    var getBufferFromAccessor = (gltfRuntime: IGLTFRuntime, accessor: IGLTFAccessor, scalar?: boolean): any => {
        var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[accessor.bufferView];
        var arrayBuffer: ArrayBuffer = gltfRuntime.arrayBuffers[bufferView.buffer];

        var byteOffset = accessor.byteOffset + bufferView.byteOffset;
        var count = accessor.count * getByteStrideFromType(accessor);

        switch (accessor.componentType) {
            case EComponentType.BYTE: return new Int8Array(arrayBuffer, byteOffset, count);
            case EComponentType.UNSIGNED_BYTE: return new Uint8Array(arrayBuffer, byteOffset, count);
            case EComponentType.SHORT: return new Int16Array(arrayBuffer, byteOffset, count);
            case EComponentType.UNSIGNED_SHORT: return new Uint16Array(arrayBuffer, byteOffset, count);
            default: return new Float32Array(arrayBuffer, byteOffset, count);
        }
    };

    var normalizeBuffer = (buffer: any) => {
        for (var i = 0; i < buffer.length; i++) {
            buffer[i] *= -1;
        }
    };

    var normalizeUVs = (buffer: any) => {
        for (var i = 0; i < buffer.length / 2; i++) {
            buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
        }
    };

    var replaceInString = (str: string, searchValue: string, replaceValue: string) => {
        while (str.indexOf(searchValue) !== -1) {
            str = str.replace(searchValue, replaceValue);
        }

        return str;
    };

    var getAttribute = (attributeParameter: IGLTFTechniqueParameter) => {
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
        else if (attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
            var channel = Number(attributeParameter.semantic.split("_")[1]);
            return "uv" + (channel === 0 ? "" : channel + 1);
        }
    };

    var isBase64 = (uri: string): boolean => {
        return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
    };

    var getTextureFromName = (gltfRuntime: IGLTFRuntime, name: string): BaseTexture => {
        var textures = gltfRuntime.scene.textures;

        for (var i = 0; i < textures.length; i++) {
            if (textures[i].name === name) {
                return textures[i];
            }
        }

        return null;
    };

    /**
    * Load animations
    */
    var getAnimationPath = (path: string): string => {
        var index = glTFAnimationPaths.indexOf(path);

        if (index !== -1) {
            return babylonAnimationPaths[index];
        }

        return path;
    };

    var loadAnimations = (gltfRuntime: IGLTFRuntime) => {
        for (var anim in gltfRuntime.animations) {
            var animation: IGLTFAnimation = gltfRuntime.animations[anim];

            for (var i = 0; i < animation.channels.length; i++) {
                // Get parameters and load buffers
                var channel = animation.channels[i];
                var sampler: IGLTFAnimationSampler = animation.samplers[channel.sampler];

                if (!sampler) {
                    continue;
                }

                var inputData = animation.parameters[sampler.input];
                var outputData = animation.parameters[sampler.output];

                var bufferInput = getBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                var bufferOutput = getBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);

                var targetID = channel.target.id;
                var targetNode: any = gltfRuntime.scene.getNodeByID(targetID);

                if (targetNode === null) {
                    targetNode = gltfRuntime.scene.getNodeByName(targetID);
                }

                if (targetNode === null) {
                    Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                    continue;
                }

                // Get target path (position, rotation or scaling)
                var targetPath = channel.target.path;
                var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                if (targetPathIndex !== -1) {
                    targetPath = babylonAnimationPaths[targetPathIndex];
                }

                // Create key frames and animation
                var animationType = Animation.ANIMATIONTYPE_VECTOR3;
                if (targetPath === "rotationQuaternion") {
                    animationType = Animation.ANIMATIONTYPE_QUATERNION;
                    targetNode.rotationQuaternion = new Quaternion();
                }

                var babylonAnimation = new Animation(anim, targetPath, 1, animationType, Animation.ANIMATIONLOOPMODE_CYCLE);
                var keys = [];

                for (var i = 0; i < bufferInput.length; i++) {
                    var value: any = null;

                    if (targetPath === "rotationQuaternion") { // VEC4
                        value = Quaternion.RotationAxis(Vector3.FromArray([bufferOutput[i * 4], bufferOutput[i * 4 + 1], bufferOutput[i * 4 + 2]]).normalize(), bufferOutput[i * 4 + 3]);
                    }
                    else { // Position and scaling are VEC3
                        value = Vector3.FromArray([bufferOutput[i * 3], bufferOutput[i * 3 + 1], bufferOutput[i * 3 + 2]]);
                        // Y is up
                        value.z *= -1;
                    }

                    keys.push({
                        frame: bufferInput[i],
                        value: value
                    });
                }
                
                // Finish
                babylonAnimation.setKeys(keys);
                targetNode.animations.push(babylonAnimation);
                gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true);
            }
        }
    };

    /**
    * Load geometries and nodes
    */
    var importSkeleton = (gltfRuntime: IGLTFRuntime, skins: IGLTFSkins): Skeleton => {
        var newSkeleton = new Skeleton(skins.name, "", gltfRuntime.scene);

        // Matrices
        var accessor = gltfRuntime.accessors[skins.inverseBindMatrices];
        var buffer = getBufferFromAccessor(gltfRuntime, accessor);

        // Joints
        for (var i = 0; i < skins.jointNames.length; i++) {
            var node: IGLTFNode = gltfRuntime.nodes[skins.jointNames[i]];
            if (!node) {
                Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                continue;
            }

            var mat = Matrix.Identity();

            if (node.translation && node.rotation && node.scale) {
                mat = Matrix.Compose(Vector3.FromArray(node.scale), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.translation));
            }

            var bone = new Bone(node.name, newSkeleton, null, mat);
            bone.id = skins.jointNames[i];
            bone.getInvertedAbsoluteTransform().copyFrom(Matrix.FromArray(buffer.subarray(i * 16, i * 16 + 16)));
        }

        return newSkeleton;
    };

    var importMesh = (gltfRuntime: IGLTFRuntime, mesh: IGLTFMesh, id: string): Mesh => {
        var newMesh = new Mesh(mesh.name, gltfRuntime.scene);
        newMesh.id = id;
        newMesh.material = null;
        newMesh.layerMask = 0x0FFFFFFF;
        newMesh.subMeshes = [];

        var multiMat = new MultiMaterial("multimat" + id, gltfRuntime.scene);
        multiMat.backFaceCulling = false;
        newMesh.material = multiMat;

        var vertexData = new VertexData();
        var geometry = new Geometry(id, gltfRuntime.scene, vertexData, true);

        var verticesStarts = [];
        var verticesCounts = [];
        var indexStarts = [];
        var indexCounts = [];

        // Positions, normals and UVs
        for (var i = 0; i < mesh.primitives.length; i++) {
            // Temporary vertex data
            var tempVertexData = new VertexData();

            var primitive = mesh.primitives[i];
            var attributes = primitive.attributes;

            var accessor: IGLTFAccessor = null;
            var buffer: any = null;

            var verticesCount = 0;

            // Set positions, normal and uvs
            for (var semantic in attributes) {

                // Link accessor and buffer view
                accessor = gltfRuntime.accessors[attributes[semantic]];
                buffer = getBufferFromAccessor(gltfRuntime, accessor);

                if (semantic === "NORMAL") {
                    tempVertexData.set(buffer, VertexBuffer.NormalKind);
                }
                else if (semantic === "POSITION") {
                    verticesCounts.push(buffer.length);
                    normalizeBuffer(buffer);
                    tempVertexData.set(buffer, VertexBuffer.PositionKind);
                }
                else if (semantic.indexOf("TEXCOORD_") !== -1) {
                    var channel = Number(semantic.split("_")[1]);
                    var uvKind = VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                    normalizeUVs(buffer);
                    tempVertexData.set(buffer, uvKind);
                }
                else if (semantic === "JOINT") {
                    tempVertexData.set(buffer, VertexBuffer.MatricesIndicesKind);
                }
                else if (semantic === "WEIGHT") {
                    tempVertexData.set(buffer, VertexBuffer.MatricesWeightsKind);
                }
            }

            // Indices
            accessor = gltfRuntime.accessors[primitive.indices];
            buffer = getBufferFromAccessor(gltfRuntime, accessor, true);
            tempVertexData.indices = buffer;
            indexCounts.push(buffer.length);

            vertexData.merge(tempVertexData);
            tempVertexData = undefined;

            // Sub material
            var material = gltfRuntime.scene.getMaterialByID(primitive.material);
            multiMat.subMaterials.push(material === null ? gltfRuntime.scene.defaultMaterial : material);

            // Update vertices start and index start
            verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
            indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
        }

        // Apply geometry
        geometry.setAllVerticesData(vertexData);
        geometry.applyToMesh(newMesh);

        // Apply submeshes
        newMesh.subMeshes = [];
        for (var i = 0; i < mesh.primitives.length; i++) {
            var subMesh = new SubMesh(i, verticesStarts[i], verticesCounts[i], indexStarts[i], indexCounts[i], newMesh);
        }

        // Finish
        newMesh._updateBoundingInfo();

        return newMesh;
    };

    var configureNode = (newNode: any, position: Vector3, rotation: Quaternion, scaling: Vector3) => {
        if (newNode.position) {
            newNode.position = position;

            if (newNode.rotation) {
                newNode.position.x *= -1;
                newNode.position.y *= -1;
                newNode.position.z *= -1;
            }
        }

        if (newNode.rotation) {
            newNode.rotation = rotation.toEulerAngles().addInPlace(new Vector3(0, 0, Math.PI));
        }

        if (newNode.scaling) {
            newNode.scaling = scaling;
        }
    };

    var configureNodeFromMatrix = (newNode: any, node: IGLTFNode) => {
        if (node.matrix) {
            var position = new Vector3(0, 0, 0);
            var rotation = new Quaternion();
            var scaling = new Vector3(0, 0, 0);
            Matrix.FromArray(node.matrix).decompose(scaling, rotation, position);
            configureNode(newNode, position, rotation, scaling);
        }
        else {
            configureNode(newNode, Vector3.FromArray(node.translation), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.scale));
        }
    };

    var importNode = (gltfRuntime: IGLTFRuntime, node: IGLTFNode): Node => {
        var lastNode: Node = null;

        // Meshes
        if (node.instanceSkin) {
            var instanceSkin = node.instanceSkin;

            for (var i = 0; i < instanceSkin.meshes.length; i++) {
                var meshID = instanceSkin.meshes[i];

                var newMesh = importMesh(gltfRuntime, gltfRuntime.meshes[meshID], meshID);
                newMesh.material = null;

                //newMesh.useBones = true;
                //newMesh.computeBonesUsingShaders = true;
                //newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(instanceSkin.skin);

                lastNode = newMesh;
            }
        }
        else if (node.meshes) {
            /**
            * Improve meshes property
            */
            for (var i = 0; i < node.meshes.length; i++) {
                var meshID = node.meshes[i];
                var newMesh = importMesh(gltfRuntime, gltfRuntime.meshes[meshID], meshID);

                lastNode = newMesh;
            }
        }
        // Lights
        else if (node.light) {
            var light = gltfRuntime.lights[node.light];

            if (light) {
                if (light.type === "ambient") {
                    var ambienLight: IGLTFAmbienLight = light[light.type];
                    var hemiLight = new HemisphericLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    hemiLight.name = node.name;

                    if (ambienLight.color) {
                        hemiLight.diffuse = Color3.FromArray(ambienLight.color);
                    }

                    lastNode = hemiLight;
                }
                else if (light.type === "directional") {
                    var directionalLight: IGLTFDirectionalLight = light[light.type];
                    var dirLight = new DirectionalLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    dirLight.name = node.name;

                    if (directionalLight.color) {
                        dirLight.diffuse = Color3.FromArray(directionalLight.color);
                    }

                    lastNode = dirLight;
                }
                else if (light.type === "point") {
                    var pointLight: IGLTFPointLight = light[light.type];
                    var ptLight = new PointLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    ptLight.name = node.name;

                    if (pointLight.color) {
                        ptLight.diffuse = Color3.FromArray(pointLight.color);
                    }

                    lastNode = ptLight;
                }
                else if (light.type === "spot") {
                    var spotLight: IGLTFSpotLight = light[light.type];
                    var spLight = new SpotLight(node.light, Vector3.Zero(), Vector3.Zero(), 0, 0, gltfRuntime.scene);
                    spLight.name = node.name;

                    if (spotLight.color) {
                        spLight.diffuse = Color3.FromArray(spotLight.color);
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
        else if (node.camera) {
            var camera: IGLTFCamera = gltfRuntime.cameras[node.camera];

            if (camera) {
                if (camera.type === "orthographic") {
                    var orthographicCamera: IGLTFCameraOrthographic = camera[camera.type];
                    var orthoCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene);

                    orthoCamera.name = node.name;
                    orthoCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                    orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());

                    lastNode = orthoCamera;
                }
                else if (camera.type === "perspective") {
                    var perspectiveCamera: IGLTFCameraPerspective = camera[camera.type];
                    var persCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene);

                    persCamera.name = node.name;
                    persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());

                    if (perspectiveCamera.yfov && perspectiveCamera.aspectRatio && perspectiveCamera.znear && perspectiveCamera.zfar) {
                        persCamera.getViewMatrix().copyFrom(Matrix.PerspectiveFovLH(perspectiveCamera.yfov, perspectiveCamera.aspectRatio, perspectiveCamera.znear, perspectiveCamera.zfar));
                    }

                    lastNode = persCamera;
                }
            }
        }

        // Empty node
        if (lastNode === null && !node.jointName) {
            lastNode = new Node(node.name, gltfRuntime.scene);
        }

        if (lastNode !== null) {
            if (node.matrix) {
                configureNodeFromMatrix(lastNode, node);
            }
            else {
                configureNode(lastNode, Vector3.FromArray(node.translation), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.scale));
            }

            lastNode.updateCache(true);
        }

        return lastNode;
    };

    /**
    * Load buffers
    */
    var onBuffersLoaded = (gltfRuntime: IGLTFRuntime) => {
        // Skins
        /*
        for (var skin in gltfRuntime.skins) {
            var skins: IGLTFSkins = gltfRuntime.skins[skin];
            var skeleton = importSkeleton(gltfRuntime, skins);
            skeleton.id = skin;
        }
        */

        // Nodes
        var parsedNodes = gltfRuntime.nodes;
        var currentScene: IGLTFScene = <IGLTFScene>gltfRuntime.currentScene;

        for (var nde in parsedNodes) {
            var node: IGLTFNode = parsedNodes[nde];
            var newNode = importNode(gltfRuntime, node);

            if (newNode !== null) {
                newNode.id = nde;
            }
        }

        // Resolve parenting once all nodes were created
        for (var nde in parsedNodes) {
            var node: IGLTFNode = parsedNodes[nde];
            var parent = gltfRuntime.scene.getNodeByID(nde);

            if (node.children && parent !== null) {
                for (var i = 0; i < node.children.length; i++) {
                    var child = gltfRuntime.scene.getNodeByID(node.children[i]);
                    if (child === null) {
                        child = gltfRuntime.scene.getNodeByName(node.children[i]);
                    }

                    if (child !== null) {
                        child.parent = parent;
                    }
                    else {
                        Tools.Warn("Node named " + node.name + " as a children named " + node.children[i] + " but does not exists");
                    }
                }
            }
        }

        // Set animations
        loadAnimations(gltfRuntime);
    };

    var onLoadBuffer = (gltfRuntime: IGLTFRuntime, buf: string) => {
        return (data: any) => {
            gltfRuntime.loadedBuffers++;

            if (!(data instanceof ArrayBuffer)) {
                Tools.Error("Buffer named " + buf + " is not an array buffer");
            }
            else if ((<ArrayBuffer>data).byteLength != gltfRuntime.buffers[buf].byteLength) {
                Tools.Error("Buffer named " + buf + " is length " + data.byteLength + ". Expected: " + gltfRuntime.buffers[buf].byteLength); // Improve error message
            }

            gltfRuntime.arrayBuffers[buf] = data;

            if (gltfRuntime.loadedBuffers === gltfRuntime.buffersCount) {
                onBuffersLoaded(gltfRuntime);
            }
        };
    };

    var onLoadBufferError = (gltfRuntime: IGLTFRuntime, buf: string) => {
        return () => {
            Tools.Error("Error when loading buffer named " + buf + " located at " + gltfRuntime.buffers[buf].uri);
        };
    };

    var decodeArrayBuffer = (base64: string): ArrayBuffer => {
        var decodedString = atob(base64);
        var bufferLength = decodedString.length;
        var arraybuffer = new Uint8Array(new ArrayBuffer(bufferLength));

        for (var i = 0; i < bufferLength; i++) {
            arraybuffer[i] = decodedString.charCodeAt(i);
        }

        return arraybuffer.buffer;
    };

    var loadBuffers = (gltfRuntime: IGLTFRuntime) => {
        for (var buf in gltfRuntime.buffers) {
            var buffer: IGLTFBuffer = gltfRuntime.buffers[buf];

            if (buffer) {
                if (isBase64(buffer.uri)) {
                    var arrayBuffer = decodeArrayBuffer(buffer.uri.split(",")[1]);
                    onLoadBuffer(gltfRuntime, buf)(arrayBuffer);
                }
                else {
                    Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, onLoadBuffer(gltfRuntime, buf), null, null, true, onLoadBufferError(gltfRuntime, buf));
                }
            }
            else {
                Tools.Error("No buffer named : " + buf);
            }
        }
    };

    /**
    * Load shaders
    */
    var onBindShaderMaterial = (mesh: Mesh, gltfRuntime: IGLTFRuntime, unTreatedUniforms: Object, shaderMaterial: ShaderMaterial, pass: IGLTFTechniquePass, material: IGLTFMaterial) => {
        for (var unif in unTreatedUniforms) {
            var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
            var type = uniform.type;

            if (type === EParameterType.FLOAT_MAT2 || type === EParameterType.FLOAT_MAT3 || type === EParameterType.FLOAT_MAT4) {
                if (uniform.semantic && !uniform.source && !uniform.node) {
                    setMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                }
                else if (uniform.semantic && (uniform.source || uniform.node)) {
                    var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node);
                    if (source === null) {
                        source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node);
                    }
                    if (source === null) {
                        continue;
                    }

                    setMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                }
            }
            else {
                var value = material.instanceTechnique.values[pass.instanceProgram.uniforms[unif]];
                if (!value) {
                    continue;
                }

                if (type === EParameterType.SAMPLER_2D) {
                    var texture = getTextureFromName(gltfRuntime, value);

                    if (texture === null) {
                        continue;
                    }

                    shaderMaterial.getEffect().setTexture(unif, texture);
                }
                else {
                    setUniform(shaderMaterial.getEffect(), unif, value, type);
                }
            }
        }
    };

    var prepareShaderMaterialUniforms = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, pass: IGLTFTechniquePass, material: IGLTFMaterial, unTreatedUniforms: Object) => {
        var materialValues = material.instanceTechnique.values;
        var instanceProgramUniforms = pass.instanceProgram.uniforms;

        /**
        * Prepare values here (not matrices)
        */
        for (var unif in unTreatedUniforms) {
            var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
            var type = uniform.type;
            var value = materialValues[instanceProgramUniforms[unif]] || uniform.value;

            if (!value) {
                continue;
            }

            // Texture (sampler2D)
            if (type === EParameterType.SAMPLER_2D) {
                var texture: IGLTFTexture = gltfRuntime.textures[value];
                var sampler: IGLTFSampler = gltfRuntime.samplers[texture.sampler];

                if (!texture || !texture.source) {
                    continue;
                }

                var source: IGLTFImage = gltfRuntime.images[texture.source];
                var newTexture: Texture = null;

                if (isBase64(source.uri)) {
                    newTexture = new Texture(source.uri, gltfRuntime.scene, true, undefined, undefined, undefined, undefined, source.uri, true);
                }
                else {
                    newTexture = new Texture(gltfRuntime.rootUrl + source.uri, gltfRuntime.scene, true);
                }
                newTexture.name = value;

                if (texture.internalFormat && (texture.internalFormat === ETextureFormat.ALPHA || texture.internalFormat === ETextureFormat.RGBA)) {
                    newTexture.hasAlpha = true;
                }

                if (uniform.value) {
                    // Static uniform
                    shaderMaterial.setTexture(unif, newTexture);
                    delete unTreatedUniforms[unif];
                }
            }
            // Others
            else {
                if (uniform.value && setUniform(shaderMaterial, unif, value, type)) {
                    // Static uniform
                    delete unTreatedUniforms[unif];
                }
            }
        }
    };

    var onShaderCompileError = (program: IGLTFProgram, shaderMaterial: ShaderMaterial) => {
        return (effect: Effect, error: string) => {
            Tools.Error("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            shaderMaterial.dispose(true);
        };
    };

    var onShaderCompileSuccess = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, pass: IGLTFTechniquePass, material: IGLTFMaterial, unTreatedUniforms: Object) => {
        return (_: Effect) => {
            prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, pass, material, unTreatedUniforms);

            shaderMaterial.onBind = (mat: Material, mesh: Mesh) => {
                onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, pass, material);
            };
        };
    };

    var parseShaderUniforms = (tokenizer: Tokenizer, instanceProgram: IGLTFTechniquePassInstanceProgram, technique: IGLTFTechnique, unTreatedUniforms: Object): string => {
        for (var unif in instanceProgram.uniforms) {
            var uniform = instanceProgram.uniforms[unif];
            var uniformParameter: IGLTFTechniqueParameter = technique.parameters[uniform];

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

    var onShadersLoaded = (gltfRuntime: IGLTFRuntime) => {
        // Create materials
        for (var mat in gltfRuntime.materials) {
            var material: IGLTFMaterial = gltfRuntime.materials[mat];
            var instanceTechnique: IGLTFMaterialInstanceTechnique = material.instanceTechnique;
            var technique: IGLTFTechnique = gltfRuntime.techniques[instanceTechnique.technique];
            var pass: IGLTFTechniquePass = technique.passes[technique.pass];
            var instanceProgram: IGLTFTechniquePassInstanceProgram = pass.instanceProgram;
            var program: IGLTFProgram = gltfRuntime.programs[instanceProgram.program];

            var vertexShader: string = Effect.ShadersStore[program.vertexShader + "VertexShader"];
            var pixelShader: string = Effect.ShadersStore[program.fragmentShader + "PixelShader"];
            var newVertexShader = "";
            var newPixelShader = "";

            var vertexTokenizer = new Tokenizer(vertexShader);
            var pixelTokenizer = new Tokenizer(pixelShader);

            var unTreatedUniforms: Object = {};
            var uniforms = [];
            var attributes = [];
            var samplers = [];

            // Fill uniform, sampler2D and attributes
            for (var unif in instanceProgram.uniforms) {
                var uniform = instanceProgram.uniforms[unif];
                var uniformParameter: IGLTFTechniqueParameter = technique.parameters[uniform];

                unTreatedUniforms[unif] = uniformParameter;

                if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                    var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                    if (transformIndex !== -1) {
                        uniforms.push(babylonTransforms[transformIndex]);
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                else if (uniformParameter.type === EParameterType.SAMPLER_2D) {
                    samplers.push(unif);
                }
                else {
                    uniforms.push(unif);
                }
            }

            for (var attr in instanceProgram.attributes) {
                var attribute = instanceProgram.attributes[attr];
                var attributeParameter: IGLTFTechniqueParameter = technique.parameters[attribute];

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

                for (var attr in instanceProgram.attributes) {
                    var attribute = instanceProgram.attributes[attr];
                    var attributeParameter: IGLTFTechniqueParameter = technique.parameters[attribute];

                    if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                        newVertexShader += getAttribute(attributeParameter);
                        foundAttribute = true;
                        break;
                    }
                }

                if (foundAttribute) {
                    continue;
                }

                newVertexShader += parseShaderUniforms(vertexTokenizer, instanceProgram, technique, unTreatedUniforms);
            }

            // Configure pixel shader
            while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                var tokenType = pixelTokenizer.currentToken;

                if (tokenType !== ETokenType.IDENTIFIER) {
                    newPixelShader += pixelTokenizer.currentString;
                    continue;
                }

                newPixelShader += parseShaderUniforms(pixelTokenizer, instanceProgram, technique, unTreatedUniforms);
            }

            // Create shader material
            var shaderPath = {
                vertex: program.vertexShader,
                fragment: program.fragmentShader
            };

            var options = {
                attributes: attributes,
                uniforms: uniforms,
                samplers: samplers
            };

            Effect.ShadersStore[program.vertexShader + "VertexShader"] = newVertexShader;
            Effect.ShadersStore[program.fragmentShader + "PixelShader"] = newPixelShader;

            var shaderMaterial = new ShaderMaterial(material.name, gltfRuntime.scene, shaderPath, options);
            shaderMaterial.id = mat;
            shaderMaterial.onError = onShaderCompileError(program, shaderMaterial);
            shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, pass, material, unTreatedUniforms);
        }

        // Finish
        loadBuffers(gltfRuntime);
    };

    var onLoadShader = (gltfRuntime: IGLTFRuntime, sha: string) => {
        return (data: any) => {
            gltfRuntime.loadedShaders++;
            Effect.ShadersStore[sha + (gltfRuntime.shaders[sha].type === EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = data;

            if (gltfRuntime.loadedShaders === gltfRuntime.shaderscount) {
                onShadersLoaded(gltfRuntime);
            }
        };
    };

    var onLoadShaderError = (gltfRuntime: IGLTFRuntime, sha: string) => {
        return () => {
            Tools.Error("Error when loading shader program named " + sha + " located at " + gltfRuntime.shaders[sha].uri);
        };
    };

    var load = (gltfRuntime: IGLTFRuntime) => {
        // Begin with shaders
        for (var sha in gltfRuntime.shaders) {
            var shader: IGLTFShader = gltfRuntime.shaders[sha];
            
            if (shader) {
                if (isBase64(shader.uri)) {
                    var shaderString = atob(shader.uri.split(",")[1]);
                    onLoadShader(gltfRuntime, sha)(shaderString);
                }
                else {
                    Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onLoadShader(gltfRuntime, sha), null, null, false, onLoadShaderError(gltfRuntime, sha));
                }
            }
            else {
                Tools.Error("No shader file named " + shader.uri);
            }
        }
    };

    /**
    * glTF File Loader Plugin
    */
    export class GLTFFileLoader implements ISceneLoaderPlugin {
        /**
        * Public members
        */
        public extensions = ".gltf";

        /**
        * Private members
        */
        // None

        /**
        * Import meshes
        */
        public importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean {
            return true;
        }

        /**
        * Load scene
        */
        public load(scene: Scene, data: string, rootUrl: string): boolean {
            var parsedData = JSON.parse(data);

            var gltfRuntime: IGLTFRuntime = {
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
                currentScene: {},

                buffersCount: 0,
                shaderscount: 0,

                scene: scene,
                loadedBuffers: 0,
                loadedShaders: 0,
                rootUrl: rootUrl,

                arrayBuffers: []
            }

            // Parse
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

            if (parsedData.scene && parsedData.scenes) {
                gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
            }

            // Load buffers
            load(gltfRuntime);

            // Finish
            return true;
        }
    };

    BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
}