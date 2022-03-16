import { CreateRibbon } from "./Builders/ribbonBuilder";
import { CreateDisc } from "./Builders/discBuilder";
import { CreateBox } from "./Builders/boxBuilder";
import { CreateTiledBox } from "./Builders/tiledBoxBuilder";
import { CreateSphere } from "./Builders/sphereBuilder";
import { CreateCylinder } from "./Builders/cylinderBuilder";
import { CreateTorus } from "./Builders/torusBuilder";
import { CreateTorusKnot } from "./Builders/torusKnotBuilder";
import { CreateDashedLines, CreateLineSystem, CreateLines } from "./Builders/linesBuilder";
import { CreatePolygon, ExtrudePolygon } from "./Builders/polygonBuilder";
import { ExtrudeShape, ExtrudeShapeCustom } from "./Builders/shapeBuilder";
import { CreateLathe } from "./Builders/latheBuilder";
import { CreatePlane } from "./Builders/planeBuilder";
import { CreateTiledPlane } from "./Builders/tiledPlaneBuilder";
import { CreateGround, CreateGroundFromHeightMap, CreateTiledGround } from "./Builders/groundBuilder";
import { CreateTube } from "./Builders/tubeBuilder";
import { CreatePolyhedron } from "./Builders/polyhedronBuilder";
import { CreateIcoSphere } from "./Builders/icoSphereBuilder";
import { CreateDecal } from "./Builders/decalBuilder";
import { CreateCapsule } from "./Builders/capsuleBuilder";
import { CreateGeodesic } from "./Builders/geodesicBuilder";
import { CreateGoldberg } from "./Builders/goldbergBuilder";

/**
 * Class containing static functions to help procedurally build meshes
 */
export const MeshBuilder = {
    CreateBox,
    CreateTiledBox,
    CreateSphere,
    CreateDisc,
    CreateIcoSphere,
    CreateRibbon,
    CreateCylinder,
    CreateTorus,
    CreateTorusKnot,
    CreateLineSystem,
    CreateLines,
    CreateDashedLines,
    ExtrudeShape,
    ExtrudeShapeCustom,
    CreateLathe,
    CreateTiledPlane,
    CreatePlane,
    CreateGround,
    CreateTiledGround,
    CreateGroundFromHeightMap,
    CreatePolygon,
    ExtrudePolygon,
    CreateTube,
    CreatePolyhedron,
    CreateGeodesic,
    CreateGoldberg,
    CreateDecal,
    CreateCapsule
};
