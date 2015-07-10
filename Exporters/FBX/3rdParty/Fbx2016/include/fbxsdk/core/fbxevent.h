/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxevent.h
#ifndef _FBXSDK_CORE_EVENT_H_
#define _FBXSDK_CORE_EVENT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxpropertytypes.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FBX SDK event base class. 
  * An event is something that is emitted by an emitter, with the goal of being filled by the listener that listen to it. 
  * You can see that like a form that you send to some people. If those people know how to fill the form, they fill it and return
  * it to you with the right information in it. FBX object could be used as emitter, since FbxObject is derived from FbxEmitter.
  * Meanwhile, plug-in could be used as listener, since FbxPlugin is derived from FbxListener.
  * The derived class of FbxEventBase contains a type ID to distinguish different types of events.
  * FBX object can emit different types of FBX events at different conditions. 
  * \par The whole process of event is:
  * \li 1. Create an emitter and a listener, then bind them together via the same event handler.
  * \li 2. Emitter can emit an event at certain conditions. The event could be handled by event handler.
  * \li 3. Once an event is emitted, the listener to this event will receive a signal. 
  * \li 4. And then the listener could process the event data according to the types of event, by calling event handler.
  * \note The event data is process by the callback function of event handler.
  * For example, if a certain property of a FBX object is changed, the FBX object(emitter) can emit an event which type is FbxObjectPropertyChanged.
  * The plug-in(listener) who are listening to FbxObjectPropertyChanged, will receive a signal and take action to process the event data. 
  * \nosubgrouping
  * \see FbxEvent FbxEventHandler FbxListener FbxEmitter
  */
class FBXSDK_DLL FbxEventBase
{
  public:
	 /**
	   * \name Constructor and Destructor
	   */
     //@{
	 //!Destructor
     virtual ~FbxEventBase();
	 //@}

	 /** Retrieve the event type ID
	   * \return            type id
	   */
     virtual int GetTypeId() const = 0;

	 /** Force events to give us a name
	   * \return            event name 
	   */
     virtual const char* GetEventName() const = 0;   

	protected:
     static int GetStaticTypeId(const char*);
};

// Force events to declare a name by using an abstract method, and force them to use 
// the proper name by making the call from FbxEvent<> go through the private static
// method.
#define FBXSDK_EVENT_DECLARE(Class)												\
	public: virtual const char* GetEventName() const { return FbxEventName(); }	\
	private: static const char* FbxEventName() { return #Class; }				\
	friend class FbxEvent<Class>;												\

//
// Similar to above, but to be used when you've got an event template, and the
// type is something know to FBX
//
#define FBXSDK_EVENT_TYPE_DECLARE(Class, FBXType)                                  \
  public: virtual const char* GetEventName() const { return FbxEventName(); }      \
  private:                                                                         \
     static const char* FbxEventName() {                                           \
     static FbxString lEventName = FbxString(#Class) + FbxString("<") +                  \
     FbxGetDataTypeFromEnum(FbxTypeOf(*((const FBXType *)0))).GetName() + ">";               \
                                                                                   \
     return lEventName.Buffer();                                                   \
  }                                                                                \
  friend class FbxEvent< Class<FBXType> >;



//This is for templates classes that will uses non fbxtypes in their templates
//We force the the creation of an UNIQUE string for each types so that we can
//retrieve the event within multiple DLLs

//to be able to use this, the char EventName[] = "uniqueEventName"; must be declared
//globally.

#define FBXSDK_EVENT_TEMPLATE_HEADER(ClassName, TemplateName)\
template < class TemplateName, const char* T > \
class ClassName: public  FbxEvent< ClassName <TemplateName,T> >\
{\
    public: virtual const char* GetEventName() const {return FbxEventName();}\
    private: static const char* FbxEventName() {\
    static FbxString lEventName = (FbxString(#ClassName) +"<"+ FbxString(T) +">");\
    return lEventName.Buffer();\
    }\
    friend class FbxEvent< ClassName<TemplateName, T> >;


//This is the footer macro, to put at the end to close the template class
//created by FBXSDK_EVENT_TEMPLATE_HEADER
#define FBXSDK_EVENT_TEMPLATE_FOOTER()\
};

/** FBX event class, derived from FbxEventBase, and it contains a type ID for event. 
* It's a template class. You can derive your own types of even. Such as:
* \code class FbxEventCustom : public FbxEvent<FbxEventCustom> \endcode
* \see FbxObjectPropertyChanged FbxEventReferencedDocument FbxEventPostExport
* \see FbxEventPostImport FbxEventPreExport FbxEventPreImport FbxEventPopulateSystemLibrary
* \nosubgrouping
* \remarks A FBX event is something that is emitted by an emitter, with the goal of being filled by the listener that listen to it. 
* An object(emitter) can emit a certain type of event, the plug-in(listener) who are listening to that type of event, 
* will receive a signal and take action to process the event data. 
* \par The whole process of event is:
* \li 1. Create an emitter and a listener, then bind them together via the same event handler.
* \li 2. Emitter can emit an event at certain conditions. The event could be handled by event handler.
* \li 3. Once an event is emitted, the listener to this event will receive a signal. 
* \li 4. And then the listener could process the event data according to the types of event, by calling event handler.
* \note The event data is process by the callback function of event handler.
* \see FbxEventBase FbxEventHandler FbxListener FbxEmitter
*/
//---------------------------------------------------
// T : We use the curiously recurring template pattern
//          to initialize the typeId of each event type
template<typename T> class FbxEvent : public FbxEventBase
{
public:
    //!Destructor
    virtual ~FbxEvent(){}

    /** Update the type ID of current event with the given type ID.
    * \param pTypeId     the new type ID.
    */
    static void ForceTypeId(int pTypeId)
    {
        // This is to handle specific cases where the type ID must be hard coded
        // It is useful for shared event across DLL. We can then guarantee that
        // The ID of a certain type will always have the same ID
        smTypeId = pTypeId;
    }

    /** Retrieve the event type ID
    * \note This may be called from multiple threads.
    * \return            type id
    */
    virtual int GetTypeId() const 
    {
		return GetStaticTypeId();
    }

    /** Retrieve the event type ID
    * \return            type id
    */
    static int GetStaticTypeId() 
    {
        if( !smTypeId )
        {
            if( !smTypeId )
            {
                // If this does not compile, you need to add 
                // FBXSDK_EVENT_DECLARE(YourEventClassName) to your class declaration
                smTypeId  = FbxEventBase::GetStaticTypeId(T::FbxEventName());
            }
        }

       return smTypeId;
    }

private:
    //! The type ID of event
    static int smTypeId;
};

// Static members implementation
template<typename T> int FbxEvent<T>::smTypeId = 0;

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_EVENT_H_ */
