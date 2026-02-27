import type { I3mfModel } from "./3mf.interfaces";

export const OpenXmlContentTypesNamespace = "http://schemas.openxmlformats.org/package/2006/content-types";
export const OpenXmlRelationshipsNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";

export enum KnownI3mfContentType {
    // OPC core
    Relationships = "application/vnd.openxmlformats-package.relationships+xml",

    // 3MF core
    Model = "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",

    // Extensions officielles
    Materials = "application/vnd.ms-package.3dmanufacturing-material+xml",
    Colors = "application/vnd.ms-package.3dmanufacturing-colors+xml",
    Texture = "application/vnd.ms-package.3dmanufacturing-texture+xml",
    Texture2D = "application/vnd.ms-package.3dmanufacturing-texture2d+xml",
    Production = "application/vnd.ms-package.3dmanufacturing-production+xml",
    Slice = "application/vnd.ms-package.3dmanufacturing-slice+xml",
    BeamLattice = "application/vnd.ms-package.3dmanufacturing-beamlattice+xml",
    SecureContent = "application/vnd.ms-package.3dmanufacturing-securecontent+xml",

    // Assets
    Png = "image/png",
    Jpeg = "image/jpeg",
    Tiff = "image/tiff",
    Xml = "application/xml",
}

export const RelationshipDirName = "_rels/";
export const Object3dDirName = "3D/";
export const ModelFileName = `3dmodel.model`;
export const RelationshipFileName = `.rels`;
export const ContentTypeFileName = "[Content_Types].xml";

/**
 * Common OPC and 3MF relationship Type URIs.
 */
export class Known3mfRelationshipTypes {
    /**
     * 3MF core: points to the main .model part of the package
     */
    public static readonly ThreeDimModel = "http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel";

    /**
     * OPC core: points to a package thumbnail (often used by 3MF packages)
     */
    public static readonly Thumbnail = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail";

    /**
     * 3MF (print ticket): optional printing settings part (rarely used by slicers)
     */
    public static readonly PrintTicket = "http://schemas.microsoft.com/3dmanufacturing/2013/01/printticket";

    /**
     * OPC core: indicates parts that must be preserved when editing the package
     */
    public static readonly MustPreserve = "http://schemas.openxmlformats.org/package/2006/relationships/mustpreserve";

    /**
     * Convenience set for quick checks
     */
    public static readonly Known: ReadonlySet<string> = new Set<string>([
        Known3mfRelationshipTypes.ThreeDimModel,
        Known3mfRelationshipTypes.Thumbnail,
        Known3mfRelationshipTypes.PrintTicket,
        Known3mfRelationshipTypes.MustPreserve,
    ]);

    /**
     * Test if the relationship Type is one of the common known URIs above
     * @param type
     * @returns true if the relationship Type is one of the common known URIs above
     */
    public static IsKnown(type: string): boolean {
        return Known3mfRelationshipTypes.Known.has(type);
    }

    /**
     * test if the relationship Type is the main 3MF model entry point
     * @param type
     * @returns  true if the relationship Type is the main 3MF model entry point
     */
    public static IsThreeDimModel(type: string): boolean {
        return type === Known3mfRelationshipTypes.ThreeDimModel;
    }
}

/**
 *
 */
export interface I3mfContentTypes {
    /**
     *
     */
    items: I3mfContentType[];
}

/**
 *
 */
export interface I3mfContentType {
    /**
     *
     */
    ext: string;
    /**
     *
     */
    ct: string;
}

/**
 *
 */
export interface I3mfRelationships {
    /**
     *
     */
    items: I3mfRelationship[];
}

/**
 *
 */
export interface I3mfRelationship {
    /**
     *
     */
    id: string;

    /**
     *
     */
    type?: string;

    /**
     *
     */
    target?: string;
}

/**
 *
 */
export interface I3mfDocument {
    /**
     *
     */
    contentTypes: I3mfContentTypes;
    /**
     *
     */
    relationships: I3mfRelationships;
    /**
     *
     */
    model: I3mfModel;
}
