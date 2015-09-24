/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxselectionnode.h
#ifndef _FBXSDK_SCENE_SELECTION_NODE_H_
#define _FBXSDK_SCENE_SELECTION_NODE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxSelectionNode is an auxiliary class for Selection Set. 
* \nosubgrouping
* Used to group objects with their components (e.g. vertex, edge, and face), when adding it to a selection set (FbxSelectionSet).
* \see FbxSelectionSet 
*/
class FBXSDK_DLL FbxSelectionNode : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxSelectionNode, FbxObject);

public:
    /** \enum ESelectType               SelectionNode type identifier.
    * - \e eVertexLevel                Vertex level selection.
    * - \e eEdgeLevel                  Edge level selection.
    * - \e eFaceLevel                  Face level selection.
    * - \e eObjectLevel                Object level selection.
    * - \e eSelectTypeCount             Number of Select Types.
    */
    enum ESelectType
    {
        eVertexLevel,
        eEdgeLevel,
        eFaceLevel,
        eObjectLevel,
        eSelectTypeCount
    };

    /** Set an object whose components or itself is contained in the SelectionNode.
    * \param pObject      The object whose components or itself is contained in the SelectionNode. 
    * \return \c true if the object is set successfully. \c false otherwise.
    * \remarks It is possible a SDK user will try to set multiple objects to one SelectionNode, but only the last one will be kept.
    */
    bool SetSelectionObject(FbxObject* pObject);

    /** Get the object whose components or itself or both are contained in the SelectionNode.
    * \return The object whose components or itself or both are contained in the SelectionNode. 
    */
    FbxObject* GetSelectionObject() const;

    /** To detect if the SelectionNode is valid.
    *  \return \c true if this is a valid SelectionNode. \c false otherwise.
    *  \remarks SelectionNode is valid if selection object is set.
    *   SelectionNode is not valid if no selection object is set.
    */
    bool IsValid() const;

    /** \c true means the object itself is also in the selection set; 
    *   \c false means only the object's components are in the selection set, the object is not.
    */
    bool mIsTheNodeInSet;

    /** Index array for selected vertices.
    */
    FbxArray<int> mVertexIndexArray;  

    /** Index array for selected edges.
    */
    FbxArray<int> mEdgeIndexArray; 

    /** Index array for selected faces.
    */
    FbxArray<int> mPolygonIndexArray;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxArray<FbxArray<int>*> mSubTypeSelectArray;
    static const char* SELECT_TYPE_NAMES[(int)eSelectTypeCount];

protected:
	virtual void Construct(const FbxObject* pFrom);
    bool ConnectNotify (FbxConnectEvent const &pEvent);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SELECTION_NODE_H_ */
