/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxredblacktree.h
#ifndef _FBXSDK_CORE_BASE_REDBLACKTREE_H_
#define _FBXSDK_CORE_BASE_REDBLACKTREE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxcontainerallocators.h>
#include <fbxsdk/core/base/fbxpair.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

template <typename RecordType> class FbxRedBlackConstIterator;

template <typename RecordType> class FbxRedBlackIterator
{
public:
    FbxRedBlackIterator() : mRecord(0) {}
    FbxRedBlackIterator(RecordType* pRecord) : mRecord(pRecord) {}
    FbxRedBlackIterator(const FbxRedBlackIterator<RecordType>& pV) : mRecord(pV.mRecord) {}

    FbxRedBlackIterator& operator++()
    {
        FBX_ASSERT( mRecord != NULL );
        mRecord = mRecord->Successor();
        return *this;
    }

    const FbxRedBlackIterator operator++(int)
    {
        FbxRedBlackIterator t(*this);
        operator++();
        return t;
    }

	FbxRedBlackIterator& operator+=(int pCount)
	{
		FBX_ASSERT( mRecord != NULL );
		for( int i = 0; i < pCount; ++i )
		{
			if( !mRecord ) break;
			mRecord = mRecord->Successor();
		}
		return *this;
	}

    FbxRedBlackIterator& operator--()
    {
        FBX_ASSERT( mRecord );
        mRecord = mRecord->Predecessor();
        return *this;
    }

    const FbxRedBlackIterator operator--(int)
    {
        FbxRedBlackIterator t(*this);
        operator--();
        return t;
    }

	FbxRedBlackIterator& operator-=(int pCount)
	{
		FBX_ASSERT( mRecord != NULL );
		for( int i = 0; i < pCount; ++i )
		{
			if( !mRecord ) break;
			mRecord = mRecord->Predecessor();
		}
		return *this;
	}

    const RecordType& operator*() const
    {
        FBX_ASSERT( mRecord );

        return *mRecord;
    }

    RecordType& operator*()
    {
        FBX_ASSERT( mRecord );

        return *mRecord;
    }

    const RecordType* operator->() const
    {
        FBX_ASSERT( mRecord );

        return mRecord;
    }

    RecordType* operator->()
    {
        FBX_ASSERT( mRecord );

        return mRecord;
    }

    inline bool operator==(const FbxRedBlackIterator& pOther) const
    {
        return mRecord == pOther.mRecord;
    }

    inline bool operator !=(const FbxRedBlackIterator& pOther) const
    {
        return mRecord != pOther.mRecord;
    }

protected:
    RecordType* mRecord;

    friend class FbxRedBlackConstIterator<RecordType>;
};

template <typename RecordType> class FbxRedBlackConstIterator
{
public:
    FbxRedBlackConstIterator() : mRecord(0) {}
    FbxRedBlackConstIterator(const RecordType* pRecord) : mRecord(pRecord) {}
    FbxRedBlackConstIterator(const FbxRedBlackIterator<RecordType>& pV) : mRecord(pV.mRecord) {}
    FbxRedBlackConstIterator(const FbxRedBlackConstIterator<RecordType>& pV) : mRecord(pV.mRecord) {}

    FbxRedBlackConstIterator & operator++()
    {
        FBX_ASSERT( mRecord != NULL );
        mRecord = mRecord->Successor();
        return *this;
    }

    const FbxRedBlackConstIterator operator++(int)
    {
        FbxRedBlackConstIterator t(*this);
        operator++();
        return t;
    }

	FbxRedBlackConstIterator& operator+=(int pCount)
	{
		FBX_ASSERT( mRecord != NULL );
		for( int i = 0; i < pCount; ++i )
		{
			if( !mRecord ) break;
			mRecord = mRecord->Successor();
		}
		return *this;
	}

    FbxRedBlackConstIterator & operator--()
    {
        FBX_ASSERT( mRecord );
        mRecord = mRecord->Predecessor();
        return *this;
    }

    const FbxRedBlackConstIterator operator--(int)
    {
        FbxRedBlackConstIterator t(*this);
        operator--();
        return t;
    }

	FbxRedBlackConstIterator& operator-=(int pCount)
	{
		FBX_ASSERT( mRecord != NULL );
		for( int i = 0; i < pCount; ++i )
		{
			if( !mRecord ) break;
			mRecord = mRecord->Predecessor();
		}
		return *this;
	}

    const RecordType& operator*() const
    {
        FBX_ASSERT( mRecord );

        return *mRecord;
    }

    const RecordType& operator*()
    {
        FBX_ASSERT( mRecord );

        return *mRecord;
    }

    const RecordType* operator->() const
    {
        FBX_ASSERT( mRecord );

        return mRecord;
    }

    const RecordType* operator->()
    {
        FBX_ASSERT( mRecord );

        return mRecord;
    }

    inline bool operator==(const FbxRedBlackConstIterator& pOther) const
    {
        return mRecord == pOther.mRecord;
    }

    inline bool operator !=(const FbxRedBlackConstIterator& pOther) const
    {
        return mRecord != pOther.mRecord;
    }

protected:
    const RecordType* mRecord;

    friend class FbxRedBlackIterator<RecordType>;
};

