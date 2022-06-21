import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { ConnectionPointPortData } from "./connectionPointPortData";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data) => {
        return new ConnectionPointPortData(data.connectionPoint);
    }
}
