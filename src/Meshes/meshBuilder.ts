import { RibbonBuilder } from "./Builders/ribbonBuilder";
import { DiscBuilder } from "./Builders/discBuilder";
import { BoxBuilder } from "./Builders/boxBuilder";
import { TiledBoxBuilder } from "./Builders/tiledBoxBuilder";
import { SphereBuilder } from "./Builders/sphereBuilder";
import { CylinderBuilder } from "./Builders/cylinderBuilder";
import { TorusBuilder } from "./Builders/torusBuilder";
import { TorusKnotBuilder } from "./Builders/torusKnotBuilder";
import { LinesBuilder } from "./Builders/linesBuilder";
import { PolygonBuilder } from "./Builders/polygonBuilder";
import { ShapeBuilder } from "./Builders/shapeBuilder";
import { LatheBuilder } from "./Builders/latheBuilder";
import { PlaneBuilder } from "./Builders/planeBuilder";
import { TiledPlaneBuilder } from "./Builders/tiledPlaneBuilder";
import { GroundBuilder } from "./Builders/groundBuilder";
import { TubeBuilder } from "./Builders/tubeBuilder";
import { PolyhedronBuilder } from "./Builders/polyhedronBuilder";
import { IcoSphereBuilder } from "./Builders/icoSphereBuilder";
import { DecalBuilder } from "./Builders/decalBuilder";
import { CapsuleBuilder } from "./Builders/capsuleBuilder";

import { Vector4, Vector3, Vector2 } from "../Maths/math.vector";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Mesh } from "./mesh";
import { LinesMesh } from "./linesMesh";
import { GroundMesh } from "./groundMesh";
import { AbstractMesh } from "./abstractMesh";
import { Color4, Color3 } from '../Maths/math.color';
import { Plane } from '../Maths/math.plane';

declare var earcut: any;

/**
 * Class containing static functions to help procedurally build meshes
 */
export class MeshBuilder {
    /**
     * Creates a box mesh
     * * The parameter `size` sets the size (float) of each box side (default 1)
     * * You can set some different box dimensions by using the parameters `width`, `height` and `depth` (all by default have the same value of `size`)
     * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 Color3 elements) and `faceUV` (an array of 6 Vector4 elements)
     * * Please read this tutorial : https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/set_shapes#box
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the box mesh
     */
    public static CreateBox(name: string, options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean, topBaseAt?: number, bottomBaseAt?: number, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return BoxBuilder.CreateBox(name, options, scene);
    }

