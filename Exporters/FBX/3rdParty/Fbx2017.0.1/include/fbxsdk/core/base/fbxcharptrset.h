/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcharptrset.h
#ifndef _FBXSDK_CORE_BASE_CHARPTRSET_H_
#define _FBXSDK_CORE_BASE_CHARPTRSET_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains the data structure support for char pointer set.
  */
class FBXSDK_DLL FbxCharPtrSet
{
public:
	/** Class constructor
	* \param pItemPerBlock Number of item per block. Default is 20. */
	FbxCharPtrSet(int pItemPerBlock=20);

	//! Class destructor
	~FbxCharPtrSet();

	/** Add a new item.
	* \param pReference char pointer reference to the item.
	* \param pItem FbxHandle to the item. */
	void Add(const char* pReference, FbxHandle pItem);

	/** Removes an item.
	* \param pReference char reference to the item.
	* \return true if successful. */
	bool Remove(const char* pReference);

	/** Get an item's reference.
	* \param pReference char reference to the item.
	* \param PIndex index to the item.
	* \return FbxHandle to the item, NULL if fails. */
	FbxHandle Get(const char* pReference, int* PIndex=NULL);

	/** Get an item's reference from index.
	* \param pIndex index to the item.
	* \return FbxHandle to the item, NULL if fails. */
	FbxHandle& operator[](int pIndex);

	/** Get an item's reference from index.
	* \param pIndex index to the item.
	* \param pReference char reference to the item.
	* \return FbxHandle to the item, NULL if fails. */
	FbxHandle GetFromIndex(int pIndex, const char** pReference=NULL);

	/** Removes an item by index.
	* \param pIndex index to the item. */
	void RemoveFromIndex(int pIndex);

	/** Get the number of item in the array.
	* \return the number of element in the set. */
	inline int GetCount() const { return mCharPtrSetCount; }

	//! Sorts the array.
	void Sort();

	//! Clears the array.
	void Clear();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	struct CharPtrSet;

	inline void SetCaseSensitive(bool pIsCaseSensitive){ mIsCaseSensitive = pIsCaseSensitive; }

private:
	CharPtrSet*	FindEqual(const char* pReference) const;

	CharPtrSet*	mCharPtrSetArray;
	int			mCharPtrSetCount;
	int			mBlockCount;
	int			mItemPerBlock;
	bool		mIsChanged;
	bool		mIsCaseSensitive;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_CHARPTRSET_H_ */
