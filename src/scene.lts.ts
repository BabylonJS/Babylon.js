
import { Camera } from "./Cameras/camera";
import { Nullable } from "./types";
import { Material } from "./Materials/material";
import { BaseTexture } from "./Materials/Textures/baseTexture";
import { Bone } from "./Bones/bone";
import { Light } from "./Lights/light";
import { AbstractMesh } from "./Meshes/abstractMesh";
import { TransformNode } from "./Meshes/transformNode";
import { Node } from "./node";
import { Skeleton } from "./Bones/skeleton";
import { IParticleSystem } from "./Particles/IParticleSystem";
import { Geometry } from "./Meshes/geometry";
import { Scene } from "./scene";

declare module './scene' {
    interface Scene {
        /**
         * sets the active camera of the scene using its Id
         * @param id defines the camera's Id
         * @return the new active camera or null if none found.
         * @deprecated Please use setActiveCameraById instead
         */
        setActiveCameraByID(id: string): Nullable<Camera>;
        /**
         * get a material using its id
         * @param id defines the material's Id
         * @return the material or null if none found.
         * @deprecated Please use getMaterialById instead
         */
        getMaterialByID(id: string): Nullable<Material>;
        /**
         * Gets a the last added material using a given id
         * @param id defines the material's Id
         * @return the last material with the given id or null if none found.
         * @deprecated Please use getLastMaterialById instead
         */
        getLastMaterialByID(id: string): Nullable<Material>;

        /**
         * Get a texture using its unique id
         * @param uniqueId defines the texture's unique id
         * @return the texture or null if none found.
         * @deprecated Please use getTextureByUniqueId instead
         */
        getTextureByUniqueID(uniqueId: number): Nullable<BaseTexture>;
        /**
         * Gets a camera using its Id
         * @param id defines the Id to look for
         * @returns the camera or null if not found
         * @deprecated Please use getCameraById instead
         */
        getCameraByID(id: string): Nullable<Camera>;
        /**
         * Gets a camera using its unique Id
         * @param uniqueId defines the unique Id to look for
         * @returns the camera or null if not found
         * @deprecated Please use getCameraByUniqueId instead
         */
        getCameraByUniqueID(uniqueId: number): Nullable<Camera>;
        /**
         * Gets a bone using its Id
         * @param id defines the bone's Id
         * @return the bone or null if not found
         * @deprecated Please use getBoneById instead
         */
        getBoneByID(id: string): Nullable<Bone>;
        /**
        * Gets a light node using its Id
        * @param id defines the light's Id
        * @return the light or null if none found.
        * @deprecated Please use getLightById instead
        */
        getLightByID(id: string): Nullable<Light>;
        /**
        * Gets a light node using its scene-generated unique Id
        * @param uniqueId defines the light's unique Id
        * @return the light or null if none found.
        * @deprecated Please use getLightByUniqueId instead
        */
        getLightByUniqueID(uniqueId: number): Nullable<Light>;
        /**
         * Gets a particle system by Id
         * @param id defines the particle system Id
         * @return the corresponding system or null if none found
         * @deprecated Please use getParticleSystemById instead
         */
        getParticleSystemByID(id: string): Nullable<IParticleSystem>;
        /**
         * Gets a geometry using its Id
         * @param id defines the geometry's Id
         * @return the geometry or null if none found.
         * @deprecated Please use getGeometryById instead
         */
        getGeometryByID(id: string): Nullable<Geometry>;
        /**
         * Gets the first added mesh found of a given Id
         * @param id defines the Id to search for
         * @return the mesh found or null if not found at all
         * @deprecated Please use getMeshById instead
         */
        getMeshByID(id: string): Nullable<AbstractMesh>;
        /**
         * Gets a mesh with its auto-generated unique Id
         * @param uniqueId defines the unique Id to search for
         * @return the found mesh or null if not found at all.
         * @deprecated Please use getMeshByUniqueId instead
         */
        getMeshByUniqueID(uniqueId: number): Nullable<AbstractMesh>;
        /**
         * Gets a the last added mesh using a given Id
         * @param id defines the Id to search for
         * @return the found mesh or null if not found at all.
         * @deprecated Please use getLastMeshById instead
         */
        getLastMeshByID(id: string): Nullable<AbstractMesh>;
        /**
         * Gets a list of meshes using their Id
         * @param id defines the Id to search for
         * @returns a list of meshes
         * @deprecated Please use getMeshesById instead
         */
        getMeshesByID(id: string): Array<AbstractMesh>;
        /**
         * Gets the first added transform node found of a given Id
         * @param id defines the Id to search for
         * @return the found transform node or null if not found at all.
         * @deprecated Please use getTransformNodeById instead
         */
        getTransformNodeByID(id: string): Nullable<TransformNode>;
        /**
         * Gets a transform node with its auto-generated unique Id
         * @param uniqueId efines the unique Id to search for
         * @return the found transform node or null if not found at all.
         * @deprecated Please use getTransformNodeByUniqueId instead
         */
        getTransformNodeByUniqueID(uniqueId: number): Nullable<TransformNode>;
        /**
         * Gets a list of transform nodes using their Id
         * @param id defines the Id to search for
         * @returns a list of transform nodes
         * @deprecated Please use getTransformNodesById instead
         */
        getTransformNodesByID(id: string): Array<TransformNode>;
        /**
         * Gets a node (Mesh, Camera, Light) using a given Id
         * @param id defines the Id to search for
         * @return the found node or null if not found at all
         * @deprecated Please use getNodeById instead
         */
        getNodeByID(id: string): Nullable<Node>;
        /**
         * Gets a the last added node (Mesh, Camera, Light) using a given Id
         * @param id defines the Id to search for
         * @return the found node or null if not found at all
         * @deprecated Please use getLastEntryById instead
         */
        getLastEntryByID(id: string): Nullable<Node>;
        /**
         * Gets a skeleton using a given Id (if many are found, this function will pick the last one)
         * @param id defines the Id to search for
         * @return the found skeleton or null if not found at all.
         * @deprecated Please use getLastSkeletonById instead
         */
        getLastSkeletonByID(id: string): Nullable<Skeleton>;
    }
}

