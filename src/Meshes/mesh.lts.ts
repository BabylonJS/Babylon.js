import { Color4 } from "../Maths/math.color";
import { Vector3, Vector4 } from "../Maths/math.vector";
import { _DevTools } from "../Misc/devTools";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { AbstractMesh } from "./abstractMesh";
import { ICreateCapsuleOptions } from "./Builders/capsuleBuilder";
import { Mesh } from "./mesh";

declare type LinesMesh = import("./linesMesh").LinesMesh;
declare type GroundMesh = import("./groundMesh").GroundMesh;

declare var earcut: any;

declare module "./mesh" {
    namespace Mesh {
        /**
     * Creates a ribbon mesh. Please consider using the same method from the MeshBuilder class instead
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     * @param name defines the name of the mesh to create
     * @param pathArray is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.
     * @param closeArray creates a seam between the first and the last paths of the path array (default is false)
     * @param closePath creates a seam between the first and the last points of each path of the path array
     * @param offset is taken in account only if the `pathArray` is containing a single path
     * @param scene defines the hosting scene
     * @param updatable defines if the mesh must be flagged as updatable
     * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
     * @param instance defines an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#ribbon)
     * @returns a new Mesh
     */
        let CreateRibbon: (
            name: string,
            pathArray: Vector3[][],
            closeArray: boolean,
            closePath: boolean,
            offset: number,
            scene?: Scene,
            updatable?: boolean,
            sideOrientation?: number,
            instance?: Mesh
        ) => Mesh;

        /**
         * Creates a plane polygonal mesh.  By default, this is a disc. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param radius sets the radius size (float) of the polygon (default 0.5)
         * @param tessellation sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateDisc: (name: string, radius: number, tessellation: number, scene: Nullable<Scene>, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a box mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param size sets the size (float) of each box side (default 1)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateBox: (name: string, size: number, scene: Nullable<Scene>, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a sphere mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param segments sets the sphere number of horizontal stripes (positive integer, default 32)
         * @param diameter sets the diameter size (float) of the sphere (default 1)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateSphere: (name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a hemisphere mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param segments sets the sphere number of horizontal stripes (positive integer, default 32)
         * @param diameter sets the diameter size (float) of the sphere (default 1)
         * @param scene defines the hosting scene
         * @returns a new Mesh
         */
        let CreateHemisphere: (name: string, segments: number, diameter: number, scene?: Scene) => Mesh;

        /**
         * Creates a cylinder or a cone mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param height sets the height size (float) of the cylinder/cone (float, default 2)
         * @param diameterTop set the top cap diameter (floats, default 1)
         * @param diameterBottom set the bottom cap diameter (floats, default 1). This value can't be zero
         * @param tessellation sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance
         * @param subdivisions sets the number of rings along the cylinder height (positive integer, default 1)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateCylinder: (
            name: string,
            height: number,
            diameterTop: number,
            diameterBottom: number,
            tessellation: number,
            subdivisions: any,
            scene?: Scene,
            updatable?: any,
            sideOrientation?: number
        ) => Mesh;

        // Torus  (Code from SharpDX.org)
        /**
         * Creates a torus mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param diameter sets the diameter size (float) of the torus (default 1)
         * @param thickness sets the diameter size of the tube of the torus (float, default 0.5)
         * @param tessellation sets the number of torus sides (positive integer, default 16)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateTorus: (name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a torus knot mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param radius sets the global radius size (float) of the torus knot (default 2)
         * @param tube sets the diameter size of the tube of the torus (float, default 0.5)
         * @param radialSegments sets the number of sides on each tube segments (positive integer, default 32)
         * @param tubularSegments sets the number of tubes to decompose the knot into (positive integer, default 32)
         * @param p the number of windings on X axis (positive integers, default 2)
         * @param q the number of windings on Y axis (positive integers, default 3)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateTorusKnot: (
            name: string,
            radius: number,
            tube: number,
            radialSegments: number,
            tubularSegments: number,
            p: number,
            q: number,
            scene?: Scene,
            updatable?: boolean,
            sideOrientation?: number
        ) => Mesh;

        /**
         * Creates a line mesh. Please consider using the same method from the MeshBuilder class instead.
         * @param name defines the name of the mesh to create
         * @param points is an array successive Vector3
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param instance is an instance of an existing LineMesh object to be updated with the passed `points` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#lines-and-dashedlines).
         * @returns a new Mesh
         */
        let CreateLines: (name: string, points: Vector3[], scene: Nullable<Scene>, updatable: boolean, instance?: Nullable<LinesMesh>) => LinesMesh;

        /**
         * Creates a dashed line mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param points is an array successive Vector3
         * @param dashSize is the size of the dashes relatively the dash number (positive float, default 3)
         * @param gapSize is the size of the gap between two successive dashes relatively the dash number (positive float, default 1)
         * @param dashNb is the intended total number of dashes (positive integer, default 200)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param instance is an instance of an existing LineMesh object to be updated with the passed `points` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#lines-and-dashedlines)
         * @returns a new Mesh
         */
        let CreateDashedLines: (
            name: string,
            points: Vector3[],
            dashSize: number,
            gapSize: number,
            dashNb: number,
            scene: Nullable<Scene>,
            updatable?: boolean,
            instance?: LinesMesh
        ) => LinesMesh;

