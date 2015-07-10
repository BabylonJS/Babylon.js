/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdynamicarray.h
#ifndef _FBXSDK_CORE_BASE_DYNAMICARRAY_H_
#define _FBXSDK_CORE_BASE_DYNAMICARRAY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxcontainerallocators.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Template class for dynamic array holding objects.
  * \nosubgrouping
  * \see FbxStaticArray
  */
template <typename Type, typename Allocator=FbxBaseAllocator> class FbxDynamicArray
{
public:
	//! Default constructor.
	FbxDynamicArray() :
		mArray(NULL),
		mCapacity(0),
		mSize(0),
		mAllocator(sizeof(Type))
	{
	}

	/** Constructor.
	* \param pInitialSize initial capacity of this array */
	FbxDynamicArray(const size_t pInitialSize) :
		mArray(NULL),
		mCapacity(0),
		mSize(0),
		mAllocator(sizeof(Type))
	{
		Reserve(pInitialSize);
	}

	/** Copy constructor.
	* \remarks The copy constructor of \c Type will be 
	* invoked in order to copy the value of elements to the
	* new array.
	*/
	FbxDynamicArray(const FbxDynamicArray& pArray) :
		mArray(NULL),
		mCapacity(0),
		mSize(0),
		mAllocator(sizeof(Type))
	{
		Reserve(pArray.mCapacity);
		CopyArray(mArray, pArray.mArray, pArray.mSize);
		mSize = pArray.mSize;
	}

	//! Destructor.
	~FbxDynamicArray()
	{
		for( size_t i = 0; i < mSize; ++i )
		{
			mArray[i].~Type();
		}
		mAllocator.FreeMemory(mArray);
	}

	//! Gets the current capacity of the array.
	size_t Capacity() const
	{
		return mCapacity;
	}

	//! Gets the size of the array.
	size_t Size() const
	{
		return mSize;
	}

	/** Assures that sufficient memory is allocated to hold n objects in the array, and increases the capacity if necessary.
	* \param pCount Number of objects to reserve */
	void Reserve(const size_t pCount)
	{
		if( pCount > mCapacity )
		{
			//We don't use mAllocator.PreAllocate, because we want our array to be continuous in memory.
			Type* lNewArray = (Type*)mAllocator.AllocateRecords(pCount);
			MoveArray(lNewArray, mArray, mSize);
			mAllocator.FreeMemory(mArray);
			mArray = lNewArray;
			mCapacity = pCount;
		}
	}

	/** Appends n objects at the end of the array.
	* \param pItem object to append
	* \param pNCopies number of copies to append */
	void PushBack(const Type& pItem, const size_t pNCopies = 1)
	{
		if( mSize + pNCopies > mCapacity )
		{
			size_t lNewSize = mCapacity + mCapacity / 2;	//grow by 50%
			if( mSize + pNCopies > lNewSize )
			{
				lNewSize = mSize + pNCopies;
			}
			Reserve(lNewSize);
		}
		FBX_ASSERT(mSize + pNCopies <= mCapacity);
		Fill(mArray + mSize, pItem, pNCopies);
		mSize += pNCopies;
	}

	/** Inserts n objects at the specified position.
	* \param pIndex position index
	* \param pItem object to insert
	* \param pNCopies number of copies to append */
	void Insert(const size_t pIndex, const Type& pItem, const size_t pNCopies=1)
	{
		FBX_ASSERT(pIndex >= 0);
		FBX_ASSERT(pIndex <= mSize);
		Type lValue = pItem; // in case pItem is in array
		if( pNCopies == 0 )
		{
		}
		else if( pIndex >= mSize )
		{
			PushBack(pItem, pNCopies);
		}
		else if( mSize + pNCopies > mCapacity )
		{
			size_t lNewSize = mCapacity + mCapacity / 2;	//not enough room, grow by 50%
			if( mSize + pNCopies > lNewSize )
			{
				lNewSize = mSize + pNCopies;
			}

			Type* lNewArray = (Type*)mAllocator.AllocateRecords(lNewSize);
			MoveArray(lNewArray, mArray, pIndex); // copy prefix
			Fill(lNewArray + pIndex, pItem, pNCopies); // copy values
			MoveArray(lNewArray + pIndex + pNCopies, mArray + pIndex, mSize - pIndex); // copy suffix
			mAllocator.FreeMemory(mArray);
			mArray = lNewArray;
			mSize += pNCopies;
			mCapacity = lNewSize;
		}
		else
		{
			// copy suffix backwards
			MoveArrayBackwards(mArray + pIndex + pNCopies, mArray + pIndex, mSize - pIndex);
			Fill(mArray + pIndex, pItem, pNCopies); // copy values
			mSize += pNCopies;
		}
	}

	/** Removes n objects at the end.
	* \param pNElements number of objects to remove */
	void PopBack(size_t pNElements=1)
	{
		FBX_ASSERT(pNElements <= mSize);
		for( size_t i = mSize - pNElements; i < mSize; ++i )
		{
			mArray[i].~Type();
		}
		mSize -= pNElements;
	}

	/** Removes n objects at the specified position.
	* \param pIndex position index
	* \param pNElements number of objects to remove */
	void Remove(const size_t pIndex, size_t pNElements=1)
	{
		FBX_ASSERT(pIndex >= 0);
		FBX_ASSERT(pIndex <= mSize);
		FBX_ASSERT(pIndex + pNElements <= mSize);
		if( pIndex + pNElements >= mSize )
		{
			PopBack(pNElements);
		}
		else
		{            
			for( size_t i = pIndex; i < pIndex + pNElements; ++i )
			{
				mArray[i].~Type();
			}
			MoveOverlappingArray(&mArray[pIndex], &mArray[pIndex + pNElements], mSize - pIndex - pNElements);
			mSize -= pNElements;
		}
	}

	/** Gets nth object in the array.
	* \param pIndex position index */
	Type& operator[](const size_t pIndex)
	{
		return mArray[pIndex];
	}

	/** Gets nth object in the array.
	* \param pIndex position index */
	const Type& operator[](const size_t pIndex) const
	{
		return mArray[pIndex];
	}

	/** Retrieve the first item in the array.
	* \return The first item in the array. */
	Type& First()
	{
		return operator[](0);
	}

	/** Retrieve the first item in the array.
	* \return The first item in the array. */
	const Type& First() const
	{
		return operator[](0);
	}

	/** Retrieve the last item in the array.
	* \return The last item in the array. */
	Type& Last()
	{
		return operator[](mSize-1);
	}

	/** Retrieve the last item in the array.
	* \return The last item in the array. */
	const Type& Last() const
	{
		return operator[](mSize-1);
	}

	/** Find first matching element, from first to last.
	* \param pItem The item to try to find in the array.
	* \param pStartIndex The index to start searching from.
	* \return Index of the first matching item, otherwise returns -1 (equivalent of SIZE_MAX for size_t). */
	size_t Find(const Type& pItem, const size_t pStartIndex=0) const
	{
		for( size_t i = pStartIndex; i < mSize; ++i )
		{
			if( operator[](i) == pItem ) return i;
		}
		return -1;
	}

	/** Assignment operator.
	* \remarks The copy constructor of \c Type will be invoked in order to copy the value of elements to the new array. */
	FbxDynamicArray& operator=(const FbxDynamicArray& pArray)
	{
		Reserve(pArray.mCapacity);
		CopyArray(mArray, pArray.mArray, pArray.mSize);
		mSize = pArray.mSize;
		return *this;
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	static void CopyArray(Type* pDest, const Type* pSrc, size_t pCount)
	{
		for( int i = 0; i < int(pCount); i++ )
		{
			new(&(pDest[i])) Type(pSrc[i]);	//in-place new won't allocate memory, so it is safe
		}
	}

	static void MoveArray(Type* pDest, const Type* pSrc, size_t pCount)
	{
		for( int i = 0; i < int(pCount); i++ )
		{
			new(&(pDest[i])) Type(pSrc[i]);	//in-place new won't allocate memory, so it is safe
		}

		for( int i = 0; i < int(pCount); i++ )
		{
			pSrc[i].~Type();
		}
	}

	static void MoveOverlappingArray(Type* pDest, const Type* pSrc, size_t pCount)
	{
		for( int i = 0; i < int(pCount); i++ )
		{
			new(&(pDest[i])) Type(pSrc[i]);	//in-place new won't allocate memory, so it is safe
			pSrc[i].~Type();
		}
	}

	static void MoveArrayBackwards(Type* pDest, const Type* pSrc, size_t pCount)
	{
		for( int i = 0; i < int(pCount); ++i )
		{
			new(&(pDest[pCount-1-i])) Type(pSrc[pCount-1-i]);	//in-place new won't allocate memory, so it is safe
			pSrc[pCount-1-i].~Type();
		}
	}

	static void Fill(Type* pDest, const Type& pItem, size_t pCount)
	{
		for( int i = 0; i < int(pCount); i++ )
		{
			new(&(pDest[i])) Type(pItem);	//in-place new won't allocate memory, so it is safe
		}
	}

    Type*		mArray;
    size_t		mCapacity;
    size_t		mSize;
    Allocator	mAllocator;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_DYNAMICARRAY_H_ */
