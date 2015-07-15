/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxvertexcachedeformer.h
#ifndef _FBXSDK_SCENE_GEOMETRY_VERTEX_CACHE_DEFORMER_H_
#define _FBXSDK_SCENE_GEOMETRY_VERTEX_CACHE_DEFORMER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxdeformer.h>
#include <fbxsdk/scene/geometry/fbxcache.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This class deforms control points of a geometry using control point positions
 * stored in the associated cache object.
 * \nosubgrouping
 */
class FBXSDK_DLL FbxVertexCacheDeformer : public FbxDeformer
{
	FBXSDK_OBJECT_DECLARE(FbxVertexCacheDeformer, FbxDeformer);

public:
	//! Vertex cache deformer data type
	enum ECacheChannelType
	{
		ePositions,		//!< This vertex cache deformer handles positions
		eNormals,		//!< This vertex cache deformer handles normals
		eUVs,			//!< This vertex cache deformer handles uvs
		eTangents,		//!< This vertex cache deformer handles tangents
		eBinormals,		//!< This vertex cache deformer handles binormals
		eUserDefined	//!< This vertex cache deformer handles user specified data (the cache channel string can provide a hint)
	};

	/** Assign a cache object to be used by this deformer.
	* \param pCache The cache object. */ 
	void SetCache(FbxCache* pCache);

	/** Get the cache object used by this deformer.
	* \return A pointer to the cache object used by this deformer, or \c NULL if no cache object is assigned. */
	FbxCache* GetCache() const;

	//! Indicate if the deformer is active or not.
	FbxPropertyT<FbxBool> Active;

	//! The channel name used in the cache file
	FbxPropertyT<FbxString> Channel;

	//! The cache set used by this vertex cache deformer
	FbxPropertyT<FbxString> CacheSet;

	//! The vertex cache deformer type
	FbxPropertyT<ECacheChannelType> Type;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);
	virtual EDeformerType GetDeformerType() const { return FbxDeformer::eVertexCache; }
    
protected:
	virtual void ConstructProperties(bool pForceSet);
	virtual FbxStringList GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxVertexCacheDeformer::ECacheChannelType&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_VERTEX_CACHE_DEFORMER_H_ */