        /**
         * Creates a polygon mesh.Please consider using the same method from the MeshBuilder class instead
         * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
         * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
         * You can set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         * Remember you can only change the shape positions, not their number when updating a polygon.
         * @see https://doc.babylonjs.com/how_to/parametric_shapes#non-regular-polygon
         * @param name defines the name of the mesh to create
         * @param shape is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
         * @param scene defines the hosting scene
         * @param holes is a required array of arrays of successive Vector3 used to defines holes in the polygon
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @param earcutInjection can be used to inject your own earcut reference
         * @returns a new Mesh
         */
        let CreatePolygon: (name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number, earcutInjection?: any) => Mesh;

        /**
         * Creates an extruded polygon mesh, with depth in the Y direction. Please consider using the same method from the MeshBuilder class instead.
         * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-non-regular-polygon
         * @param name defines the name of the mesh to create
         * @param shape is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
         * @param depth defines the height of extrusion
         * @param scene defines the hosting scene
         * @param holes is a required array of arrays of successive Vector3 used to defines holes in the polygon
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @param earcutInjection can be used to inject your own earcut reference
         * @returns a new Mesh
         */
        let ExtrudePolygon: (
            name: string,
            shape: Vector3[],
            depth: number,
            scene: Scene,
            holes?: Vector3[][],
            updatable?: boolean,
            sideOrientation?: number,
            earcutInjection?: any
        ) => Mesh;

        /**
         * Creates an extruded shape mesh.
         * The extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters. Please consider using the same method from the MeshBuilder class instead
         * @see https://doc.babylonjs.com/how_to/parametric_shapes
         * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
         * @param name defines the name of the mesh to create
         * @param shape is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis
         * @param path is a required array of successive Vector3. This is the axis curve the shape is extruded along
         * @param scale is the value to scale the shape
         * @param rotation is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve
         * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @param instance is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#extruded-shape)
         * @returns a new Mesh
         */
        let ExtrudeShape: (
            name: string,
            shape: Vector3[],
            path: Vector3[],
            scale: number,
            rotation: number,
            cap: number,
            scene: Nullable<Scene>,
            updatable?: boolean,
            sideOrientation?: number,
            instance?: Mesh
        ) => Mesh;

        /**
         * Creates an custom extruded shape mesh.
         * The custom extrusion is a parametric shape.
         * It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead
         * @see https://doc.babylonjs.com/how_to/parametric_shapes#extruded-shapes
         * @param name defines the name of the mesh to create
         * @param shape is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis
         * @param path is a required array of successive Vector3. This is the axis curve the shape is extruded along
         * @param scaleFunction is a custom Javascript function called on each path point
         * @param rotationFunction is a custom Javascript function called on each path point
         * @param ribbonCloseArray forces the extrusion underlying ribbon to close all the paths in its `pathArray`
         * @param ribbonClosePath forces the extrusion underlying ribbon to close its `pathArray`
         * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @param instance is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters (https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#extruded-shape)
         * @returns a new Mesh
         */
        let ExtrudeShapeCustom: (
            name: string,
            shape: Vector3[],
            path: Vector3[],
            scaleFunction: Nullable<{ (i: number, distance: number): number }>,
            rotationFunction: Nullable<{ (i: number, distance: number): number }>,
            ribbonCloseArray: boolean,
            ribbonClosePath: boolean,
            cap: number,
            scene: Scene,
            updatable?: boolean,
            sideOrientation?: number,
            instance?: Mesh
        ) => Mesh;

        /**
         * Creates lathe mesh.
         * The lathe is a shape with a symmetry axis : a 2D model shape is rotated around this axis to design the lathe.
         * Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param shape is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero
         * @param radius is the radius value of the lathe
         * @param tessellation is the side number of the lathe.
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreateLathe: (name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a plane mesh. Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param size sets the size (float) of both sides of the plane at once (default 1)
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @returns a new Mesh
         */
        let CreatePlane: (name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number) => Mesh;

        /**
         * Creates a ground mesh.
         * Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param width set the width of the ground
         * @param height set the height of the ground
         * @param subdivisions sets the number of subdivisions per side
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @returns a new Mesh
         */
        let CreateGround: (name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean) => Mesh;

        /**
         * Creates a tiled ground mesh.
         * Please consider using the same method from the MeshBuilder class instead
         * @param name defines the name of the mesh to create
         * @param xmin set the ground minimum X coordinate
         * @param zmin set the ground minimum Y coordinate
         * @param xmax set the ground maximum X coordinate
         * @param zmax set the ground maximum Z coordinate
         * @param subdivisions is an object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the numbers of subdivisions on the ground width and height. Each subdivision is called a tile
         * @param precision is an object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the numbers of subdivisions on the ground width and height of each tile
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @returns a new Mesh
         */
        let CreateTiledGround: (
            name: string,
            xmin: number,
            zmin: number,
            xmax: number,
            zmax: number,
            subdivisions: { w: number; h: number },
            precision: { w: number; h: number },
            scene: Scene,
            updatable?: boolean
        ) => Mesh;

