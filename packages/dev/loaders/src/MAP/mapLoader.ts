import type { Light } from "core/Lights/light";
import { PointLight } from "core/Lights/pointLight";
import type { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Texture } from "core/Materials/Textures/texture";
import { Angle } from "core/Maths/math";
import { Color3 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { SubMesh } from "core/Meshes/subMesh";
import { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";
import type { MapLoadingOptions } from "./mapLoadingOptions";
import { MapMathUtils } from "./mapMathUtils";
import type { IBrush, IEntity } from "./mapParser";
import { MapParser } from "./mapParser";
import { Logger } from "core/Misc/logger";

/**
 * Interface for a map of texture names to materials
 */
export interface IMaterialMap {
    [textureName: string]: Material;
}

/**
 * Interface for map loading result
 */
export interface IMapLoadResult {
    rootNode: TransformNode;
    entities: IEntity[];
    meshes: Mesh[];
    lights: Light[];
}

export class MapLoader {
    private static readonly _EPSILON = 1e-5;
    private static readonly _DEFAULT_LIGHT_INTENSITY: number = 200;

    /**
     * Loads a MAP file from the specified URL and creates meshes in the scene
     * @param mapData - The .map file content to load
     * @param scene - The Babylon.js scene to add the meshes to
     * @param loadingOptions - Optional options for the map loader
     * @returns Promise that resolves with the map load result containing meshes and entities
     */
    public static LoadMap(mapData: string, scene: Scene, loadingOptions?: MapLoadingOptions): IMapLoadResult {
        // Create a root node if not provided
        const mapRoot = new TransformNode("map", scene);

        const entities = MapParser.ParseMapData(mapData, loadingOptions);
        return this._CreateMeshes(entities, scene, mapRoot, loadingOptions?.materials);
    }

    /**
     * Creates Babylon.js meshes from the parsed entities
     * @param entities - The parsed entities from the MAP file
     * @param scene - The Babylon.js scene to add the meshes to
     * @param rootNode - The root node to parent the meshes to
     * @param loadingOptions - Optional options for the map loader
     * @returns Object containing created meshes and entity nodes
     */
    private static _CreateMeshes(entities: IEntity[], scene: Scene, rootNode: TransformNode, loadingOptions?: MapLoadingOptions): IMapLoadResult {
        const meshes: Mesh[] = [];
        const lights: Light[] = [];
        const entityNodes: TransformNode[] = [];
        const materials = loadingOptions?.materials;

        // Create a standard gray material for all brushes (default)
        const defaultMaterial = new StandardMaterial("mapDefaultMaterial", scene);
        defaultMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);

        // Track missing textures to avoid duplicate warnings
        const missingTextures = new Set<string>();

        // Create a multi-material for texture per face
        const multiMaterial = new MultiMaterial("mapMultiMaterial", scene);
        multiMaterial.subMaterials.push(defaultMaterial);

        // Material index map to track subMaterials
        const materialIndexMap = new Map<string, number>();
        materialIndexMap.set("default", 0);

        // Process each entity
        for (let e = 0; e < entities.length; e++) {
            const entity = entities[e];
            const entityName = entity.properties.get("classname") || `entity_${e}`;

            // Create an entity node to group brushes
            const entityNode = new TransformNode(entityName, scene);
            entityNode.parent = rootNode;

            // Store entity properties as metadata
            for (const [key, value] of entity.properties.entries()) {
                entityNode.metadata = entityNode.metadata || {};
                entityNode.metadata[key] = value;
            }

            // Add to the list of entity nodes
            entityNodes.push(entityNode);

            // Handle entity position (origin)
            if (entity.properties.has("origin")) {
                const originParts = entity.properties.get("origin")?.split(" ").map(Number);
                if (originParts && originParts.length === 3) {
                    // Convert from Quake (right-handed, Z-up) to Babylon.js (right-handed, Y-up)
                    // Quake (x,y,z) -> Babylon (x,z,y)
                    entityNode.position = new Vector3(
                        originParts[0],
                        originParts[2], // Z in Quake is Y in Babylon
                        originParts[1] // Y in Quake is Z in Babylon
                    );
                }
            } else if (loadingOptions?.loadLights && entity.properties.has("light")) {
                const originParts = entity.properties.get("origin")?.split(" ").map(Number);
                const position = new Vector3();
                if (originParts && originParts.length === 3) {
                    // Convert from Quake (right-handed, Z-up) to Babylon.js (right-handed, Y-up)
                    // Quake (x,y,z) -> Babylon (x,z,y)
                    position.set(
                        originParts[0],
                        originParts[2], // Z in Quake is Y in Babylon
                        originParts[1] // Y in Quake is Z in Babylon
                    );
                }

                const intensity: number = Number(entity.properties.get("light")) || MapLoader._DEFAULT_LIGHT_INTENSITY;

                const light = new PointLight("light", position, scene);
                light.intensity = intensity / MapLoader._DEFAULT_LIGHT_INTENSITY;
                lights.push(light);
            }

            // Process each brush in the entity
            for (let b = 0; b < entity.brushes.length; b++) {
                const brush = entity.brushes[b];

                // Convert brush planes to plane equations
                const planeEquations = MapMathUtils.ConvertBrushPlanesToEquations(brush.planes);

                if (planeEquations.length < 4) {
                    Logger.Warn(`Brush ${entityName}_brush_${b} has fewer than 4 valid planes, skipping`);
                    continue;
                }

                // Create a brush mesh with per-face materials
                const brushMesh = this._CreateBrushMesh(`${entityName}_brush_${b}`, brush, scene, multiMaterial, materialIndexMap, materials, missingTextures);

                if (brushMesh) {
                    brushMesh.parent = entityNode;
                    meshes.push(brushMesh);
                }
            }
        }

        // Log summary of missing textures
        if (missingTextures.size > 0) {
            Logger.Warn(`Missing materials for ${missingTextures.size} textures in the map`);
        }

        return { rootNode, entities, meshes, lights };
    }

    /**
     * Creates a mesh from a brush using its plane definitions
     * @param name - The name of the brush
     * @param brush - The brush to create a mesh from
     * @param scene - The Babylon.js scene to add the mesh to
     * @param multiMaterial - The multi-material to use for the mesh
     * @param materialIndexMap - The map of material indices to sub-materials
     * @param materials - Optional map of texture names to materials
     * @param missingTextures - Optional set of missing textures
     * @returns The created mesh or null if the brush has fewer than 4 planes
     */
    private static _CreateBrushMesh(
        name: string,
        brush: IBrush,
        scene: Scene,
        multiMaterial: MultiMaterial,
        materialIndexMap: Map<string, number>,
        materials?: IMaterialMap,
        missingTextures?: Set<string>
    ): Mesh | null {
        if (brush.planes.length < 4) {
            Logger.Warn(`Brush ${name} has fewer than 4 planes, skipping`);
            return null;
        }

        try {
            // Convert brush planes to plane equations with texture information
            const planeEquations = MapMathUtils.ConvertBrushPlanesToEquations(brush.planes);

            if (planeEquations.length < 4) {
                Logger.Warn(`Brush ${name} has fewer than 4 valid planes after filtering, skipping`);
                return null;
            }

            // Find vertices at plane intersections
            const vertices = MapMathUtils.FindBrushVertices(planeEquations);

            if (vertices.length === 0) {
                Logger.Warn(`Brush ${name} has no valid vertices, creating fallback mesh`);
                return this._CreateFallbackMesh(name, brush, scene);
            }

            // Create faces for each plane with texture information
            const { positions, indices, uvs, materialIndices } = this._CreateBrushFaces(vertices, planeEquations, multiMaterial, materialIndexMap, materials, missingTextures);

            if (positions.length === 0 || indices.length === 0) {
                Logger.Warn(`Brush ${name} failed to generate valid geometry, creating fallback mesh`);
                return this._CreateFallbackMesh(name, brush, scene);
            }

            // Create a mesh with the calculated geometry
            const customMesh = new Mesh(name, scene);
            const vertexData = new VertexData();

            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.uvs = uvs;

            try {
                // Calculate normals automatically
                VertexData.ComputeNormals(positions, indices, (vertexData.normals = []));

                vertexData.applyToMesh(customMesh);
                customMesh.material = multiMaterial;

                // Assign submaterial indices
                if (materialIndices.length > 0) {
                    customMesh.subMeshes = [];

                    // Track how many triangles each face has
                    let startIndex = 0;
                    for (let i = 0; i < materialIndices.length; i++) {
                        // Calculate the number of triangles for this face
                        const trianglesInFace = positions.length / 9; // Each triangle has 3 vertices with 3 coords each
                        const indexCount = trianglesInFace * 3;

                        if (indexCount > 0) {
                            new SubMesh(
                                materialIndices[i],
                                0,
                                positions.length / 3, // Total vertices
                                startIndex,
                                indexCount,
                                customMesh
                            );

                            startIndex += indexCount;
                        }
                    }
                }

                return customMesh;
            } catch (e) {
                Logger.Error(`Error finalizing mesh ${name}:`, e);
                return this._CreateFallbackMesh(name, brush, scene);
            }
        } catch (error) {
            Logger.Error(`Error creating brush mesh ${name}:`, error);
            return this._CreateFallbackMesh(name, brush, scene);
        }
    }

    /**
     * Creates faces for a brush using its vertices and plane equations
     * @param vertices - The vertices of the brush
     * @param planeEquations - The plane equations of the brush
     * @param multiMaterial - The multi-material to use for the mesh
     * @param materialIndexMap - The map of material indices to sub-materials
     * @param materials - Optional map of texture names to materials
     * @param missingTextures - Optional set of missing textures
     * @returns The created faces with positions, indices, uvs, and material indices
     */
    private static _CreateBrushFaces(
        vertices: Vector3[],
        planeEquations: {
            normal: Vector3;
            distance: number;
            textureName: string;
            xOffset: number;
            yOffset: number;
            rotation: number;
            xScale: number;
            yScale: number;
        }[],
        multiMaterial: MultiMaterial,
        materialIndexMap: Map<string, number>,
        materials?: IMaterialMap,
        missingTextures?: Set<string>
    ): { positions: number[]; indices: number[]; uvs: number[]; materialIndices: number[] } {
        const positions: number[] = [];
        const indices: number[] = [];
        const uvs: number[] = [];
        const materialIndices: number[] = [];
        let vertexIndex = 0;

        // For each plane, find the vertices that lie on it
        for (const plane of planeEquations) {
            const planeVertices: Vector3[] = [];

            // Find vertices that lie on this plane
            for (const vertex of vertices) {
                const distance = Math.abs(Vector3.Dot(plane.normal, vertex) + plane.distance);
                if (distance < MapLoader._EPSILON) {
                    planeVertices.push(vertex);
                }
            }

            if (planeVertices.length < 3) {
                Logger.Warn(`Skipping plane with normal ${plane.normal.toString()} - only found ${planeVertices.length} vertices`);
                continue;
            }

            // Sort vertices in clockwise order
            MapMathUtils.SortVerticesForFace(planeVertices, plane.normal);

            // Get material index
            let materialIndex = 0;
            if (plane.textureName && plane.textureName !== "") {
                const textureName = plane.textureName;
                if (!materialIndexMap.has(textureName)) {
                    let material = materials?.[textureName];
                    if (!material) {
                        if (missingTextures && !missingTextures.has(textureName)) {
                            Logger.Warn(`Material not found for texture: ${textureName}`);
                            missingTextures.add(textureName);
                        }
                        material = this._CreateDefaultMaterial(textureName, multiMaterial.getScene());
                    }
                    multiMaterial.subMaterials.push(material);
                    materialIndexMap.set(textureName, multiMaterial.subMaterials.length - 1);
                }
                materialIndex = materialIndexMap.get(textureName) || 0;
            }
            materialIndices.push(materialIndex);

            // Triangulate using ear clipping
            const triangleIndices = MapMathUtils.TriangulatePolygon(planeVertices, plane.normal);

            if (triangleIndices.length === 0) {
                Logger.Warn(`Failed to triangulate plane with normal ${plane.normal.toString()}`);
                continue;
            }

            // Add vertices and indices for all triangles
            for (let i = 0; i < triangleIndices.length; i += 3) {
                const v0 = planeVertices[triangleIndices[i]];
                const v1 = planeVertices[triangleIndices[i + 1]];
                const v2 = planeVertices[triangleIndices[i + 2]];

                // Add positions
                positions.push(v0.x, v0.y, v0.z);
                positions.push(v1.x, v1.y, v1.z);
                positions.push(v2.x, v2.y, v2.z);

                // Add indices
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                vertexIndex += 3;

                // Calculate UVs for actual vertices only
                // Get the actual material and texture to find dimensions
                const subMaterial = multiMaterial.subMaterials[materialIndex];
                let texWidth = 32; // Default if no texture
                let texHeight = 32;
                if (subMaterial && subMaterial.getActiveTextures().length > 0) {
                    // Prefer diffuseTexture, but check others if needed
                    const texture = (subMaterial as StandardMaterial).diffuseTexture || (subMaterial.getActiveTextures()[0] as Texture);
                    if (texture) {
                        const texSize = texture.getSize();
                        if (texSize && texSize.width > 0 && texSize.height > 0) {
                            texWidth = texSize.width;
                            texHeight = texSize.height;
                        }
                    }
                }

                // Get raw UV dot products
                const uvDot0 = this._CalculateUVForPoint(v0, plane);
                const uvDot1 = this._CalculateUVForPoint(v1, plane);
                const uvDot2 = this._CalculateUVForPoint(v2, plane);

                // Apply scale and offset to get Quake texel coordinates
                const scaleX = plane.xScale || 1;
                const scaleY = plane.yScale || 1;

                // Check for invalid scales to prevent division by zero or extreme values
                const safeScaleX = Math.abs(scaleX) < MapLoader._EPSILON ? 1.0 : scaleX;
                const safeScaleY = Math.abs(scaleY) < MapLoader._EPSILON ? 1.0 : scaleY;
                if (safeScaleX !== scaleX || safeScaleY !== scaleY) {
                    Logger.Warn(`Invalid texture scale encountered for texture ${plane.textureName}: scaleX=${scaleX}, scaleY=${scaleY}. Using safe scale.`);
                }

                const uTexel0 = uvDot0.x / safeScaleX + plane.xOffset;
                const vTexel0 = uvDot0.y / safeScaleY + plane.yOffset;
                const uTexel1 = uvDot1.x / safeScaleX + plane.xOffset;
                const vTexel1 = uvDot1.y / safeScaleY + plane.yOffset;
                const uTexel2 = uvDot2.x / safeScaleX + plane.xOffset;
                const vTexel2 = uvDot2.y / safeScaleY + plane.yOffset;

                // Convert texels to final 0-1 UVs using texture dimensions and flip V
                const finalU0 = uTexel0 / texWidth;
                const finalV0 = 1.0 - vTexel0 / texHeight;
                const finalU1 = uTexel1 / texWidth;
                const finalV1 = 1.0 - vTexel1 / texHeight;
                const finalU2 = uTexel2 / texWidth;
                const finalV2 = 1.0 - vTexel2 / texHeight;

                uvs.push(finalU0, finalV0, finalU1, finalV1, finalU2, finalV2);
            }
        }

        return { positions, indices, uvs, materialIndices };
    }

    /**
     * Creates a default (fallback) material for faces without a texture
     * @param name - The name of the material
     * @param scene - The Babylon.js scene to add the material to
     * @returns The created material
     */
    private static _CreateDefaultMaterial(name: string, scene: Scene): StandardMaterial {
        const material = new StandardMaterial(`texture_${name}`, scene);
        material.diffuseColor = new Color3(0.6, 0.6, 0.6);
        return material;
    }

    /**
     * Calculates UV coordinates for a point on a textured plane
     * @param point - The point to calculate the UV for
     * @param plane - The plane to calculate the UV for
     * @returns The calculated UV coordinates as a Vector2
     */
    private static _CalculateUVForPoint(
        point: Vector3,
        plane: {
            normal: Vector3;
            textureName: string;
            xOffset: number;
            yOffset: number;
            rotation: number;
            xScale: number;
            yScale: number;
        }
    ): Vector2 {
        let uAxis: Vector3;
        let vAxis: Vector3;

        // Quake base axes transformed to Babylon.js coordinate system (Y-up)
        // Original Quake baseaxis: {normal, u, v} repeated 6 times
        // Transformed to Babylon.js: Quake(x,y,z) -> BJS(x,z,y); Normal(A,B,C) -> BJS(A,C,B)
        const baseNormalsBJS = [
            new Vector3(0, 1, 0), // Floor (Quake Z+)
            new Vector3(0, -1, 0), // Ceiling (Quake Z-)
            new Vector3(1, 0, 0), // West Wall (Quake X+)
            new Vector3(-1, 0, 0), // East Wall (Quake X-)
            new Vector3(0, 0, 1), // South Wall (Quake Y+)
            new Vector3(0, 0, -1), // North Wall (Quake Y-)
        ];
        const baseUAxesBJS = [
            new Vector3(1, 0, 0), // Floor
            new Vector3(1, 0, 0), // Ceiling
            new Vector3(0, 0, 1), // West Wall (Quake U(0,1,0) -> BJS(0,0,1))
            new Vector3(0, 0, 1), // East Wall (Quake U(0,1,0) -> BJS(0,0,1))
            new Vector3(1, 0, 0), // South Wall (Quake U(1,0,0) -> BJS(1,0,0))
            new Vector3(1, 0, 0), // North Wall (Quake U(1,0,0) -> BJS(1,0,0))
        ];
        const baseVAxesBJS = [
            new Vector3(0, 0, -1), // Floor (Quake V(0,-1,0) -> BJS(0,0,-1))
            new Vector3(0, 0, -1), // Ceiling (Quake V(0,-1,0) -> BJS(0,0,-1))
            new Vector3(0, -1, 0), // West Wall (Quake V(0,0,-1) -> BJS(0,-1,0))
            new Vector3(0, -1, 0), // East Wall (Quake V(0,0,-1) -> BJS(0,-1,0))
            new Vector3(0, -1, 0), // South Wall (Quake V(0,0,-1) -> BJS(0,-1,0))
            new Vector3(0, -1, 0), // North Wall (Quake V(0,0,-1) -> BJS(0,-1,0))
        ];

        // Find the best matching base axis based on the plane's normal
        let bestAxisIndex = 0;
        let maxDot = -Infinity;

        for (let i = 0; i < 6; i++) {
            const dot = Vector3.Dot(plane.normal, baseNormalsBJS[i]);
            if (dot > maxDot) {
                maxDot = dot;
                bestAxisIndex = i;
            }
        }

        // Assign the corresponding transformed U and V axes
        uAxis = baseUAxesBJS[bestAxisIndex].clone(); // Use clone to avoid modifying constants
        vAxis = baseVAxesBJS[bestAxisIndex].clone();

        // Original logic for rotation, scaling, and offset calculation (should be correct now with proper base axes)
        // 2. Apply rotation (fixed matrix rotation)
        if (plane.rotation !== 0) {
            const angleRad = Angle.FromDegrees(plane.rotation).radians();
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            const newUAxis = uAxis.scale(cos).add(vAxis.scale(sin));
            const newVAxis = uAxis.scale(-sin).add(vAxis.scale(cos));

            uAxis = newUAxis;
            vAxis = newVAxis;
        }

        // 4. Calculate U and V dot products using rotated axes
        const uDot = Vector3.Dot(point, uAxis);
        const vDot = Vector3.Dot(point, vAxis);

        // 5. Return raw dot products. Scale and offset will be applied by the caller.
        return new Vector2(uDot, vDot);
    }

    /**
     * Creates a simple fallback mesh for visualization when brush creation fails
     * @param name - The name of the fallback mesh
     * @param brush - The brush to create a fallback mesh for
     * @param scene - The Babylon.js scene to add the fallback mesh to
     * @returns The created fallback mesh
     */
    private static _CreateFallbackMesh(name: string, brush: IBrush, scene: Scene): Mesh {
        // Find the center point of all the planes
        const center = new Vector3(0, 0, 0);
        let count = 0;

        for (const plane of brush.planes) {
            // Convert to Babylon.js coordinate system (x,z,y)
            const p1 = new Vector3(plane.points[0].x, plane.points[0].z, plane.points[0].y);
            center.addInPlace(p1);
            count++;
        }

        if (count > 0) {
            center.scaleInPlace(1 / count);
        }

        // Create a small box at the center point
        const fallbackMesh = MeshBuilder.CreateBox(`${name}_fallback`, { size: 16 }, scene);

        fallbackMesh.position = center;

        // Create a new material with a different color to indicate it's a fallback
        const fallbackMaterial = new StandardMaterial(`${name}_fallback_material`, scene);
        fallbackMaterial.diffuseColor = new Color3(1, 0, 0); // Red for visibility
        fallbackMesh.material = fallbackMaterial;

        return fallbackMesh;
    }
}
