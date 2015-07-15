/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxselectionset.h
#ifndef _FBXSDK_SCENE_SELECTION_SET_H_
#define _FBXSDK_SCENE_SELECTION_SET_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxcollection.h>
#include <fbxsdk/scene/fbxselectionnode.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FBX SDK selection set class.
* \nosubgrouping
*  Represents a set of selected objects (FbxObject) and components. This is a non-exclusive (multiple membership) collection. 
*  Objects (FbxObject) can be added to a FbxSelectionSet directly, but to add components (vertexes, edges, or faces) 
*  you create a selection node (FbxSelectionNode) to group the object and its components together as a single item to be added. 
*  \see FbxSelectionNode 
*/
class FBXSDK_DLL FbxSelectionSet : public FbxCollection
{
    FBXSDK_OBJECT_DECLARE(FbxSelectionSet, FbxCollection);

public:
    /** This property stores annotation of the selection set.
    * Default value is "".
    */
    FbxPropertyT<FbxString>        SelectionSetAnnotation;

    /**
    * \name Utility functions
    */
    //@{

    /**  Get the selected faces of a specified object. 
    *    \param pObj                The specified object.
    *    \param pPolygonIndexArray  The array to take the indices of the selected faces.
    *    \remarks                   The indices of selected faces will be put in pPolygonIndexArray.
    */
    void GetFaceSelection( FbxObject* pObj,FbxArray<int>& pPolygonIndexArray ) const;

	/**  Get the selected edges of a specified object. 
	*    \param pObj                The specified object.
	*    \param pEdgeIndexArray     The array to take the indices of the selected edges.
	*    \remarks                   The indices of selected face will be put in pEdgeIndexArray.
	*/
    void GetEdgeSelection( FbxObject* pObj,FbxArray<int>& pEdgeIndexArray ) const; 

	/**  Get the selected vertices of a specified object. 
	*    \param pObj                The specified object.
	*    \param pVertexIndexArray   The array to take the indices of the selected vertices.
	*    \remarks                   The indices of selected face will be put in pVertexIndexArray.
	*/
    void GetVertexSelection( FbxObject* pObj,FbxArray<int>& pVertexIndexArray ) const; 

    /**  Get list of two types of member in the selection set: SelectionNodes and Directly contained objects.
    *    \param pSelectionNodeList  The array to take selection nodes of the selection set.
    *    \param pDirectObjectList   The array to take directly contained objects of the selection set.
    *    \remarks There might be two types members for a selection set: selection node and directly contained object.
    *    They will be listed in pSelectionNodeList and pDirectObjectList separately.
    */
    void GetSelectionNodesAndDirectObjects(FbxArray<FbxSelectionNode*> &pSelectionNodeList, FbxArray<FbxObject*> &pDirectObjectList) const; 

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet); 
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SELECTION_SET_H_ */
