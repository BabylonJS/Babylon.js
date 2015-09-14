/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpropertypage.h
#ifndef _FBXSDK_CORE_PROPERTY_PAGE_H_
#define _FBXSDK_CORE_PROPERTY_PAGE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstringlist.h>
#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/fbxsymbol.h>
#include <fbxsdk/core/fbxpropertydef.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

typedef FbxPair<FbxInt, const char*> FbxNameMapKey;

struct FbxNameMapCompare
{
	inline int operator()(const FbxNameMapKey& pKeyA, const FbxNameMapKey& pKeyB) const
	{
		if( pKeyA.mFirst < pKeyB.mFirst ) return -1;
		else if( pKeyA.mFirst > pKeyB.mFirst ) return 1;
		return strcmp(pKeyA.mSecond, pKeyB.mSecond);
	}
};

class FBXSDK_DLL FbxPropertyInfo
{
public:
    FBXSDK_FRIEND_NEW();
    static FbxPropertyInfo* Create(const char* pName, FbxPropertyPage* pTypeInfo)         { return FbxNew< FbxPropertyInfo >(pName,pTypeInfo); }
    static FbxPropertyInfo* Create(const char* pName, EFbxType   pType=eFbxUndefined)  { return FbxNew< FbxPropertyInfo >(pName,pType); }
    void                     Destroy()  { FbxDelete(this); }
    FbxPropertyInfo*        Clone(FbxPropertyPage* /*pPage*/)
    {
        // @@@@@ Filter is missing
        // @@@@@ Clone is incomplete
        if (mTypeInfo) 
		{
            return FbxNew< FbxPropertyInfo >(mName,mTypeInfo);
        } 
		else 
		{
            return FbxNew< FbxPropertyInfo >(mName,mType);
        }
    }

    inline void IncRef() { mRef++; }
    inline void DecRef() { mRef--; if (mRef==0) FbxDelete(this); }
    inline int  GetRef() { return mRef; }

	// Labels and Types

    inline FbxStringSymbol GetName() const             { return mName; }
    EFbxType            GetType() const;
    FbxPropertyPage*       GetTypeInfo() const             { return mTypeInfo; }

    inline void         SetLabel(const char* pLabel)    { mLabel=pLabel;          }
    inline const char*  GetLabel() const                { return mLabel.IsEmpty() ? "" : ((const char*)mLabel); }

    inline void     SetUserTag(int pUserTag)            { mUserTag=pUserTag;      }
    inline int      GetUserTag() const                  { return mUserTag;        }

    inline void     SetUserData(const void* pUserData)  { mUserData=(void*)pUserData;    }
    inline void*   GetUserData() const                 { return mUserData;       }

	// Enum list       
    int AddEnumValue(const char* pStringValue)
    {
		EFbxType lType = GetType();
        if (lType == eFbxEnum || lType == eFbxEnumM)
        {
            if (!mEnumList)
                mEnumList.Reset(FbxNew< FbxStringList >());

			bool lCanAdd = (lType == eFbxEnumM || mEnumList->FindIndex( pStringValue ) == -1);
            if( lCanAdd )
                return mEnumList->Add((char*)pStringValue);
        }
        return -1;
    }

    void InsertEnumValue(int pIndex, const char* pStringValue)
    {
        EFbxType lType = GetType();
        if (lType == eFbxEnum || lType == eFbxEnumM)
        {
            if (!mEnumList)
                mEnumList.Reset(FbxNew< FbxStringList >());

			bool lCanAdd = (lType == eFbxEnumM || mEnumList->FindIndex( pStringValue ) == -1);
            if( lCanAdd )
				mEnumList->InsertAt(pIndex,(char*)pStringValue);
        }
    }

    int GetEnumCount()
    {
        return mEnumList ? mEnumList->GetCount() : 0;
    }

    void SetEnumValue(int pIndex, const char* pStringValue)
    {
        EFbxType lType = GetType();
        if (lType == eFbxEnum || lType == eFbxEnumM)
        {
            if (!mEnumList)
                mEnumList.Reset(FbxNew< FbxStringList >());

			bool lCanAdd = (lType == eFbxEnumM || mEnumList->FindIndex( pStringValue ) == -1);
			if (lCanAdd)
				mEnumList->SetStringAt(pIndex,(char*)pStringValue);
        }
    }

    void RemoveEnumValue(int pIndex)
    {
        EFbxType lType = GetType();
        if (lType == eFbxEnum || lType == eFbxEnumM)
        {
            if (!mEnumList)
                mEnumList.Reset(FbxNew< FbxStringList >());

            mEnumList->RemoveAt(pIndex);
        }
    }

    char* GetEnumValue(int pIndex)
    {
		char* lValue = NULL;
        EFbxType lType = GetType();
        if (lType == eFbxEnum || lType == eFbxEnumM)
		{
            lValue = mEnumList ? mEnumList->GetStringAt(pIndex) : 0;
        }
        return lValue;
    }


	// Min and Max values       
    enum EValueIndex {eValueMin, eValueSoftMin, eValueMax, eValueSoftMax, eValueCount};

	bool HasMinMax(EValueIndex pId) const
	{
		return mMinMaxValue[pId] != NULL;
	}

	bool GetMinMax(EValueIndex pId, void* pValue, EFbxType pValueType) const
	{
		if (mMinMaxValue[pId]) {
			return FbxTypeCopy(pValue, pValueType, mMinMaxValue[pId], GetType());
		}
		return false;
	}

	bool SetMinMax(EValueIndex pId, const void* pValue, EFbxType pValueType)
	{
		if (!mMinMaxValue[pId]) {
		  size_t lSize = FbxTypeSizeOf(GetType());
			if (lSize) {
				mMinMaxValue[pId] = FbxMalloc(lSize);
			}
		}
		if (mMinMaxValue[pId]) {
			return FbxTypeCopy(mMinMaxValue[pId], GetType(), pValue, pValueType);
		}
		return false;
	}

private:
	 FbxPropertyInfo(const char* pName, FbxPropertyPage* pTypeInfo)
        : mRef(0)
        , mName(pName)
        , mType(eFbxUndefined)
        , mTypeInfo(pTypeInfo)
        , mUserTag(0)
        , mUserData(0)
        , mFilter(0)
    {
        for (int i=0; i<eValueCount; i++) {
            mMinMaxValue[i] = 0;
        }
    }

    FbxPropertyInfo(FbxStringSymbol pName,FbxPropertyPage *pTypeInfo)
        : mRef(0)
        , mName(pName)
        , mType(eFbxUndefined)
        , mTypeInfo(pTypeInfo)
        , mUserTag(0)
        , mUserData(0)
        , mFilter(0)
    {
        for (int i=0; i<eValueCount; i++) {
            mMinMaxValue[i] = 0;
        }
    }

    FbxPropertyInfo(const char* pName, EFbxType pType)
        : mRef(0)
        , mName(pName)
        , mType(pType)
        , mTypeInfo(0)
        , mUserTag(0)
        , mUserData(0)
        , mFilter(0)
    {
        for (int i=0; i<eValueCount; i++) {
            mMinMaxValue[i] = 0;
        }
    }
    ~FbxPropertyInfo()
    {
        for (int i=eValueMin; i<eValueCount; i++) {
            FbxFree(mMinMaxValue[i]);
        }
    }

    int								mRef;
    FbxStringSymbol					mName;
    FbxStringSymbol					mLabel;
    EFbxType						mType;
    FbxPropertyPage*				mTypeInfo;
    int								mUserTag;
    void*							mMinMaxValue[eValueCount];  
    void*							mUserData;
    FbxConnectionPointFilter*		mFilter;
    FbxAutoDeletePtr<FbxStringList>	mEnumList;
};

#if defined(FBXSDK_COMPILER_MSC)
	#pragma warning (push)
	#pragma warning (disable: 4355)
#endif

class FBXSDK_DLL FbxPropertyConnect
{
public:
    FBXSDK_FRIEND_NEW();
    static FbxPropertyConnect* Create(FbxPropertyPage* pPage,FbxInt pId)  { return FbxNew< FbxPropertyConnect >(pPage,pId); }
    void                        Destroy() { FbxDelete(this); }
    FbxPropertyConnect*        Clone(FbxPropertyPage* pPage)
    {
        return FbxNew< FbxPropertyConnect >(pPage,mId);
    }
       
