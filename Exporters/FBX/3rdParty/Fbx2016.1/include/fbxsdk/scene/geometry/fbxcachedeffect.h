/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcachedeffect.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CACHED_EFFECT_H_
#define _FBXSDK_SCENE_GEOMETRY_CACHED_EFFECT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>
#include <fbxsdk/scene/geometry/fbxcache.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A cached effect is a type of node attribute to represent certain type of effect 
  *  by an cache object. Categories are particle cache, fluid cache, hair cache and general cache.
  * \see ECategory for the effect types that are supported.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxCachedEffect : public FbxNodeAttribute
{
	FBXSDK_OBJECT_DECLARE(FbxCachedEffect, FbxNodeAttribute);

public:
    //! Returns the FbxNodeAttribute::EType::eCachedEffect attribute type.
	virtual FbxNodeAttribute::EType GetAttributeType() const;
	
     /** Effect attribute category. This is for identification purpose and has 
       * no influence inside the FBX SDK. However, applications may use this to filter FbxCachedEffect
       * objects.
       * \remarks Vertex caches for deforming geometries are not handled by the FbxCachedEffect object. These
       *          caches are connected with the FbxVertexCacheDeformer object.
       * \remarks If an object of this class is used as the default NodeAttribute for a FbxNode and the scene is
       *          saved to an FBX v6 and earlier versions, the CachedEffect attribute is not saved and the FbxNode will
       *          be processed as a FbxNull node with default values for the attribute.
      */
    enum ECategory
	{
        eParticles,	//!< This effect handles a particle cache.
        eFluids,	//!< This effect handles a fluid cache.
        eHair,		//!< This effect handles an hair cache.
        eGeneric	//!< This effect handles a cache other than particles, fluids or hair.
    };

    //! Return the specialization category of this effect attribute.
    ECategory GetCategory() const;

	/** Assign a cache object to be used by this attribute.
	  * \param pCache               The cache object.
      * \param pCategory            The type of this cached effect.
      * \remarks The cache referenced by the \b pCache pointer can be freely shared among
      *          multiple FbxCachedEffect (and even the FbxVertexCacheDeformer) therefore
      *          \b pCategory identifier should really only used as a hint of what this FbxCachedEffect
      *          represents but it should not be taken for granted that the content of the cache really
      *          matches the category. Applications should always check the cache files to ensure that
      *          they are manipulating the desired information.
      *          
	  */ 
	void SetCache( FbxCache* pCache, ECategory pCategory = eGeneric);

	/** Get the cache object used by this node attribute.
	  * \return     A pointer to the cache object used by this node attribute, or \c NULL if no cache object is assigned.
	  */
	FbxCache* GetCache() const;

protected:


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject&	Copy(const FbxObject& pObject);

protected:
	virtual void ConstructProperties(bool pForceSet);

public:
	virtual const char* GetTypeName() const;
	virtual FbxStringList GetTypeFlags() const;

private:
	void ClearCacheConnections();
    FbxPropertyT<ECategory> Category;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxCachedEffect::ECategory&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CACHED_EFFECT_H_ */