export const _injectLTS = () => {
    Scene.prototype.setActiveCameraByID = function (id: string): Nullable<Camera> {
        return this.setActiveCameraById(id);
    };

    Scene.prototype.getLastMaterialByID = function (id: string): Nullable<Material> {
        return this.getLastMaterialById(id);
    };

    Scene.prototype.getMaterialByID = function (id: string): Nullable<Material> {
        return this.getMaterialById(id);
    };

    Scene.prototype.getTextureByUniqueID = function (uniqueId: number): Nullable<BaseTexture> {
        return this.getTextureByUniqueId(uniqueId);
    };

    Scene.prototype.getCameraByID = function (id: string): Nullable<Camera> {
        return this.getCameraById(id);
    };

    Scene.prototype.getCameraByUniqueID = function (uniqueId: number): Nullable<Camera> {
        return this.getCameraByUniqueId(uniqueId);
    };

    Scene.prototype.getBoneByID = function (id: string): Nullable<Bone> {
        return this.getBoneById(id);
    };

    Scene.prototype.getLightByID = function (id: string): Nullable<Light> {
        return this.getLightById(id);
    };

    Scene.prototype.getLightByUniqueID = function (uniqueId: number): Nullable<Light> {
        return this.getLightByUniqueId(uniqueId);
    };

    Scene.prototype.getParticleSystemByID = function (id: string): Nullable<IParticleSystem> {
        return this.getParticleSystemById(id);
    };

    Scene.prototype.getGeometryByID = function (id: string): Nullable<Geometry> {
        return this.getGeometryById(id);
    };

    Scene.prototype.getMeshByID = function (id: string): Nullable<AbstractMesh> {
        return this.getMeshById(id);
    };

    Scene.prototype.getMeshesByID = function (id: string): Array<AbstractMesh> {
        return this.getMeshesById(id);
    };

    Scene.prototype.getTransformNodeByID = function (id: string): Nullable<TransformNode> {
        return this.getTransformNodeById(id);
    };

    Scene.prototype.getTransformNodeByUniqueID = function (uniqueId: number): Nullable<TransformNode> {
        return this.getTransformNodeByUniqueId(uniqueId);
    };

    Scene.prototype.getTransformNodesByID = function (id: string): Array<TransformNode> {
        return this.getTransformNodesById(id);
    };

    Scene.prototype.getMeshByUniqueID = function (uniqueId: number): Nullable<AbstractMesh> {
        return this.getMeshByUniqueId(uniqueId);
    };

    Scene.prototype.getLastMeshByID = function (id: string): Nullable<AbstractMesh> {
        return this.getLastMeshById(id);
    };

    Scene.prototype.getLastEntryByID = function (id: string): Nullable<Node> {
        return this.getLastEntryById(id);
    };

    Scene.prototype.getNodeByID = function (id: string): Nullable<Node> {
        return this.getNodeById(id);
    };

    Scene.prototype.getLastSkeletonByID = function (id: string): Nullable<Skeleton> {
        return this.getLastSkeletonById(id);
    };
};
