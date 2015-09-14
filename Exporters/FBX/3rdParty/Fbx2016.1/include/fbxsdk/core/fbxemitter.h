/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxemitter.h
#ifndef _FBXSDK_CORE_EMITTER_H_
#define _FBXSDK_CORE_EMITTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxintrusivelist.h>
#include <fbxsdk/core/fbxeventhandler.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxListener;

/** Base class to emit event with the specified event type.
* The event type could be a specific class which derived from FbxEvent. Please read FbxEmitter::Emit() for more details. 
* Event emitter contains a list of event handlers.
* FBX object could be used as emitter, since FbxObject is derived from FbxEmitter.
* Before using emitter to emit an event, one or more event handlers must be added to the handlers list of current emitter.
* In other words, it's "bind event handlers to emitter".
* There are two ways to bind event handlers to emitter.
* \li 1. If you already got an event handler and would like to bind it to current emitter, please call FbxEmitter::AddListener().
* \li 2. Or you can create an event listener first and then call FbxListener::Bind().
* It will create an event handler automatically and bind the handler to the specified emitter.
* It's similar to unbind or remove an even handler. For more details, 
* \see FbxEmitter::RemoveListener()
* \see FbxListener::Unbind()
* \remarks An object(emitter) can emit a certain type of event, the plug-in(listener) who are listening to that type of event, 
* will receive a signal and take action to process the event data. 
* \par The whole process of event is:
* \li 1. Create an emitter and a listener, then bind them together via the same event handler.
* \li 2. Emitter can emit an event at certain conditions. The event could be handled by event handler.
* \li 3. Once an event is emitted, the listener to this event will receive a signal. 
* \li 4. And then the listener could process the event data according to the types of event, by calling event handler.
* \note The event data is process by the callback function of event handler.
* \nosubgrouping
* \see FbxListener FbxEventHandler FbxEvent FbxEventBase
*/
class FBXSDK_DLL FbxEmitter
{
public:
	/** Add the specified event handler to current emitter list.
	* \param pHandler The event handler will be added to the handlers list of current emitter. */
	void AddListener(FbxEventHandler& pHandler);

	/** Remove the specified event handler from current emitter list.
	* \param pHandler The event handler will be removed from the handlers list of current emitter. */
	void RemoveListener(FbxEventHandler& pHandler);

	/** Emit an event with the specified the event type. One the event is emitted, the listener to this event will receive a signal.
	* \param pEvent Specify the event type to emit. Could be a specific class which derived from FbxEvent, such as FbxObjectPropertyChanged.
	* \see FbxEventBase FbxObjectPropertyChanged FbxEventReferencedDocument FbxEventPostExport
	* \see FbxEventPostImport FbxEventPreExport FbxEventPreImport FbxEventPopulateSystemLibrary */
	template <typename EventType> void Emit(const EventType& pEvent) const
	{
		if( !mData ) return;
		EventHandlerList::iterator itBegin = mData->mEventHandlerList.Begin();
		EventHandlerList::iterator itEnd = mData->mEventHandlerList.End();
		for( EventHandlerList::iterator it = itBegin; it != itEnd; ++it )
		{
			if ((*it).GetHandlerEventType() == pEvent.GetTypeId())
			{
				(*it).FunctionCall(pEvent);
			}
		}
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxEmitter();
	~FbxEmitter();

protected:
    typedef FbxIntrusiveList<FbxEventHandler, FbxEventHandler::eEmitter> EventHandlerList;
    struct EventData { EventHandlerList mEventHandlerList; };
    EventData* mData;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_EMITTER_H_ */
