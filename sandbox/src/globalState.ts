import { Observable } from 'babylonjs/Misc/observable';
import { Scene } from 'babylonjs/scene';

export class GlobalState {
    onSceneLoaded = new Observable<{scene: Scene, filename: string}>();
    onError = new Observable<Scene>();
}