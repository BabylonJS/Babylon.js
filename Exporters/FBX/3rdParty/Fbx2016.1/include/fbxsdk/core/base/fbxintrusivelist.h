/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxintrusivelist.h
#ifndef _FBXSDK_CORE_BASE_INTRUSIVE_LIST_H_
#define _FBXSDK_CORE_BASE_INTRUSIVE_LIST_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

#define FBXSDK_INTRUSIVE_LIST_NODE(Class, NodeCount)\
    public: inline FbxListNode<Class>& GetListNode(int index = 0){ return this->mNode[index]; }\
    private: FbxListNode<Class> mNode[NodeCount];

template <typename T> class FbxListNode
{
    typedef FbxListNode<T> NodeT; 

public:
	explicit FbxListNode(T* pData = 0):mNext(0),mPrev(0),mData(pData){}
	~FbxListNode(){ Disconnect(); }

	void Disconnect()
	{
		if ( mPrev != 0 )
			mPrev->mNext = mNext;

		if ( mNext != 0 )
			mNext->mPrev = mPrev;

		mPrev = mNext = 0;
	}

	NodeT*	mNext;
	NodeT*	mPrev;
	T*		mData;
};

//-----------------------------------------------------------------
// template arg T: Type listed
//          arg NodeIndex: If an object listed has  multiple list node, which
//                         index corresponds to the right node
template <typename T, int NodeIndex=0> class FbxIntrusiveList
{
public:
    typedef T         allocator_type;
    typedef T         value_type;
    typedef T&        reference;
    typedef const T&  const_reference;
    typedef T*        pointer;
    typedef const T*  const_pointer;

    typedef FbxListNode<T> NodeT;

    // Construction / Destruction
    FbxIntrusiveList():mHead(0)
    {
        mHead.mNext = mHead.mPrev = &mHead;
    }
    ~FbxIntrusiveList()
    {
        while(!Empty())
            Begin().Get()->Disconnect();  // LINUXNote:  should be Erase(Begin()); but there's an issue with gcc 4.2
    };

    // true if the list's size is 0.
    bool Empty() const
    {
        return ((mHead.mNext==&mHead)&&(mHead.mPrev==&mHead));
    }

    // Back Insertion Sequence  Inserts a new element at the end.  
    void PushBack(T& pElement)
    {
        NodeT* pNode = &pElement.GetListNode(NodeIndex);
        pNode->mData = &pElement;

        if (Empty())
        {
            pNode->mNext = &mHead;
            pNode->mPrev = &mHead;
            mHead.mNext = pNode;
            mHead.mPrev = pNode;
        }
        else
        {
            pNode->mNext = &mHead;
            pNode->mPrev = mHead.mPrev;

            pNode->mPrev->mNext = pNode;
            mHead.mPrev = pNode;
        }
    }

    void PushFront(T& pElement)
    {
        NodeT* pNode = &pElement.GetListNode(NodeIndex);
        pNode->mData = &pElement;

        if (Empty())
        {
            pNode->mNext = &mHead;
            pNode->mPrev = &mHead;
            mHead.mNext = pNode;
            mHead.mPrev = pNode;
        }
        else
        {
            pNode->mNext = mHead.mNext;
            pNode->mPrev = &mHead;

            pNode->mNext->mPrev = pNode;
            mHead.mNext = pNode;
        }
    }

    void PopFront()
    {
        iterator begin = Begin();
        Erase(begin);
    }

    void PopBack()
    {
        Erase(--(End()));
    }

public:
    class IntrusiveListIterator
    {
    public:
        explicit IntrusiveListIterator(NodeT* ptr=0):mPtr(ptr){}

        // pre-increment
        IntrusiveListIterator& operator++()
        {
            mPtr = mPtr->mNext;return (*this);
        }
        // post-increment
        const IntrusiveListIterator operator++(int)
        {
            IntrusiveListIterator temp = *this;
            ++*this;
            return (temp);
        }
        // pre-decrement
        IntrusiveListIterator& operator--()
        {
            mPtr = mPtr->mPrev;return *this;
        }
        // post-decrement
        const IntrusiveListIterator operator--(int)
        {
            IntrusiveListIterator temp = *this;
            --*this;
            return (temp);
        }
        IntrusiveListIterator& operator=(const IntrusiveListIterator &other){mPtr = other.mPtr; return *this;}

        reference operator*() const { return *(mPtr->mData); }
        pointer operator->() const { return (&**this); }
        bool operator==(const IntrusiveListIterator& other)const{ return mPtr==other.mPtr; } 
        bool operator!=(const IntrusiveListIterator& other)const{ return !(*this == other); } 

        inline NodeT* Get()const { return mPtr; }

    private:
        NodeT* mPtr;
    };

    class  IntrusiveListConstIterator
    {
    public:
        explicit IntrusiveListConstIterator(const NodeT* ptr=0):mPtr(ptr){}

       // pre-increment
        IntrusiveListConstIterator& operator++()
        {
            mPtr = mPtr->mNext;return (*this);
        }
        // post-increment
        const IntrusiveListConstIterator operator++(int)
        {
            IntrusiveListConstIterator temp = *this;
            ++*this;
            return (temp);
        }
        // pre-decrement
        IntrusiveListConstIterator& operator--()
        {
            mPtr = mPtr->mPrev;return *this;
        }
        // post-decrement
        const IntrusiveListConstIterator operator--(int)
        {
            IntrusiveListConstIterator temp = *this;
            --*this;
            return (temp);
        }
        IntrusiveListConstIterator& operator=(const IntrusiveListConstIterator &other){mPtr = other.mPtr; return *this;}

        const_reference operator*() const { return *(mPtr->mData); }
        const_pointer operator->() const { return (&**this); }
        bool operator==(const IntrusiveListConstIterator& other)const{ return mPtr==other.mPtr; } 
        bool operator!=(const IntrusiveListConstIterator& other)const{ return !(*this == other); } 

        inline const NodeT* Get()const { return mPtr; }

    private:
        mutable const NodeT* mPtr;
    };

    // --- Iterator definitions ---
    typedef IntrusiveListIterator iterator;
    typedef IntrusiveListConstIterator const_iterator;

    // iterator support
    inline iterator Begin() { return iterator(mHead.mNext); }
    inline const_iterator Begin() const { return const_iterator(mHead.mNext); }
    inline iterator End() { return iterator(&mHead); }
    inline const_iterator End() const { return const_iterator(&mHead); }

    // Because there is no real use, for the reverse iterators, 
    // they have not been implemented. 

    reference Front(){return (*Begin());}
    const_reference Front() const { return (*Begin()); }
    reference Back(){ return (*(--End())); }
    const_reference Back() const{ return (*(--End())); }

    iterator& Erase(iterator& it)
    {
        it.Get()->Disconnect();
        return (++it);
    }
private:
    NodeT mHead;

    // Not copyable
    FbxIntrusiveList(const FbxIntrusiveList&);
    FbxIntrusiveList& operator=(const FbxIntrusiveList& Right){return (*this);}
};

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_INTRUSIVE_LIST_H_ */
