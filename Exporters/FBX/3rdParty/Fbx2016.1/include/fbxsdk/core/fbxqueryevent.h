/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxqueryevent.h
#ifndef _FBXSDK_CORE_QUERY_EVENT_H_
#define _FBXSDK_CORE_QUERY_EVENT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxevent.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A query event is something that is emitted by an entity, with the goal of being filled by someone that listen to it. 
*  You can see that like a form that you send to some people. If those people know how to fill the form, they fill it and return
*  it to you with the right information in it.  A query event is emitted, and plug-in who are listening to that type of query, 
*  fill the data that can be accessed by the query emitter.
*/
template <typename QueryT> class FbxQueryEvent : public FbxEvent<FbxQueryEvent<QueryT> >
{
public:
    /**
    *\name Public interface
    */
    //@{
    /** Constructor.
	  * \param pData The requested data.  
      */
    explicit FbxQueryEvent(QueryT* pData):mData(pData){}

    /** Accessor to a mutable reference to the data. Event are usually const and can't be modified by listener. 
     * This special type of event can have is content modified via this accessor.
     * \return A mutable reference the requested data.
    */
    QueryT& GetData()const { return *mData; }
    //@}

private:
    mutable QueryT* mData;

private:
    virtual const char* GetEventName() const { FBX_ASSERT(false); return ""; }
    static const char* FbxEventName() { FBX_ASSERT(false); return ""; }
    friend class FbxEvent< FbxQueryEvent<QueryT> >;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_QUERY_EVENT_H_ */