    inline void IncRef() { mRef++; }
    inline void DecRef() { mRef--; if (mRef==0) FbxDelete(this); }
    inline int  GetRef() { return mRef; }

// Properties       
    FbxPropertyPage*   GetPage()       { return mPage; }
    FbxInt      GetPropertyId() { return mId; }

// ClearConnectCache()
// ------------------------------------------------------
    inline void ClearConnectCache()
    {
        mConnectionPoint.SubConnectRemoveAll();
    }

	//! Clear all connect without sending any notification (Internal use ONLY)
	inline void WipeAllConnections()
	{
		mConnectionPoint.WipeConnectionList();
	}

// Properties        
    inline bool ConnectSrc(FbxPropertyConnect* pSrc, FbxConnection::EType pType)
    {
        return mConnectionPoint.ConnectSrc(&pSrc->mConnectionPoint,pType);
    }
    inline bool DisconnectSrc(FbxPropertyConnect* pSrc)
    {
        return mConnectionPoint.DisconnectSrc(&pSrc->mConnectionPoint);
    }
    inline bool IsConnectedSrc(FbxPropertyConnect* pSrc)
    {
        return mConnectionPoint.IsConnectedSrc(&pSrc->mConnectionPoint);
    }
    inline int GetSrcCount(FbxConnectionPointFilter* pFilter)
    {
        return mConnectionPoint.GetSrcCount(pFilter);
    }
    inline FbxPropertyConnect* GetSrc(FbxConnectionPointFilter* pFilter, int pIndex)
    {
		FbxConnectionPoint *lCP = mConnectionPoint.GetSrc(pIndex,pFilter);
        return lCP ? (FbxPropertyConnect * )lCP->GetData() : 0;
    }
    inline bool ConnectDst(FbxPropertyConnect* pDst, FbxConnection::EType pType)
    {
        return mConnectionPoint.ConnectDst(&pDst->mConnectionPoint,pType);
    }
    inline bool IsConnectedDst(FbxPropertyConnect* pSrc)
    {
        return mConnectionPoint.IsConnectedSrc(&pSrc->mConnectionPoint);
    }
    inline bool DisconnectDst(FbxPropertyConnect* pDst)
    {
        return mConnectionPoint.DisconnectDst(&pDst->mConnectionPoint);
    }
    inline int GetDstCount(FbxConnectionPointFilter* pFilter)
    {
        return mConnectionPoint.GetDstCount(pFilter);
    }
    inline FbxPropertyConnect* GetDst(FbxConnectionPointFilter* pFilter, int pIndex)
    {
		FbxConnectionPoint *lCP = mConnectionPoint.GetDst(pIndex,pFilter);
        return lCP ? (FbxPropertyConnect * )lCP->GetData() : 0;
    }

    int					mRef;
    FbxConnectionPoint	mConnectionPoint;
    FbxPropertyPage*	mPage;
    FbxInt				mId;

private:
	FbxPropertyConnect(FbxPropertyPage* pPage,FbxInt pId) :
		mRef(0),
		mConnectionPoint(this),
		mPage(pPage),
		mId(pId)
	{
	}

	~FbxPropertyConnect(){ if( FbxObject::GetWipeMode() ) mConnectionPoint.WipeConnectionList(); }
};

#if defined(FBXSDK_COMPILER_MSC)
	#pragma warning (pop)
#endif

class FBXSDK_DLL FbxPropertyEntry
{
public:
	static FbxPropertyEntry* Create(FbxInt pParentId, FbxPropertyInfo* pInfo, FbxPropertyValue* pValue, FbxPropertyConnect* pConnect){ return FbxNew<FbxPropertyEntry>(pParentId, pInfo, pValue, pConnect); }

	void Destroy() { FbxDelete(this); }
        
	inline FbxInt GetParentId(){ return mParentId; }
	inline bool IsEmpty(){ return (mInfo || mValue || mConnect || mFlags.GetMask() != 0) ? false : true; }

	inline FbxPropertyInfo* Get(const FbxPropertyInfo* /*pType*/){ return mInfo; }

	void Set(FbxPropertyInfo* pInfo)
	{
		FbxPropertyInfo* lInfo = mInfo;
		if( pInfo ) pInfo->IncRef();
		mInfo = pInfo;
		if( lInfo ) lInfo->DecRef();
	}

	inline FbxPropertyValue* Get(const FbxPropertyValue* /*pType*/){ return mValue; }

	void Set(FbxPropertyValue* pValue)
	{
		FbxPropertyValue* lValue = mValue;
		if( pValue ) pValue->IncRef();
		mValue = pValue;
		if( lValue ) lValue->DecRef();
	}

	inline FbxPropertyConnect* Get(const FbxPropertyConnect* /*pType*/){ return mConnect; }

	void Set(FbxPropertyConnect* pConnect)
	{
		FbxPropertyConnect* lConnect = mConnect;
		if( pConnect ) pConnect->IncRef();
		mConnect = pConnect;
		if( lConnect ) lConnect->DecRef();
	}

	inline FbxPropertyFlags* Get(const FbxPropertyFlags* /*pType*/){ return &mFlags; }
	inline void Set(FbxPropertyFlags pType){ mFlags = pType; }
	inline void Set(FbxPropertyFlags* pType){ mFlags = pType ? *pType : FbxPropertyFlags(FbxPropertyFlags::eNone); }

private:
	FbxPropertyEntry(FbxInt pParentId,FbxPropertyInfo *pInfo,FbxPropertyValue *pValue,FbxPropertyConnect *pConnect) :
		mInfo(pInfo),
		mValue(pValue),
		mConnect(pConnect),
		mParentId(pParentId),
		mFlags(FbxPropertyFlags::eNone)
	{
		if( mInfo ) mInfo->IncRef();
		if( mValue ) mValue->IncRef();
		if( mConnect ) mConnect->IncRef();
	}

	~FbxPropertyEntry()
	{
		if( mInfo ) mInfo->DecRef();
		if( mValue ) mValue->DecRef();
		if( mConnect ) mConnect->DecRef();
	}

	FbxPropertyInfo*	mInfo;
	FbxPropertyValue*	mValue;
	FbxPropertyConnect*	mConnect;
	FbxInt				mParentId;
	FbxPropertyFlags	mFlags;

	FBXSDK_FRIEND_NEW();
	friend class FbxPropertyPage;
};

class FBXSDK_DLL FbxPropertyIdGenerator
{
public:
	FbxPropertyIdGenerator() : mRef(0), mNextId(0) {}

	inline FbxInt GetNextId() const { return mNextId; }
	inline FbxInt GetNextIdAndInc() { return mNextId++; }

	inline void IncRef() { mRef++; }
	inline void DecRef() { mRef--; if( mRef == 0 ) FbxDelete(this); }

private:
	FbxInt mRef, mNextId;
};

class FBXSDK_DLL FbxPropertyPage
{

public:
    FBXSDK_FRIEND_NEW();
    static FbxPropertyPage* Create (FbxPropertyPage* pInstanceOf=0)       { return FbxNew< FbxPropertyPage >(pInstanceOf);     }
    static FbxPropertyPage*     Create (const char* pName, FbxPropertyPage* pTypeInfo)    { return FbxNew< FbxPropertyPage >(pName,pTypeInfo); }
    static FbxPropertyPage*     Create (const char* pName, EFbxType    pType=eFbxUndefined)     { return FbxNew< FbxPropertyPage >(pName,pType);     }
    void                     Destroy() { FbxDelete(this); }

	template<class T> inline T* GetPropertyItem(const T* pItemType,FbxInt pIndex,FbxPropertyPage **pFoundIn=0) const
    {
      FbxPropertyPage*     lReferencePage = 0;
      FbxPropertyEntry*    lReferenceEntry = GetPropertyEntry(pIndex,&lReferencePage);
        if (pFoundIn) *pFoundIn = 0;
        if (lReferenceEntry) {
          T* lItem = lReferenceEntry->Get( FBX_TYPE(T) );
            if (lItem) {
                if (pFoundIn) *pFoundIn = lReferencePage;
                return lItem;
            } else {
                return lReferencePage->mInstanceOf ? lReferencePage->mInstanceOf->GetPropertyItem(pItemType,pIndex,pFoundIn) : 0 ;
            }
        }
        return 0;
    }

