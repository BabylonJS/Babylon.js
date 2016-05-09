/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxrootnodeutility.h
#ifndef _FBXSDK_UTILS_ROOT_NODE_UTILITY_H_
#define _FBXSDK_UTILS_ROOT_NODE_UTILITY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxsystemunit.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxScene;
class FbxAxisSystem;
class FbxNode;

/** \brief This class collects static functions for manipulating Fbx_Root nodes. 
  * Fbx_Root nodes were used to orient and scale scenes from other graphics applications. They have been replaced by the 
  * conversion routines in FbxAxisSystem and FbxSystemUnit. These methods are provided for backward compatibility only 
  * and will eventually be removed. Use the conversion routines in FbxSystemUnit and FbxAxisSystem when possible.
  */
class FBXSDK_DLL FbxRootNodeUtility 
{
public:
	
	static const char* sFbxRootNodePrefix;

	/** This method strips the scene of all Fbx_Root nodes.
	  * \param pScene     The scene to convert
	  * \return           \c true if successful, \c false otherwise.
	  * \remarks          Converts the children of any Fbx_Roots to the orientation
	  *                   and units that the Fbx_Root transformation represented.
	  *                   The scene should look unchanged.
	  */
	static bool RemoveAllFbxRoots( FbxScene* pScene );

	/** Inserts an Fbx_Root node into the scene to orient the 
	  * scene from its axis and unit systems to the specified ones.
	  * \param pScene            The scene to convert
	  * \param pDstAxis          Destination axis.
	  * \param pDstUnit          Destination unit
	  * \param pUnitOptions      Unit conversion options
	  * 
	  */
	static bool InsertFbxRoot(  FbxScene* pScene, 
								const FbxAxisSystem& pDstAxis, 
								const FbxSystemUnit& pDstUnit,
								const FbxSystemUnit::ConversionOptions& pUnitOptions = FbxSystemUnit::DefaultConversionOptions );

	/** Check if a node is an Fbx_Root node
	  * \param pNode     The node to query
	  * \return          \c true if pNode is a Fbx_Root node, false otherwise
	  */
	static bool IsFbxRootNode(FbxNode* pNode);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	FbxRootNodeUtility(); 
	FbxRootNodeUtility(const FbxRootNodeUtility& pOther); 
	~FbxRootNodeUtility();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_ROOT_NODE_UTILITY_H_ */