    /**
     * Creates a tiled box mesh
     * * faceTiles sets the pattern, tile size and number of tiles for a face
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the tiled box mesh
     */
    public static CreateTiledBox(name: string, options: { pattern?: number, size?: number, width?: number, height?: number, depth: number, tileSize?: number, tileWidth?: number, tileHeight?: number, faceUV?: Vector4[], faceColors?: Color4[], alignHorizontal?: number, alignVertical?: number, sideOrientation?: number, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return TiledBoxBuilder.CreateTiledBox(name, options, scene);
    }

    /**
     * Creates a sphere mesh
     * * The parameter `diameter` sets the diameter size (float) of the sphere (default 1)
     * * You can set some different sphere dimensions, for instance to build an ellipsoid, by using the parameters `diameterX`, `diameterY` and `diameterZ` (all by default have the same value of `diameter`)
     * * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32)
     * * You can create an unclosed sphere with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference (latitude) : 2 x PI x ratio
     * * You can create an unclosed sphere on its height with the parameter `slice` (positive float, default1), valued between 0 and 1, what is the height ratio (longitude)
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the sphere mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#sphere
     */
    public static CreateSphere(name: string, options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return SphereBuilder.CreateSphere(name, options, scene);
    }

    /**
     * Creates a plane polygonal mesh.  By default, this is a disc
     * * The parameter `radius` sets the radius size (float) of the polygon (default 0.5)
     * * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc
     * * You can create an unclosed polygon with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference : 2 x PI x ratio
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the plane polygonal mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#disc-or-regular-polygon
     */
    public static CreateDisc(name: string, options: { radius?: number, tessellation?: number, arc?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
        return DiscBuilder.CreateDisc(name, options, scene);
    }

    /**
     * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided
     * * The parameter `radius` sets the radius size (float) of the icosphere (default 1)
     * * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value of `radius`)
     * * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size
     * * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the icosahedron mesh
     * @see https://doc.babylonjs.com/how_to/polyhedra_shapes#icosphere
     */
    public static CreateIcoSphere(name: string, options: { radius?: number, radiusX?: number, radiusY?: number, radiusZ?: number, flat?: boolean, subdivisions?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return IcoSphereBuilder.CreateIcoSphere(name, options, scene);
    }

    /**
     * Creates a ribbon mesh. The ribbon is a parametric shape.  It has no predefined shape. Its final shape will depend on the input parameters
     * * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry
     * * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array
     * * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array
     * * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path
     * * It's the offset to join the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11
     * * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#ribbon
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The parameter `uvs` is an optional flat array of `Vector2` to update/set each ribbon vertex with its own custom UV values instead of the computed ones
     * * The parameters `colors` is an optional flat array of `Color4` to set/update each ribbon vertex with its own custom color values
     * * Note that if you use the parameters `uvs` or `colors`, the passed arrays must be populated with the right number of elements, it is to say the number of ribbon vertices. Remember that if you set `closePath` to `true`, there's one extra vertex per path in the geometry
     * * Moreover, you can use the parameter `color` with `instance` (to update the ribbon), only if you previously used it at creation time
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the ribbon mesh
     * @see https://doc.babylonjs.com/how_to/ribbon_tutorial
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     */
    public static CreateRibbon(name: string, options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean, uvs?: Vector2[], colors?: Color4[] }, scene: Nullable<Scene> = null): Mesh {
        return RibbonBuilder.CreateRibbon(name, options, scene);
    }

    /**
     * Creates a cylinder or a cone mesh
     * * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).
     * * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).
     * * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.
     * * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
     * * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).
     * * The parameter `hasRings` (boolean, default false) makes the subdivisions independent from each other, so they become different faces.
     * * The parameter `enclose`  (boolean, default false) adds two extra faces per subdivision to a sliced cylinder to close it around its height axis.
     * * The parameter `cap` sets the way the cylinder is capped. Possible values : BABYLON.Mesh.NO_CAP, BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL (default).
     * * The parameter `arc` (float, default 1) is the ratio (max 1) to apply to the circumference to slice the cylinder.
     * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of n Color3 elements) and `faceUV` (an array of n Vector4 elements).
     * * The value of n is the number of cylinder faces. If the cylinder has only 1 subdivisions, n equals : top face + cylinder surface + bottom face = 3
     * * Now, if the cylinder has 5 independent subdivisions (hasRings = true), n equals : top face + 5 stripe surfaces + bottom face = 2 + 5 = 7
     * * Finally, if the cylinder has 5 independent subdivisions and is enclose, n equals : top face + 5 x (stripe surface + 2 closing faces) + bottom face = 2 + 5 * 3 = 17
     * * Each array (color or UVs) is always ordered the same way : the first element is the bottom cap, the last element is the top cap. The other elements are each a ring surface.
     * * If `enclose` is false, a ring surface is one element.
     * * If `enclose` is true, a ring surface is 3 successive elements in the array : the tubular surface, then the two closing faces.
     * * Example how to set colors and textures on a sliced cylinder : https://www.html5gamedevs.com/topic/17945-creating-a-closed-slice-of-a-cylinder/#comment-106379
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the cylinder mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#cylinder-or-cone
     */
    public static CreateCylinder(name: string, options: { height?: number, diameterTop?: number, diameterBottom?: number, diameter?: number, tessellation?: number, subdivisions?: number, arc?: number, faceColors?: Color4[], faceUV?: Vector4[], updatable?: boolean, hasRings?: boolean, enclose?: boolean, cap?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
        return CylinderBuilder.CreateCylinder(name, options, scene);
    }

    /**
     * Creates a torus mesh
     * * The parameter `diameter` sets the diameter size (float) of the torus (default 1)
     * * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5)
     * * The parameter `tessellation` sets the number of torus sides (postive integer, default 16)
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the torus mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#torus
     */
    public static CreateTorus(name: string, options: { diameter?: number, thickness?: number, tessellation?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
        return TorusBuilder.CreateTorus(name, options, scene);
    }

    /**
     * Creates a torus knot mesh
     * * The parameter `radius` sets the global radius size (float) of the torus knot (default 2)
     * * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32)
     * * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32)
     * * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3)
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the torus knot mesh
     * @see  https://doc.babylonjs.com/how_to/set_shapes#torus-knot
     */
    public static CreateTorusKnot(name: string, options: { radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
        return TorusKnotBuilder.CreateTorusKnot(name, options, scene);
    }

    /**
     * Creates a line system mesh. A line system is a pool of many lines gathered in a single mesh
     * * A line system mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of lines as an input parameter
     * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineSystem to this static function
     * * The parameter `lines` is an array of lines, each line being an array of successive Vector3
     * * The optional parameter `instance` is an instance of an existing LineSystem object to be updated with the passed `lines` parameter
     * * The optional parameter `colors` is an array of line colors, each line colors being an array of successive Color4, one per line point
     * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need the alpha blending (faster)
     * * Updating a simple Line mesh, you just need to update every line in the `lines` array : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * When updating an instance, remember that only line point positions can change, not the number of points, neither the number of lines
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#line-system
     * @param name defines the name of the new line system
     * @param options defines the options used to create the line system
     * @param scene defines the hosting scene
     * @returns a new line system mesh
     */
    public static CreateLineSystem(name: string, options: { lines: Vector3[][], updatable?: boolean, instance?: Nullable<LinesMesh>, colors?: Nullable<Color4[][]>, useVertexAlpha?: boolean }, scene: Nullable<Scene>): LinesMesh {
        return LinesBuilder.CreateLineSystem(name, options, scene);
    }

    /**
     * Creates a line mesh
     * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter
     * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function
     * * The parameter `points` is an array successive Vector3
     * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * The optional parameter `colors` is an array of successive Color4, one per line point
     * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need alpha blending (faster)
     * * When updating an instance, remember that only point positions can change, not the number of points
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#lines
     * @param name defines the name of the new line system
     * @param options defines the options used to create the line system
     * @param scene defines the hosting scene
     * @returns a new line mesh
     */
    public static CreateLines(name: string, options: { points: Vector3[], updatable?: boolean, instance?: Nullable<LinesMesh>, colors?: Color4[], useVertexAlpha?: boolean }, scene: Nullable<Scene> = null): LinesMesh {
        return LinesBuilder.CreateLines(name, options, scene);
    }

    /**
     * Creates a dashed line mesh
     * * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter
     * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function
     * * The parameter `points` is an array successive Vector3
     * * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200)
     * * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3)
     * * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1)
     * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * When updating an instance, remember that only point positions can change, not the number of points
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the dashed line mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#dashed-lines
     */
    public static CreateDashedLines(name: string, options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number, updatable?: boolean, instance?: LinesMesh }, scene: Nullable<Scene> = null): LinesMesh {
        return LinesBuilder.CreateDashedLines(name, options, scene);
    }

    /**
     * Creates an extruded shape mesh. The extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
     * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis.
     * * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
     * * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
     * * The parameter `scale` (float, default 1) is the value to scale the shape.
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#extruded-shape
     * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture.
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the extruded shape mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
     */
    public static ExtrudeShape(name: string, options: { shape: Vector3[], path: Vector3[], scale?: number, rotation?: number, cap?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return ShapeBuilder.ExtrudeShape(name, options, scene);
    }

    /**
     * Creates an custom extruded shape mesh.
     * The custom extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
     * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis.
     * * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
     * * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path and the distance of this point from the begining of the path
     * * It must returns a float value that will be the rotation in radians applied to the shape on each path point.
     * * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path and the distance of this point from the begining of the path
     * * It must returns a float value that will be the scale value applied to the shape on each path point
     * * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`
     * * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#extruded-shape
     * * Remember you can only change the shape or path point positions, not their number when updating an extruded shape
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the custom extruded shape mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#custom-extruded-shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
     */
    public static ExtrudeShapeCustom(name: string, options: { shape: Vector3[], path: Vector3[], scaleFunction?: any, rotationFunction?: any, ribbonCloseArray?: boolean, ribbonClosePath?: boolean, cap?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return ShapeBuilder.ExtrudeShapeCustom(name, options, scene);
    }

    /**
     * Creates lathe mesh.
     * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe
     * * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero
     * * The parameter `radius` (positive float, default 1) is the radius value of the lathe
     * * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe
     * * The parameter `clip` (positive integer, default 0) is the number of sides to not create without effecting the general shape of the sides
     * * The parameter `arc` (positive float, default 1) is the ratio of the lathe. 0.5 builds for instance half a lathe, so an opened shape
     * * The parameter `closed` (boolean, default true) opens/closes the lathe circumference. This should be set to false when used with the parameter "arc"
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the lathe mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#lathe
     */
    public static CreateLathe(name: string, options: { shape: Vector3[], radius?: number, tessellation?: number, clip?: number, arc?: number, closed?: boolean, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, cap?: number, invertUV?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return LatheBuilder.CreateLathe(name, options, scene);
    }

    /**
     * Creates a tiled plane mesh
     * * You can set a limited pattern arrangement with the tiles
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the plane mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#plane
     */
    public static CreateTiledPlane(name: string, options: { pattern?: number, tileSize?: number, tileWidth?: number, tileHeight?: number, size?: number, width?: number, height?: number, alignHorizontal?: number, alignVertical?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return TiledPlaneBuilder.CreateTiledPlane(name, options, scene);
    }

    /**
     * Creates a plane mesh
     * * The parameter `size` sets the size (float) of both sides of the plane at once (default 1)
     * * You can set some different plane dimensions by using the parameters `width` and `height` (both by default have the same value of `size`)
     * * The parameter `sourcePlane` is a Plane instance. It builds a mesh plane from a Math plane
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the plane mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#plane
     */
    public static CreatePlane(name: string, options: { size?: number, width?: number, height?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean, sourcePlane?: Plane }, scene: Nullable<Scene> = null): Mesh {
        return PlaneBuilder.CreatePlane(name, options, scene);
    }

    /**
     * Creates a ground mesh
     * * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground
     * * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the ground mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#ground
     */
    public static CreateGround(name: string, options: { width?: number, height?: number, subdivisions?: number, subdivisionsX?: number, subdivisionsY?: number, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return GroundBuilder.CreateGround(name, options, scene);
    }

    /**
     * Creates a tiled ground mesh
     * * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates
     * * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates
     * * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the numbers of subdivisions on the ground width and height. Each subdivision is called a tile
     * * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the numbers of subdivisions on the ground width and height of each tile
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the tiled ground mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#tiled-ground
     */
    public static CreateTiledGround(name: string, options: { xmin: number, zmin: number, xmax: number, zmax: number, subdivisions?: { w: number; h: number; }, precision?: { w: number; h: number; }, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return GroundBuilder.CreateTiledGround(name, options, scene);
    }

    /**
     * Creates a ground mesh from a height map
     * * The parameter `url` sets the URL of the height map image resource.
     * * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.
     * * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.
     * * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.
     * * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.
     * * The parameter `colorFilter` (optional Color3, default (0.3, 0.59, 0.11) ) is the filter to apply to the image pixel colors to compute the height.
     * * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).
     * * The parameter `alphaFilter` will filter any data where the alpha channel is below this value, defaults 0 (all data visible)
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param url defines the url to the height map
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the ground mesh
     * @see https://doc.babylonjs.com/babylon101/height_map
     * @see https://doc.babylonjs.com/how_to/set_shapes#ground-from-a-height-map
     */
    public static CreateGroundFromHeightMap(name: string, url: string, options: { width?: number, height?: number, subdivisions?: number, minHeight?: number, maxHeight?: number, colorFilter?: Color3, alphaFilter?: number, updatable?: boolean, onReady?: (mesh: GroundMesh) => void }, scene: Nullable<Scene> = null): GroundMesh {
        return GroundBuilder.CreateGroundFromHeightMap(name, url, options, scene);
    }

    /**
     * Creates a polygon mesh
     * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh
     * * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
     * * You can set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4)
     * * Remember you can only change the shape positions, not their number when updating a polygon
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @param earcutInjection can be used to inject your own earcut reference
     * @returns the polygon mesh
     */
    public static CreatePolygon(name: string, options: { shape: Vector3[], holes?: Vector3[][], depth?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, }, scene: Nullable<Scene> = null, earcutInjection = earcut): Mesh {
        return PolygonBuilder.CreatePolygon(name, options, scene, earcutInjection);
    }

    /**
     * Creates an extruded polygon mesh, with depth in the Y direction.
     * * You can set different colors and different images to the top, bottom and extruded side by using the parameters `faceColors` (an array of 3 Color3 elements) and `faceUV` (an array of 3 Vector4 elements)
     * @see https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @param earcutInjection can be used to inject your own earcut reference
     * @returns the polygon mesh
     */
    public static ExtrudePolygon(name: string, options: { shape: Vector3[], holes?: Vector3[][], depth?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null, earcutInjection = earcut): Mesh {
        return PolygonBuilder.ExtrudePolygon(name, options, scene, earcutInjection);
    }

    /**
     * Creates a tube mesh.
     * The tube is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters
     * * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube
     * * The parameter `radius` (positive float, default 1) sets the tube radius size
     * * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface
     * * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`
     * * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path. It must return a radius value (positive float)
     * * The parameter `arc` (positive float, maximum 1, default 1) is the ratio to apply to the tube circumference : 2 x PI x arc
     * * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
     * * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#tube
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the tube mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @see https://doc.babylonjs.com/how_to/set_shapes#tube
     */
    public static CreateTube(name: string, options: { path: Vector3[], radius?: number, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; }, cap?: number, arc?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean }, scene: Nullable<Scene> = null): Mesh {
        return TubeBuilder.CreateTube(name, options, scene);
    }

    /**
     * Creates a polyhedron mesh
     * * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial to choose the wanted type
     * * The parameter `size` (positive float, default 1) sets the polygon size
     * * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value)
     * * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`
     * * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
     * * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`)
     * * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the polyhedron mesh
     * @see https://doc.babylonjs.com/how_to/polyhedra_shapes
     */
    public static CreatePolyhedron(name: string, options: { type?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, faceUV?: Vector4[], faceColors?: Color4[], flat?: boolean, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
        return PolyhedronBuilder.CreatePolyhedron(name, options, scene);
    }

    /**
     * Creates a decal mesh.
     * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal
     * * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates
     * * The parameter `normal` (Vector3, default `Vector3.Up`) sets the normal of the mesh where the decal is applied onto in World coordinates
     * * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling
     * * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal
     * @param name defines the name of the mesh
     * @param sourceMesh defines the mesh where the decal must be applied
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the decal mesh
     * @see https://doc.babylonjs.com/how_to/decals
     */
    public static CreateDecal(name: string, sourceMesh: AbstractMesh, options: { position?: Vector3, normal?: Vector3, size?: Vector3, angle?: number }): Mesh {
        return DecalBuilder.CreateDecal(name, sourceMesh, options);
    }


    /**
     * Creates a decal mesh.
     * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal
     * * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates
     * * The parameter `normal` (Vector3, default `Vector3.Up`) sets the normal of the mesh where the decal is applied onto in World coordinates
     * * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling
     * * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal
     * @param name defines the name of the mesh
     * @param sourceMesh defines the mesh where the decal must be applied
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the decal mesh
     * @see https://doc.babylonjs.com/how_to/decals
     */
    public static CreateCapsule(name: string, options: {
        orientation: Vector3,
        subdivisions: number,
        tessellation: number,
        height: number,
        radius: number,
        capSubdivisions: number,
        radiusTop:number,
        radiusBottom: number,
        thetaStart:number,
        thetaLength:number,
        topCapSubdivisions:number,
        bottomCapSubdivisions:number
    }, scene: Nullable<Scene> = null): Mesh {
        return CapsuleBuilder.CreateCapsule(name, options, scene);
    }
}
