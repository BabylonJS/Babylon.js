/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmultimap.h
#ifndef _FBXSDK_CORE_BASE_MULTIMAP_H_
#define _FBXSDK_CORE_BASE_MULTIMAP_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class to manipulate a map that can contain multiple times the same key.
* \nosubgrouping */
class FBXSDK_DLL FbxMultiMap
{
public:
	struct Pair
	{
		FbxHandle mKey;
		FbxHandle mItem;
	};

	/** If can't find the matching item,append a item at the end of the array.
	* If find the matching item ,insert the new item before the matching item. 
    * \param pKey The value of Key in new item, also is the character for matching.
	* \param pItem The value of Item in new item.
	* \return If add successfully return true,otherwise return false.
    */
    bool Add(FbxHandle pKey, FbxHandle pItem);
	
	/** Remove the first matching item, whose reference is the same as given.
	* \param pKey The given reference.
	* \return If remove successfully return true,otherwise return false.
	*/
    bool Remove(FbxHandle pKey);
	
	/** Remove all the matching item, whose item is the same as given.
	* \param pItem The given item.
	* \return If remove successfully return true,otherwise return false.
	*/
    bool RemoveItem(FbxHandle pItem);

    /** Set first matching item with the given parameter.
    * \param pKey The character for matching.
	* \param pItem  The value of Item that the matching item will be set.
	* \return If set successfully return true,otherwise return false.
    */
    bool SetItem(FbxHandle pKey, FbxHandle pItem);

    /** Get first matching item with the given parameter.
    * \param pKey The character for matching.
	* \param pIndex The pointer to the index of the matching item.
	* \return The value of Item in the matching item.
    * \remarks If there are multiple elements that match the character, the index returned is unspecified.
    */
    FbxHandle Get(FbxHandle pKey, int* pIndex=NULL);

	//! Delete the array.
    void Clear();

	/** Get the item of the given index.
    * \param pIndex The index for matching.
	* \param pKey The pointer to the Key of the matching item.
	* \return The value of Item in the matching item.
    */
    FbxHandle GetFromIndex(int pIndex, FbxHandle* pKey=NULL);

	/** Remove the item of the given index
	* \param pIndex The given index.
	* \return If remove successfully return true,otherwise return false.
	*/
    bool RemoveFromIndex(int pIndex);

	/** Get number of items in the array.
	* \return The number of items in the array. */
    int GetCount() const { return mSetCount; }

	/** Swap the value of Key and Item in every item of array, and sort the new array with the value of Key. */
    void Swap();

	/** Sort the array according the value of Key in each item. */
    void Sort();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxMultiMap(int pItemPerBlock=20);
	FbxMultiMap(const FbxMultiMap& pOther);
	~FbxMultiMap();

    FbxMultiMap& operator=(const FbxMultiMap&);

private:
    Pair*	FindEqual(FbxHandle pKey) const;

    Pair*	mSetArray;
    int		mSetCount;
    int		mBlockCount;
    int		mItemPerBlock;
    bool	mIsChanged;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_MULTIMAP_H_ */