	template<class T> inline T* ChangePropertyItemState(const T* pItemType, FbxInt pIndex, FbxPropertyFlags::EInheritType pInheritType)
	{
		FbxPropertyPage*	lReferencePage = NULL;
		T*					lItem = GetPropertyItem(pItemType, pIndex, &lReferencePage);
		if( pInheritType == FbxPropertyFlags::eOverride )
		{
			if( lReferencePage == this )
			{
				return lItem;
			}
			else if( lItem )
			{
				FbxPropertyEntry* lEntry = ChangePropertyEntryState(pIndex, FbxPropertyFlags::eOverride);
				lEntry->Set(lItem->Clone(this));
				return lEntry->Get(FBX_TYPE(T));
			}
		}
		else
		{
			// can't inherit entries that were created on our page.
			bool lOwnEntry = !mInstanceOf || (mInstanceOf->GetPropertyItem(pItemType, pIndex) == NULL);
			if( lOwnEntry && FbxPropertyFlags::eInherit == pInheritType) return 0;

			if( lItem && (lReferencePage == this) )
			{
				FbxPropertyEntry* lEntry = GetPropertyEntry(pIndex);
				lEntry->Set((T*)0);
				if( lEntry->IsEmpty() )
				{
					ChangePropertyEntryState(pIndex, FbxPropertyFlags::eInherit);
				}
			}
			return 0;
		}
		return 0;
	}

	template<class T> FbxPropertyPage* GetFirstPropertyItem(FbxInt pId, const T* pItem) const
	{
		FbxPropertyPage* lReferencePage = NULL;
		GetPropertyItem(FBX_TYPE(T), pId, &lReferencePage);
		if( lReferencePage && lReferencePage->mInstanceOf )
		{
			FbxPropertyPage* lReferencePage2 = lReferencePage->mInstanceOf->GetFirstPropertyItem(pId, pItem);
			return lReferencePage2 ? lReferencePage2 : lReferencePage;
		}
		return lReferencePage;
	}

    const char* GetName(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? ((const char*)lPropertyInfo->GetName()) : "";
    }

    const char* GetLabel(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? ((const char*)lPropertyInfo->GetLabel()) : "";
    }

