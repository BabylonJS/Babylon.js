/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxobjectscontainer.h
#ifndef _FBXSDK_SCENE_OBJECTS_CONTAINER_H_
#define _FBXSDK_SCENE_OBJECTS_CONTAINER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/scene/fbxscene.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

typedef FbxArray<FbxNodeAttribute::EType> FbxAttributeFilters;

/* Internal helper class used to traverse scene in the FbxAxisSystem and FbxSystemUnit
 */
class FbxObjectsContainer
{
public:
    enum EDepth
	{
        eChildOnly,
        eChildAndSubChild,
		eSubChildWithNoScaleInherit
    };

	FbxObjectsContainer() : mStartNode(NULL) {}
    virtual ~FbxObjectsContainer(){ Clear(); }

    // Store all anim curve nodes pointers that need to be converted
    FbxArray<FbxAnimCurveNode*> mFCurvesT;
    FbxArray<FbxAnimCurveNode*> mFCurvesR;
	FbxArray<FbxAnimCurveNode*> mFCurvesS;

    // Store all node that need to be converted
    FbxArray<FbxNode*> mNodes;
   
public:
    void ExtractSceneObjects(FbxScene* pScene, EDepth pDepth, const FbxAttributeFilters& pFilters);

	void ExtractSceneObjects(FbxNode* pRootNode, EDepth pDepth, const FbxAttributeFilters& pFilters);

    void Clear() { mFCurvesT.Clear(); mFCurvesR.Clear(); mFCurvesS.Clear(); mNodes.Clear(); mStartNode = NULL; }

protected:
    // Extract all node and fcurve from all take for this node.
    void ExtractNodesAnimCurveNodes(FbxNode* pNode, EDepth pDepth, const FbxAttributeFilters& pFilters);
    void ExtractAnimCurveNodes(FbxNode* pNode);
	bool InheritsScale( FbxNode* pNode ) const;

	FbxNode* mStartNode;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_OBJECTS_CONTAINER_H_ */
