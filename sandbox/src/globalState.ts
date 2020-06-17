import { Observable } from 'babylonjs/Misc/observable';
import { Scene } from 'babylonjs/scene';
import { FilesInput } from 'babylonjs/Misc/filesInput';

export class GlobalState {
    currentScene: Scene;
    onSceneLoaded = new Observable<{scene: Scene, filename: string}>();
    onError = new Observable<{scene: Scene, message: string}>();
    onEnvironmentChanged = new Observable<string>();    
    onRequestClickInterceptor = new Observable<void>();
    onClickInterceptorClicked = new Observable<void>();

    filesInput: FilesInput;
}