    bool SetLabel(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT, const char* pLabel="")
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
		if (lPropertyInfo) {
			lPropertyInfo->SetLabel(pLabel);
			return true;
		} else {
			return false;
        }
    }

    void* GetUserData(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? lPropertyInfo->GetUserData() : 0;
    }

    bool SetUserData(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT, const void* pUserData=0)
    {
      FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
          // Don't make it writeable (Keep it shared)
          if (lPropertyInfo) {
              lPropertyInfo->SetUserData(pUserData);
              return true;
          } else {
              return false;
          }
    }

    int GetUserTag(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
    {
      FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? lPropertyInfo->GetUserTag() : 0;
    }

    bool SetUserTag(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT,int pUserTag=0)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
          // Don't make it writeable (Keep it shared)
		if (lPropertyInfo) {
			lPropertyInfo->SetUserTag(pUserTag);
			return true;
		} else {
			return false;
		}
    }

    EFbxType GetType(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT) const
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? lPropertyInfo->GetType() : eFbxUndefined;
    }

    FbxInt GetParent(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT) const
    {
		FbxPropertyEntry* lPropertyEntry = GetPropertyEntry( pId );
        return lPropertyEntry ? lPropertyEntry->GetParentId() : FBXSDK_PROPERTY_ID_NULL;
    }

    FbxPropertyPage* GetTypeInfo(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? lPropertyInfo->GetTypeInfo() : 0;
    }
    FbxInt Add(FbxInt pParentId, const char* pName, EFbxType pType)
    {
        return Add(pParentId,FbxPropertyInfo::Create(pName,pType),FbxPropertyValue::Create(0,pType),0);
    }
    FbxInt Add(FbxInt pParentId, const char* pName, FbxPropertyPage* pTypeInfo)
    {
        return Add(pParentId,FbxPropertyInfo::Create(pName,pTypeInfo),FbxPropertyValue::Create(0,pTypeInfo->GetType()),0);
    }

    inline bool Reparent( FbxInt /*pChildId*/, FbxInt /*pNewParentId*/ )
    {
        // Not implemented.
        /*
        if( GetParent(pChildId) != pNewParentId  && pChildId < mEntries.GetCount() )
        {
            FbxPropertyEntry* lChildEntry = mEntries[pChildId];
            lChildEntry->mParentId = pNewParentId;

            //@@@@@ TODO: propagate to instances

            return true;
        }
        */
        return false;
    }

    inline bool IsChildOf(FbxInt pId,FbxInt pParentId) const
    {
        return GetParent(pId)==pParentId;

    }

    inline bool IsDescendentOf(FbxInt pId,FbxInt pAncestorId) const
    {
		if (pAncestorId>0) {
            FbxInt lParentId = GetParent(pId);
            while (lParentId != FBXSDK_PROPERTY_ID_NULL ) {
                if (lParentId==pAncestorId) {
                    return true;
                }
                lParentId = GetParent(lParentId);
            }
            return false;
        } else {
            return true;
        }

    }

    //#define PROPERTY_PAGE_SANITY_CHECK  // Debug purpose only. Never enable it in a production release.

    /** Retrieves the first child property id of a specified property id.
    * \param pParentId The specified property id
    * \return the first child property id
    */
    FbxInt GetChild(FbxInt pParentId=FBXSDK_PROPERTY_ID_ROOT) const
    {
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FbxInt ret0 = FBXSDK_PROPERTY_ID_NULL;
            if (pParentId!=FBXSDK_PROPERTY_ID_NULL) {
            FbxInt       lId        = GetMinimumPropertyId(pParentId);
            FbxInt       lParentId  = GetParent(lId);
            const FbxInt lLastId    = GetPropertyEntryCount();

            while (lId<lLastId && lParentId!=pParentId) lParentId=GetParent(++lId);
            ret0 = lId<lLastId ? lId : FBXSDK_PROPERTY_ID_NULL;
        } else {
            ret0 = FBXSDK_PROPERTY_ID_NULL;
        }
    #endif
        FbxInt ret1 = FBXSDK_PROPERTY_ID_NULL;
        if (pParentId != FBXSDK_PROPERTY_ID_NULL)
        {
            FbxPropertyEntry* lEntry;
            FbxInt lId = pParentId;
            do 
            {
                lId = GetMinimumPropertyIdAndEntry(lId, &lEntry);
            } while (lId != FBXSDK_PROPERTY_ID_NULL && lEntry->GetParentId() != pParentId);
            ret1 = lId;
        }
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FBX_ASSERT(ret0==ret1);
    #endif
        return ret1;
    }

    /** Retrieves the next sibling property id of a specified property id.
    * \param pId The specified property id
    * \return the next sibling property id
    */
    FbxInt GetSibling(FbxInt pId) const
    {
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FbxInt pIdBackup = pId;
        FbxInt ret0 = FBXSDK_PROPERTY_ID_NULL;
        if (pId!=FBXSDK_PROPERTY_ID_NULL) {
            FbxInt       lReferenceParentId = GetParent(pId);
            FbxInt       lParentId          = GetParent(++pId);
            const FbxInt lLastId            = GetPropertyEntryCount();

            while (pId<lLastId && lReferenceParentId!=FBXSDK_PROPERTY_ID_NULL && lParentId!=lReferenceParentId)
                lParentId=GetParent(++pId);
            ret0 = pId<lLastId ? pId : FBXSDK_PROPERTY_ID_NULL;
        } else {
            ret0 = FBXSDK_PROPERTY_ID_NULL;
        }
        pId = pIdBackup;
    #endif
        FbxInt ret1 = FBXSDK_PROPERTY_ID_NULL;
        if (pId != FBXSDK_PROPERTY_ID_NULL)
        {
            FbxInt lReferenceParentId = GetParent(pId);

            if (lReferenceParentId != FBXSDK_PROPERTY_ID_NULL)
            {
                FbxPropertyEntry *lEntry;
                do 
                {
                    pId = GetMinimumPropertyIdAndEntry(pId, &lEntry);
                } while (pId != FBXSDK_PROPERTY_ID_NULL && lEntry->GetParentId() != lReferenceParentId);

                ret1 = pId;
            }
        }

    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FBX_ASSERT(ret0==ret1);
    #endif
        return ret1;
    }

    /** Retrieves the first descendent property id of a specified property id.
    * \param pAnscestorId The specified property id
    * \return the first descendent property id
    */
    FbxInt GetFirstDescendent(FbxInt pAnscestorId=FBXSDK_PROPERTY_ID_ROOT) const
    {
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FbxInt ret0 = FBXSDK_PROPERTY_ID_NULL;
        if (pAnscestorId!=FBXSDK_PROPERTY_ID_NULL) {
            FbxInt       lId        = GetMinimumPropertyId(pAnscestorId);
            FbxInt       lParentId  = GetParent(lId);
            const FbxInt lLastId    = GetPropertyEntryCount();

            while (lId<lLastId) {
                if( lParentId!=FBXSDK_PROPERTY_ID_NULL && IsDescendentOf(lId,pAnscestorId) )
                {
                    ret0 = lId;
                    break;
                }
                lParentId = GetParent(++lId);
            }
        }
    #endif
        FbxInt ret1 = FBXSDK_PROPERTY_ID_NULL;
        FbxInt lId = pAnscestorId;
        FbxPropertyEntry* lEntry;
        if (pAnscestorId != FBXSDK_PROPERTY_ID_NULL)
        {
            for(;;)
            {
                lId  = GetMinimumPropertyIdAndEntry(lId, &lEntry);
                if (lId == FBXSDK_PROPERTY_ID_NULL)
                    break;
                if(lEntry->GetParentId() != FBXSDK_PROPERTY_ID_NULL && IsDescendentOf(lId, pAnscestorId))
                {
                    ret1 = lId;
                    break;
                }
            }
        }

    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FBX_ASSERT(ret0==ret1);
    #endif
        return ret1;
    }

    /** Retrieves the next descendent property id of a specified property id, with given a descendent property id.
    * \param pAnscestorId The specified property id
    * \param pId The descendent property id
    * \return the next descendent property id
    */
    FbxInt GetNextDescendent(FbxInt pAnscestorId, FbxInt pId) const
    {
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FbxInt pIdBackup = pId;
        FbxInt ret0 = FBXSDK_PROPERTY_ID_NULL;
        if (pId!=FBXSDK_PROPERTY_ID_NULL) {
            FbxInt       lParentId  = GetParent(++pId);
            const FbxInt lLastId    = GetPropertyEntryCount();

            while (pId<lLastId) {
                // GetParent returns null when the given id isn't in our page,
                // or our ancestor's page.
                if( lParentId != FBXSDK_PROPERTY_ID_NULL && IsDescendentOf(pId, pAnscestorId) )
                {
                    ret0 = pId;
                    break;
                }

                lParentId = GetParent(++pId);
            }
        }
        
        pId = pIdBackup;
    #endif
        FbxInt ret1 = FBXSDK_PROPERTY_ID_NULL;
        if (pId != FBXSDK_PROPERTY_ID_NULL)
        {
            FbxPropertyEntry* lEntry;
            for(;;)
            {
                pId = GetMinimumPropertyIdAndEntry(pId, &lEntry);
                if (pId == FBXSDK_PROPERTY_ID_NULL)
                    break;
                if(lEntry->GetParentId() != FBXSDK_PROPERTY_ID_NULL && IsDescendentOf(pId, pAnscestorId) )
                {
                    ret1 = pId;
                    break;
                }
            }

        }
    #ifdef PROPERTY_PAGE_SANITY_CHECK
        FBX_ASSERT(ret0==ret1);
    #endif
        return ret1;

    }

    FbxInt FastFind (FbxInt pId, const char* pName, FbxPropertyPage* pTypeInfo, bool pCaseSensitive)
    {
        FbxInt lId = FBXSDK_PROPERTY_ID_NULL;

        bool lSlowQuery = true;
        if( mNameMap.mSecond.GetSize() > 0 )
        {
            lSlowQuery = false;
            // try to use the map if we've got it
            NameMap::RecordType* lIterator = mNameMap.mSecond.Find( FbxNameMapKey( pId, pName ) );
            if( !lIterator )
            {
                lId = FBXSDK_PROPERTY_ID_NULL;
            }
            else
            {
                lId = lIterator->GetValue();
                if (lId != FBXSDK_PROPERTY_ID_NULL && pTypeInfo)
                {
                    lSlowQuery = true;

                    // Try to match types.
                    // If they are mismatched, fall back to the slow query,
                    // since we might have multiple property with the same name but different types
                    FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo), lId );
                    if (lPropertyInfo)
                    {
                        FbxPropertyPage* lTypeInfo2 = lPropertyInfo->GetTypeInfo();
                        if ( lTypeInfo2 && lTypeInfo2->Is(pTypeInfo) )
                        {
                            lSlowQuery = false;
                        }
                    }
                }
            }
        }

        if (!lSlowQuery)
            return lId;

        // fall back if there's no map or we got one with a different type

        lId = GetChild(pId);
        FbxStringSymbol lSearchSymbol( pName );
        while( lId != FBXSDK_PROPERTY_ID_NULL ) {
			FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo), lId );
            if  ( (!pTypeInfo || lPropertyInfo->GetTypeInfo()->Is(pTypeInfo)) &&
                ((!pCaseSensitive && FBXSDK_stricmp(lPropertyInfo->GetName(),pName)==0) ||
                (pCaseSensitive && lPropertyInfo->GetName() == lSearchSymbol)) ) {
                return lId;
            }
            lId = GetSibling(lId);
        }

        return FBXSDK_PROPERTY_ID_NULL;
    }

    FbxInt Find (FbxInt pId, const char* pName, FbxPropertyPage* pTypeInfo, bool pCaseSensitive, const char* pChildrenSeparators )
    {
		if (pChildrenSeparators) 
		{
			FbxInt	lId;
			size_t	lFoundIndex = strcspn(pName,pChildrenSeparators);

            // Strip the first part of the name and search
            if (lFoundIndex<strlen(pName)) 
			{
				FbxString	pRootName;
                pRootName.Append(pName,lFoundIndex);
                lId = FastFind(pId,pRootName.Buffer(),NULL,pCaseSensitive);
                return lId != FBXSDK_PROPERTY_ID_NULL ? Find(lId,pName+lFoundIndex+1,pTypeInfo,pCaseSensitive,pChildrenSeparators) : lId;
            } else {
                return FastFind(pId,pName,pTypeInfo,pCaseSensitive);
            }
        } else {
            return FastFind(pId,pName,pTypeInfo,pCaseSensitive);
        }
    }

