/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxquery.h
#ifndef _FBXSDK_CORE_QUERY_H_
#define _FBXSDK_CORE_QUERY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxclassid.h>
#include <fbxsdk/core/fbxconnectionpoint.h>
#include <fbxsdk/core/base/fbxmap.h>
#include <fbxsdk/core/base/fbxmemorypool.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define FBXSDK_QUERY_UNIQUE_ID 0x14000000

class FbxProperty;

/** Base class to manage query. A query contains a filter and reference ID, which will be used to search and retrieve objects. 
* The derived query classes are used to create FbxCriteria.
* \nosubgrouping */
class FBXSDK_DLL FbxQuery
{
public:
	//! Get unique filter Id
	virtual FbxInt GetUniqueId() const { return FBXSDK_QUERY_UNIQUE_ID; }

	/** Judge if the given property is valid.
	* \param pProperty The given property.
	* \return \c true always, not implemented. */
	virtual bool IsValid(const FbxProperty& pProperty) const;

	/** This compares whether two FbxQuery are the same, NOT whether the query matches or not. It's strictly the equivalent of an operator==, but virtual.
	* \param pOtherQuery The given FbxQuery */
	virtual bool IsEqual(FbxQuery* pOtherQuery) const;

	//! Add one to ref count.
	void Ref();

	//! Minus one to ref count, if ref count is zero, delete this query object.
	void Unref();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    FbxQuery();
    virtual ~FbxQuery();

private:
    class InternalFilter : public FbxConnectionPointFilter
	{
	public:
		InternalFilter(FbxQuery* pQuery);
		~InternalFilter();

	public:
		FbxConnectionPointFilter*	Ref();
		void						Unref();
		FbxInt						GetUniqueId() const { return mQuery->GetUniqueId(); }
		bool						IsValid(FbxConnectionPoint* pConnect) const;
		bool						IsEqual(FbxConnectionPointFilter* pConnectFilter) const;

		FbxQuery*					mQuery;
    };

    InternalFilter	mFilter;
    int				mRefCount;

    FBXSDK_FRIEND_NEW();
    friend class FbxProperty;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Defines a filtering criteria for a query of objects, connections and properties, so that only those satisfying the criteria are
* affected by the query. Some examples of kinds of criteria are object type, connection type, or property. Criteria can be combined
* using logical operators such as "and" and "or".
* \note 
* Objects are basic elements in FBX. Each of them has a hierarchy type and some properties. Objects and properties can be connected
* through a connection to represent a relationship between them. (e.g. child-parent, container membership, reference, etc.,). In a
* query, you could select object or properties based on these criteria.
* Here are some examples:
* \code
* FbxObject* lObject = FbxObject::Create(lManager, "Object");
* int lSrcLightCount = lObject->RootProperty.GetSrcObjectCount(FbxCriteria::ObjectType(FbxLight::ClassId));
* int lSrcDeformerCount = lObject->RootProperty.GetSrcObjectCount(FbxCriteria::ObjectTypeStrict(FbxDeformer::ClassId));
* int lSrcPropertyCount = lObject->RootProperty.GetSrcCount(FbxCriteria::IsProperty());
* \endcode
* \see FbxQuery
* \see FbxProperty::GetSrcObjectCount(const FbxCriteria&) const
* \see FbxCollection::GetMemberCount(const FbxCriteria&) const
* \nosubgrouping */
class FBXSDK_DLL FbxCriteria
{
public:
	/** Creates a new query criteria that only selects objects which have a specific
	* class ID or derive from a class with a specific class ID.
	* \param pClassId The base type class ID */
	static FbxCriteria ObjectType(const FbxClassId& pClassId);

	/** Creates a new query criteria that only selects objects which have a specific class ID.
	* \param pClassId The type class ID */
	static FbxCriteria ObjectTypeStrict(const FbxClassId& pClassId);

	//! Creates a new query criteria that only selects properties.
	static FbxCriteria IsProperty();

	/** Gets a logical conjunction (and) criteria from this and the specified criteria.
	* \param pCriteria The specified criteria */
	FbxCriteria operator&&(const FbxCriteria& pCriteria) const;

	/** Gets a logical disjunction (or) criteria from this and the specified criteria.
	* \param pCriteria The specified criteria */
	FbxCriteria operator||(const FbxCriteria& pCriteria) const;

