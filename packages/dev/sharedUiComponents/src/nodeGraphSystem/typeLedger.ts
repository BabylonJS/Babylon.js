import { IPortData } from "./interfaces/portData";
import { NodePort } from "./nodePort";

export class TypeLedger {
    public static PortDataBuilder: (port: NodePort) => IPortData;
}