        /**
         * Creates a ground mesh from a height map.
         * Please consider using the same method from the MeshBuilder class instead
         * @see https://doc.babylonjs.com/babylon101/height_map
         * @param name defines the name of the mesh to create
         * @param url sets the URL of the height map image resource
         * @param width set the ground width size
         * @param height set the ground height size
         * @param subdivisions sets the number of subdivision per side
         * @param minHeight is the minimum altitude on the ground
         * @param maxHeight is the maximum altitude on the ground
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param onReady  is a callback function that will be called  once the mesh is built (the height map download can last some time)
         * @param alphaFilter will filter any data where the alpha channel is below this value, defaults 0 (all data visible)
         * @returns a new Mesh
         */
        let CreateGroundFromHeightMap: (
            name: string,
            url: string,
            width: number,
            height: number,
            subdivisions: number,
            minHeight: number,
            maxHeight: number,
            scene: Scene,
            updatable?: boolean,
            onReady?: (mesh: GroundMesh) => void,
            alphaFilter?: number
        ) => GroundMesh;

        /**
         * Creates a tube mesh.
         * The tube is a parametric shape.
         * It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead
         * @see https://doc.babylonjs.com/how_to/parametric_shapes
         * @param name defines the name of the mesh to create
         * @param path is a required array of successive Vector3. It is the curve used as the axis of the tube
         * @param radius sets the tube radius size
         * @param tessellation is the number of sides on the tubular surface
         * @param radiusFunction is a custom function. If it is not null, it overrides the parameter `radius`. This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path
         * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
         * @param scene defines the hosting scene
         * @param updatable defines if the mesh must be flagged as updatable
         * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation)
         * @param instance is an instance of an existing Tube object to be updated with the passed `pathArray` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#tube)
         * @returns a new Mesh
         */
        let CreateTube: (
            name: string,
            path: Vector3[],
            radius: number,
            tessellation: number,
            radiusFunction: { (i: number, distance: number): number },
            cap: number,
            scene: Scene,
            updatable?: boolean,
            sideOrientation?: number,
            instance?: Mesh
        ) => Mesh;

        /**
         * Creates a polyhedron mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embedded types. Please refer to the type sheet in the tutorial to choose the wanted type
         * * The parameter `size` (positive float, default 1) sets the polygon size
         * * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value)
         * * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`
         * * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
         * * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`)
         * * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
         * * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored
         * * You can also set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
         * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
         * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
         * @param name defines the name of the mesh to create
         * @param options defines the options used to create the mesh
         * @param scene defines the hosting scene
         * @returns a new Mesh
         */
        let CreatePolyhedron: (
            name: string,
            options: {
                type?: number;
                size?: number;
                sizeX?: number;
                sizeY?: number;
                sizeZ?: number;
                custom?: any;
                faceUV?: Vector4[];
                faceColors?: Color4[];
                updatable?: boolean;
                sideOrientation?: number;
            },
            scene: Scene
        ) => Mesh;

        /**
     * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided
     * * The parameter `radius` sets the radius size (float) of the icosphere (default 1)
     * * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`)
     * * The parameter `subdivisions` sets the number of subdivisions (positive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size
     * * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface
     * * You can also set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns a new Mesh
     * @see https://doc.babylonjs.com/how_to/polyhedra_shapes#icosphere
     */
        let CreateIcoSphere: (
            name: string,
            options: { radius?: number; flat?: boolean; subdivisions?: number; sideOrientation?: number; updatable?: boolean },
            scene: Scene
        ) => Mesh;

        /**
         * Creates a decal mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A decal is a mesh usually applied as a model onto the surface of another mesh
         * @param name  defines the name of the mesh
         * @param sourceMesh defines the mesh receiving the decal
         * @param position sets the position of the decal in world coordinates
         * @param normal sets the normal of the mesh where the decal is applied onto in world coordinates
         * @param size sets the decal scaling
         * @param angle sets the angle to rotate the decal
         * @returns a new Mesh
         */
        let CreateDecal: (name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number) => Mesh;

        /** Creates a Capsule Mesh
         * @param name defines the name of the mesh.
         * @param options the constructors options used to shape the mesh.
         * @param scene defines the scene the mesh is scoped to.
         * @returns the capsule mesh
         * @see https://doc.babylonjs.com/how_to/capsule_shape
         */
        let CreateCapsule: (name: string, options: ICreateCapsuleOptions, scene: Scene) => Mesh;
    }
}

Mesh.CreateRibbon = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateDisc = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateBox = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateTorus = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateSphere = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateCylinder = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateTorusKnot = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateTorus = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreatePlane = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateGround = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateTiledGround = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateGroundFromHeightMap = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateTube = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreatePolyhedron = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateIcoSphere = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateDecal = () => { throw _DevTools.WarnImport("MeshBuilder"); };
Mesh.CreateCapsule = () => { throw _DevTools.WarnImport("MeshBuilder"); };
