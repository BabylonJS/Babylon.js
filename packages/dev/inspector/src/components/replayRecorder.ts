import { SceneRecorder } from "core/Misc/sceneRecorder";
import type { Scene } from "core/scene";
import { Tools } from "core/Misc/tools";

export class ReplayRecorder {
    private _sceneRecorder = new SceneRecorder();
    private _isRecording = false;

    public get isRecording() {
        return this._isRecording;
    }

    public cancel() {
        this._isRecording = false;
    }

    public trackScene(scene: Scene) {
        this._sceneRecorder.track(scene);
        this._isRecording = true;
    }

    public applyDelta(json: any, scene: Scene) {
        SceneRecorder.ApplyDelta(json, scene);
        this._isRecording = false;
    }

    public export() {
        const content = JSON.stringify(this._sceneRecorder.getDelta());

        Tools.Download(new Blob([content]), "diff.json");

        this._isRecording = false;
    }
}