//! Implements an efficient ordered data storage.
template <typename Type, typename Compare, typename Allocator> class FbxRedBlackTree
{
public:
    typedef Type DataType;
    typedef typename Type::KeyType         KeyType;
    typedef typename Type::ConstKeyType    ConstKeyType;
    typedef typename Type::ValueType       ValueType;
    typedef typename Type::ConstValueType  ConstValueType;
    typedef Allocator AllocatorType;

    /**
       This class represents a node in the tree. It contains the key,
       the value, and internal tree management data.
    */
    class RecordType
    {
    public:
        inline ConstKeyType& GetKey() const { return mData.GetKey(); }
        inline ConstValueType& GetValue() const { return mData.GetValue(); }
        inline ValueType& GetValue() { return mData.GetValue(); }

        inline const RecordType* Minimum() const
        {
            const RecordType* lParent = 0;
            const RecordType* lNode = this;
            while (lNode != 0)
            {
                lParent = lNode;
                lNode = lNode->mLeftChild;
            }

            return lParent;
        }

        inline RecordType* Minimum()
        {
            RecordType* lParent = 0;
            RecordType* lNode = this;
            while (lNode != 0)
            {
                lParent = lNode;
                lNode = lNode->mLeftChild;
            }

            return lParent;
        }

        inline const RecordType* Maximum() const
        {
            const RecordType* lParent = 0;
            const RecordType* lNode = this;
            while (lNode != 0)
            {
                lParent = lNode;
                lNode = lNode->mRightChild;
            }

            return lParent;
        }

        inline RecordType* Maximum()
        {
            RecordType* lParent = 0;
            RecordType* lNode = this;
            while (lNode != 0)
            {
                lParent = lNode;
                lNode = lNode->mRightChild;
            }

            return lParent;
        }

        inline const RecordType* Predecessor() const
        {
            if (mLeftChild)
            {
                return mLeftChild->Maximum();
            }
            else
            {
                const RecordType* lParent = mParent;
                const RecordType* lNode = this;

                while (lParent && lParent->mLefttChild == lNode)
                {
                    lNode = lParent;
                    lParent = lParent->mParent;
                }

                return lParent;
            }
        }

        inline RecordType* Predecessor()
        {
            if (mLeftChild)
            {
                return mLeftChild->Maximum();
            }
            else
            {
                RecordType* lParent = mParent;
                RecordType* lNode = this;

                while (lParent && lParent->mLeftChild == lNode)
                {
                    lNode = lParent;
                    lParent = lParent->mParent;
                }

                return lParent;
            }
        }

        inline const RecordType* Successor() const
        {
            if (mRightChild)
            {
                return mRightChild->Minimum();
            }
            else
            {
                const RecordType* lParent = mParent;
                const RecordType* lNode = this;

                while (lParent && lParent->mRightChild == lNode)
                {
                    lNode = lParent;
                    lParent = lParent->mParent;
                }

                return lParent;
            }
        }

        inline RecordType* Successor()
        {
            if (mRightChild)
            {
                return mRightChild->Minimum();
            }
            else
            {
                RecordType* lParent = mParent;
                RecordType* lNode = this;

                while (lParent && lParent->mRightChild == lNode)
                {
                    lNode = lParent;
                    lParent = lParent->mParent;
                }

                return lParent;
            }
        }

        inline const int GetBlackDepth() { return mBlackDepth; }

    private:
        enum ETreeType {eRed, eBlack};

        inline RecordType(const DataType& pData)
            : mData(pData)
            , mParent(0)
            , mLeftChild(0)
            , mRightChild(0)
            , mColor(eRed)
            , mBlackDepth(0)
        {
        }

        inline RecordType(const RecordType& pRecordType)
            : mData(pRecordType.mData)
            , mParent(0)
            , mLeftChild(0)
            , mRightChild(0)
            , mColor(pRecordType.mColor)
            , mBlackDepth(pRecordType.mBlackDepth)
        {
        }

        DataType mData;

        friend class FbxRedBlackTree;

        RecordType* mParent;
        RecordType* mLeftChild;
        RecordType* mRightChild;
        unsigned int mColor:2;
        unsigned int mBlackDepth:30;
    };

public:
    typedef FbxRedBlackConstIterator<RecordType>  ConstIteratorType;
    typedef FbxRedBlackIterator<RecordType>       IteratorType;

    inline FbxRedBlackTree() : mRoot(0), mSize(0), mAllocator(sizeof(RecordType)) {}
    inline FbxRedBlackTree(const FbxRedBlackTree& pTree) : mRoot(0), mSize(0), mAllocator(sizeof(RecordType)) { operator=(pTree); }
    inline ~FbxRedBlackTree() { Clear(); }

    /** Deep copy pTree in this. 
	* \param pTree The tree to copy in this tree. */
    inline FbxRedBlackTree& operator=(const FbxRedBlackTree& pTree)
    {
        if( this != &pTree )
        {
            Clear();

            mAllocator = pTree.mAllocator;

            if( pTree.mRoot )
            {
                void* lBuffer = mAllocator.AllocateRecords();
                mRoot = new(lBuffer) RecordType(*(pTree.mRoot));	//in-place new won't allocate memory, so it is safe
                mRoot->mLeftChild = DuplicateSubTree(pTree.mRoot->mLeftChild);
                mRoot->mRightChild = DuplicateSubTree(pTree.mRoot->mRightChild);

                if (mRoot->mLeftChild)
                {
                    mRoot->mLeftChild->mParent = mRoot;
                }

                if (mRoot->mRightChild)
                {
                    mRoot->mRightChild->mParent = mRoot;
                }
            }
            else
            {
                FBX_ASSERT( pTree.mSize == 0 );
                FBX_ASSERT( mRoot == 0 );
            }

            mSize = pTree.mSize;
        }

        return *this;
    }

    inline bool operator==(const FbxRedBlackTree& pTree) const
    {
        // Check a few quick shortcuts
        if( this == &pTree )
            return true;

        if( GetSize() != pTree.GetSize() )
            return false;

        // Iterator through all nodes; if we reach the end of both iterators at the same
        // time then we have two iterators that match.
        ConstIteratorType End;
        ConstIteratorType Iter1(Minimum());
        ConstIteratorType Iter2(pTree.Minimum());

        while( (Iter1 != End) && (Iter2 != End) &&
               (Iter1->GetKey() == Iter2->GetKey()) &&
               (Iter1->GetValue() == Iter2->GetValue()) )
        {
            ++Iter1;
            ++Iter2;
        }

        return Iter1 == End && Iter2 == End;
    }

    /** Ask Allocator to reserve space to hold pRecordCount elements. 
      * \param pRecordCount
      */
    inline void Reserve(unsigned int pRecordCount)
    {
        mAllocator.Reserve(pRecordCount);
    }

    /** Get the number of elements in the tree. Takes O(1) time.
      * \return The number of elements in the tree.
      */
    inline int GetSize() const { return mSize; }

    inline bool Empty() const { return mSize == 0; }

    /** Insert a new element in the tree. Takes O(log n) time.
      * \param pData The element to insert.
      * \return If pData.GetKey() is already present in the tree, returns the
      *         existing record and false; else returns the new record and true.
      */
    inline FbxPair<RecordType*, bool> Insert(const DataType& pData)
    {
        Compare lCompareKeys;
        bool lResult = false;
        RecordType* lParent = 0;
        RecordType* lNode = mRoot;
        while (lNode != 0)
        {
            const KeyType& lNodeKey = lNode->GetKey();
            const KeyType& lDataKey = pData.GetKey();

            if (lCompareKeys(lNodeKey, lDataKey) < 0)
            {
                lParent = lNode;
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNodeKey, lDataKey) > 0)
            {
                lParent = lNode;
                lNode = lNode->mLeftChild;
            }
            else
            {
                break;
            }
        }

        if (lNode == 0)
        {
            void* lBuffer = mAllocator.AllocateRecords();
            lNode = new(lBuffer) RecordType(pData);	//in-place new won't allocate memory, so it is safe
            mSize++;

			FBX_ASSERT(lNode == lBuffer);

            if (lParent)
            {
                if (lCompareKeys(lParent->GetKey(), pData.GetKey()) < 0)
                {
                    FBX_ASSERT(lParent->mRightChild == 0);
                    lParent->mRightChild = lNode;
                    lNode->mParent = lParent;
                }
                else
                {
                    FBX_ASSERT(lParent->mLeftChild == 0);
                    lParent->mLeftChild = lNode;
                    lNode->mParent = lParent;
                }
            }
            else
            {
                mRoot = lNode;
            }

            // Fix red black tree property
            FixNodesAfterInsertion(lNode);

            lResult = true;
        }

        return FbxPair<RecordType*, bool>(lNode, lResult);
    }

    /** Remove an element identified by a key from the tree. Takes O(log n) time.
      * \param pKey The key identifying the element to remove.
      */
    inline bool Remove(const KeyType& pKey)
    {
        Compare lCompareKeys;
        bool lResult = false;
        RecordType* lNode = mRoot;
        while (lNode != 0)
        {
            if (lCompareKeys(lNode->GetKey(), pKey) < 0)
            {
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNode->GetKey(), pKey) > 0)
            {
                lNode = lNode->mLeftChild;
            }
            else
            {
                break;
            }
        }

        if (lNode)
        {
            RemoveNode(lNode);
            mSize--;
            lNode->~RecordType();
            mAllocator.FreeMemory(lNode);

            lResult = true;
        }

        return lResult;
    }

    /** Remove all elements from the tree. Takes O(n) time. Recursive.
      */
    inline void Clear()
    {
        if (mRoot)
        {
            ClearSubTree(mRoot->mLeftChild);
            ClearSubTree(mRoot->mRightChild);
            mRoot->~RecordType();
            mAllocator.FreeMemory(mRoot);
            mRoot = 0;
            mSize = 0;
        }
    }

    /** Find the smallest element in the tree.
      * Takes O(log n) time.
      */
    inline const RecordType* Minimum() const
    {
        if (0 != mRoot)
        {
            return mRoot->Minimum();
        }
        else
        {
            return 0;
        }
    }

    /** Find the smallest element in the tree.
      * Takes O(log n) time.
      */
    inline RecordType* Minimum()
    {
        if (0 != mRoot)
        {
            return mRoot->Minimum();
        }
        else
        {
            return 0;
        }
    }

    /** Find the largest element in the tree.
      * Takes O(log n) time.
      */
    inline const RecordType* Maximum() const
    {
        if (0 != mRoot)
        {
            return mRoot->Maximum();
        }
        else
        {
            return 0;
        }
    }

    /** Find the largest element in the tree.
      * Takes O(log n) time.
      */
    inline RecordType* Maximum()
    {
        if (0 != mRoot)
        {
            return mRoot->Maximum();
        }
        else
        {
            return 0;
        }
    }

    /** Find the key-value pair with key pKey.
      * Takes O(log n) time.
      * \param pKey The key to look for.
      */
    inline const RecordType* Find(const KeyType& pKey) const
    {
        Compare lCompareKeys;
        const RecordType* lNode = mRoot;
        while (lNode != 0)
        {
            if (lCompareKeys(lNode->GetKey(), pKey) < 0)
            {
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNode->GetKey(), pKey) > 0)
            {
                lNode = lNode->mLeftChild;
            }
            else
            {
                break;
            }
        }

        return lNode;
    }

    /** Find the key-value pair with key pKey.
      * Takes O(log n) time.
      * \param pKey The key to look for.
      */
    inline RecordType* Find(const KeyType& pKey)
    {
        Compare lCompareKeys;
        RecordType* lNode = mRoot;
        while (lNode != 0)
        {
            if (lCompareKeys(lNode->GetKey(), pKey) < 0)
            {
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNode->GetKey(), pKey) > 0)
            {
                lNode = lNode->mLeftChild;
            }
            else
            {
                break;
            }
        }

        return lNode;
    }

    /** Find the key-value pair with the smallest key greater than pKey.
      * Takes O(log n) time.
      * \param pKey The key to look for.
      */
    inline const RecordType* UpperBound(const KeyType& pKey) const
    {
        Compare lCompareKeys;
        const RecordType* lNode = mRoot;
        const RecordType* lCandidate = 0;
        while (lNode != 0)
        {
            if (lCompareKeys(lNode->GetKey(), pKey) <= 0)
            {
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNode->GetKey(), pKey) > 0)
            {
                lCandidate = lNode;
                lNode = lNode->mLeftChild;
            }
        }
        
        return lCandidate;
    }

    /** Find the key-value pair with the smallest key greater than pKey.
      * Takes O(log n) time.
      * \param pKey The key to look for.
      */
    inline RecordType* UpperBound(const KeyType& pKey)
    {
        Compare lCompareKeys;
        RecordType* lNode = mRoot;
        RecordType* lCandidate = 0;
        while (lNode != 0)
        {
            if (lCompareKeys(lNode->GetKey(), pKey) <= 0)
            {
                lNode = lNode->mRightChild;
            }
            else if (lCompareKeys(lNode->GetKey(), pKey) > 0)
            {
                lCandidate = lNode;
                lNode = lNode->mLeftChild;
            }
        }
        
        return lCandidate;
    }

