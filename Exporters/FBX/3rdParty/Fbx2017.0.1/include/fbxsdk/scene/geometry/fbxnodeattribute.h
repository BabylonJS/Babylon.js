/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnodeattribute.h
#ifndef _FBXSDK_SCENE_GEOMETRY_NODE_ATTRIBUTE_H_
#define _FBXSDK_SCENE_GEOMETRY_NODE_ATTRIBUTE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxNode;

/** \brief This class is the base class to all types of node attributes.
  * \nosubgrouping
  *    A node attribute is the content of a node. A \c NULL node attribute is set 
  * by calling function FbxNode::SetNodeAttribute() with a \c NULL pointer.
  */
class FBXSDK_DLL FbxNodeAttribute : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxNodeAttribute, FbxObject);

public:
    //! Property Names
    static const char* sColor;

    //! Property Default Values
    static const FbxDouble3 sDefaultColor;

    /** This property handles the color.
      *
      * Default value is (0.8, 0.8, 0.8)
      */
    FbxPropertyT<FbxDouble3> Color;

    /** \enum EType Node attribute types.
      * - \e eUnknown
      * - \e eNull
      * - \e eMarker
      * - \e eSkeleton
      * - \e eMesh
      * - \e eNurbs
      * - \e ePatch
      * - \e eCamera
      * - \e eCameraStereo,
      * - \e eCameraSwitcher
      * - \e eLight
      * - \e eOpticalReference
      * - \e eOpticalMarker
      * - \e eNurbsCurve
      * - \e eTrimNurbsSurface
      * - \e eBoundary
      * - \e eNurbsSurface
      * - \e eShape
      * - \e eLODGroup
      * - \e eSubDiv
      * - \e eCachedEffect
      * - \e eLine
      */
    enum EType
    {   
        eUnknown,
        eNull,
        eMarker,
        eSkeleton, 
        eMesh, 
        eNurbs, 
        ePatch,
        eCamera, 
        eCameraStereo,
        eCameraSwitcher,
        eLight,
        eOpticalReference,
        eOpticalMarker,
        eNurbsCurve,
        eTrimNurbsSurface,
        eBoundary,
        eNurbsSurface,
        eShape,
        eLODGroup,
        eSubDiv,
        eCachedEffect,
        eLine
    };

    /** Return the type of node attribute.
      * This class is pure virtual.
      */
    virtual FbxNodeAttribute::EType GetAttributeType() const;

	/** Return the node count using this attribute.
	  * \return  The count of nodes with this attribute set.
	  */
	int GetNodeCount() const;

    /** Return the node this attribute is set to.
	  * \param pIndex	The index of the node to retrieve
      * \return			Pointer to the node, or \c NULL if the current attribute is not set to a node.
      */
    FbxNode* GetNode(int pIndex=0) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_NODE_ATTRIBUTE_H_ */
