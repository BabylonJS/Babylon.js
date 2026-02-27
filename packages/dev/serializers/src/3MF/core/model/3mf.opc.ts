import { XmlAttr, XmlName } from "../xml/xml.interfaces";
import type { I3mfModel } from "./3mf.interfaces";
import { OpenXmlContentTypesNamespace, OpenXmlRelationshipsNamespace } from "./3mf.opc.interfaces";
import type { I3mfContentTypes, I3mfContentType, I3mfRelationships, I3mfRelationship, I3mfDocument } from "./3mf.opc.interfaces";

/**
 *
 */
@XmlName({ ns: OpenXmlContentTypesNamespace, name: "Types" })
export class ThreeMfContentTypes implements I3mfContentTypes {
    /**
     *
     */
    items: ThreeMfContentType[] = [];
}

/**
 *
 */
@XmlName({ ns: OpenXmlContentTypesNamespace, name: "Default" })
export class ThreeMfContentType implements I3mfContentType {
    /**
     *
     */
    @XmlAttr({ name: { ns: OpenXmlContentTypesNamespace, name: "Extension" } })
    ext: string;
    /**
     *
     */
    @XmlAttr({ name: { ns: OpenXmlContentTypesNamespace, name: "ContentType" } })
    ct: string;

    /**
     *
     * @param ext
     * @param ct
     */
    public constructor(ext: string, ct: string) {
        this.ext = ext;
        this.ct = ct;
    }
}

/**
 *
 */
@XmlName({ ns: OpenXmlRelationshipsNamespace, name: "Relationships" })
export class ThreeMfRelationships implements I3mfRelationships {
    /**
     *
     */
    items: ThreeMfRelationship[] = [];
}

/**
 *
 */
@XmlName({ ns: OpenXmlRelationshipsNamespace, name: "Relationship" })
export class ThreeMfRelationship implements I3mfRelationship {
    /**
     *
     */
    @XmlAttr({ name: "Id" })
    id: string;

    /**
     *
     */
    @XmlAttr({ name: "Type" })
    type?: string;

    /**
     *
     */
    @XmlAttr({ name: "Target" })
    target?: string;

    constructor(id: string, type: string, target: string) {
        this.id = id;
        this.type = type;
        this.target = target;
    }
}

/**
 *
 */
export class ThreeMfDocument implements I3mfDocument {
    public constructor(
        public contentTypes: I3mfContentTypes,
        public relationships: I3mfRelationships,
        public model: I3mfModel
    ) {}
}
