/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxproceduralgeometry.h
#ifndef _FBXSDK_SCENE_GEOMETRY_PROCEDURAL_H_
#define _FBXSDK_SCENE_GEOMETRY_PROCEDURAL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Base class for procedural geometry. In a standard geometry (FbxGeometry, FbxGeometryBase), control points,
  * normals, possibly polygons (FbxMesh) and other specifications are described. A procedural geometry contains minimal information
  * to be created on-the-fly.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxProceduralGeometry : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxProceduralGeometry, FbxGeometry);
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_PROCEDURAL_H_ */
