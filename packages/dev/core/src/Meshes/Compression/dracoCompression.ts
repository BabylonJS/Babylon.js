import type { Nullable } from "../../types";
import { DracoDecoder } from "./draco/dracoCompression.decoder";
import type { IDracoCompressionEngineConfiguration} from "./Draco/dracoCommons";
import { DracoCompressionBase } from "./Draco/dracoCommons";



/**
 * @deprecated use DracoDecoder
 */
export class DracoCompression extends DracoDecoder {
    public static get Configuration(): IDracoCompressionEngineConfiguration {
        return DracoDecoder.Configuration;
    }

    public static set Configuration(value: IDracoCompressionEngineConfiguration) {
        DracoDecoder.Configuration = value;
    }

    private static _Default0: Nullable<DracoDecoder> = null;

    /**
     * Default instance for the draco compression object.
     */
    public static get Default(): DracoCompression {
        if (!DracoCompression._Default0) {
            DracoCompression._Default0 = new DracoCompression();
        }

        return DracoCompression._Default0;
    }

    constructor(numWorkers = DracoCompressionBase.DefaultNumWorkers) {
        super(numWorkers);
    }
}
