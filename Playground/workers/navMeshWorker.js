importScripts("https://preview.babylonjs.com/recast.js");

onmessage = function(messageEvent) {
    // get message datas
    const meshData = messageEvent.data;
    const positions = meshData[0];
    const offset = meshData[1];
    const indices = meshData[2];
    const indicesLength = meshData[3];
    const parameters = meshData[4];

    // initialize Recast
    var recast = Recast();

    // build rc config from parameters
    const rc = new recast.rcConfig();
    rc.cs = parameters.cs;
    rc.ch = parameters.ch;
    rc.borderSize = parameters.borderSize ? parameters.borderSize : 0;
    rc.tileSize = parameters.tileSize ? parameters.tileSize : 0;
    rc.walkableSlopeAngle = parameters.walkableSlopeAngle;
    rc.walkableHeight = parameters.walkableHeight;
    rc.walkableClimb = parameters.walkableClimb;
    rc.walkableRadius = parameters.walkableRadius;
    rc.maxEdgeLen = parameters.maxEdgeLen;
    rc.maxSimplificationError = parameters.maxSimplificationError;
    rc.minRegionArea = parameters.minRegionArea;
    rc.mergeRegionArea = parameters.mergeRegionArea;
    rc.maxVertsPerPoly = parameters.maxVertsPerPoly;
    rc.detailSampleDist = parameters.detailSampleDist;
    rc.detailSampleMaxError = parameters.detailSampleMaxError;

    // create navmesh and build it from message datas
    const navMesh = new recast.NavMesh();
    navMesh.build(positions, offset, indices, indicesLength, rc);

    // get recast uint8array
    const navmeshData = navMesh.getNavmeshData();
    const arrView = new Uint8Array(recast.HEAPU8.buffer, navmeshData.dataPointer, navmeshData.size);
    const ret = new Uint8Array(navmeshData.size);
    ret.set(arrView);
    navMesh.freeNavmeshData(navmeshData);

    // job done, returns the result
    postMessage(ret);
}