// Enum list        
    int AddEnumValue(FbxInt pId, const char* pStringValue)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        return lPropertyInfo ? lPropertyInfo->AddEnumValue(pStringValue) : - 1;
    }

    void InsertEnumValue(FbxInt pId, int pIndex, const char* pStringValue)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        if (lPropertyInfo) lPropertyInfo->InsertEnumValue(pIndex,pStringValue);
    }

    int GetEnumCount(FbxInt pId)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        return lPropertyInfo ? lPropertyInfo->GetEnumCount() : 0;
    }

    void SetEnumValue(FbxInt pId, int pIndex, const char* pStringValue)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        if (lPropertyInfo) lPropertyInfo->SetEnumValue(pIndex,pStringValue);
    }

    void RemoveEnumValue(FbxInt pId, int pIndex)
    {
		 FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        if (lPropertyInfo) lPropertyInfo->RemoveEnumValue(pIndex);
    }

    char* GetEnumValue(FbxInt pId,int pIndex)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        return lPropertyInfo ? lPropertyInfo->GetEnumValue(pIndex) : (char*)"";
    }

    // Connection
    // ---------------------------------
    void ClearConnectCache(FbxInt pId)
    {
		FbxPropertyPage*     lReferencePage = 0;
		FbxPropertyConnect*	lPropertyConnect = GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        // Connections are not considered propagated so
        // make sure that we own the FbxPropertyConnect objects
        if (lPropertyConnect) {
            lPropertyConnect->ClearConnectCache();
        }
    }

	void WipeAllConnections(FbxInt pId)
	{
        FbxPropertyPage*		lReferencePage = 0;
        FbxPropertyConnect*	lPropertyConnect = GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        if (lPropertyConnect) {
            lPropertyConnect->WipeAllConnections();
        }
	}

    bool ConnectSrc(FbxInt pDstId, FbxPropertyPage* pSrcPage, FbxInt pSrcId, FbxConnection::EType pType)
    {
		FbxPropertyEntry*    lDstEntry = ChangePropertyEntryState(pDstId,FbxPropertyFlags::eOverride);
		FbxPropertyEntry*    lSrcEntry = pSrcPage->ChangePropertyEntryState(pSrcId,FbxPropertyFlags::eOverride);
		FbxPropertyConnect*  lDstConnect= lDstEntry->Get( FBX_TYPE(FbxPropertyConnect) );
		FbxPropertyConnect*  lSrcConnect= lSrcEntry->Get( FBX_TYPE(FbxPropertyConnect) );

        // Make sure we have a connection point on both sides of the connection
        if (!lDstConnect) {
            lDstConnect = FbxPropertyConnect::Create( this,pDstId );
            lDstEntry->Set( lDstConnect );
        }
        if (!lSrcConnect) {
            lSrcConnect = FbxPropertyConnect::Create( pSrcPage,pSrcId );
            lSrcEntry->Set( lSrcConnect );
        }

        // Must @@@@@@@ Propagate to inherited children
        return lDstConnect->ConnectSrc(lSrcConnect,pType);

    }

    bool DisconnectSrc(FbxInt pDstId,FbxPropertyPage* pSrcPage,FbxInt pSrcId)
    {
		FbxPropertyPage*		lDstReferencePage	= 0;
		FbxPropertyConnect*	lDstConnect			= GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pDstId,&lDstReferencePage );
		FbxPropertyPage*		lSrcReferencePage	= 0;
		FbxPropertyConnect*	lSrcConnect			= pSrcPage->GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pSrcId,&lSrcReferencePage );

        // Make sure we have a connection point on both sides of the connection
        if (lDstConnect && lSrcConnect && lDstReferencePage==this && lSrcReferencePage==pSrcPage) {
            // Must @@@@@@@ Remove unused connections
            return lDstConnect->DisconnectSrc(lSrcConnect);
        }
        return false;
    }

    bool IsConnectedSrc(FbxInt pDstId, FbxPropertyPage* pSrcPage, FbxInt pSrcId)
    {
		FbxPropertyPage*		lDstReferencePage	= 0;
		FbxPropertyConnect*	lDstConnect			= GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pDstId,&lDstReferencePage );
		FbxPropertyPage*		lSrcReferencePage	= 0;
		FbxPropertyConnect*	lSrcConnect			= pSrcPage->GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pSrcId,&lSrcReferencePage );

        // Make sure we have a connection point on both sides of the connection
        if (lDstConnect && lSrcConnect && lDstReferencePage==this && lSrcReferencePage==pSrcPage) {
            // Must @@@@@@@ Remove unused connections
            return lDstConnect->IsConnectedSrc(lSrcConnect);
        }
        return false;
    }

    int GetSrcCount(FbxInt pId, FbxConnectionPointFilter* pFilter)
    {
		FbxPropertyPage*		lReferencePage		= 0;
		FbxPropertyConnect*	lPropertyConnect	= GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        // Connections are not considered propagated so
        // make sure that we own the FbxPropertyConnect objects
        return (lPropertyConnect && lReferencePage==this) ? lPropertyConnect->GetSrcCount(pFilter) : 0;
    }

    bool GetSrc(FbxInt pId, int pIndex, FbxConnectionPointFilter* pFilter, FbxPropertyPage** pSrcPage, FbxInt* pSrcId)
    {
		FbxPropertyPage*		lReferencePage		= 0;
		FbxPropertyConnect*	lPropertyConnect	= GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        // Connections are always overridden
        // make sure that we own the FbxPropertyConnect Item
        if (lPropertyConnect && lReferencePage==this) 
		{
			FbxPropertyConnect* lSrc = lPropertyConnect->GetSrc(pFilter,pIndex);
            if (lSrc) 
			{
                if (pSrcPage)   *pSrcPage = lSrc->GetPage();
                if (pSrcId)     *pSrcId   = lSrc->GetPropertyId();
                return true;
            }
        }
        return false;
    }

    bool ConnectDst(FbxInt pSrcId, FbxPropertyPage* pDstPage, FbxInt pDstId, FbxConnection::EType pType)
    {
        return pDstPage->ConnectSrc(pDstId,this,pSrcId,pType);
    }

    bool DisconnectDst(FbxInt pSrcId, FbxPropertyPage* pDstPage, FbxInt pDstId)
    {
        return pDstPage->DisconnectSrc(pDstId,this,pSrcId);
    }

    bool IsConnectedDst(FbxInt pSrcId, FbxPropertyPage* pDstPage, FbxInt pDstId)
    {
        return pDstPage->IsConnectedSrc(pDstId,this,pSrcId);
    }

    int GetDstCount(FbxInt pId, FbxConnectionPointFilter* pFilter)
    {
		FbxPropertyPage*		lReferencePage	 = 0;
		FbxPropertyConnect*	lPropertyConnect = GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        // Connections are not considered propagated so
        // make sure that we own the FbxPropertyConnect objects
        return (lPropertyConnect && lReferencePage==this) ? lPropertyConnect->GetDstCount(pFilter) : 0;
    }

    bool GetDst(FbxInt pId, int pIndex, FbxConnectionPointFilter* pFilter, FbxPropertyPage** pDstPage, FbxInt* pDstId)
    {
		FbxPropertyPage*		lReferencePage	 = 0;
		FbxPropertyConnect*	lPropertyConnect = GetPropertyItem( FBX_TYPE(FbxPropertyConnect),pId,&lReferencePage );

        // Connections are always overridden
        // make sure that we own the FbxPropertyConnect Item
        if (lPropertyConnect && lReferencePage==this)
		{
			FbxPropertyConnect* lDst = lPropertyConnect->GetDst(pFilter,pIndex);
            if (lDst) 
			{
                if (pDstPage)   *pDstPage = lDst->GetPage();
                if (pDstId)     *pDstId   = lDst->GetPropertyId();
                return true;
            }
        }
        return false;
    }

    // Min and Max
    // ---------------------------------
    enum EValueIndex { eValueMin,eValueSoftMin,eValueMax,eValueSoftMax,eValueCount };

	bool HasMinMax(FbxInt pId, FbxPropertyInfo::EValueIndex pValueId) const
	{
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
	
		return lPropertyInfo ? lPropertyInfo->HasMinMax(pValueId) : false;
	}

    bool GetMinMax(FbxInt pId, FbxPropertyInfo::EValueIndex pValueId, void* pValue, EFbxType pValueType)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        return lPropertyInfo ? lPropertyInfo->GetMinMax(pValueId,pValue,pValueType) : false;
    }

    bool SetMinMax(FbxInt pId, FbxPropertyInfo::EValueIndex pValueId, const void* pValue, EFbxType pValueType)
    {
		FbxPropertyInfo* lPropertyInfo = GetPropertyItem( FBX_TYPE(FbxPropertyInfo),pId );
        // Don't make it writeable (Keep it shared)
        return lPropertyInfo ? lPropertyInfo->SetMinMax(pValueId,pValue,pValueType) : false;
    }

    // Value
    // ---------------------------------
    bool Get(FbxInt pId, void* pValue, EFbxType pValueType)
    {
		FbxPropertyValue* lPropertyValue = GetPropertyItem( FBX_TYPE(FbxPropertyValue),pId );
        return lPropertyValue ? lPropertyValue->Get(pValue,pValueType) : 0;
    }

    bool Set(FbxInt pId, const void* pValue, EFbxType pValueType, bool pCheckValueEquality)
    {
        if( pCheckValueEquality )
        {
            FbxPropertyPage*   lReferencePage  = NULL;
            FbxPropertyValue*  lPropertyValue  = GetPropertyItem( FBX_TYPE(FbxPropertyValue),pId,&lReferencePage );
            void* lCurrentValue = FbxTypeAllocate( pValueType );
            bool lValuesEqual = false;
            bool lValueChanged = false;
            if( lReferencePage && lReferencePage != this )
            {
                // this page inherits, so check if we have to override the value.
                if( lPropertyValue )
                {
                    lPropertyValue->Get( lCurrentValue, pValueType );
                    lValuesEqual = FbxTypeCompare( pValue, lCurrentValue, pValueType );
                }
            }
            else
            {
                FbxPropertyPage* lReferencePage2 = NULL;
                FbxPropertyValue*  lPropertyValue2 = mInstanceOf ? mInstanceOf->GetPropertyItem( FBX_TYPE(FbxPropertyValue),pId,&lReferencePage2 ) : NULL;
                if( lReferencePage2 && lPropertyValue2 )
                {
                    // this page is an override, but there is another page before us that overrides the value
                    lPropertyValue2->Get( lCurrentValue, pValueType );
                    lValuesEqual = FbxTypeCompare( pValue, lCurrentValue, pValueType );

                    if( lValuesEqual )
                    {
                        ChangePropertyItemState( FBX_TYPE(FbxPropertyValue), pId, FbxPropertyFlags::eInherit );
                        lValueChanged = true;
                    }

                }
                // else this page is the originator of the property, so no need to check,
            }

            FbxTypeDeallocate(pValueType, lCurrentValue);
            lCurrentValue = NULL;

            if( lValuesEqual )
                return lValueChanged;
        }

        FbxPropertyValue* lPropertyValue = ChangePropertyItemState( FBX_TYPE(FbxPropertyValue),pId,FbxPropertyFlags::eOverride );
        return lPropertyValue ? lPropertyValue->Set(pValue,pValueType) : false;
    }

	inline FbxPropertyFlags::EInheritType GetValueInherit(FbxInt pId, bool pCheckInstanceOf) const
	{
		FbxPropertyPage* lReferencePage = NULL;
		GetPropertyItem(FBX_TYPE(FbxPropertyValue), pId, &lReferencePage);

		// check one level
		if( !pCheckInstanceOf )
		{
			return lReferencePage == this ? FbxPropertyFlags::eOverride : FbxPropertyFlags::eInherit;
		}
		else
		{
			if( lReferencePage == this ) return FbxPropertyFlags::eOverride;			// this page is either an override, or the originator
			else if( !lReferencePage->mInstanceOf ) return FbxPropertyFlags::eInherit;	// the reference is the class root, so we must be inheriting

			// The reference page is not the class root, might be another override, or the originator.
			FbxPropertyValue* lPropertyValue = lReferencePage->mInstanceOf->GetPropertyItem( FBX_TYPE(FbxPropertyValue), pId );

			// if lReferencePage->mInstanceOf has the property value,
			//      lReferencePage is an override
			//  else
			//      its the originator, so this page inherits from it.
			return lPropertyValue ? FbxPropertyFlags::eOverride : FbxPropertyFlags::eInherit;
		}
	}

    inline bool SetValueInherit(FbxInt pId, FbxPropertyFlags::EInheritType pType)
    {
        // no support for this mode yet
        if( FbxPropertyFlags::eDeleted == pType )
            return false;

        ChangePropertyItemState( FBX_TYPE(FbxPropertyValue), pId, pType );

        // Above call doesn't return error codes, so just check that we match types.
        return GetValueInherit(pId, false) == pType;
    }

    inline bool GetDefaultValue(FbxInt pId, void* pValue, EFbxType pValueType) const
    {
        FbxPropertyPage*	lReferencePage = GetFirstPropertyItem( pId, FBX_TYPE(FbxPropertyValue) );
        FbxPropertyValue*	lPropertyValue = lReferencePage ? lReferencePage->GetPropertyItem( FBX_TYPE(FbxPropertyValue), pId ) : NULL;

        return lPropertyValue ? lPropertyValue->Get( pValue, pValueType ) : false;
    }


    // useful set and get functions
    template <class T> inline bool  Set( FbxInt pId, const T& pValue )    { return Set( pId,&pValue,FbxTypeOf(pValue),true ); }
    template <class T> inline T     Get( FbxInt pId, const T* pFBX_TYPE)  { T lValue; Get( pId,&lValue,FbxTypeOf(lValue) ); return lValue; }


	void    SetDataPtr(void* pDataPtr)  { mDataPtr = pDataPtr; }
	void*   GetDataPtr() const          { return mDataPtr; }

	// Instance and override management
	// ------------------------------------------
	void    PushPropertiesToParentInstance()
	{
		if (mInstanceOf) {
			const int lCount = GetPropertyEntryCount();
			// push the existing properties into the parent
			// ----------------------------------------------
			for( int i = 0; i < lCount; ++i )
			{
			  FbxPropertyEntry* lParentEntry = mInstanceOf->ChangePropertyEntryState( (FbxInt)i,FbxPropertyFlags::eOverride );
			  FbxPropertyEntry* lEntry       = GetPropertyEntry( (FbxInt)i );

				if( !lParentEntry )
				{
					lParentEntry = FbxPropertyEntry::Create( lEntry->GetParentId(), 0, 0, 0 );
					mInstanceOf->mEntryMap.Insert( i, lParentEntry );

					//mInstanceOf->AddChild(i);

				}

				FBX_ASSERT( lParentEntry );

				// Add it to the parent
				// Don't touch the connections
				// -----------------------------------------
				if (lParentEntry) {
					lParentEntry->Set( lEntry->Get(FBX_TYPE(FbxPropertyInfo))  );
					lParentEntry->Set( lEntry->Get(FBX_TYPE(FbxPropertyValue)) );
					lParentEntry->Set( lEntry->Get(FBX_TYPE(FbxPropertyFlags)) );
				}

				/*
				else {
					mInstanceOf->Add(
						lEntry->GetParentId(),
						lEntry->Get(FBX_TYPE(FbxPropertyInfo)),        // The info
						lEntry->Get(FBX_TYPE(FbxPropertyValue)),       // The Value
						0,                                              // The connections
						false,
						false
					);
				}
				*/

				// Empty the current entry
				// Don't touch the connections
				// -----------------------------------------
				ChangePropertyItemState(FBX_TYPE(FbxPropertyInfo),  i,FbxPropertyFlags::eInherit);
				ChangePropertyItemState(FBX_TYPE(FbxPropertyValue), i,FbxPropertyFlags::eInherit);
				ChangePropertyItemState(FBX_TYPE(FbxPropertyFlags), i,FbxPropertyFlags::eInherit);
			}
		}
	}

	inline const FbxPropertyPage*  GetInstanceOf() const   { return mInstanceOf; }
	inline FbxPropertyPage*        GetInstanceOf()         { return mInstanceOf; }

	inline const FbxArray<FbxPropertyPage*>&     GetInstances() const    { return mInstances; }
	inline FbxArray<FbxPropertyPage*>&           GetInstances()          { return mInstances; }


	// Flags
	// ------------------------------------------
	FbxPropertyFlags::EFlags GetFlags(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT) const
	{
		FbxPropertyPage* lFoundIn = NULL;
		FbxPropertyFlags*  lPropertyFlags = GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId, &lFoundIn );
		FbxPropertyFlags::EFlags lFlags = FbxPropertyFlags::eNone;

		if( lPropertyFlags )
		{
			if( !mInstanceOf ) // no inheritance.
				lFlags = lPropertyFlags->GetFlags();
			else
			{
				lFlags = mInstanceOf->GetFlags(pId);
				lFlags = lPropertyFlags->GetMergedFlags(lFlags);
			}
		}
		return lFlags;
	}

	bool ModifyFlags(FbxInt pId=FBXSDK_PROPERTY_ID_ROOT,FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone,bool pValue=true,bool pCheckFlagEquality=true)
	{
		if( pCheckFlagEquality )
		{
			FbxPropertyPage* lFoundIn = NULL;
			FbxPropertyFlags* lFlag = GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId, &lFoundIn );

			if( lFlag )
			{
				if( lFoundIn == this )
				{
					// set them in us.
					lFlag->ModifyFlags( pFlags, pValue );

					 // we override this entry, check if we need to revert
					FbxPropertyFlags* lInheritedFlags = mInstanceOf ? mInstanceOf->GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId ) : NULL;
					if( lInheritedFlags && lInheritedFlags->Equal( *lFlag, pFlags ) )
					{
						lFlag->UnsetMask( pFlags );

						if( lFlag->GetMask() == 0 )
							ChangePropertyItemState( FBX_TYPE(FbxPropertyFlags), pId, FbxPropertyFlags::eInherit );

						return true;
					}
				}
				else
				{
					// its not us. Just check if we need to set.
					FbxPropertyFlags lNewValues( pFlags );
					if( lFlag->Equal( lNewValues, pFlags ) )
						return true;
				}
			}
		}

		FbxPropertyFlags* lPropertyFlags = ChangePropertyItemState(FBX_TYPE(FbxPropertyFlags), pId, FbxPropertyFlags::eOverride);
		return lPropertyFlags ? lPropertyFlags->ModifyFlags( pFlags, pValue ) : false;
	}

	FbxPropertyFlags::EInheritType GetFlagsInheritType(FbxPropertyFlags::EFlags pFlags, bool pCheckInstanceOf, FbxInt pId=FBXSDK_PROPERTY_ID_ROOT) const
	{
		FbxPropertyPage* lFoundIn = NULL;
		FbxPropertyFlags*  lPropertyFlags = GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId, &lFoundIn );

		if( !pCheckInstanceOf )
			return lFoundIn != this ? FbxPropertyFlags::eInherit : ( lPropertyFlags ? lPropertyFlags->GetFlagsInheritType(pFlags) : FbxPropertyFlags::eInherit );
		else
		{
			// This code basically counts the number of overrides for the
			// given flags. The original entry is always considered an override.
			// so if we see more than one, something overrode the original.
			// and thus we are an override.
			FbxPropertyPage* lRefPage = lFoundIn;
			bool lFoundOverride = false;
			while( lRefPage )
			{
				lPropertyFlags = lRefPage->GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId );

				if( !lPropertyFlags )
					break;  // gone too far, break.

				if( lPropertyFlags->GetFlagsInheritType( pFlags ) == FbxPropertyFlags::eOverride )
				{
					if( this == lRefPage || lFoundOverride )
						return FbxPropertyFlags::eOverride;    // found two overrides or this page is the override.
					else
						lFoundOverride = true;  // signal that we found the first override.
				}
				lRefPage = lRefPage->mInstanceOf;
			}

			return FbxPropertyFlags::eInherit;
		}
	}

	bool SetFlagsInheritType(FbxPropertyFlags::EInheritType pInheritType, FbxPropertyFlags::EFlags pFlags, FbxInt pId=FBXSDK_PROPERTY_ID_ROOT)
	{
		FbxPropertyPage* lFoundIn = NULL;
		FbxPropertyFlags* lPropertyFlags = NULL;

		if( FbxPropertyFlags::eOverride == pInheritType )
		{
			lPropertyFlags = ChangePropertyItemState( FBX_TYPE(FbxPropertyFlags), pId, FbxPropertyFlags::eOverride );

			// we should initialize our flag to the inherited value, if any.
			FbxPropertyFlags* lParentFlags = mInstanceOf ? mInstanceOf->GetPropertyItem( FBX_TYPE(FbxPropertyFlags), pId ) : NULL;
			if( lParentFlags && lPropertyFlags )
			{
				FbxPropertyFlags::EFlags lParentValues = lParentFlags->GetFlags();
				lPropertyFlags->SetFlags( pFlags, lParentValues );
				return lPropertyFlags->SetMask( pFlags );
			}

			return false;
		}
		else if( FbxPropertyFlags::eInherit == pInheritType )
		{
			lPropertyFlags = GetPropertyItem(FBX_TYPE(FbxPropertyFlags), pId, &lFoundIn);
			if( !lPropertyFlags ) return false;
			if( lFoundIn != this ) return true; // not us
			lPropertyFlags->UnsetMask( pFlags );
			if( lPropertyFlags->GetMask() == 0 )    // revert
				ChangePropertyItemState( FBX_TYPE(FbxPropertyFlags), pId, FbxPropertyFlags::eInherit );

			return true;
		}
		return false;
	}

	inline void BeginCreateOrFindProperty()
	{
		if( 0 == mNameMap.mFirst )
		{
			mNameMap.mSecond.Reserve(20);

			// push the existing properties into the map. Note: this includes the root property!
			FbxInt lFoundId = FBXSDK_PROPERTY_ID_ROOT;
			FbxPropertyEntry* lEntry = GetPropertyEntry(lFoundId);
			while(lFoundId != FBXSDK_PROPERTY_ID_NULL)
			{
				FbxPropertyInfo* lInfo = lEntry->Get(FBX_TYPE(FbxPropertyInfo));
				//FBX_ASSERT( lInfo );
				if (lInfo)
				{
					mNameMap.mSecond.Insert(FbxNameMapKey(lEntry->GetParentId(), lInfo->GetName()), lFoundId);
				}
				lFoundId = GetMinimumPropertyIdAndEntry(lFoundId, &lEntry);
			}
			mNameMap.mFirst++;
		}
	}

	inline void EndCreateOrFindProperty()
	{
		if( mNameMap.mFirst > 0 )
		{
			if( --(mNameMap.mFirst) == 0 )
				mNameMap.mSecond.Clear();
		}
	}

