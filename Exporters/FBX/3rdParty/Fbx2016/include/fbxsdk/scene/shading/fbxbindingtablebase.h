/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbindingtablebase.h
#ifndef _FBXSDK_SCENE_SHADING_BINDING_TABLE_BASE_H_
#define _FBXSDK_SCENE_SHADING_BINDING_TABLE_BASE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/shading/fbxbindingtableentry.h>
#include <fbxsdk/core/base/fbxdynamicarray.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A binding table represents a collection of bindings
  * from source types such as FbxObject, or FbxLayerElements
  * to destinations which can be of similar types.
  * \see FbxBindingTableEntry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxBindingTableBase : public FbxObject
{
    FBXSDK_ABSTRACT_OBJECT_DECLARE(FbxBindingTableBase,FbxObject);

public:
    /** Adds a new entry to the binding table.
      * \return The new entry.
      */
    FbxBindingTableEntry& AddNewEntry();

    /** Query the number of table entries.
      * \return The number of entries.
      */
    size_t GetEntryCount() const;

    /** Access a table entry. 
      * \param pIndex Valid range is [0, GetEntryCount()-1].
      * \return A valid table entry if pIndex is valid. Otherwise the value is undefined.
      */
    FbxBindingTableEntry const& GetEntry( size_t pIndex ) const;

    /** Access a table entry.
      * \param pIndex Valid range is [0, GetEntryCount()-1].
      * \return A valid table entry if pIndex is valid. Otherwise the value is undefined.
      */
    FbxBindingTableEntry& GetEntry( size_t pIndex );

    /** Retrieve the table entry  for the given source value.
      * \param pSrcName The source value to query.
      * \return The corresponding entry, or NULL if no entry in
      *             the table has a source equal in value to pSrcName.
      */
    const FbxBindingTableEntry* GetEntryForSource(const char* pSrcName) const;

    /** Retrieve the table entry for the given destination value.
      * \param pDestName The destination value to query.
      * \return The corresponding entry, or NULL if no entry in
      *             the table has a destination equal in value to pDestName.
      */
    const FbxBindingTableEntry* GetEntryForDestination(const char* pDestName) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    // Remark: This method copies the mEntries table AND clears the UserData on the resulting copy to prevent shared memory
    // data between clones/copies.
    virtual FbxObject& Copy(const FbxObject& pObject);

private:
    FbxDynamicArray<FbxBindingTableEntry> mEntries;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_BINDING_TABLE_BASE_H_ */
