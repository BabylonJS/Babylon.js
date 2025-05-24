import { MapLoadingOptions } from "./mapLoadingOptions";

/**
 * Interface for a brush vertex in MAP format
 */
export interface BrushVertex {
    x: number;
    y: number;
    z: number;
}

/**
 * Interface for a brush plane in MAP format
 */
export interface BrushPlane {
    points: [BrushVertex, BrushVertex, BrushVertex];
    textureName: string;
    xOffset: number;
    yOffset: number;
    rotation: number;
    xScale: number;
    yScale: number;
}

/**
 * Interface for a brush in MAP format
 */
export interface Brush {
    planes: BrushPlane[];
}

/**
 * Interface for an entity in MAP format
 */
export interface Entity {
    properties: Map<string, string>;
    brushes: Brush[];
}

export class MapParser {
    /**
     * Parses the MAP file data into entities
     * @param mapData - The contents of the MAP file
     * @returns Array of parsed entities
     */
    public static parseMapData(mapData: string, loadingOptions?: MapLoadingOptions): Entity[] {
        const entities: Entity[] = [];
        let currentEntity: Entity | null = null;
        let currentBrush: Brush | null = null;

        // Remove comments (// style)
        const sanitizedData = mapData.replace(/\/\/.*$/gm, "");

        // Split into lines and process
        const lines = sanitizedData.split("\n");

        let lineNumber = 0;
        for (let i = 0; i < lines.length; i++) {
            lineNumber = i + 1; // 1-based line numbers for error reporting
            const line = lines[i].trim();

            // Skip empty lines
            if (line === "") continue;

            try {
                // Start of an entity
                if (line === "{") {
                    if (currentEntity === null) {
                        currentEntity = {
                            properties: new Map<string, string>(),
                            brushes: [],
                        };
                    } else if (currentBrush === null) {
                        // Start of a brush within an entity
                        currentBrush = {
                            planes: [],
                        };
                    }
                }
                // End of a brush or entity
                else if (line === "}") {
                    if (currentBrush !== null) {
                        // End of a brush
                        if (currentBrush.planes.length > 0) {
                            currentEntity?.brushes.push(currentBrush);
                        }
                        currentBrush = null;
                    } else if (currentEntity !== null) {
                        // End of an entity
                        // Skip triggers if not loading triggers
                        if (!loadingOptions?.loadTriggers && currentEntity.properties.get("classname")?.toLocaleLowerCase()?.startsWith("trigger_")) {
                            continue;
                        }
                        entities.push(currentEntity);
                        currentEntity = null;
                    }
                }
                // Entity property
                else if (line.startsWith('"') && currentBrush === null && currentEntity !== null) {
                    // Extract property key and value
                    const match = line.match(/"([^"]+)"\s+"([^"]+)"/);
                    if (match) {
                        const key = match[1];
                        const value = match[2];
                        currentEntity.properties.set(key, value);
                    } else {
                        console.warn(`Invalid entity property format at line ${lineNumber}: ${line}`);
                    }
                }
                // Brush plane
                else if (currentBrush !== null && line.startsWith("(")) {
                    // Parse brush plane line like:
                    // ( 128 0 0 ) ( 128 1 0 ) ( 128 0 1 ) GROUND1_6 0 0 0 1.0 1.0
                    // TODO: parse valve 220 map format
                    const planePattern =
                        /\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)\s*(\S+)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/;

                    const match = line.match(planePattern);
                    if (match) {
                        const plane: BrushPlane = {
                            points: [
                                { x: parseFloat(match[1]), y: parseFloat(match[2]), z: parseFloat(match[3]) },
                                { x: parseFloat(match[4]), y: parseFloat(match[5]), z: parseFloat(match[6]) },
                                { x: parseFloat(match[7]), y: parseFloat(match[8]), z: parseFloat(match[9]) },
                            ],
                            textureName: match[10],
                            xOffset: parseFloat(match[11]),
                            yOffset: parseFloat(match[12]),
                            rotation: parseFloat(match[13]),
                            xScale: parseFloat(match[14]),
                            yScale: parseFloat(match[15]),
                        };

                        if (!loadingOptions?.loadClips && "CLIP" === plane.textureName) {
                            continue;
                        }

                        currentBrush.planes.push(plane);
                    } else {
                        console.warn(`Invalid brush plane format at line ${lineNumber}: ${line}`);
                    }
                } else if (line !== "{" && line !== "}" && !line.startsWith('"') && !line.startsWith("(")) {
                    console.warn(`Unrecognized line format at line ${lineNumber}: ${line}`);
                }
            } catch (e) {
                console.error(`Error parsing line ${lineNumber}: ${line}`, e);
            }
        }

        // Log some information about the entities
        let entityInfo = "Entities:";
        for (const entity of entities) {
            const classname = entity.properties.get("classname") || "unknown";
            entityInfo += `\n- ${classname} with ${entity.brushes.length} brushes`;

            if (entity.properties.has("origin")) {
                entityInfo += `, origin: ${entity.properties.get("origin")}`;
            }
        }

        return entities;
    }
}
