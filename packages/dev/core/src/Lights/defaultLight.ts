import { Light } from "./light";
import { LightConstants } from "./lightConstants";

export class DefaultLight extends Light {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override getTypeID(): number {
        return LightConstants.LIGHTTYPEID_NONE;
    }

    public prepareLightSpecificDefines(): void {}

    public transferToEffect(): Light {
        return this;
    }

    public override transferToNodeMaterialEffect(): Light {
        return this;
    }
}