protected:
    FbxPropertyPage(FbxPropertyPage* pInstanceOf=0)
        : mInstanceOf(0)
        , mDataPtr(0)
        , mPropNextId(0)
    {
        mEntryMap.Reserve(32);
        mNameMap.mFirst = 0;

        // instances don't need to create a root property
        if( !pInstanceOf )
        {
            mPropNextId = FbxNew< FbxPropertyIdGenerator >();
            mPropNextId->IncRef();

            // First item is the root information
            Add(FBXSDK_PROPERTY_ID_NULL,"",eFbxUndefined);
        }

        // Hook the instances
        // ------------------------
        mInstanceOf = pInstanceOf;
        if (mInstanceOf) {
            mInstanceOf->mInstances.Add(this);

            mPropNextId = mInstanceOf->mPropNextId;
            mPropNextId->IncRef();
        }
    }
    FbxPropertyPage(const char* pName, EFbxType pType)
        : mInstanceOf(0)
        , mDataPtr(0)
        , mPropNextId(0)
    {
        mEntryMap.Reserve(32);
        mNameMap.mFirst = 0;

        mPropNextId = FbxNew< FbxPropertyIdGenerator >();
        mPropNextId->IncRef();

        // First item is the root information
        Add(FBXSDK_PROPERTY_ID_NULL,pName,pType);
    }
    FbxPropertyPage(const char* pName, FbxPropertyPage* pTypeInfo)
        : mInstanceOf(0)
        , mDataPtr(0)
        , mPropNextId(0)
    {
        mEntryMap.Reserve(32);
        mNameMap.mFirst = 0;

        mPropNextId = FbxNew< FbxPropertyIdGenerator >();
        mPropNextId->IncRef();

        // First item is the root information
        Add(FBXSDK_PROPERTY_ID_NULL,pName,pTypeInfo);
    }
    ~FbxPropertyPage()
    {
        // Propagate our property entries.
        int i = 0, j = 0;
        for( i = 0; i < mInstances.GetCount(); ++i )
        {
            for( j = 0; j < GetPropertyEntryCount(); ++j )
            {
                if( mInstances[i]->ChangePropertyEntryState((FbxInt)j, FbxPropertyFlags::eOverride) )
                {
                    // Clone the info and values. Don't clone the connections,
                    // since they aren't propagated.
                    mInstances[i]->ChangePropertyItemState( FBX_TYPE(FbxPropertyInfo), (FbxInt)j, FbxPropertyFlags::eOverride );
                    mInstances[i]->ChangePropertyItemState( FBX_TYPE(FbxPropertyValue), (FbxInt)j, FbxPropertyFlags::eOverride );

                    // Since all entries have their own flags, just override the ones in the instance.
                    mInstances[i]->SetFlagsInheritType(FbxPropertyFlags::eOverride, FbxPropertyFlags::eAllFlags, (FbxInt)j );
                }
            }

            // Instances become their own copies.
            mInstances[i]->mInstanceOf = NULL;
        }

		FbxMapDestroy(mEntryMap);

        if (mInstanceOf) {
            int lIndex = mInstanceOf->mInstances.Find(this);
            mInstanceOf->mInstances.SetAt(lIndex, mInstanceOf->mInstances[mInstanceOf->mInstances.GetCount()-1]);
            mInstanceOf->mInstances.RemoveAt(mInstanceOf->mInstances.GetCount()-1);

            //mInstanceOf->mInstances.RemoveIt(this);
        }

        mPropNextId->DecRef();
        mPropNextId = NULL;

        mInstanceOf = NULL;
        mInstances.Clear();
    }

    inline bool Is(FbxPropertyPage* pPage)
    {
        // @@@@@@@@@@@@@@@ Must complete for sub types
        return this==pPage;
    }