	//! Returns a negated version of the criteria.
	FbxCriteria operator!() const;

	/** Retrieves the query.
	* \return The query of this criteria */
	FbxQuery* GetQuery() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxCriteria();
	FbxCriteria(const FbxCriteria& pCriteria);
	FbxCriteria(FbxQuery* pQuery);
	~FbxCriteria();

	FbxCriteria& operator=(const FbxCriteria& pCriteria);

private:
    FbxQuery* mQuery;

	static void FreeGlobalCache();

    FBXSDK_FRIEND_NEW();
	friend class FbxManager;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Functor to compare FbxCriteria
struct FbxCriteriaCompare
{
	inline int operator()(const FbxCriteria& pKeyA, const FbxCriteria& pKeyB) const
	{
		const FbxQuery* lKeyA = pKeyA.GetQuery();
		const FbxQuery* lKeyB = pKeyB.GetQuery();
		return lKeyA < lKeyB ? -1 : (lKeyA > lKeyB ? 1 : 0);
	}
};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
class FBXSDK_DLL FbxQueryOperator : public FbxQuery
{
public:
    FBXSDK_FRIEND_NEW();

	enum EType {eAND, eOR};

    static FbxQueryOperator* Create(FbxQuery* pA, EType pOperator, FbxQuery* pB);
    virtual FbxInt GetUniqueId() const { return FBXSDK_QUERY_UNIQUE_ID+1; }
    virtual bool IsValid(const FbxProperty& pProperty) const;
    virtual bool IsEqual(FbxQuery* pOtherQuery) const;

protected:
    FbxQueryOperator(FbxQuery* pA, EType pOperator, FbxQuery* pB);
    virtual ~FbxQueryOperator();

private:
    FbxQuery	*mA, *mB;
    EType		mOperator;
};

class FBXSDK_DLL FbxQueryOperatorUnary : public FbxQuery
{
public:
    FBXSDK_FRIEND_NEW();

    static FbxQueryOperatorUnary* Create(FbxQuery* pA);
    virtual FbxInt GetUniqueId() const{ return FBXSDK_QUERY_UNIQUE_ID+2; }
    virtual bool IsValid(const FbxProperty& pProperty) const;
    virtual bool IsEqual(FbxQuery* pOtherQuery) const;

protected:
    FbxQueryOperatorUnary(FbxQuery* pA);
    virtual ~FbxQueryOperatorUnary();

private:
    FbxQuery* mA;
};

class FBXSDK_DLL FbxQueryClassId : public FbxQuery
{
public:
    FBXSDK_FRIEND_NEW();

    static FbxQueryClassId* Create(const FbxClassId& pClassId);
    virtual FbxInt GetUniqueId() const{ return FBXSDK_QUERY_UNIQUE_ID+3; }
    virtual bool IsValid(const FbxProperty& pProperty) const;
    virtual bool IsEqual(FbxQuery* pOtherQuery) const;

protected:
    FbxQueryClassId(const FbxClassId& pClassId);

private:
    FbxClassId	mClassId;
};

class FBXSDK_DLL FbxQueryIsA : public FbxQuery
{
public:
    FBXSDK_FRIEND_NEW();

    static FbxQueryIsA* Create(const FbxClassId& pClassId);       
    virtual FbxInt GetUniqueId() const{ return FBXSDK_QUERY_UNIQUE_ID+4; }
    virtual bool IsValid(const FbxProperty& pProperty) const;
    virtual bool IsEqual(FbxQuery* pOtherQuery) const;

protected:
    FbxQueryIsA(const FbxClassId& pClassId);

private:
    FbxClassId mClassId;
};

class FBXSDK_DLL FbxQueryIsProperty : public FbxQuery
{
public:
    FBXSDK_FRIEND_NEW();

    static FbxQueryIsProperty* Create();
    virtual FbxInt GetUniqueId() const{ return FBXSDK_QUERY_UNIQUE_ID+5; }
    virtual bool IsValid(const FbxProperty& pProperty) const;
    virtual bool IsEqual(FbxQuery* pOtherQuery) const;

protected:
    FbxQueryIsProperty();
};
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_QUERY_H_ */
