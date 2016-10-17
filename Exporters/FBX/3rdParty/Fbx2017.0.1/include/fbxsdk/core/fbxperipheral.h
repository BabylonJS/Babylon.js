/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxperipheral.h
#ifndef _FBXSDK_CORE_PERIPHERAL_H_
#define _FBXSDK_CORE_PERIPHERAL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxObject;

/** FbxPeripheral is an interface to load/unload content of FbxObject from memory to
somewhere you defined, for example, to a temporary file on disk .
* \nosubgrouping
* You need to inherited your own peripheral class from this class and overload
* the functions to control what information of a FbxObject you want to load/unload,
* and where you are going to load/unload these information to.
* For example, you can ask an object to dump itself on disk to free some memory and vice-versa 
* when you want to load/unload this object from your scene flexibly.
*/
class FBXSDK_DLL FbxPeripheral 
{
public:
	/**
	  * \name Constructor and Destructor
	  */
	//@{

	//!Constructor.
	FbxPeripheral();

    //!Destructor.
	virtual ~FbxPeripheral();
	//@}

	/** Reset the peripheral to its initial state.
	  */
	virtual void Reset() = 0;

	/** Unload the content of pObject.
	  * \param pObject                 Object whose content is to be offloaded into 
	  * the peripheral storage area.
	  * \return                        \c true if the object content has been successfully transferred.
	  * \c false otherwise.
	  */
	virtual bool UnloadContentOf(FbxObject* pObject) = 0;

	/** Load the content of pObject.
	  * \param pObject                 Object whose content is to be loaded from
	  * the peripheral storage area.
	  * \return                        \c true if the object content has been successfully transferred.
	  * \c false otherwise.
	  */
	virtual bool LoadContentOf(FbxObject* pObject) = 0;

	/** Check if this peripheral can unload the given object content.
	  * \param pObject                 Object whose content has to be transferred.
	  * \return                        \c true if the peripheral can handle this object content and
	  * has enough space in its storage area.\c false otherwise.
	  */
	virtual bool CanUnloadContentOf(FbxObject* pObject) = 0;

    /** Check if this peripheral can load the given object content.
    * \param pObject                  Object whose content has to be transferred.
    * \return                         \c true if the peripheral can handle this object content.
	* \c false otherwise.
    */
    virtual bool CanLoadContentOf(FbxObject* pObject) = 0;

    /** Initialize the connections of an object
    * \param pObject                  Object on which the request for connection is done.
    */
    virtual void InitializeConnectionsOf(FbxObject* pObject) = 0;

    /** Uninitialize the connections of an object
    * \param pObject                 Object on which the request for disconnection is done.
    */
    virtual void UninitializeConnectionsOf(FbxObject* pObject) = 0;
};

// predefined offload peripherals
extern FBXSDK_DLL FbxPeripheral* NULL_PERIPHERAL;
extern FBXSDK_DLL FbxPeripheral* TMPFILE_PERIPHERAL;
#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_PERIPHERAL_H_ */