// Internal entry management
private:

    /** Retrieves the smallest property id of which are larger than a specified one.
    * \param pId The specified property id
    * \param pIncrementIfNone Whether it returns FBXSDK_PROPERTY_ID_NULL or pId+1, if not found.
    * \return The property id described above.
    */
    FbxInt GetMinimumPropertyId(FbxInt pId, bool pIncrementIfNone = true) const
    {
        if( pId == FBXSDK_PROPERTY_ID_NULL )
            pId = FBXSDK_PROPERTY_ID_ROOT;
       
        FbxInt lMin = FBXSDK_PROPERTY_ID_NULL;
        const EntryMap::RecordType* lElement = mEntryMap.UpperBound(pId);
        if (NULL != lElement)
        {
            lMin = lElement->GetKey();
        }

        FbxInt lParentMin = mInstanceOf ? mInstanceOf->GetMinimumPropertyId(pId,false) : FBXSDK_PROPERTY_ID_NULL;

        bool lParentNull = lParentMin == FBXSDK_PROPERTY_ID_NULL;
        bool lMinNull = lMin == FBXSDK_PROPERTY_ID_NULL;

        if( lParentNull && lMinNull )   return pIncrementIfNone ? pId+1 : FBXSDK_PROPERTY_ID_NULL;
        else if( lMinNull )             lMin = lParentMin;
        else if( !lParentNull )         lMin = lMin < lParentMin ? lMin : lParentMin;

        return lMin;
    }

    /** Retrieves the smallest property id of which are larger than a specified one, and retrieve its entry.
    * \param pId The specified property id
    * \param pEntry The returned property entry
    * \return The property id described above.
    */
    FbxInt GetMinimumPropertyIdAndEntry(FbxInt pId, FbxPropertyEntry** pEntry) const
    {
        FbxInt lFoundId = FBXSDK_PROPERTY_ID_NULL;
        FbxPropertyEntry* lFoundEntry = NULL;
        if( pId == FBXSDK_PROPERTY_ID_NULL )
            pId = FBXSDK_PROPERTY_ID_ROOT;

        const EntryMap::RecordType* lElement = mEntryMap.UpperBound(pId);
        if (NULL != lElement)
        {
            lFoundId = lElement->GetKey();
            lFoundEntry = lElement->GetValue();
        }

        FbxPropertyEntry* lParentEntry = NULL;
        FbxInt lParentMin = mInstanceOf ? mInstanceOf->GetMinimumPropertyIdAndEntry(pId, &lParentEntry) : FBXSDK_PROPERTY_ID_NULL;

        bool lParentNull = lParentMin == FBXSDK_PROPERTY_ID_NULL;
        bool lMinNull = lFoundId == FBXSDK_PROPERTY_ID_NULL;

        if( lMinNull && !lParentNull )
        {
            lFoundId = lParentMin;
            lFoundEntry = lParentEntry;
        }
        else if( !lMinNull && !lParentNull )
        {
            lFoundId = lFoundId < lParentMin ? lFoundId : lParentMin;
            lFoundEntry = lFoundId < lParentMin ? lFoundEntry : lParentEntry;
        }

        if (pEntry)
            *pEntry = lFoundEntry;
        return lFoundId;
    }

    int GetPropertyEntryCount() const
    {
        int lCount = 0;
        const EntryMap::RecordType* lElement = mEntryMap.Maximum();

        if (NULL != lElement)
        {
            lCount = lElement->GetKey() + 1;
        }

        int lParentCount = mInstanceOf ? mInstanceOf->GetPropertyEntryCount() : 0;
        return lParentCount > lCount ? lParentCount : lCount;
    }

    FbxPropertyEntry* GetPropertyEntry(FbxInt pIndex,FbxPropertyPage **pFoundIn=0) const
    {
        const EntryMap::RecordType* lElement = mEntryMap.Find(pIndex);
        if (NULL != lElement)
        {
            if( pFoundIn )
            {
                *pFoundIn = const_cast<FbxPropertyPage*>(this);
            }
            return lElement->GetValue();
        }
        
        if( pFoundIn )
        {
            *pFoundIn = 0;
        }

        return mInstanceOf ? mInstanceOf->GetPropertyEntry(pIndex,pFoundIn) : 0;
    }

    FbxPropertyEntry* ChangePropertyEntryState(FbxInt pIndex,FbxPropertyFlags::EInheritType pInheritType)
    {
		FbxPropertyPage*     lReferencePage      = 0;
		FbxPropertyEntry*    lReferenceEntry     = GetPropertyEntry(pIndex,&lReferencePage);

        if (pInheritType==FbxPropertyFlags::eOverride) {
            if (lReferencePage==this) {
                return lReferenceEntry;
            } else if (lReferenceEntry) {
                // must create an entry
                FbxPropertyEntry* lEntry = FbxPropertyEntry::Create(lReferenceEntry->GetParentId(),0,0,0);
                mEntryMap.Insert( pIndex, lEntry );

                return lEntry;
            }
        } else {
            if (lReferenceEntry && (lReferencePage==this)) {
                mEntryMap.Remove(pIndex);
                lReferenceEntry->Destroy();
            }
        }
        return 0;
    }

    FbxInt Add(FbxInt pParentId,FbxPropertyInfo* pInfo,FbxPropertyValue* pValue,FbxPropertyConnect* pConnect,bool pRecursive=true)
    {
        FbxInt lId = mPropNextId->GetNextIdAndInc();
        FbxPropertyEntry* lEntry = FbxPropertyEntry::Create(pParentId,pInfo,pValue,pConnect);
        
        // entries created through Add() are not overrides of another entry.
        // Thus, set all of their flags by default.
        FbxPropertyFlags* lFlags = lEntry->Get( FBX_TYPE(FbxPropertyFlags) );
        if( lFlags ) lFlags->ModifyFlags( FbxPropertyFlags::eAllFlags, false );

        mEntryMap.Insert( lId, lEntry );

        // We only add to the map if this Add is called after BeginCreateOrFindProperty()
        // in which case the size is always > 0 because it includes the root property
        if( mNameMap.mSecond.GetSize() > 0 )
            mNameMap.mSecond.Insert( FbxNameMapKey( pParentId, pInfo->GetName()), lId );

        // If the entry has multiple children(Struct Datatype)
        // Recurse for the entries and create an entry in this structure
        if (pRecursive) {
            FbxPropertyPage* lTypeInfo = pInfo->GetTypeInfo();
            if (lTypeInfo) {
				FbxInt lChildId;
                lChildId = lTypeInfo->GetChild();
                while (lChildId!=FBXSDK_PROPERTY_ID_NULL) {
					FbxPropertyInfo*		lPropertyInfo    = lTypeInfo->GetPropertyItem( FBX_TYPE(FbxPropertyInfo),lChildId );
					FbxPropertyValue*	lPropertyValue   = lTypeInfo->GetPropertyItem( FBX_TYPE(FbxPropertyValue),lChildId );
					FbxPropertyConnect*	lPropertyConnect = lTypeInfo->GetPropertyItem( FBX_TYPE(FbxPropertyConnect),lChildId );

                    Add ( lId, lPropertyInfo ? lPropertyInfo->Clone(this) : 0 , lPropertyValue ? lPropertyValue->Clone(this) : 0,
							   lPropertyConnect ? lPropertyConnect->Clone(this) : 0 );
                    lChildId = lTypeInfo->GetSibling(lChildId );
                }
            }
        }
        return lId;
    }       

    // Property management
    typedef FbxMap<FbxInt, FbxPropertyEntry*, FbxLessCompare<FbxInt>, FbxHungryAllocator> EntryMap;
    EntryMap mEntryMap;

    // instance management
    FbxPropertyPage*				mInstanceOf;
    FbxArray<FbxPropertyPage*>		mInstances;

    void*							mDataPtr;

    // speed up structure
    typedef FbxMap<FbxNameMapKey, FbxInt, FbxNameMapCompare > NameMap;
    typedef FbxPair<unsigned int, NameMap > NameLookupPair;
    NameLookupPair     mNameMap;

    FbxPropertyIdGenerator* mPropNextId;

    friend class FbxPropertyHandle;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_PROPERTY_PAGE_H_ */
