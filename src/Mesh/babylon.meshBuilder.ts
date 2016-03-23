module BABYLON {
    export class MeshBuilder {
        /**
         * Creates a box mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#box  
         * The parameter `size` sets the size (float) of each box side (default 1).  
         * You can set some different box dimensions by using the parameters `width`, `height` and `depth` (all by default have the same value than `size`).  
         * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 `Color3` elements) and `faceUV` (an array of 6 `Vector4` elements).
         * Please read this tutorial : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateBox(name: string, options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh {
            var box = new Mesh(name, scene);
            var vertexData = VertexData.CreateBox(options);

            vertexData.applyToMesh(box, options.updatable);

            return box;
        }

        /**
         * Creates a sphere mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#sphere  
         * The parameter `diameter` sets the diameter size (float) of the sphere (default 1).  
         * You can set some different sphere dimensions, for instance to build an ellipsoid, by using the parameters `diameterX`, `diameterY` and `diameterZ` (all by default have the same value than `diameter`).  
         * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32).  
         * You can create an unclosed sphere with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference (latitude) : 2 x PI x ratio  
         * You can create an unclosed sphere on its height with the parameter `slice` (positive float, default1), valued between 0 and 1, what is the height ratio (longitude).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateSphere(name: string, options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, updatable?: boolean }, scene: any): Mesh {
            var sphere = new Mesh(name, scene);
            var vertexData = VertexData.CreateSphere(options);

            vertexData.applyToMesh(sphere, options.updatable);

            return sphere;
        }

        /**
         * Creates a plane polygonal mesh.  By default, this is a disc.   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#disc   
         * The parameter `radius` sets the radius size (float) of the polygon (default 0.5).  
         * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc.  
         * You can create an unclosed polygon with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference : 2 x PI x ratio  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateDisc(name: string, options: { radius?: number, tessellation?: number, arc?: number, updatable?: boolean, sideOrientation?: number }, scene: Scene): Mesh {
            var disc = new Mesh(name, scene);
            var vertexData = VertexData.CreateDisc(options);

            vertexData.applyToMesh(disc, options.updatable);

            return disc;
        }

        /**
         * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided.   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#icosphere     
         * The parameter `radius` sets the radius size (float) of the icosphere (default 1).  
         * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`).  
         * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size.    
         * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface.  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateIcoSphere(name: string, options: { radius?: number, radiusX?: number, radiusY?: number, radiusZ?: number, flat?: boolean, subdivisions?: number, sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh {
            var sphere = new Mesh(name, scene);
            var vertexData = VertexData.CreateIcoSphere(options);

            vertexData.applyToMesh(sphere, options.updatable);

            return sphere;
        };

        /**
         * Creates a ribbon mesh.    
         * The ribbon is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.    
         *
         * Please read this full tutorial to understand how to design a ribbon : http://doc.babylonjs.com/tutorials/Ribbon_Tutorial    
         * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.    
         * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array.  
         * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array.
         * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path. 
         * It's the offset to join the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11.    
         * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#ribbon   
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateRibbon(name: string, options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene?: Scene): Mesh {
            var pathArray = options.pathArray;
            var closeArray = options.closeArray;
            var closePath = options.closePath;
            var offset = options.offset;
            var sideOrientation = options.sideOrientation;
            var instance = options.instance;
            var updatable = options.updatable;

            if (instance) {   // existing ribbon instance update
                // positionFunction : ribbon case
                // only pathArray and sideOrientation parameters are taken into account for positions update
                var positionFunction = positions => {
                    var minlg = pathArray[0].length;
                    var i = 0;
                    var ns = (instance.sideOrientation === Mesh.DOUBLESIDE) ? 2 : 1;
                    for (var si = 1; si <= ns; si++) {
                        for (var p = 0; p < pathArray.length; p++) {
                            var path = pathArray[p];
                            var l = path.length;
                            minlg = (minlg < l) ? minlg : l;
                            var j = 0;
                            while (j < minlg) {
                                positions[i] = path[j].x;
                                positions[i + 1] = path[j].y;
                                positions[i + 2] = path[j].z;
                                j++;
                                i += 3;
                            }
                            if ((<any>instance)._closePath) {
                                positions[i] = path[0].x;
                                positions[i + 1] = path[0].y;
                                positions[i + 2] = path[0].z;
                                i += 3;
                            }
                        }
                    }
                };
                var positions = instance.getVerticesData(VertexBuffer.PositionKind);
                positionFunction(positions);
                instance.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
                if (!(instance.areNormalsFrozen)) {
                    var indices = instance.getIndices();
                    var normals = instance.getVerticesData(VertexBuffer.NormalKind);
                    VertexData.ComputeNormals(positions, indices, normals);

                    if ((<any>instance)._closePath) {
                        var indexFirst: number = 0;
                        var indexLast: number = 0;
                        for (var p = 0; p < pathArray.length; p++) {
                            indexFirst = (<any>instance)._idx[p] * 3;
                            if (p + 1 < pathArray.length) {
                                indexLast = ((<any>instance)._idx[p + 1] - 1) * 3;
                            }
                            else {
                                indexLast = normals.length - 3;
                            }
                            normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                            normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                            normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                            normals[indexLast] = normals[indexFirst];
                            normals[indexLast + 1] = normals[indexFirst + 1];
                            normals[indexLast + 2] = normals[indexFirst + 2];
                        }
                    }

                    instance.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
                }

                return instance;
            }
            else {  // new ribbon creation

                var ribbon = new Mesh(name, scene);
                ribbon.sideOrientation = sideOrientation;

                var vertexData = VertexData.CreateRibbon(options);
                if (closePath) {
                    (<any>ribbon)._idx = (<any>vertexData)._idx;
                }
                (<any>ribbon)._closePath = closePath;
                (<any>ribbon)._closeArray = closeArray;

                vertexData.applyToMesh(ribbon, updatable);

                return ribbon;
            }
        }

        /**
         * Creates a cylinder or a cone mesh.   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#cylinder-or-cone    
         * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).  
         * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).  
         * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.  
         * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
         * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).   
         * The parameter `hasRings` (boolean, default false) makes the subdivisions independent from each other, so they become different faces.  
         * The parameter `enclose`  (boolean, default false) adds two extra faces per subdivision to a sliced cylinder to close it around its height axis.  
         * The parameter `arc` (float, default 1) is the ratio (max 1) to apply to the circumference to slice the cylinder.   
         * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of n `Color3` elements) and `faceUV` (an array of n `Vector4` elements).   
         * The value of n is the number of cylinder faces. If the cylinder has only 1 subdivisions, n equals : top face + cylinder surface + bottom face = 3   
         * Now, if the cylinder has 5 independent subdivisions (hasRings = true), n equals : top face + 5 stripe surfaces + bottom face = 2 + 5 = 7   
         * Finally, if the cylinder has 5 independent subdivisions and is enclose, n equals : top face + 5 x (stripe surface + 2 closing faces) + bottom face = 2 + 5 * 3 = 17    
         * Each array (color or UVs) is always ordered the same way : the first element is the bottom cap, the last element is the top cap. The other elements are each a ring surface.    
         * If `enclose` is false, a ring surface is one element.   
         * If `enclose` is true, a ring surface is 3 successive elements in the array : the tubular surface, then the two closing faces.    
         * Example how to set colors and textures on a sliced cylinder : http://www.html5gamedevs.com/topic/17945-creating-a-closed-slice-of-a-cylinder/#comment-106379  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateCylinder(name: string, options: { height?: number, diameterTop?: number, diameterBottom?: number, diameter?: number, tessellation?: number, subdivisions?: number, arc?: number, faceColors?: Color4[], faceUV?: Vector4[], updatable?: boolean, hasRings?: boolean, enclose?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var cylinder = new Mesh(name, scene);
            var vertexData = VertexData.CreateCylinder(options);

            vertexData.applyToMesh(cylinder, options.updatable);

            return cylinder;
        }

        /**
         * Creates a torus mesh.   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#torus       
         * The parameter `diameter` sets the diameter size (float) of the torus (default 1).  
         * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5).  
         * The parameter `tessellation` sets the number of torus sides (postive integer, default 16).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTorus(name: string, options: { diameter?: number, thickness?: number, tessellation?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var torus = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorus(options);

            vertexData.applyToMesh(torus, options.updatable);

            return torus;
        }

        /**
         * Creates a torus knot mesh.   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#torus-knot         
         * The parameter `radius` sets the global radius size (float) of the torus knot (default 2).  
         * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32).  
         * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32).  
         * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3).    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTorusKnot(name: string, options: { radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var torusKnot = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorusKnot(options);

            vertexData.applyToMesh(torusKnot, options.updatable);

            return torusKnot;
        }

        /**
         * Creates a line system mesh.  
         * A line system is a pool of many lines gathered in a single mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#linesystem  
         * A line system mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of lines as an input parameter.  
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineSystem to this static function.  
         * The parameter `lines` is an array of lines, each line being an array of successive Vector3.   
         * The optional parameter `instance` is an instance of an existing LineSystem object to be updated with the passed `lines` parameter. The way to update it is the same than for 
         * updating a simple Line mesh, you just need to update every line in the `lines` array : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines   
         * When updating an instance, remember that only line point positions can change, not the number of points, neither the number of lines.      
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateLineSystem(name: string, options: { lines: Vector3[][], updatable: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh {
            var instance = options.instance;
            var lines = options.lines;

            if (instance) { // lines update
                var positionFunction = positions => {
                    var i = 0;
                    for (var l = 0; l < lines.length; l++) {
                        var points = lines[l];
                        for (var p = 0; p < points.length; p++) {
                            positions[i] = points[p].x;
                            positions[i + 1] = points[p].y;
                            positions[i + 2] = points[p].z;
                            i += 3;
                        }
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            
            // line system creation
            var lineSystem = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateLineSystem(options);
            vertexData.applyToMesh(lineSystem, options.updatable);
            return lineSystem;
        }

        /**
         * Creates a line mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#lines  
         * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.  
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.  
         * The parameter `points` is an array successive Vector3.   
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines    
         * When updating an instance, remember that only point positions can change, not the number of points.      
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateLines(name: string, options: { points: Vector3[], updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh {
            var lines = MeshBuilder.CreateLineSystem(name, { lines: [options.points], updatable: options.updatable, instance: options.instance }, scene);
            return lines;
        }

        /**
         * Creates a dashed line mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#dashed-lines  
         * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.  
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.  
         * The parameter `points` is an array successive Vector3.  
         * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200).    
         * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3).  
         * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1).  
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines    
         * When updating an instance, remember that only point positions can change, not the number of points.      
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateDashedLines(name: string, options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number, updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh {
            var points = options.points;
            var instance = options.instance;
            var gapSize = options.gapSize;
            var dashNb = options.dashNb;
            var dashSize = options.dashSize;

            if (instance) {  //  dashed lines update
                var positionFunction = (positions: number[]): void => {
                    var curvect = Vector3.Zero();
                    var nbSeg = positions.length / 6;
                    var lg = 0;
                    var nb = 0;
                    var shft = 0;
                    var dashshft = 0;
                    var curshft = 0;
                    var p = 0;
                    var i = 0;
                    var j = 0;
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        lg += curvect.length();
                    }
                    shft = lg / nbSeg;
                    dashshft = (<any>instance).dashSize * shft / ((<any>instance).dashSize + (<any>instance).gapSize);
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        nb = Math.floor(curvect.length() / shft);
                        curvect.normalize();
                        j = 0;
                        while (j < nb && p < positions.length) {
                            curshft = shft * j;
                            positions[p] = points[i].x + curshft * curvect.x;
                            positions[p + 1] = points[i].y + curshft * curvect.y;
                            positions[p + 2] = points[i].z + curshft * curvect.z;
                            positions[p + 3] = points[i].x + (curshft + dashshft) * curvect.x;
                            positions[p + 4] = points[i].y + (curshft + dashshft) * curvect.y;
                            positions[p + 5] = points[i].z + (curshft + dashshft) * curvect.z;
                            p += 6;
                            j++;
                        }
                    }
                    while (p < positions.length) {
                        positions[p] = points[i].x;
                        positions[p + 1] = points[i].y;
                        positions[p + 2] = points[i].z;
                        p += 3;
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            // dashed lines creation
            var dashedLines = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateDashedLines(options);
            vertexData.applyToMesh(dashedLines, options.updatable);
            (<any>dashedLines).dashSize = dashSize;
            (<any>dashedLines).gapSize = gapSize;
            return dashedLines;
        }

        /**
         * Creates an extruded shape mesh.    
         * The extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#extruded-shapes    
         *
         * Please read this full tutorial to understand how to design an extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion     
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.    
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.      
         * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.    
         * The parameter `scale` (float, default 1) is the value to scale the shape.  
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL      
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape  
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.       
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static ExtrudeShape(name: string, options: { shape: Vector3[], path: Vector3[], scale?: number, rotation?: number, cap?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene: Scene): Mesh {
            var path = options.path;
            var shape = options.shape;
            var scale = options.scale || 1;
            var rotation = options.rotation || 0;
            var cap = (options.cap === 0) ? 0 : options.cap || Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var instance = options.instance;

            return MeshBuilder._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, cap, false, scene, updatable, sideOrientation, instance);
        }

        /**
         * Creates an custom extruded shape mesh.    
         * The custom extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.  
         * tuto :http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#custom-extruded-shapes     
         *
         * Please read this full tutorial to understand how to design a custom extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion     
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.    
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.      
         * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path 
         * and the distance of this point from the begining of the path : 
         * ```rotationFunction = function(i, distance) {
         *  // do things
         *  return rotationValue; }```  
         * It must returns a float value that will be the rotation in radians applied to the shape on each path point.      
         * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path 
         * and the distance of this point from the begining of the path : 
         * ````scaleFunction = function(i, distance) {
         *   // do things
         *  return scaleValue;}```  
         * It must returns a float value that will be the scale value applied to the shape on each path point.   
         * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`.  
         * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL        
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape  
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.       
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static ExtrudeShapeCustom(name: string, options: { shape: Vector3[], path: Vector3[], scaleFunction?: any, rotationFunction?: any, ribbonCloseArray?: boolean, ribbonClosePath?: boolean, cap?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene: Scene): Mesh {
            var path = options.path;
            var shape = options.shape;
            var scaleFunction = options.scaleFunction || (() => { return 1; });
            var rotationFunction = options.rotationFunction || (() => { return 0; });
            var ribbonCloseArray = options.ribbonCloseArray || false;
            var ribbonClosePath = options.ribbonClosePath || false;
            var cap = (options.cap === 0) ? 0 : options.cap || Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var instance = options.instance;
            return MeshBuilder._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, true, scene, updatable, sideOrientation, instance);
        }

        /**
         * Creates lathe mesh.  
         * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe.      
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#lathe  
         *
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be
         * rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero.    
         * The parameter `radius` (positive float, default 1) is the radius value of the lathe.        
         * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe.      
         * The parameter `arc` (positive float, default 1) is the ratio of the lathe. 0.5 builds for instance half a lathe, so an opened shape.  
         * The parameter `closed` (boolean, default true) opens/closes the lathe circumference. This should be set to false when used with the parameter "arc".        
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL          
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateLathe(name: string, options: { shape: Vector3[], radius?: number, tessellation?: number, arc?: number, closed?: boolean, updatable?: boolean, sideOrientation?: number, cap?: number }, scene: Scene): Mesh {
            var arc: number = (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var closed: boolean = (options.closed === undefined) ? true : options.closed;
            var shape = options.shape;
            var radius = options.radius || 1;
            var tessellation = options.tessellation || 64;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || Mesh.DEFAULTSIDE;
            var cap = options.cap || Mesh.NO_CAP;
            var pi2 = Math.PI * 2;
            var paths = new Array();

            var i = 0;
            var p = 0;
            var step = pi2 / tessellation * arc;
            var rotated;
            var path = new Array<Vector3>();;
            for (i = 0; i <= tessellation; i++) {
                var path: Vector3[] = [];
                if (cap == Mesh.CAP_START || cap == Mesh.CAP_ALL) {
                    path.push(new Vector3(0, shape[0].y, 0));
                    path.push(new Vector3(Math.cos(i * step) * shape[0].x * radius, shape[0].y, Math.sin(i * step) * shape[0].x * radius));
                }
                for (p = 0; p < shape.length; p++) {
                    rotated = new Vector3(Math.cos(i * step) * shape[p].x * radius, shape[p].y, Math.sin(i * step) * shape[p].x * radius);
                    path.push(rotated);
                }
                if (cap == Mesh.CAP_END || cap == Mesh.CAP_ALL) {
                    path.push(new Vector3(Math.cos(i * step) * shape[shape.length - 1].x * radius, shape[shape.length - 1].y, Math.sin(i * step) * shape[shape.length - 1].x * radius));
                    path.push(new Vector3(0, shape[shape.length - 1].y, 0));
                }
                paths.push(path);
            }

            // lathe ribbon
            var lathe = MeshBuilder.CreateRibbon(name, { pathArray: paths, closeArray: closed, sideOrientation: sideOrientation, updatable: updatable }, scene);
            return lathe;
        }

        /**
         * Creates a plane mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#plane  
         * The parameter `size` sets the size (float) of both sides of the plane at once (default 1).  
         * You can set some different plane dimensions by using the parameters `width` and `height` (both by default have the same value than `size`).
         * The parameter `sourcePlane` is a `Plane` instance. It builds a mesh plane from a Math plane.    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreatePlane(name: string, options: { size?: number, width?: number, height?: number, sideOrientation?: number, updatable?: boolean, sourcePlane?: Plane }, scene: Scene): Mesh {
            var plane = new Mesh(name, scene);

            var vertexData = VertexData.CreatePlane(options);

            vertexData.applyToMesh(plane, options.updatable);

            if (options.sourcePlane) {
                plane.translate(options.sourcePlane.normal, options.sourcePlane.d);

                var product = Math.acos(Vector3.Dot(options.sourcePlane.normal, Axis.Z));
                var vectorProduct = Vector3.Cross(Axis.Z, options.sourcePlane.normal);

                plane.rotate(vectorProduct, product);
            }

            return plane;
        }

        /**
         * Creates a ground mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#plane  
         * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground.    
         * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side.       
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateGround(name: string, options: { width?: number, height?: number, subdivisions?: number, updatable?: boolean }, scene: any): Mesh {
            var ground = new GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = options.subdivisions || 1;
            ground._width = options.width || 1;
            ground._height = options.height || 1;
            ground._maxX = ground._width / 2;
            ground._maxZ = ground._height / 2;
            ground._minX = -ground._maxX;
            ground._minZ = -ground._maxZ;

            var vertexData = VertexData.CreateGround(options);

            vertexData.applyToMesh(ground, options.updatable);

            ground._setReady(true);

            return ground;
        }

        /**
         * Creates a tiled ground mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#tiled-ground    
         * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates.     
         * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates.   
         * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height. Each subdivision is called a tile.    
         * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height of each tile.  
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTiledGround(name: string, options: { xmin: number, zmin: number, xmax: number, zmax: number, subdivisions?: { w: number; h: number; }, precision?: { w: number; h: number; }, updatable?: boolean }, scene: Scene): Mesh {
            var tiledGround = new Mesh(name, scene);

            var vertexData = VertexData.CreateTiledGround(options);

            vertexData.applyToMesh(tiledGround, options.updatable);

            return tiledGround;
        }

        /**
         * Creates a ground mesh from a height map.    
         * tuto : http://doc.babylonjs.com/tutorials/14._Height_Map   
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#ground-from-a-height-map  
         * The parameter `url` sets the URL of the height map image resource.  
         * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.     
         * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.  
         * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.     
         * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.   
         * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).  
         * This function is passed the newly built mesh : ```function(mesh) { // do things
         * return; }```
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateGroundFromHeightMap(name: string, url: string, options: { width?: number, height?: number, subdivisions?: number, minHeight?: number, maxHeight?: number, updatable?: boolean, onReady?: (mesh: GroundMesh) => void }, scene: Scene): GroundMesh {
            var width = options.width || 10;
            var height = options.height || 10;
            var subdivisions = options.subdivisions || 1;
            var minHeight = options.minHeight;
            var maxHeight = options.maxHeight || 10;
            var updatable = options.updatable;
            var onReady = options.onReady;

            var ground = new GroundMesh(name, scene);
            ground._subdivisions = subdivisions;
            ground._width = width;
            ground._height = height;
            ground._maxX = ground._width / 2;
            ground._maxZ = ground._height / 2;
            ground._minX = -ground._maxX;
            ground._minZ = -ground._maxZ;

            ground._setReady(false);

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var bufferWidth = img.width;
                var bufferHeight = img.height;
                canvas.width = bufferWidth;
                canvas.height = bufferHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = <Uint8Array>(<any>context.getImageData(0, 0, bufferWidth, bufferHeight).data);
                var vertexData = VertexData.CreateGroundFromHeightMap({
                    width, height,
                    subdivisions,
                    minHeight, maxHeight,
                    buffer, bufferWidth, bufferHeight
                });

                vertexData.applyToMesh(ground, updatable);

                ground._setReady(true);

                //execute ready callback, if set
                if (onReady) {
                    onReady(ground);
                }
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);

            return ground;
        }

        /**
         * Creates a tube mesh.    
         * The tube is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.    
         *
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#tube     
         * The parameter `path` is a required array of successive `Vector3`. It is the curve used as the axis of the tube.        
         * The parameter `radius` (positive float, default 1) sets the tube radius size.    
         * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface.  
         * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`. 
         * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path. 
         * It must return a radius value (positive float) : 
         * ```var radiusFunction = function(i, distance) {
         *   // do things
         *   return radius; }```
         * The parameter `arc` (positive float, maximum 1, default 1) is the ratio to apply to the tube circumference : 2 x PI x arc.  
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL         
         * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#tube    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTube(name: string, options: { path: Vector3[], radius?: number, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; }, cap?: number, arc?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene: Scene): Mesh {
            var path = options.path;
            var radius = options.radius || 1;
            var tessellation = options.tessellation || 64;
            var radiusFunction = options.radiusFunction;
            var cap = options.cap || Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = options.sideOrientation || Mesh.DEFAULTSIDE;
            var instance = options.instance;
            options.arc = (options.arc <= 0 || options.arc > 1) ? 1 : options.arc || 1;

            // tube geometry
            var tubePathArray = (path, path3D, circlePaths, radius, tessellation, radiusFunction, cap, arc) => {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var distances = path3D.getDistances();
                var pi2 = Math.PI * 2;
                var step = pi2 / tessellation * arc;
                var returnRadius: { (i: number, distance: number): number; } = () => radius;
                var radiusFunctionFinal: { (i: number, distance: number): number; } = radiusFunction || returnRadius;

                var circlePath: Vector3[];
                var rad: number;
                var normal: Vector3;
                var rotated: Vector3;
                var rotationMatrix: Matrix = Tmp.Matrix[0];
                var index = (cap === Mesh._NO_CAP || cap === Mesh.CAP_END) ? 0 : 2;
                for (var i = 0; i < path.length; i++) {
                    rad = radiusFunctionFinal(i, distances[i]); // current radius
                    circlePath = Array<Vector3>();              // current circle array
                    normal = normals[i];                        // current normal
                    for (var t = 0; t < tessellation; t++) {
                        Matrix.RotationAxisToRef(tangents[i], step * t, rotationMatrix);
                        rotated = circlePath[t] ? circlePath[t] : Vector3.Zero();
                        Vector3.TransformCoordinatesToRef(normal, rotationMatrix, rotated);
                        rotated.scaleInPlace(rad).addInPlace(path[i]);
                        circlePath[t] = rotated;
                    }
                    circlePaths[index] = circlePath;
                    index++;
                }
                // cap
                var capPath = (nbPoints, pathIndex) => {
                    var pointCap = Array<Vector3>();
                    for (var i = 0; i < nbPoints; i++) {
                        pointCap.push(path[pathIndex]);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        circlePaths[0] = capPath(tessellation, 0);
                        circlePaths[1] = circlePaths[2].slice(0);
                        break;
                    case Mesh.CAP_END:
                        circlePaths[index] = circlePaths[index - 1].slice(0);
                        circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                        break;
                    case Mesh.CAP_ALL:
                        circlePaths[0] = capPath(tessellation, 0);
                        circlePaths[1] = circlePaths[2].slice(0);
                        circlePaths[index] = circlePaths[index - 1].slice(0);
                        circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                        break;
                    default:
                        break;
                }
                return circlePaths;
            };
            var path3D;
            var pathArray;
            if (instance) { // tube update
                var arc = options.arc || (<any>instance).arc;
                path3D = ((<any>instance).path3D).update(path);
                pathArray = tubePathArray(path, path3D, (<any>instance).pathArray, radius, (<any>instance).tessellation, radiusFunction, (<any>instance).cap, arc);
                instance = MeshBuilder.CreateRibbon(null, { pathArray: pathArray, instance: instance });
                (<any>instance).path3D = path3D;
                (<any>instance).pathArray = pathArray;
                (<any>instance).arc = arc;

                return instance;

            }
            // tube creation
            path3D = <any>new Path3D(path);
            var newPathArray = new Array<Array<Vector3>>();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap, options.arc);
            var tube = MeshBuilder.CreateRibbon(name, { pathArray: pathArray, closePath: true, closeArray: false, updatable: updatable, sideOrientation: sideOrientation }, scene);
            (<any>tube).pathArray = pathArray;
            (<any>tube).path3D = path3D;
            (<any>tube).tessellation = tessellation;
            (<any>tube).cap = cap;
            (<any>tube).arc = options.arc;

            return tube;
        }

        /**
         * Creates a polyhedron mesh.  
         * 
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#polyhedron  
         * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial
         *  to choose the wanted type.  
         * The parameter `size` (positive float, default 1) sets the polygon size.  
         * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value).  
         * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`.  
         * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron    
         * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (`Color4`, default `(1, 1, 1, 1)`) and faceUV (`Vector4`, default `(0, 0, 1, 1)`). 
         * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors  
         * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored.    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.   
         */
        public static CreatePolyhedron(name: string, options: { type?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, faceUV?: Vector4[], faceColors?: Color4[], flat?: boolean, updatable?: boolean, sideOrientation?: number }, scene: Scene): Mesh {
            var polyhedron = new Mesh(name, scene);

            var vertexData = VertexData.CreatePolyhedron(options);

            vertexData.applyToMesh(polyhedron, options.updatable);

            return polyhedron;
        }

        /**
         * Creates a decal mesh.  
         * tuto : http://doc.babylonjs.com/tutorials/Mesh_CreateXXX_Methods_With_Options_Parameter#decals  
         * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal.  
         * The parameter `position` (`Vector3`, default `(0, 0, 0)`) sets the position of the decal in World coordinates.  
         * The parameter `normal` (`Vector3`, default `Vector3.Up`) sets the normal of the mesh where the decal is applied onto in World coordinates.  
         * The parameter `size` (`Vector3`, default `(1, 1, 1)`) sets the decal scaling.  
         * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal.  
         */
        public static CreateDecal(name: string, sourceMesh: AbstractMesh, options: { position?: Vector3, normal?: Vector3, size?: Vector3, angle?: number }): Mesh {
            var indices = sourceMesh.getIndices();
            var positions = sourceMesh.getVerticesData(VertexBuffer.PositionKind);
            var normals = sourceMesh.getVerticesData(VertexBuffer.NormalKind);
            var position = options.position || Vector3.Zero();
            var normal = options.normal || Vector3.Up();
            var size = options.size || new Vector3(1, 1, 1);
            var angle = options.angle || 0;

            // Getting correct rotation
            if (!normal) {
                var target = new Vector3(0, 0, 1);
                var camera = sourceMesh.getScene().activeCamera;
                var cameraWorldTarget = Vector3.TransformCoordinates(target, camera.getWorldMatrix());

                normal = camera.globalPosition.subtract(cameraWorldTarget);
            }

            var yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
            var len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
            var pitch = Math.atan2(normal.y, len);

            // Matrix
            var decalWorldMatrix = Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(Matrix.Translation(position.x, position.y, position.z));
            var inverseDecalWorldMatrix = Matrix.Invert(decalWorldMatrix);
            var meshWorldMatrix = sourceMesh.getWorldMatrix();
            var transformMatrix = meshWorldMatrix.multiply(inverseDecalWorldMatrix);

            var vertexData = new VertexData();
            vertexData.indices = [];
            vertexData.positions = [];
            vertexData.normals = [];
            vertexData.uvs = [];

            var currentVertexDataIndex = 0;

            var extractDecalVector3 = (indexId: number): PositionNormalVertex => {
                var vertexId = indices[indexId];
                var result = new PositionNormalVertex();
                result.position = new Vector3(positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2]);

                // Send vector to decal local world
                result.position = Vector3.TransformCoordinates(result.position, transformMatrix);

                // Get normal
                result.normal = new Vector3(normals[vertexId * 3], normals[vertexId * 3 + 1], normals[vertexId * 3 + 2]);

                return result;
            }; // Inspired by https://github.com/mrdoob/three.js/blob/eee231960882f6f3b6113405f524956145148146/examples/js/geometries/DecalGeometry.js
            var clip = (vertices: PositionNormalVertex[], axis: Vector3): PositionNormalVertex[]=> {
                if (vertices.length === 0) {
                    return vertices;
                }

                var clipSize = 0.5 * Math.abs(Vector3.Dot(size, axis));

                var clipVertices = (v0: PositionNormalVertex, v1: PositionNormalVertex): PositionNormalVertex => {
                    var clipFactor = Vector3.GetClipFactor(v0.position, v1.position, axis, clipSize);

                    return new PositionNormalVertex(
                        Vector3.Lerp(v0.position, v1.position, clipFactor),
                        Vector3.Lerp(v0.normal, v1.normal, clipFactor)
                    );
                };
                var result = new Array<PositionNormalVertex>();

                for (var index = 0; index < vertices.length; index += 3) {
                    var v1Out: boolean;
                    var v2Out: boolean;
                    var v3Out: boolean;
                    var total = 0;
                    var nV1: PositionNormalVertex, nV2: PositionNormalVertex, nV3: PositionNormalVertex, nV4: PositionNormalVertex;

                    var d1 = Vector3.Dot(vertices[index].position, axis) - clipSize;
                    var d2 = Vector3.Dot(vertices[index + 1].position, axis) - clipSize;
                    var d3 = Vector3.Dot(vertices[index + 2].position, axis) - clipSize;

                    v1Out = d1 > 0;
                    v2Out = d2 > 0;
                    v3Out = d3 > 0;

                    total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);

                    switch (total) {
                        case 0:
                            result.push(vertices[index]);
                            result.push(vertices[index + 1]);
                            result.push(vertices[index + 2]);
                            break;
                        case 1:

                            if (v1Out) {
                                nV1 = vertices[index + 1];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index], nV1);
                                nV4 = clipVertices(vertices[index], nV2);
                            }

                            if (v2Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index + 1], nV1);
                                nV4 = clipVertices(vertices[index + 1], nV2);

                                result.push(nV3);
                                result.push(nV2.clone());
                                result.push(nV1.clone());

                                result.push(nV2.clone());
                                result.push(nV3.clone());
                                result.push(nV4);
                                break;
                            }
                            if (v3Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 1];
                                nV3 = clipVertices(vertices[index + 2], nV1);
                                nV4 = clipVertices(vertices[index + 2], nV2);
                            }

                            result.push(nV1.clone());
                            result.push(nV2.clone());
                            result.push(nV3);

                            result.push(nV4);
                            result.push(nV3.clone());
                            result.push(nV2.clone());
                            break;
                        case 2:
                            if (!v1Out) {
                                nV1 = vertices[index].clone();
                                nV2 = clipVertices(nV1, vertices[index + 1]);
                                nV3 = clipVertices(nV1, vertices[index + 2]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v2Out) {
                                nV1 = vertices[index + 1].clone();
                                nV2 = clipVertices(nV1, vertices[index + 2]);
                                nV3 = clipVertices(nV1, vertices[index]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v3Out) {
                                nV1 = vertices[index + 2].clone();
                                nV2 = clipVertices(nV1, vertices[index]);
                                nV3 = clipVertices(nV1, vertices[index + 1]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            break;
                        case 3:
                            break;
                    }
                }

                return result;
            };
            for (var index = 0; index < indices.length; index += 3) {
                var faceVertices = new Array<PositionNormalVertex>();

                faceVertices.push(extractDecalVector3(index));
                faceVertices.push(extractDecalVector3(index + 1));
                faceVertices.push(extractDecalVector3(index + 2));

                // Clip
                faceVertices = clip(faceVertices, new Vector3(1, 0, 0));
                faceVertices = clip(faceVertices, new Vector3(-1, 0, 0));
                faceVertices = clip(faceVertices, new Vector3(0, 1, 0));
                faceVertices = clip(faceVertices, new Vector3(0, -1, 0));
                faceVertices = clip(faceVertices, new Vector3(0, 0, 1));
                faceVertices = clip(faceVertices, new Vector3(0, 0, -1));

                if (faceVertices.length === 0) {
                    continue;
                }

                // Add UVs and get back to world
                for (var vIndex = 0; vIndex < faceVertices.length; vIndex++) {
                    var vertex = faceVertices[vIndex];

                    //TODO check for Int32Array
                    (<number[]>vertexData.indices).push(currentVertexDataIndex);
                    vertex.position.toArray(vertexData.positions, currentVertexDataIndex * 3);
                    vertex.normal.toArray(vertexData.normals, currentVertexDataIndex * 3);
                    (<number[]>vertexData.uvs).push(0.5 + vertex.position.x / size.x);
                    (<number[]>vertexData.uvs).push(0.5 + vertex.position.y / size.y);

                    currentVertexDataIndex++;
                }
            }

            // Return mesh
            var decal = new Mesh(name, sourceMesh.getScene());
            vertexData.applyToMesh(decal);

            decal.position = position.clone();
            decal.rotation = new Vector3(pitch, yaw, angle);

            return decal;
        }

        // Privates
        private static _ExtrudeShapeGeneric(name: string, shape: Vector3[], curve: Vector3[], scale: number, rotation: number, scaleFunction: { (i: number, distance: number): number; }, rotateFunction: { (i: number, distance: number): number; }, rbCA: boolean, rbCP: boolean, cap: number, custom: boolean, scene: Scene, updtbl: boolean, side: number, instance: Mesh): Mesh {
            // extrusion geometry
            var extrusionPathArray = (shape, curve, path3D, shapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom) => {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var binormals = path3D.getBinormals();
                var distances = path3D.getDistances();

                var angle = 0;
                var returnScale: { (i: number, distance: number): number; } = () => { return scale; };
                var returnRotation: { (i: number, distance: number): number; } = () => { return rotation; };
                var rotate: { (i: number, distance: number): number; } = custom ? rotateFunction : returnRotation;
                var scl: { (i: number, distance: number): number; } = custom ? scaleFunction : returnScale;
                var index = (cap === Mesh.NO_CAP || cap === Mesh.CAP_END) ? 0 : 2;
                var rotationMatrix: Matrix = Tmp.Matrix[0];

                for (var i = 0; i < curve.length; i++) {
                    var shapePath = new Array<Vector3>();
                    var angleStep = rotate(i, distances[i]);
                    var scaleRatio = scl(i, distances[i]);
                    for (var p = 0; p < shape.length; p++) {
                        Matrix.RotationAxisToRef(tangents[i], angle, rotationMatrix);
                        var planed = ((tangents[i].scale(shape[p].z)).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y)));
                        var rotated = shapePath[p] ? shapePath[p] : Vector3.Zero();
                        Vector3.TransformCoordinatesToRef(planed, rotationMatrix, rotated);
                        rotated.scaleInPlace(scaleRatio).addInPlace(curve[i]);
                        shapePath[p] = rotated;
                    }
                    shapePaths[index] = shapePath;
                    angle += angleStep;
                    index++;
                }
                // cap
                var capPath = shapePath => {
                    var pointCap = Array<Vector3>();
                    var barycenter = Vector3.Zero();
                    var i: number;
                    for (i = 0; i < shapePath.length; i++) {
                        barycenter.addInPlace(shapePath[i]);
                    }
                    barycenter.scaleInPlace(1 / shapePath.length);
                    for (i = 0; i < shapePath.length; i++) {
                        pointCap.push(barycenter);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        shapePaths[0] = capPath(shapePaths[2]);
                        shapePaths[1] = shapePaths[2].slice(0);
                        break;
                    case Mesh.CAP_END:
                        shapePaths[index] = shapePaths[index - 1];
                        shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                        break;
                    case Mesh.CAP_ALL:
                        shapePaths[0] = capPath(shapePaths[2]);
                        shapePaths[1] = shapePaths[2].slice(0);
                        shapePaths[index] = shapePaths[index - 1];
                        shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                        break;
                    default:
                        break;
                }
                return shapePaths;
            };
            var path3D;
            var pathArray;
            if (instance) { // instance update
                path3D = ((<any>instance).path3D).update(curve);
                pathArray = extrusionPathArray(shape, curve, (<any>instance).path3D, (<any>instance).pathArray, scale, rotation, scaleFunction, rotateFunction, (<any>instance).cap, custom);
                instance = Mesh.CreateRibbon(null, pathArray, null, null, null, null, null, null, instance);

                return instance;
            }
            // extruded shape creation
            path3D = <any>new Path3D(curve);
            var newShapePaths = new Array<Array<Vector3>>();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
            var extrudedGeneric = Mesh.CreateRibbon(name, pathArray, rbCA, rbCP, 0, scene, updtbl, side);
            (<any>extrudedGeneric).pathArray = pathArray;
            (<any>extrudedGeneric).path3D = path3D;
            (<any>extrudedGeneric).cap = cap;

            return extrudedGeneric;
        }
    }
}
