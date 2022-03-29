declare module "recast-detour" {
  export class rcConfig {
    new();
    width: number;
    height: number;
    tileSize: number;
    borderSize: number;
    cs: number;
    ch: number;
    bmin: any;
    bmax: any;
    walkableSlopeAngle: number;
    walkableHeight: number;
    walkableClimb: number;
    walkableRadius: number;
    maxEdgeLen: number;
    maxSimplificationError: number;
    minRegionArea: number;
    mergeRegionArea: number;
    maxVertsPerPoly: number;
    detailSampleDist: number;
    detailSampleMaxError: number;
  }
  export class Vec3 {
    new();
    new(x: number, y: number, z: number);
    x: number;
    y: number;
    z: number;
  }
  export class Triangle {
    new();
    getPoint(n: number): Vec3;
  }
  export class DebugNavMesh {
    new();
    getTriangleCount(): number;
    getTriangle(n: number): Triangle;
  }
  export class dtNavMesh {}
  export class dtObstacleRef {}
  export class NavmeshData {
    new();
    dataPointer: any;
    size: number;
  }
  export class NavPath {
    getPointCount(): number;
    getPoint(n: number): Vec3;
  }
  export class dtCrowdAgentParams {
    new();
    radius: number;
    height: number;
    maxAcceleration: number;
    maxSpeed: number;
    collisionQueryRange: number;
    pathOptimizationRange: number;
    separationWeight: number;
    updateFlags: number;
    obstacleAvoidanceType: number;
    queryFilterType: number;
    userData: unknown;
  }
  export class NavMesh {
    new();
    destroy(): void;
    build(
      positions: any,
      positionCount: number,
      indices: any,
      indexCount: number,
      config: rcConfig
    ): void;
    buildFromNavmeshData(data: NavmeshData): void;
    getNavmeshData(): NavmeshData;
    freeNavmeshData(data: NavmeshData): void;
    getDebugNavMesh(): DebugNavMesh;
    getClosestPoint(position: Vec3): Vec3;
    getRandomPointAround(position: Vec3, maxRadius: number): Vec3;
    moveAlong(position: Vec3, destination: Vec3): Vec3;
    getNavMesh(): dtNavMesh;
    computePath(start: Vec3, end: Vec3): NavPath;
    setDefaultQueryExtent(extent: Vec3): void;
    getDefaultQueryExtent(): Vec3;
    addCylinderObstacle(
      position: Vec3,
      radius: number,
      height: number
    ): dtObstacleRef;
    addBoxObstacle(position: Vec3, extent: Vec3, angle: number): dtObstacleRef;
    removeObstacle(obstacle: dtObstacleRef): void;
    update(): void;
  }
  export class Crowd {
    new(maxAgents: number, maxAgentRadius: number, nav: dtNavMesh);
    destroy(): void;
    addAgent(position: Vec3, params: dtCrowdAgentParams): number;
    removeAgent(idx: number): void;
    update(dt: number): void;
    getAgentPosition(idx: number): Vec3;
    getAgentVelocity(idx: number): Vec3;
    getAgentNextTargetPath(idx: number): Vec3;
    getAgentState(idx: number): number;
    overOffmeshConnection(idx: number): boolean;
    agentGoto(idx: number, destination: Vec3): void;
    agentTeleport(idx: number, destination: Vec3): void;
    getAgentParameters(idx: number): dtCrowdAgentParams;
    setAgentParameters(idx: number, params: dtCrowdAgentParams): void;
    setDefaultQueryExtent(extent: Vec3): void;
    getDefaultQueryExtent(): Vec3;
    getCorners(idx: number): NavPath;
  }
}