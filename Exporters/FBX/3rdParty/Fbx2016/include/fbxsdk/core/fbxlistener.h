/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlistener.h
#ifndef _FBXSDK_CORE_LISTENER_H_
#define _FBXSDK_CORE_LISTENER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxemitter.h>
#include <fbxsdk/core/fbxeventhandler.h>
#include <fbxsdk/core/base/fbxintrusivelist.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**FBX SDK listener class. Once an event is emitted by an emitter, a listener should be created to listen to the event. 
  * The listener could receive a signal and take action to process the event data. 
  * \note The data will be process by the callback function of FbxListener::Bind().
  * Plug-in could be used as listener, since FbxPlugin is derived from FbxListener.
  * To emit event, you could create an emitter and a listener, and then bind them together via event handler.
  * To listen to an event which is emitted by an emitter, you should bind current listener to the emitter by calling FbxListener::Bind(). 
  * Event listener contains a list of event handlers.
  * \remarks An object(emitter) can emit a certain type of event, the plug-in(listener) who are listening to that type of event, 
  * will receive a signal and take action to process the event data. 
  * \par The whole process of event is:
  * \li 1. Create an emitter and a listener, then bind them together via the same event handler.
  * \li 2. Emitter can emit an event at certain conditions. The event could be handled by event handler.
  * \li 3. Once an event is emitted, the listener to this event will receive a signal. 
  * \li 4. And then the listener could process the event data according to the types of event, by calling event handler.
  * \note The event data is process by the callback function of event handler.
  * \see FbxEmitter FbxEventHandler FbxEvent FbxEventBase
  */
class FBXSDK_DLL FbxListener
{
public:
	/**
	  * \name Constructor and Destructor
	  */
	//@{
	//!Destructor.
    ~FbxListener();
	//!Constructor.
    FbxListener(){}
	//@}
   
	////////////////////////////////////////////////////////////////////////////////////////
    /**
    * \name Bind and unbind methods
    */
    //@{

    /**Bind current listener and the specified emitter together via an automatically created event handler. 
     * An event handler will be created automatically and added to the handlers list of current listener and the specified emitter.
     * After that, the listener can listen to the event which is emitted by the specified emitter.
	 * \param pEmitter          Event emitter to bind. Current listener can listen to the event which is emitted by pEmitter.
	 * \param pFunc             The callback function to process event date.
	 * \return                  The automatically created event handler.
	 */
    template <typename EventType,typename ListenerType> FbxEventHandler* Bind(FbxEmitter& pEmitter, void (ListenerType::*pFunc)(const EventType*))
    {
        FbxMemberFuncEventHandler<EventType,ListenerType>* eventHandler = 
            FbxNew< FbxMemberFuncEventHandler<EventType,ListenerType> >(static_cast<ListenerType*>(this),pFunc);
        pEmitter.AddListener(*eventHandler);
        mEventHandler.PushBack(*eventHandler);
        return eventHandler;
    }

    /**Bind current listener and the specified emitter together via an automatically created event handler. 
    * An event handler will be created automatically and added to the handlers list of current listener and the specified emitter.
    * After that, the listener can listen to the event which is emitted by the specified emitter.
    * \param pEmitter          Event emitter to bind. Current listener can listen to the event which is emitted by pEmitter.
    * \param pFunc             The callback function to process event date.
    * \return                  The automatically created event handler.
    */
    template <typename EventType,typename ListenerType> FbxEventHandler* Bind(FbxEmitter& pEmitter, void (ListenerType::*pFunc)(const EventType*)const)
    {
        FbxConstMemberFuncEventHandler<EventType,ListenerType>* eventHandler = 
                    FbxNew< FbxConstMemberFuncEventHandler<EventType,ListenerType> >(static_cast<ListenerType*>(this),pFunc);
        pEmitter.AddListener(*eventHandler);
        mEventHandler.PushBack(*eventHandler);
        return eventHandler;
    }

    /**Bind current listener and the specified emitter together via an automatically created event handler. 
    * An event handler will be created automatically and added to the handlers list of current listener and the specified emitter.
    * After that, the listener can listen to the event which is emitted by the specified emitter.
    * \param pEmitter          Event emitter to bind. Current listener can listen to the event which is emitted by pEmitter.
    * \param pFunc             The callback function to process event date.
    * \return                  The automatically created event handler.
    */
    template <typename EventType> FbxEventHandler* Bind(FbxEmitter& pEmitter, void (*pFunc)(const EventType*,FbxListener*))
    {
        FbxFuncEventHandler<EventType>* eventHandler = 
                        FbxNew< FbxFuncEventHandler<EventType> >(this, pFunc);
        pEmitter.AddListener(*eventHandler);
        mEventHandler.PushBack(*eventHandler);
        return eventHandler;
    }
    
	/**Unbind an event handler. The specified event handler will be removed from the handlers list of current listener. 
	  * \param aBindId       The event handler to unbind.
	  */
    void Unbind(const FbxEventHandler* aBindId);
	//@}

private:
    typedef FbxIntrusiveList<FbxEventHandler, FbxEventHandler::eListener> EventHandlerList;
    EventHandlerList mEventHandler;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_LISTENER_H_ */
