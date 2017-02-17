/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxeventhandler.h
#ifndef _FBXSDK_CORE_EVENT_HANDLER_H_
#define _FBXSDK_CORE_EVENT_HANDLER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxevent.h>
#include <fbxsdk/core/base/fbxintrusivelist.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxListener;

/** Event handler class contains a listener and a callback function.
* Event handler is used to bind emitter and listener together. Its callback function can process event data.
* To generate a valid event handler, you can create an event emitter and event listener first and then call FbxListener::Bind().
* It will create an event handler automatically and bind the handler to the listener and the created emitter. 
* After that, the emitter and listener are bound together via event handler.
* \remarks An object(emitter) can emit a certain type of event, the object(listener) who are listening to that type of event, 
* will receive a signal and take action to process the event data. 
* \par The whole process of event is:
* \li 1. Create an emitter and a listener, then bind them together via the same event handler.
* \li 2. Emitter can emit an event at certain conditions. The event could be handled by event handler.
* \li 3. Once an event is emitted, the listener to this event will receive a signal. 
* \li 4. And then the listener could process the event data according to the types of event, by calling event handler.
* \note The event data is process by the callback function of event handler.
* \nosubgrouping
* \see FbxListener FbxEventBase FbxEvent FbxEmitter
*/
class FbxEventHandler
{
public:
	//! Event handler base type.
	enum EType
	{
		eListener,	//!< Listener event handler type.
		eEmitter,	//!< Emitter event handler type.
		eCount		//!< Count of different event handler types.
	};

	/** Get event type of current handler.
	* \return The type ID of event. */
	virtual int GetHandlerEventType()=0;

	/** Call function that process event data.
	* \param pEvent specify the event type. pEvent could be a specific class which derived from FbxEventBase.
	* \see FbxEventBase */
	virtual void FunctionCall(const FbxEventBase& pEvent)=0;

	/** Get listener of current handler.
	* \return A pointer to the listener object. */
	virtual FbxListener* GetListener()=0;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxEventHandler(){}
    virtual ~FbxEventHandler(){}

	FBXSDK_INTRUSIVE_LIST_NODE(FbxEventHandler, eCount);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

template <typename EventType, typename ListenerType> class FbxMemberFuncEventHandler : public FbxEventHandler
{
	typedef void (ListenerType::*CallbackFnc)(const EventType*);

public:
    FbxMemberFuncEventHandler(ListenerType* pListenerInstance, CallbackFnc pFunction) : mListener(pListenerInstance), mFunction(pFunction){}
	virtual int GetHandlerEventType(){ return EventType::GetStaticTypeId(); }  
	virtual void FunctionCall(const FbxEventBase& pEvent){ (*mListener.*mFunction)(reinterpret_cast<const EventType*>(&pEvent)); } 
	virtual FbxListener* GetListener(){ return mListener; }

private:
	ListenerType*	mListener;
	CallbackFnc		mFunction;
};

template <typename EventType, typename ListenerType> class FbxConstMemberFuncEventHandler : public FbxEventHandler
{
	typedef void (ListenerType::*CallbackFnc)(const EventType*) const;

public:
	FbxConstMemberFuncEventHandler(ListenerType* pListenerInstance, CallbackFnc pFunction) : mListener(pListenerInstance), mFunction(pFunction){}
	virtual int GetHandlerEventType(){ return EventType::GetStaticTypeId(); }    
	virtual void FunctionCall(const FbxEventBase& pEvent){ (*mListener.*mFunction)(reinterpret_cast<const EventType*>(&pEvent)); }
	virtual FbxListener* GetListener(){ return mListener; }

private:
	ListenerType*	mListener;
	CallbackFnc		mFunction;
};

template <typename EventType> class FbxFuncEventHandler : public FbxEventHandler
{
	typedef void (*CallbackFnc)(const EventType*, FbxListener*);

public:
	FbxFuncEventHandler(FbxListener* pListener, CallbackFnc pFunction) : mListener(pListener), mFunction(pFunction){}
	virtual int GetHandlerEventType(){ return EventType::GetStaticTypeId(); }   
	virtual void FunctionCall(const FbxEventBase& pEvent){ (*mFunction)(reinterpret_cast<const EventType*>(&pEvent), mListener); }
	virtual FbxListener* GetListener(){ return mListener; }

private:
	FbxListener*	mListener;
	CallbackFnc		mFunction;
};
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_EVENT_HANDLER_H_ */
