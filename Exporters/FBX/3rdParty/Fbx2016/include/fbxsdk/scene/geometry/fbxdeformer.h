/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdeformer.h
#ifndef _FBXSDK_SCENE_GEOMETRY_DEFORMER_H_
#define _FBXSDK_SCENE_GEOMETRY_DEFORMER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/fbxsdk_nsbegin.h>

/** Base class for skin deformer (FbxSkin) and vertex cache deformer (FbxVertexCacheDeformer).
  * The corresponding deformer types are FbxDeformer::eSkin and FbxDeformer::eVertexCache.
  * A deformer can be binded to a geometry (FbxGeometry) to act on its shape. Typically,
  * some objects under the deformer are animated, and via the deformer, the geometry
  * is animated too.
  *
  * A skin deformer contains clusters (FbxCluster). Each cluster acts on a subset of the geometry's
  * control points, with different weights. For example, a mesh of humanoid shape
  * can have a skin attached, that describes the way the humanoid mesh is deformed
  * by bones. When the bones are animated, the clusters act on the geometry to
  * animate it too.
  *
  * A vertex cache deformer contains a cache (FbxCache). The cache contains animation
  * information for every control point of the geometry.
  *
  *\nosubgrouping
  */
class FBXSDK_DLL FbxDeformer : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxDeformer, FbxObject);

public:
	/**
	  * \name Multi-Layer Flag
	  * This flag is available for backward compatibility with older 
	  * version of FBX files and should not be used anymore. All the animation layering
	  * system has been moved to the FbxAnimLayer and FbxAnimStack classes.
	  */
	//@{
        /** Set multi-layer state flag.
          * \param pMultiLayer     Set to \c true to enable multi-layering.
          */
        void SetMultiLayer(bool pMultiLayer);

        /** Get multi-layer state.
          * \return     The current state of the multi-layer flag.
          */
        bool GetMultiLayer() const;
        //@}

        /**
          * \name Deformer types
          */
        //@{
        /** \enum EDeformerType Deformer types.
          */
        enum EDeformerType
        {
            eUnknown,		//!< Unknown deformer type
            eSkin,			//!< Type FbxSkin
			eBlendShape,	//!< Type FbxBlendShape
            eVertexCache	//!< Type FbxVertexCacheDeformer
        };

        /** Get the deformer type.
          * \return     Deformer type identifier. Default value is eUnknown.
          */
        virtual EDeformerType GetDeformerType() const { return eUnknown; }
        //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual FbxStringList GetTypeFlags() const { return FbxStringList(); }

	bool		mMultiLayer;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_DEFORMER_H_ */