protected:
    RecordType* mRoot;
    int mSize;

    AllocatorType mAllocator;

    inline RecordType* DuplicateSubTree(const RecordType* pNode)
    {
        RecordType* lNewSubTree = 0;

        if (pNode)
        {
            void* lBuffer = mAllocator.AllocateRecords();
            lNewSubTree = new(lBuffer) RecordType(*pNode);	//in-place new won't allocate memory, so it is safe
            lNewSubTree->mLeftChild = DuplicateSubTree(pNode->mLeftChild);
            lNewSubTree->mRightChild = DuplicateSubTree(pNode->mRightChild);

            if (lNewSubTree->mLeftChild)
            {
                lNewSubTree->mLeftChild->mParent = lNewSubTree;
            }

            if (lNewSubTree->mRightChild)
            {
                lNewSubTree->mRightChild->mParent = lNewSubTree;
            }
        }

        return lNewSubTree;
    }

    inline void FixNodesAfterInsertion(RecordType* pNode)
    {
        RecordType* lNode = pNode;
        bool lDone = false;

        while (!lDone)
        {
            lDone = true;

            if (lNode->mParent == 0)
            {
                lNode->mColor = RecordType::eBlack;
            }
            else if (lNode->mParent->mColor == RecordType::eRed)
            {
                RecordType* lUncle = 0;
                if (lNode->mParent == lNode->mParent->mParent->mLeftChild)
                {
                    lUncle = lNode->mParent->mParent->mRightChild;
                }
                else if (lNode->mParent == lNode->mParent->mParent->mRightChild)
                {
                    lUncle = lNode->mParent->mParent->mLeftChild;
                }

                // since lNode->mParent is red, lNode->mParent->mParent exists

                if (lUncle && lUncle->mColor == RecordType::eRed)
                {
                    lNode->mParent->mColor = RecordType::eBlack;
                    lUncle->mColor = RecordType::eBlack;
                    lNode->mParent->mParent->mColor = RecordType::eRed;
                    lNode = lNode->mParent->mParent;

                    lDone = false;
                }
                else
                {
                    if ((lNode == lNode->mParent->mRightChild) &&
                        (lNode->mParent == lNode->mParent->mParent->mLeftChild))
                    {
                        LeftRotate(lNode->mParent);
                        lNode = lNode->mLeftChild;
                    }
                    else if ((lNode == lNode->mParent->mLeftChild) &&
                            (lNode->mParent == lNode->mParent->mParent->mRightChild))
                    {
                        RightRotate(lNode->mParent);
                        lNode = lNode->mRightChild;
                    }

                    lNode->mParent->mColor = RecordType::eBlack;
                    lNode->mParent->mParent->mColor = RecordType::eRed;
                    if ((lNode == lNode->mParent->mLeftChild) &&
                        (lNode->mParent == lNode->mParent->mParent->mLeftChild))
                    {
                        RightRotate(lNode->mParent->mParent);
                    }
                    else
                    {
                        LeftRotate(lNode->mParent->mParent);
                    }
                }
            }
        }

        mRoot->mColor = RecordType::eBlack;
    }

    inline void LeftRotate(RecordType* pNode)
    {
		FBX_ASSERT_RETURN(pNode);

        RecordType* lNode = pNode->mRightChild;
		FBX_ASSERT_RETURN(lNode);

	#ifdef _DEBUG
        RecordType* A = pNode->mLeftChild;
        RecordType* B = lNode->mLeftChild;
        RecordType* C = lNode->mRightChild;
        RecordType* Z = pNode->mParent;
	#endif

        pNode->mRightChild = lNode->mLeftChild;
        if (pNode->mRightChild)
        {
            pNode->mRightChild->mParent = pNode;
        }

        lNode->mParent = pNode->mParent;
        if (pNode->mParent == 0)
        {
            FBX_ASSERT(mRoot == pNode);
            mRoot = lNode;
        }
        else if (pNode == pNode->mParent->mLeftChild)
        {
            pNode->mParent->mLeftChild = lNode;
        }
        else
        {
            pNode->mParent->mRightChild = lNode;
        }
        pNode->mParent = lNode;
        lNode->mLeftChild = pNode;

        FBX_ASSERT(pNode->mLeftChild == A);
        FBX_ASSERT(pNode->mRightChild == B);
        FBX_ASSERT(pNode->mParent == lNode);

        FBX_ASSERT(lNode->mLeftChild == pNode);
        FBX_ASSERT(lNode->mRightChild == C);
        FBX_ASSERT(lNode->mParent == Z);

        FBX_ASSERT(A == 0 || A->mParent == pNode);
        FBX_ASSERT(B == 0 || B->mParent == pNode);
        FBX_ASSERT(C == 0 || C->mParent == lNode);
        FBX_ASSERT(Z == 0 || Z->mLeftChild == lNode || Z->mRightChild == lNode);
    }

    inline void RightRotate(RecordType* pNode)
    {
        RecordType* lNode = pNode->mLeftChild;

	#ifdef _DEBUG
        RecordType* A = lNode->mLeftChild;
        RecordType* B = lNode->mRightChild;
        RecordType* C = pNode->mRightChild;
        RecordType* Z = pNode->mParent;
	#endif

        pNode->mLeftChild = lNode->mRightChild;
        if (pNode->mLeftChild)
        {
            pNode->mLeftChild->mParent = pNode;
        }

        lNode->mParent = pNode->mParent;
        if (pNode->mParent == 0)
        {
            FBX_ASSERT(mRoot == pNode);
            mRoot = lNode;
        }
        else if (pNode == pNode->mParent->mRightChild)
        {
            pNode->mParent->mRightChild = lNode;
        }
        else
        {
            pNode->mParent->mLeftChild = lNode;
        }
        pNode->mParent = lNode;
        lNode->mRightChild = pNode;

        FBX_ASSERT(lNode->mLeftChild == A);
        FBX_ASSERT(lNode->mRightChild == pNode);
        FBX_ASSERT(lNode->mParent == Z);

        FBX_ASSERT(pNode->mLeftChild == B);
        FBX_ASSERT(pNode->mRightChild == C);
        FBX_ASSERT(pNode->mParent == lNode);

        FBX_ASSERT(A == 0 || A->mParent == lNode);
        FBX_ASSERT(B == 0 || B->mParent == pNode);
        FBX_ASSERT(C == 0 || C->mParent == pNode);
        FBX_ASSERT(Z == 0 || Z->mLeftChild == lNode || Z->mRightChild == lNode);
    }

    inline void RemoveNode(RecordType* pNode)
    {
        if (pNode->mLeftChild == 0)
        {
            if (pNode->mRightChild == 0)
            {
                if (pNode->mParent)
                {
                    if (pNode->mParent->mLeftChild == pNode)
                    {
                        pNode->mParent->mLeftChild = 0;
                    }
                    else if (pNode->mParent->mRightChild == pNode)
                    {
                        pNode->mParent->mRightChild = 0;
                    }
                    else
                    {
                        FBX_ASSERT_NOW("Node not found in FbxRedBlackTree");
                    }
                }
                else
                {
                    FBX_ASSERT(mRoot == pNode);
                    mRoot = 0;
                }

                if (pNode->mColor == RecordType::eBlack)
                {
                    FixNodesAfterRemoval(pNode->mParent, 0);
                }
            }
            else
            {
                if (pNode->mParent)
                {
                    if (pNode->mParent->mLeftChild == pNode)
                    {
                        pNode->mParent->mLeftChild = pNode->mRightChild;
                        pNode->mRightChild->mParent = pNode->mParent;
                    }
                    else if (pNode->mParent->mRightChild == pNode)
                    {
                        pNode->mParent->mRightChild = pNode->mRightChild;
                        pNode->mRightChild->mParent = pNode->mParent;
                    }
                    else
                    {
                        FBX_ASSERT_NOW("Node not found in FbxRedBlackTree");
                    }
                }
                else
                {
                    FBX_ASSERT(mRoot == pNode);
                    mRoot = pNode->mRightChild;
                    pNode->mRightChild->mParent = 0;
                }

                if (pNode->mColor == RecordType::eBlack)
                {
                    FixNodesAfterRemoval(pNode->mRightChild->mParent, pNode->mRightChild);
                }
            }
        }
        else
        {
            if (pNode->mRightChild == 0)
            {
                if (pNode->mParent)
                {
                    if (pNode->mParent->mLeftChild == pNode)
                    {
                        pNode->mParent->mLeftChild = pNode->mLeftChild;
                        pNode->mLeftChild->mParent = pNode->mParent;
                    }
                    else if (pNode->mParent->mRightChild == pNode)
                    {
                        pNode->mParent->mRightChild = pNode->mLeftChild;
                        pNode->mLeftChild->mParent = pNode->mParent;
                    }
                    else
                    {
                        FBX_ASSERT_NOW("Node not found in FbxRedBlackTree");
                    }
                }
                else
                {
                    FBX_ASSERT(mRoot == pNode);
                    mRoot = pNode->mLeftChild;
                    pNode->mLeftChild->mParent = 0;
                }

                if (pNode->mColor == RecordType::eBlack)
                {
                    FixNodesAfterRemoval(pNode->mLeftChild->mParent, pNode->mLeftChild);
                }
            }
            else
            {
                RecordType* lMinRightNode = pNode->mRightChild->Minimum();
                RemoveNode(lMinRightNode);

                lMinRightNode->mColor = pNode->mColor;
                ReplaceNode(pNode, lMinRightNode);
            }
        }

        pNode->mParent = 0;
        pNode->mLeftChild = 0;
        pNode->mRightChild = 0;
    }

    inline void ReplaceNode(RecordType* pNodeToReplace, RecordType* pReplacement)
    {
        pReplacement->mParent = pNodeToReplace->mParent;
        if (pNodeToReplace->mParent)
        {
            if (pNodeToReplace->mParent->mLeftChild == pNodeToReplace)
            {
                pNodeToReplace->mParent->mLeftChild = pReplacement;
            }
            else if (pNodeToReplace->mParent->mRightChild == pNodeToReplace)
            {
                pNodeToReplace->mParent->mRightChild = pReplacement;
            }
        }
        else
        {
            FBX_ASSERT(mRoot == pNodeToReplace);
            mRoot = pReplacement;
        }

        pReplacement->mLeftChild = pNodeToReplace->mLeftChild;
        if (pReplacement->mLeftChild)
        {
            pReplacement->mLeftChild->mParent = pReplacement;
        }

        pReplacement->mRightChild = pNodeToReplace->mRightChild;
        if (pReplacement->mRightChild)
        {
            pReplacement->mRightChild->mParent = pReplacement;
        }
    }

    inline RecordType* Sibling(const RecordType* pParent, const RecordType* pNode) const
    {
        if (pParent)
        {
            if (pParent->mLeftChild == pNode)
            {
                return pParent->mRightChild;
            }
            else if (pParent->mRightChild == pNode)
            {
                return pParent->mLeftChild;
            }
        }

        return 0;
    }

    inline bool IsBlack(const RecordType* pNode)
    {
        return ((pNode == 0) || (pNode->mColor == RecordType::eBlack));
    }

    inline void FixNodesAfterRemoval(RecordType* pParent, RecordType* pNode)
    {
        RecordType* lParent = pParent;
        RecordType* lNode = pNode;
        bool lDone = false;

        while (!lDone)
        {
            lDone = true;

            if (!IsBlack(lNode))
            {
                lNode->mColor = RecordType::eBlack;
            }
            else if (lParent != NULL)
            {
                RecordType* lSibling = Sibling(lParent, lNode);

                if (!IsBlack(lSibling))
                {
                    lParent->mColor = RecordType::eRed;
                    lSibling->mColor = RecordType::eBlack;
                    if (lNode == lParent->mLeftChild)
                    {
                        LeftRotate(lParent);
                    }
                    else
                    {
                        RightRotate(lParent);
                    }

                    // update sibling: it may have change after rotation
                    // parent was not affected by this rotation
                    lSibling = Sibling(lParent, lNode);
                }

                /* check this for null sibling */
                if (lSibling &&
                    IsBlack(lParent) &&
                    IsBlack(lSibling) &&
                    IsBlack(lSibling->mLeftChild) &&
                    IsBlack(lSibling->mRightChild))
                {
                    lSibling->mColor = RecordType::eRed;
                    lNode = lParent;
                    lParent = lParent->mParent;
                    lDone = false;
                }
                else
                {
                    if (!IsBlack(lParent) &&
                        IsBlack(lSibling) &&
                        ((lSibling == 0) || IsBlack(lSibling->mLeftChild)) &&
                        ((lSibling == 0) || IsBlack(lSibling->mRightChild)))
                    {
                        if (lSibling)
                        {
                            lSibling->mColor = RecordType::eRed;
                        }
                        lParent->mColor = RecordType::eBlack;
                    }
                    else if( lSibling != 0 )
                    {
                        if ((lNode == lParent->mLeftChild) &&
                            IsBlack(lSibling) &&
                            !IsBlack(lSibling->mLeftChild) &&
                            IsBlack(lSibling->mRightChild))
                        {
                            lSibling->mColor = RecordType::eRed;
                            lSibling->mLeftChild->mColor = RecordType::eBlack;
                            RightRotate(lSibling);
                        }
                        else if ((lNode == lParent->mRightChild) &&
                                 IsBlack(lSibling) &&
                                 IsBlack(lSibling->mLeftChild) &&
                                 !IsBlack(lSibling->mRightChild))
                        {
                            lSibling->mColor = RecordType::eRed;
                            lSibling->mRightChild->mColor = RecordType::eBlack;
                            LeftRotate(lSibling);
                        }

                        // update sibling: it may have change after rotation
                        lSibling = Sibling(lParent, lNode);
                        FBX_ASSERT(lSibling != 0 && lParent != 0); // lSibling is now
                                                 // the former red
                                                 // child of the
                                                 // former sibling

						if( lSibling != 0 && lParent != 0 )
						{
							lSibling->mColor = lParent->mColor;
							lParent->mColor = RecordType::eBlack;
							if (lNode == lParent->mLeftChild)
							{
								if (lSibling->mRightChild)
								{
									lSibling->mRightChild->mColor = RecordType::eBlack;
								}
								LeftRotate(lParent);
							}
							else
							{
								if (lSibling->mLeftChild)
								{
									lSibling->mLeftChild->mColor = RecordType::eBlack;
								}
								RightRotate(lParent);
							}
						}
                    }
                }
            }
        }

        if (mRoot)
        {
            mRoot->mColor = RecordType::eBlack;
        }
    }

    inline void ClearSubTree(RecordType* pNode)
    {
        if (pNode)
        {
            ClearSubTree(pNode->mLeftChild);
            ClearSubTree(pNode->mRightChild);
            pNode->~RecordType();
            mAllocator.FreeMemory(pNode);
        }
    }

    inline int GetSubTreeSize(RecordType* pNode) const
    {
        if (pNode)
        {
            return GetSubTreeSize(pNode->mLeftChild) + GetSubTreeSize(pNode->mRightChild) + 1;
        }
        else
        {
            return 0;
        }
    }

