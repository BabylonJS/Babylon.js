/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraintutils.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_UTILS_H_
#define _FBXSDK_SCENE_CONSTRAINT_UTILS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxNode; 

/** Utility class for constraints
  *\nosubgrouping
  */
class FBXSDK_DLL FbxConstraintUtils
{
public:
	/** Test if the given node is Single Chain IK Effector.
	  * \param pNode         The given node
	  * \return             \c true if it is, \c false otherwise.
	  */
	static bool IsNodeSingleChainIKEffector(FbxNode* pNode);
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_UTILS_H_ */
