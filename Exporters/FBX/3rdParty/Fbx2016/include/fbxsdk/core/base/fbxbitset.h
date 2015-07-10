/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbitset.h
#ifndef _FBXSDK_CORE_BASE_BITSET_H_
#define _FBXSDK_CORE_BASE_BITSET_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** An automatic growing array of bit.
  *
  * The bit array will automatically grow when specifying bit indexes that are greater
  * than the array size when calling SetBit or UnsetBit. Indexes can vary from 0 to
  * FBXSDK_UINT_MAX-1. When an invalid index is returned from any functions, FBXSDK_UINT_MAX
  * is returned. The bit array is not thread safe.
  */
class FBXSDK_DLL FbxBitSet
{
public:
	/** Constructor.
	  * \param pInitialSize Initial bit array size in bit count (not in byte count!).
	  */
	FbxBitSet(const FbxUInt pInitialSize=0);

	//! Destructor.
	virtual ~FbxBitSet();

	/** Set the bit at the specified bit index to true regardless of its current value.
	  * \param pBitIndex The bit index in the array in the range of [0, FBXSDK_UINT_MAX-1].
	  */
	void SetBit(const FbxUInt pBitIndex);

	/** Set all the bits to the specified value regardless of their current value.
	  * \param pValue The boolean value to set to all bits.
	  */
	void SetAllBits(const bool pValue);

	/** Set the bit at the specified bit index to false regardless of its current value.
	  * \param pBitIndex The bit index in the array in the range of [0, FBXSDK_UINT_MAX-1].
	  */
	void UnsetBit(const FbxUInt pBitIndex);

	/** Get the bit boolean value at the specified bit index.
	  * \param pBitIndex The bit index in the array in the range of [0, FBXSDK_UINT_MAX-1].
	  * \return True if the bit is set, false otherwise.
	  */
	bool GetBit(const FbxUInt pBitIndex) const;

	/** Get the bit index of the first bit that is currently set.
	  * \return The bit index of the first set bit, FBXSDK_UINT_MAX if none found.
	  */
	FbxUInt GetFirstSetBitIndex() const;

	/** Get the bit index of the last bit that is currently set.
	  * \return The bit index of the last set bit, FBXSDK_UINT_MAX if none found.
	  */
	FbxUInt GetLastSetBitIndex() const;

	/** Get the bit index of the next set bit after the specified bit index.
	  * \param pBitIndex The start bit index in the array in the range of [0, FBXSDK_UINT_MAX-1].
	  * \return The bit index of the next set bit, FBXSDK_UINT_MAX if none found.
	  */
	FbxUInt GetNextSetBitIndex(const FbxUInt pBitIndex) const;

	/** Get the bit index of the previous set bit before the specified bit index.
	  * \param pBitIndex The start bit index in the array in the range of [0, FBXSDK_UINT_MAX-1].
	  * \return The bit index of the previous set bit, FBXSDK_UINT_MAX if none found.
	  */
	FbxUInt GetPreviousSetBitIndex(const FbxUInt pBitIndex) const;

private:
	void Grow(const FbxUInt pNewSize);

	void* mData;
	FbxUInt mSize;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_BITSET_H_ */