#if 0
    inline void IsSane()
    {
        FBX_ASSERT((mRoot == 0) || (mRoot->mColor == RecordType::eBlack));
        FBX_ASSERT(((mRoot == 0) && (mSize == 0)) || (mRoot != 0) && (mSize != 0));
        IsSubTreeSane(mRoot);

        ComputeBlackDepth(mRoot, 0);

        RecordType* lNode = mRoot;
        unsigned int lLeafBlackDepth = 0;
        while (lNode)
        {
            if (lNode->mLeftChild == 0)
            {
                lLeafBlackDepth = lNode->mBlackDepth + ((lNode->mColor == RecordType::eBlack) ? 1 : 0);
            }

            lNode = lNode->mLeftChild;
        }

        CheckLeavesBlackDepth(mRoot, lLeafBlackDepth);
    }

    inline void IsSubTreeSane(const RecordType* pNode) const
    {
        Compare lCompareKeys;

        if (pNode)
        {
            FBX_ASSERT(pNode != pNode->mParent);
            FBX_ASSERT(pNode != pNode->mLeftChild);
            FBX_ASSERT(pNode != pNode->mRightChild);

            // Check for two consecutive red nodes
            FBX_ASSERT((pNode->mColor == RecordType::eBlack) ||
                     (pNode->mLeftChild == NULL) ||
                     (pNode->mLeftChild->mColor == RecordType::eBlack));

            FBX_ASSERT((pNode->mColor == RecordType::eBlack) ||
                     (pNode->mRightChild == NULL) ||
                     (pNode->mRightChild->mColor == RecordType::eBlack));

            // Check key ordering
            FBX_ASSERT((pNode->mLeftChild == 0 ||
                      lCompareKeys(pNode->GetKey(), pNode->mLeftChild->GetKey()) > 0));

            FBX_ASSERT((pNode->mRightChild == 0 ||
                      lCompareKeys(pNode->GetKey(), pNode->mRightChild->GetKey()) < 0));

            IsSubTreeSane(pNode->mLeftChild);
            IsSubTreeSane(pNode->mRightChild);
        }
    }

	inline void ComputeBlackDepth(RecordType* pNode, unsigned int pDepth)
	{
		if( pNode )
		{
			pNode->mBlackDepth = pDepth;
			if( pNode->mColor == RecordType::eBlack )
			{
				pDepth++;
			}
			ComputeBlackDepth(pNode->mLeftChild, pDepth);
			ComputeBlackDepth(pNode->mRightChild, pDepth);
		}
	}

	inline void CheckLeavesBlackDepth(RecordType* pNode, unsigned int pBlackDepth)
	{
		if( pNode )
		{
			if( pNode->mLeftChild == 0 || pNode->mRightChild == 0 )
			{
				FBX_ASSERT((pNode->mBlackDepth + ((pNode->mColor == RecordType::eBlack) ? 1 : 0)) == pBlackDepth);
			}
			CheckLeavesBlackDepth(pNode->mLeftChild, pBlackDepth);
			CheckLeavesBlackDepth(pNode->mRightChild, pBlackDepth);
		}
	}
#endif
};

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /*_FBXSDK_CORE_BASE_REDBLACKTREE_H_ */
