import { GlobalState } from './globalState';

export class SerializationTools {

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.onIsLoadingChanged.notifyObservers(true);
    }
}