import { PointerEventTypes } from "../../../Events/pointerEvents";
import { Observable } from "../../../Misc/observable";
import type { Scene } from "../../../scene";

export class MeshPickEventGenerator {
    private _scene: Scene;
    private _listeningMesheUidsToObservables: Map<number, Observable<void>> = new Map();

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public getMeshObservable(meshUid: number): Observable<void> {
        if (!this._listeningMesheUidsToObservables.has(meshUid)) {
            this._listeningMesheUidsToObservables.set(meshUid, new Observable<void>());
        }
        return this._listeningMesheUidsToObservables.get(meshUid)!;
    }

    public start() {
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERPICK && pointerInfo.pickInfo?.hit) {
                const mesh = pointerInfo.pickInfo.pickedMesh;
                if (mesh) {
                    const meshUid = mesh.uniqueId;
                    if (this._listeningMesheUidsToObservables.has(meshUid)) {
                        this._listeningMesheUidsToObservables.get(meshUid)!.notifyObservers(undefined);
                    }
                }
            }
        });
    }
}
