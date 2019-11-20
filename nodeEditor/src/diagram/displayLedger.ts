import { InputDisplayManager } from './previews/inputDisplayManager';
import { OutputDisplayManager } from './previews/outputDisplayManager';

export class DisplayLedger {
    public static RegisteredControls: {[key: string] : any} = {};
}

DisplayLedger.RegisteredControls["InputBlock"] = InputDisplayManager;
DisplayLedger.RegisteredControls["VertexOutputBlock"] = OutputDisplayManager;
DisplayLedger.RegisteredControls["FragmentOutputBlock"] = OutputDisplayManager;
