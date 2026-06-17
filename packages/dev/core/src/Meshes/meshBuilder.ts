/* eslint-disable @typescript-eslint/naming-convention */
import { CreateRibbon } from "./Builders/ribbonBuilder.pure";
import { CreateDisc } from "./Builders/discBuilder.pure";
import { CreateBox } from "./Builders/boxBuilder.pure";
import { CreateTiledBox } from "./Builders/tiledBoxBuilder";
import { CreateSphere } from "./Builders/sphereBuilder.pure";
import { CreateCylinder } from "./Builders/cylinderBuilder.pure";
import { CreateTorus } from "./Builders/torusBuilder.pure";
import { CreateTorusKnot } from "./Builders/torusKnotBuilder.pure";
import { CreateDashedLines, CreateLineSystem, CreateLines } from "./Builders/linesBuilder.pure";
import { CreatePolygon, ExtrudePolygon } from "./Builders/polygonBuilder.pure";
import { ExtrudeShape, ExtrudeShapeCustom } from "./Builders/shapeBuilder.pure";
import { CreateLathe } from "./Builders/latheBuilder.pure";
import { CreatePlane } from "./Builders/planeBuilder.pure";
import { CreateTiledPlane } from "./Builders/tiledPlaneBuilder";
import { CreateGround, CreateGroundFromHeightMap, CreateTiledGround } from "./Builders/groundBuilder.pure";
import { CreateTube } from "./Builders/tubeBuilder.pure";
import { CreatePolyhedron } from "./Builders/polyhedronBuilder.pure";
import { CreateIcoSphere } from "./Builders/icoSphereBuilder.pure";
import { CreateDecal } from "./Builders/decalBuilder.pure";
import { CreateCapsule } from "./Builders/capsuleBuilder.pure";
import { CreateGeodesic } from "./Builders/geodesicBuilder";
import { CreateGoldberg } from "./Builders/goldbergBuilder";
import { CreateText } from "./Builders/textBuilder";

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
    CreateCapsule,
    CreateText,
};
