/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxgeometryweightedmap.h
#ifndef _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAP_H_
#define _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAP_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/geometry/fbxweightedmapping.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxGeometry;

/** \brief This class provides the structure to build a correspondence between 2 geometries.
  *
  * This correspondence is done at the vertex level. Which means that for each vertex in the
  * source geometry, you can have from 0 to N corresponding vertices in the destination
  * geometry. Each corresponding vertex is weighted.
  *
  * For example, if the source geometry is a NURB and the destination geometry is a mesh,
  * the correspondence object will express the correspondence between the NURB's control vertices
  * and the mesh's vertices.
  *
  * If the mesh corresponds to a tesselation of the NURB, the correspondence object can be used
  * to transfer any deformation that affect the NURB's control vertices to the mesh's vertices.
  *
  * See FbxWeightedMapping for more details.
  */
class FBXSDK_DLL FbxGeometryWeightedMap : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxGeometryWeightedMap, FbxObject);

public:

    /** Set correspondence values.
      * \param pWeightedMappingTable     Pointer to the table containing values
      * \remark                          \e pWeightedMappingTable becomes owned by this object and will be destroyed by it
      *                                  when the object goes out of scope or on the next call to SetValues(). The deletion
      *                                  uses FbxDelete() so the content of the pointer must have been allocated with FbxNew<>()
      */
    void SetValues(const FbxWeightedMapping* pWeightedMappingTable);

    /** Return correspondence values.
      * \return     Pointer to the correspondence values table.
      */
    FbxWeightedMapping* GetValues() const;

    /** Return source geometry.
      * \return     Pointer to the source geometry, or \c NULL if there is no connected source geometry
      */
    FbxGeometry* GetSourceGeometry();

    /** Return destination geometry.
      * \return     Pointer to the destination geometry, or \c NULL if there is no connected destination geometry
      */
    FbxGeometry* GetDestinationGeometry();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);

    // Real weigths table
    FbxWeightedMapping* mWeightedMapping;

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAP_H_ */
