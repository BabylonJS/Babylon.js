import { SceneRecorder } from 'babylonjs/Misc/sceneRecorder';
import { Scene } from 'babylonjs/scene';
import { Tools } from 'babylonjs/Misc/tools';

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

    public export() {
       let content = JSON.stringify(this._sceneRecorder.getDelta());

       Tools.Download(new Blob([content]), "diff.json");

       this._isRecording = false;
    }
}