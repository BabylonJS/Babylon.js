module BABYLON {
    export class FramingBehavior implements Behavior<ArcRotateCamera> {
        public get name(): string {
            return "Framing";
        }
        
        public attach(camera: ArcRotateCamera): void {

        }
        
        public detach(camera: ArcRotateCamera): void {
            
        }
    }
}