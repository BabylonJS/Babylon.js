// Babylon Navigation Mesh Tool
// https://github.com/wanadev/babylon-navigation-mesh
declare class Navigation {
    buildNodes(mesh: BABYLON.AbstractMesh): any;
    setZoneData(zone: string, data: any): void;
    getGroup(zone: string, position: BABYLON.Vector3): number;
    getRandomNode(zone: string, group: number, nearPosition: BABYLON.Vector3, nearRange: number): BABYLON.Vector3;
    projectOnNavmesh(position: BABYLON.Vector3, zone: string, group: number): BABYLON.Vector3;
    findPath(startPosition: BABYLON.Vector3, targetPosition: BABYLON.Vector3, zone: string, group: number): BABYLON.Vector3[];
    getVectorFrom(vertices: number[], index: number, _vector: BABYLON.Vector3): BABYLON.Vector3;
}

module BABYLON {

    /* Babylon Scene Navigation Agent AI */
    export class NavigationAgent {
        private _mesh:BABYLON.AbstractMesh;
        private _info:BABYLON.INavigationAgent;
        constructor(owner: BABYLON.AbstractMesh) {
            if (owner == null) throw new Error("Null owner agent mesh specified.");
            this._mesh = owner;
            this._info = (this._mesh.metadata != null && this._mesh.metadata.navAgent != null) ? this._mesh.metadata.navAgent : null;
        }
        public get mesh():BABYLON.AbstractMesh {
            return this._mesh;
        }
        public get info():BABYLON.INavigationAgent {
            return this._info;
        }
        public get hasAgentInfo(): boolean {
            return (this.info != null);
        }
        public setDestination(destination: BABYLON.Vector3): void {
            if (this.hasAgentInfo) {
                // TODO: Create SetDestination Navigation AI With Obsticale Avoidance
            } else {
                if (console) console.warn("Null navigation agent metadata. Set agent destination ignored.");
            }
        }
    }
}