/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsubdeformer.h
#ifndef _FBXSDK_SCENE_GEOMETRY_SUB_DEFORMER_H_
#define _FBXSDK_SCENE_GEOMETRY_SUB_DEFORMER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**  Base class for cluster sub-deformer( FbxCluster) and blend shape channel sub-deformer( FbxBlendShapeChannel)
  *
  *  The corresponding sub-deformer types are FbxSubDeformer::eCluster and FbxSubDeformer::eBlendShapeChannel.
  *  
  * A cluster, or link, is an entity acting on a geometry (FbxGeometry).
  * More precisely, the cluster acts on a subset of the geometry's control points.
  * For each control point that the cluster acts on, the intensity of the cluster's
  * action is modulated by a weight. The link mode (ELinkMode) specifies how
  * the weights are taken into account.
  * The cluster's link node specifies the node (FbxNode) that influences the
  * control points of the cluster. If the node is animated, the control points
  * will move accordingly.
  * A cluster is usually part of a skin (see FbxDeformer, FbxSkin). For example,
  * imagine a mesh representing a humanoid, and imagine a skeleton made of bones. 
  * Each bone is represented by a node in FBX.
  * To bind the geometry to the nodes, 
  * we create a skin (FbxSkin). The skin has many clusters, each one corresponding
  * to a bone.
  * Each node influences some control
  * points of the mesh. A node has a high influence on some of the points (high weight)
  * and lower influence on some other points (low weight). Some points of the mesh
  * are not affected at all by the bone, so they would not be part of the corresponding
  * cluster.
  *
  * A blend shape channel is a sub-deformer to help blend shape deformer to organize the target shapes.
  * One blend shape deformer can have multiple blend shape channels in parallel, and each of them can 
  * control one or multiple target shapes. If there are multiple target shapes connected to one channel,
  * and each target shape could have its own full deformation percentage, for example, one channel could have 3 target shapes,
  * whose full deform percentage are 30, to 80 to 100, then when the percent change from 0 to 100, the base geometry will
  * deform from the first target shape to the last one, this is called In-Between blend-shapes.
  * The blend shape channel also control the deform percent of each target shape or In-Between blend shape on it.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSubDeformer : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxSubDeformer, FbxObject);
    public:

        /** Set multi layer state flag.
          * \param pMultiLayer               If \c true, multi-layering is enabled.
          */
        void SetMultiLayer(bool pMultiLayer);

        /** Get multilayer state.
          * \return                         The state of the multi-layer flag.
          */
        bool GetMultiLayer() const;


         /** \enum EType Sub-deformer type
          */
        enum EType
        {
            eUnknown,			//!< Untyped sub-deformer            
            eCluster,			//!< Type FbxCluster            
            eBlendShapeChannel	//!< Type FbxBlendShapeChannel
        };

        /** Get the type of the sub-deformer.
          * \return                         SubDeformer type identifier.
          */
        virtual EType GetSubDeformerType() const { return eUnknown; }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual FbxStringList GetTypeFlags() const { return FbxStringList(); }

	// Local
	bool		mMultiLayer;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_SUB_DEFORMER_H_ */
