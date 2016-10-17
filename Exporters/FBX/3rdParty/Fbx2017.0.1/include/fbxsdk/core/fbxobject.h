/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxobject.h
#ifndef _FBXSDK_CORE_OBJECT_H_
#define _FBXSDK_CORE_OBJECT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxclassid.h>
#include <fbxsdk/core/fbxquery.h>
#include <fbxsdk/core/fbxemitter.h>
#include <fbxsdk/core/fbxproperty.h>
#include <fbxsdk/core/fbxstream.h>
#include <fbxsdk/core/base/fbxstringlist.h>
#include <fbxsdk/utils/fbxnamehandler.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxManager;
class FbxDocument;
class FbxImplementation;
class FbxImplementationFilter;
class FbxLibrary;
class FbxMessage;
class FbxPeripheral;
class FbxUserDataRecord;
class FbxConnectEvent;

//! \internal Macro used to declare ClassId mechanics.
#define FBXSDK_CLASS_DECLARE(Class, Parent)\
private:\
	Class(const Class&);\
	Class& operator=(const Class&);\
protected:\
	virtual ~Class(){};\
public:\
	static FbxClassId ClassId;\
	virtual FbxClassId GetClassId() const { return ClassId; }\
	friend class FBXSDK_NAMESPACE::FbxManager;\
    typedef Parent ParentClass;\
	static Class* Create(FbxManager* pManager, const char* pName);\

//! \internal Macro used to declare the FbxObject class.
#define FBXSDK_FBXOBJECT_DECLARE(Class, Parent)\
	FBXSDK_CLASS_DECLARE(Class, Parent)\
    FBXSDK_FRIEND_NEW()\
    static Class* Create(FbxObject* pContainer, const char* pName);\
protected:\
	static Class* Allocate(FbxManager* pManager, const char* pName, const Class* pFrom);\

//! Macro used to declare a new class derived from FbxObject.
#define FBXSDK_OBJECT_DECLARE(Class, Parent)\
	FBXSDK_FBXOBJECT_DECLARE(Class, Parent)\
protected:\
	Class(FbxManager& pManager, const char* pName) : Parent(pManager, pName){};\
private: /* end of object declaration, put back private */\

//! Macro used to declare a new abstract class derived from FbxObject.
#define FBXSDK_ABSTRACT_OBJECT_DECLARE(Class, Parent)\
	FBXSDK_CLASS_DECLARE(Class, Parent)\
protected:\
	static FbxObjectCreateProc Allocate;\
	Class(FbxManager& pManager, const char* pName) : Parent(pManager, pName){};\
private: /* end of object declaration, put back private */\

//! Macro used to implement a new class derived from FbxObject.
#define FBXSDK_OBJECT_IMPLEMENT(Class)\
	FbxClassId Class::ClassId;\
	Class* Class::Create(FbxManager* pManager, const char* pName)\
	{\
		return (Class*)pManager->CreateNewObjectFromClassId(Class::ClassId, pName);\
	}\
	Class* Class::Create(FbxObject* pContainer, const char* pName)\
	{\
		FBX_ASSERT_RETURN_VALUE(pContainer && pContainer->GetFbxManager(), NULL);\
		return (Class*)pContainer->GetFbxManager()->CreateNewObjectFromClassId(Class::ClassId, pName, pContainer);\
	}\
	Class* Class::Allocate(FbxManager* pManager, const char* pName, const Class* pFrom)\
	{\
		Class* lNewObject = FbxNew<Class>(*pManager, pName);\
		lNewObject->Construct(pFrom);\
		lNewObject->SetObjectFlags(FbxObject::eInitialized, true);\
		return lNewObject;\
	}\

//! Macro used to implement a new abstract class derived from FbxObject.
#define FBXSDK_ABSTRACT_OBJECT_IMPLEMENT(Class)\
	FbxClassId Class::ClassId;\
	FbxObjectCreateProc Class::Allocate = 0;\
	Class* Class::Create(FbxManager* pManager, const char* pName)\
	{\
		return (Class*)pManager->CreateNewObjectFromClassId(Class::ClassId, pName);\
	}\

/** The base class of most FBX objects. Provides the benefits of connectivity, identity, run-time typing,
  * properties, naming, copying, cloning, selection, and automated file IO. Most of
  * the FBX SDK API deals with FbxObject pointers when it comes to manipulate objects in its simplest form.
  *
  * The ClassID mechanism replaces the dynamic_cast mechanism for efficient run-time type information.
  *
  * The FbxObject provides methods for managing the connections between objects.  
  * Using connections, objects can be related to each other to form hierarchies or structures. All of
  * the FBX scene's object relations are expressed as connections between objects. Those connections can
  * be altered as needed to reflect most kind of setups encountered in this world. For example,
  * connections can be used to express parenting between transform nodes. Connections are not strict in
  * the sense that we allow any type of objects to connect to any other type of objects. The meaning of
  * the connection is purely semantic. As of yet, we do not provide the functionality to validate if
  * the connections made by the users are allowed or not.
  *
  * FbxObject provide a property (FbxProperty) mechanism to describe characteristics of 
  * objects in a scene. Properties may be either static or dynamic. Static properties are defined in the class direction 
  * and can be accessed directly by their name on the object exposing them without
  * the need for a search in the property list of the object. Dynamic properties can be added during run-time,
  * while the program is running. Objects can have an unlimited amount of properties. 
  * Properties can be listed at run-time, allowing for a flexible support of custom data
  * on objects, since they might be considered by the FBX file readers/writers depending on the flags set.
  *
  * Here is an example of a new empty minimal class template for FBX objects:
  * \code
  * //Declaration
  * class MyClass : public FbxObject
  * {
  *     FBXSDK_OBJECT_DECLARE(MyClass, FbxObject);	//Be careful! The second parameter to this macro must be the parent class name!
  *
  * public:
  *     //Declare methods and properties here...
  * };
  * \endcode
  * \code
  * //Implementation
  * FBXSDK_OBJECT_IMPLEMENT(MyClass);
  * \endcode
  * Before the new class can be used, it needs to be registered to the manager with the following method:
  * \code
  * MyFbxManager->RegisterFbxClass("MyClassName", FBX_TYPE(MyClass), FBX_TYPE(FbxObject));	//Be careful! The 3rd parameter must be the parent class! If the parent class change, it must be updated here too!
  * \endcode
  * Then to create or delete instances of your new class, the following methods must be used:
  * \code
  * //Creating a new instance
  * MyClass* MyObject = MyClass::Create(MyFbxManager, "Object Name");
  *
  * //Deleting this instance
  * MyObject->Destroy();
  * MyObject = NULL;
  * \endcode
  * \see FbxProperty
  */
class FBXSDK_DLL FbxObject : public FbxEmitter
{
	FBXSDK_FBXOBJECT_DECLARE(FbxObject, FbxEmitter);

public:
	//! \name General Object Management
	//@{
		/** Templated test if this class is a hierarchical children of the specified class type.
		* \return \c true if the object is a hierarchical children of the type specified.
		* \remark This function will perform a complete search until it reaches the top level class, but it will stop as soon as one ClassId matches the test. */
		template <class T> inline bool Is() const { return GetClassId().Is(T::ClassId); }

		/** Retrieve the FbxManager this object belongs to.
		* \return A pointer to the manager that this object belongs to. */
		FbxManager* GetFbxManager() const;

		/** Returns a const pointer to the document that contains this object.
		* \return A const pointer to the document that contains this object or \c NULL if the object does not belong to any document. */
		FbxDocument* GetDocument() const;

		/** Returns a const pointer to the root document that contains this object.
		* \return A const pointer to the root document that contains this object or \c NULL if the object does not belong to any document.
		* \remarks It returns this pointer if this object is a document object and does not belong to any document. That means this object is the root document. */
		FbxDocument* GetRootDocument() const;

		/** Returns a const pointer to the scene that contains this object.
		* \return A pointer to the scene that contains this object or \c NULL if the object does not belong to any scene. */
		FbxScene* GetScene() const;

		/** Unregister and delete this object from memory. This will also breaks all connections as well as removing all the instance of all the properties of this object with the object's class.
		* \param pRecursive If true, all children (source) objects will also be unregistered and deleted. */
		void Destroy(bool pRecursive=false);

		/** Reset all the properties of this object to their default values. */
		void ResetProperties();
	//@}

	//! \name Object Flags Management
	//@{
		//! Flags available to control objects.
		enum EObjectFlag
		{
			eNone = 0,					 //!< No flags.
			eInitialized = 1 << 0,		 //!< Automatically set when FbxObject::Construct() is completed.
			eSystem = 1 << 1,			 //!< When set, object is deleted upon FbxManager destroy only. Use carefully!
			eSavable = 1 << 2,			 //!< If set, object is stored in FBX file upon export. All objects are savable by default.
			eSelected = 1 << 3,			 //!< Used by the selection mechanic to specify a selected object.
			eHidden = 1 << 4,			 //!< Used for interface representation; if set, the object should not be visible.
			eContentLoaded = 1 << 5,	 //!< Used by load-on-demand mechanic to specify if an object has its content loaded.
			eDontLocalize = 1 << 6,		 //!< Used by asset builder; Do not localize this object
            eCopyCalledByClone = 1 << 16 //!< Used internally. If set, modify the Copy behavior of the object
		};

		/** Set the state of object flags.
		* \param pFlags Bit flags which value is going to be changed.
		* \param pValue If \c true, bit flags will be set, otherwise bits will be un-set. */
		void SetObjectFlags(EObjectFlag pFlags, bool pValue);

		/** Get the state of object flags.
		* \param pFlags Bit flags to query.
		* \return \c true if the specified bit flags are all set. */
		bool GetObjectFlags(EObjectFlag pFlags) const;

		/** Override all object flags at once.
		* \param pFlags The bit flags to set all the object flags to.
		* \remark This function will override all flags; unspecified bit flags will be un-set. */
		void SetAllObjectFlags(FbxUInt pFlags);

		/** Get all object flags at once.
		* \return All bit flags at once. */
		FbxUInt	GetAllObjectFlags() const;
	//@}

	//! \name Copying, Cloning and Referencing
	//@{
		/** Copy an object content into this object.
		* \param pObject	The source object to copy data from.
		* \return			Returns the destination object being modified by the source.
		* \remark			This function replace the assignment operator (operator=). It will copy all property values and the name. Connections are NOT copied. */
		virtual FbxObject& Copy(const FbxObject& pObject);

		//! Types of clones that can be created for FbxObject.
		enum ECloneType
		{
			eDeepClone,		//!< A deep copy of the object. Changes to either the original or clone properties do not propagate to each other.
			eReferenceClone	//!< Changes to original object properties propagate to clone. Changes to clone properties do not propagate to original.
		};

		/** Creates a clone of this object.
        * By default, the connections are NOT cloned. If the desired effect is to clone the connections as well, you must clone using the FbxCloneManager 
        * (refer to this class documentation for further details).
        *
		* \param pCloneType	    The type of clone to be created. By default, the clone type is eDeepClone.
		* \param pContainer	    An optional parameter to specify which object will "contain" the new object. By contain, we mean the new object
		*					    will become a source to the container, connection-wise.
        * \param pSet           See remark section.
		* \return			    The new clone, or NULL (if the specified clone type is not supported).
		* \remark			    When doing either a "deep" or "reference" clone type, the clone will always get its properties values set from
		*					    the source object properties values. 
        * \remark               Since this is a virtual function, some classes might do additional tasks.
        * \remark               The \e pSet argument is not used in the default implementation of this method. Specialized implementations should
        *                       cast this pointer to FbxCloneManager::CloneSet to have access to the cloned objects so far. Typically, this
        *                       pointer is set by the clone manager.
        */
		virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;

		/** Checks if this object is a reference clone of another object.
		* \return \c True if this object is a clone of another object, \c false otherwise */
		bool IsAReferenceTo() const;

		/** If this object is a reference clone, returns the original object (from which the clone originates).
		* \return The original object, or NULL (if this object is not a reference clone). */
		FbxObject* GetReferenceTo() const;

		/** Checks if any objects are reference cloned from this object.
		* \return \c True if there are objects reference cloned from this object, \c false otherwise. */
		bool IsReferencedBy() const;

		/** Returns the number of objects that are reference clones of this object.
		* \return The number of objects that are reference clones of this object. */
		int GetReferencedByCount() const;

		/** Returns a reference clone of this object at the specified index.
		* \param pIndex	The specified index, valid values are [0, GetReferencedByCount())
		* \return		The reference clone, or NULL (if pIndex is out of range). */
		FbxObject* GetReferencedBy(int pIndex) const;
	//@}

	/**
	  * \name Object Name Management
	  */
	//@{
		/** Sets the name of this object.
		  * \param pName The object name as a \c NULL terminated string.
		  */
		void SetName(const char* pName);

		/** Returns the full name of this object.
		  * \return The full name as a \c NULL terminated string.
		  */
		const char* GetName() const;

		/** Returns the name of the object without the namespace qualifier.
		  * \return The object name without the namespace qualifier.
		  */
		FbxString GetNameWithoutNameSpacePrefix() const;

		/** Returns the name of the object with the namespace qualifier.
		  * \return The object name with the namespace qualifier.
		  */
		FbxString GetNameWithNameSpacePrefix() const;

		/** Sets the initial name of the object.
		  * \param pName The object's initial name as a \c NULL terminated string.
		  */
		void SetInitialName(const char* pName);

		/** Returns the initial name of the object.
		  * \return The object's initial name as a \c NULL terminated string.
		  */
		const char* GetInitialName() const;

		/** Returns the namespace of the object.
		  * \return The object's namespace as a \c NULL terminated string.
		  */
		FbxString GetNameSpaceOnly();

		/** Sets the namespace of the object.
		  * \param pNameSpace The object's namespace as a \c NULL terminated string.
		  */
		void SetNameSpace(FbxString pNameSpace);

		/** Returns an array of all the namespaces for this object
		  * \param identifier The identifier of the namespaces.
		  * \return The array of all namespaces.
		  */
		FbxArray<FbxString*> GetNameSpaceArray(char identifier);

		/** Returns only the name (no namespace or prefix) of the object.
		  * \return The name only as a \c NULL terminated string.
		  */
		FbxString GetNameOnly() const;

		/** Returns the namespace qualifier.
		  * \return The namespace qualifier.
		  */
		FbxString GetNameSpacePrefix() const;

		/** Removes the prefix of pName
		  * \param pName Whose prefix is removed.
		  * \return A temporary string without prefix.
		  */
		static FbxString RemovePrefix(char* pName);

		/** Strips the prefix of pName
		  * \param lName Whose prefix is stripped.
		  * \return lName stripped of its prefix.
		  */
		static FbxString StripPrefix(FbxString& lName);

		/** Strips the prefix of pName
		  * \param pName Whose prefix is stripped.
		  * \return A temporary string stripped of its prefix.
		  */
		static FbxString StripPrefix(const char* pName);

		//!Returns the unique ID of this object.
		const FbxUInt64& GetUniqueID() const;
	//@}

	/**
	  * \name Selection management
	  */
	//@{
		/** Returns if this object is currently in a selected state.
		  * \return \c True if this object is selected, \c false otherwise.
		  */
		virtual bool GetSelected();

		/** Sets whether this object is currently selected.
		  * \param pSelected The selection flag.
		  */
		virtual void SetSelected(bool pSelected);
	//@}

	/**
	  * \name User data
	  */
	//@{
		/** Sets the data pointer for an user data record whose ID is pUserID.
		  * \param pUserID The ID of the user data record. 
		  * \param pUserData The data pointer of the user data record. 
		  * \remarks An user data record is composed of an ID and a data pointer.
		  * If the user data record identified by pUserID does not exist, a new user data record is created and its data pointer is set as pUserData. 
		  */
		void SetUserDataPtr(const FbxUInt64& pUserID, void* pUserData);

		/** Returns the data pointer of an user data record whose ID is pUserID.
		  * \param pUserID The ID of the user data record.
		  * \return The data pointer of the user data record, \c NULL if the user data record is not found. 
		  */
		void* GetUserDataPtr(const FbxUInt64& pUserID) const;

		/** Sets the data pointer for the user data record whose ID is the object ID.
		  * \param pUserData The data pointer of the user data record. 
		  * \remarks An user data record is composed of an ID and a data pointer.
		  * If the user data record identified by pUserID does not exist, a new user data record is created and its data pointer is set as pUserData.
		  */
		inline void SetUserDataPtr(void* pUserData){ SetUserDataPtr(GetUniqueID(), pUserData); }

		/** Returns the data pointer of the user data record whose ID is the object ID.
		  * \return The data pointer of the user data record, \c NULL if the user data record is not found. 
		  */
		inline void* GetUserDataPtr() const { return GetUserDataPtr(GetUniqueID()); }
	//@}

	/**
	  * \name General Object Connection and Relationship Management
	  */
	//@{
		/** Connects this object to a source object.
		  * \param pObject The source object to which this object connects.
		  * \param pType The connection type between this object and the source object.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool ConnectSrcObject(FbxObject* pObject, FbxConnection::EType pType=FbxConnection::eNone) { return RootProperty.ConnectSrcObject(pObject,pType); }

		/** Judges whether this object connects with the source object.
		  * \param pObject The source object.
		  * \return \c True if this object connects with the source object, \c false otherwise.
		  */
		inline bool IsConnectedSrcObject(const FbxObject* pObject) const { return RootProperty.IsConnectedSrcObject(pObject); }

		/** Disconnects this object from a source object.
		  * \param pObject The source object from which this object will be disconnected.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool DisconnectSrcObject(FbxObject* pObject){ return RootProperty.DisconnectSrcObject(pObject); }

		/** Disconnects this object from all source objects.
		  * \return \c True if it disconnects all source objects successfully, \c false otherwise.
		  */
		inline bool DisconnectAllSrcObject() { return RootProperty.DisconnectAllSrcObject(); }

		/** Disconnects this object from all source objects that satisfy a given criteria. 
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all the source objects successfully, \c false otherwise.
		  */
		inline bool DisconnectAllSrcObject(const FbxCriteria& pCriteria) { return RootProperty.DisconnectAllSrcObject(pCriteria); }

		/** Returns the number of source objects with which this object connects.
		  * \return The number of source objects with which this object connects. 
		  */
		inline int GetSrcObjectCount() const { return RootProperty.GetSrcObjectCount(); }

		/** Returns the number of source objects that satisfy the given criteria with which this object connects.
		  * \param pCriteria The given criteria.
		  * \return The number of source objects that satisfy the given criteria with which this object connects.
		  */
		inline int GetSrcObjectCount(const FbxCriteria& pCriteria) const { return RootProperty.GetSrcObjectCount(pCriteria); }

		/** Returns the source object with which this object connects at the specified index.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object at the specified index, NULL if not found.
		  */
		inline FbxObject* GetSrcObject(int pIndex=0) const { return RootProperty.GetSrcObject(pIndex); }

		/** Returns the source object that satisfies the criteria at the specified index with which this object connects.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object that satisfies the given criteria at the specified index, NULL if not found.
		  */
		inline FbxObject* GetSrcObject(const FbxCriteria& pCriteria, int pIndex=0) const { return RootProperty.GetSrcObject(pCriteria,pIndex); }

		/** Searches the source object with the specified name, starting at the specified index.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		inline FbxObject* FindSrcObject(const char* pName, int pStartIndex=0) const { return RootProperty.FindSrcObject(pName,pStartIndex); }

		/** Searches the source object with the specified name which satisfies the given criteria, starting at the specified index.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		inline FbxObject* FindSrcObject(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const { return RootProperty.FindSrcObject(pCriteria,pName,pStartIndex); }

		/** Disconnects this object from all source objects of the specified class type.
		* \return \c true if it disconnects all source objects successfully, \c false otherwise. */
		template <class T> inline bool DisconnectAllSrcObject() { return RootProperty.DisconnectAllSrcObject(FbxCriteria::ObjectType(T::ClassId)); }

		/** Disconnects this object from all source objects that are of the specified class type and that satisfy the given criteria.
		* \param pCriteria The given criteria.
		* \return \c true if it disconnects all source objects successfully, \c false otherwise. */
		template <class T> inline bool DisconnectAllSrcObject(const FbxCriteria& pCriteria) { return RootProperty.DisconnectAllSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the number of source objects of a specific class type with which this object connects.
		* \return The number of source objects of the specified class type with which this object connects. */
		template <class T> inline int GetSrcObjectCount() const { return RootProperty.GetSrcObjectCount(FbxCriteria::ObjectType(T::ClassId)); }

		/** Returns the number of source objects with which this object connects that are the specified class type and that satisfy the given criteria.
		* \param pCriteria The given criteria.
		* \return The number of source objects that are the specified class type and that satisfy the given criteria. */
		template <class T> inline int GetSrcObjectCount(const FbxCriteria& pCriteria) const { return RootProperty.GetSrcObjectCount(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the source object of the specified class type at the specified index.
		* \param pIndex The specified index whose default value is 0.
		* \return The source object of a specified class type at the specified index, NULL if not found. */
		template <class T> inline T* GetSrcObject(int pIndex=0) const { return (T*)RootProperty.GetSrcObject(FbxCriteria::ObjectType(T::ClassId), pIndex); }

		/** Returns the source object that is the specified class type and that satisfies the given criteria at the specified index.
		* \param pCriteria The given criteria.
		* \param pIndex The specified index whose default value is 0.
		* \return The source object that is of the specified class type and that satisfies the given criteria at the specified index, NULL if not found. */
		template <class T> inline T* GetSrcObject(const FbxCriteria& pCriteria, int pIndex=0) const { return (T*)RootProperty.GetSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pIndex); }

		/** Searches the source object with the specified name that is the specified class type, starting at the specified index.
		* \param pName The object name.
		* \param pStartIndex The start index.
		* \return The source object with the name, NULL if not found. */
		template <class T> inline T* FindSrcObject(const char* pName, int pStartIndex=0) const { return (T*)RootProperty.FindSrcObject(FbxCriteria::ObjectType(T::ClassId), pName, pStartIndex); }

		/** Searches the source object with the specified name that is the specified class type and that satisfies the given criteria, starting at the specified index.
		* \param pCriteria The given criteria.
		* \param pName The object name.
		* \param pStartIndex The start index.
		* \return The source object with the name, NULL if not found. */
		template <class T> inline T* FindSrcObject(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const { return (T*)RootProperty.FindSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pName, pStartIndex); }

		/** Connects this object to one destination object.
		  * \param pObject The destination object with which this object connects.
		  * \param pType The connection type between this object and the destination object.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool ConnectDstObject(FbxObject* pObject, FbxConnection::EType pType=FbxConnection::eNone) { return RootProperty.ConnectDstObject(pObject,pType); }

		/** Judges whether this object connects with the destination object.
		  * \param pObject The destination object.
		  * \return \c True if this object connects with the destination object, \c false otherwise.
		  */
		inline bool IsConnectedDstObject(const FbxObject* pObject) const { return RootProperty.IsConnectedDstObject(pObject); }

		/** Disconnects this object from the destination object.
		  * \param pObject The destination object from which this object disconnects.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool DisconnectDstObject(FbxObject* pObject) { return RootProperty.DisconnectDstObject(pObject); }

		/** Disconnects this object from all destination objects.
		  * \return \c True if it disconnects all destination objects successfully, \c false otherwise.
		  */
		inline bool DisconnectAllDstObject() { return RootProperty.DisconnectAllDstObject(); }

		/** Disconnects this object from all destination objects that satisfy given criteria.
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all destination objects successfully, \c false otherwise.
		  */
		inline bool DisconnectAllDstObject(const FbxCriteria& pCriteria) { return RootProperty.DisconnectAllDstObject(pCriteria); }

		/** Returns the number of destination objects with which this object connects. 
		  * \return The number of destination objects with which this object connects. 
		  */
		inline int GetDstObjectCount() const { return RootProperty.GetDstObjectCount(); }

		/** Returns the number of destination objects with which this object connects that satisfy the given criteria. 
		  * \param pCriteria The given criteria.
		  * \return The number of destination objects with which this object connects that satisfy the given criteria.
		  */
		inline int GetDstObjectCount(const FbxCriteria& pCriteria) const { return RootProperty.GetDstObjectCount(pCriteria); }

		/** Returns the destination object at the specified index with which this object connects.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object at the specified index, NULL if not found.
		  */
		inline FbxObject* GetDstObject(int pIndex=0) const { return RootProperty.GetDstObject(pIndex); }

		/** Returns the destination object with which this object connects that satisfies the given criteria at the specified index.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object that satisfies the given criteria at the specified index, NULL if not found.
		  */
		inline FbxObject* GetDstObject(const FbxCriteria& pCriteria, int pIndex=0) const { return RootProperty.GetDstObject(pCriteria,pIndex); }

		/** Searches the destination object with the specified name, starting at the specified index.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The destination object with the name, NULL if not found.
		  */
		inline FbxObject* FindDstObject(const char* pName, int pStartIndex=0) const { return RootProperty.FindDstObject(pName,pStartIndex); }

		/** Searches the destination object with the specified name which satisfies the given criteria, starting at the specified index.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The destination object with the name, NULL if not found.
		  */
		inline FbxObject* FindDstObject(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const { return RootProperty.FindDstObject(pCriteria,pName,pStartIndex); }

		/** Disconnects this object from all destination objects of the specified class type.
		* \return \c true if it disconnects all destination objects of the specified class type successfully, \c false otherwise. */
		template <class T> inline bool DisconnectAllDstObject() { return RootProperty.DisconnectAllDstObject(FbxCriteria::ObjectType(T::ClassId)); }

		/** Disconnects this object from all destination objects that are the specified class type and that satisfy the given criteria.
		* \param pCriteria The given criteria.
		* \return \c true if it disconnects all destination objects successfully, \c false otherwise. */
		template <class T> inline bool DisconnectAllDstObject(const FbxCriteria& pCriteria) { return RootProperty.DisconnectAllDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the number of destination objects of the specified class type with which this object connects.
		* \return The number of destination objects of the specified class type with which this object connects. */
		template <class T> inline int GetDstObjectCount() const { return RootProperty.GetDstObjectCount(FbxCriteria::ObjectType(T::ClassId)); }

		/** Returns the number of destination objects with which this object connects that are the specified class type and that satisfy the given criteria.
		* \param pCriteria The given criteria.
		* \return The number of destination objects that are the specified class type and that satisfy the given criteria. */
		template <class T> inline int GetDstObjectCount(const FbxCriteria& pCriteria) const { return RootProperty.GetDstObjectCount(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the destination object with which this object connects that is the specified class type at the specified index.
		* \param pIndex The specified index whose default value is 0.
		* \return The destination object of the specified class type at the specified index, NULL if not found. */
		template <class T> inline T* GetDstObject(int pIndex=0) const { return (T*)RootProperty.GetDstObject(FbxCriteria::ObjectType(T::ClassId), pIndex); }

		/** Returns the destination object with which this object connects that is the specified class type and that satisfies the given criteria at the specified index.
		* \param pCriteria The given criteria.
		* \param pIndex The specified index whose default value is 0.
		* \return The destination object that is the specified class type and that satisfies the given criteria at the specified index, NULL if not found. */
		template <class T> inline T* GetDstObject(const FbxCriteria& pCriteria, int pIndex=0) const { return (T*)RootProperty.GetDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pIndex); }

		/** Searches the destination object with the specified name which is of the specified class type, starting at the specified index.
		* \param pName The object name.
		* \param pStartIndex The start index.
		* \return The source object with the name, NULL if not found. */
		template <class T> inline T* FindDstObject(const char* pName, int pStartIndex=0) const { return (T*)RootProperty.FindDstObject(FbxCriteria::ObjectType(T::ClassId), pName, pStartIndex); }

		/** Searches the destination object with the specified name that is the specified class type and that satisfies the given criteria, starting at the specified index.
		* \param pCriteria The given criteria.
		* \param pName The object name.
		* \param pStartIndex The start index.
		* \return The source object with the name, NULL if not found. */
		template <class T> inline T* FindDstObject(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const { return (T*)RootProperty.FindDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pName, pStartIndex); }
	//@}

	/**
	  * \name Property Management
	  */
	//@{
		/** Returns the first property of this object.
		  * \return The first property of this object.
		  */
		inline FbxProperty GetFirstProperty() const
		{
			return RootProperty.GetFirstDescendent();
		}

		/** Returns the next property of this object that follows the specified property.
		  * \param pProperty The specified property.
		  * \return The next property of this object that follows pProperty.
		  */
		inline FbxProperty GetNextProperty(const FbxProperty& pProperty) const
		{
			return RootProperty.GetNextDescendent(pProperty);
		}

		/** Searches a property by name.
		  * \param pName The property name.
		  * \param pCaseSensitive Whether the name is case-sensitive.
		  * \return A valid FbxProperty if found, else an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindProperty(const char* pName, bool pCaseSensitive = true) const
		{
			return RootProperty.Find(pName, pCaseSensitive );
		}

		/** Searches a property by name and data type.
		  * \param pName The property name.
		  * \param pDataType The data type of the property.
		  * \param pCaseSensitive Whether the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindProperty(const char* pName, const FbxDataType& pDataType, bool pCaseSensitive = true) const
		{
			return RootProperty.Find(pName, pDataType, pCaseSensitive );
		}

		/** Searches a property by full name.
		  * \param pName The full name of the property as a \c NULL terminated string.
		  * \param pCaseSensitive whether or not the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindPropertyHierarchical(const char* pName, bool pCaseSensitive = true) const
		{
			return RootProperty.FindHierarchical(pName, pCaseSensitive );
		}

		/** Searches a property by full name and data type.
		  * \param pName The full name of the property as a \c NULL terminated string.
		  * \param pDataType The data type of the property.
		  * \param pCaseSensitive whether or not the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindPropertyHierarchical(const char* pName, const FbxDataType& pDataType, bool pCaseSensitive = true) const
		{
			return RootProperty.FindHierarchical(pName, pDataType, pCaseSensitive );
		}

		/** Returns the class root property.
		  * \return The class root property if it exists, else an invalid FbxProperty. See FbxProperty::IsValid().
		  * \remarks Class FbxObject and its sub-classes all have a class root property. This class root property contains basic information about the class type, such as the class name.  
		  */
		FbxProperty GetClassRootProperty();

		/** Connects this object to a source property.
		  * \param pProperty The source property with which this object connects.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool ConnectSrcProperty(const FbxProperty& pProperty) { return RootProperty.ConnectSrcProperty(pProperty); }

		/** Determines whether this object connects with the specified source property.
		  * \param pProperty The specified source property.
		  * \return \c True if this object connects with the specified source property, \c false otherwise.
		  */
		inline bool IsConnectedSrcProperty(const FbxProperty& pProperty) { return RootProperty.IsConnectedSrcProperty(pProperty); }

		/** Disconnects this object from the specified source property.
		  * \param pProperty The specified source property.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool DisconnectSrcProperty(const FbxProperty& pProperty) { return RootProperty.DisconnectSrcProperty(pProperty); }

		/** Returns the number of source properties with which this object connects. 
		  * \return The number of source properties with which this object connects. 
		  */
		inline int GetSrcPropertyCount() const { return RootProperty.GetSrcPropertyCount(); }

		/** Returns the source property at the specified index with which this object connects. 
		  * \param pIndex The specified index.
		  * \return The source property at the specified index. 
		  */
		inline FbxProperty GetSrcProperty(int pIndex=0) const { return RootProperty.GetSrcProperty(pIndex); }

		/** Searches a source property with which this object connects that has a specific name, starting at the specified index. 
		  * \param pName The specified property name.
		  * \param pStartIndex The start index.
		  * \return The source property with the specified name. 
		  */
		inline FbxProperty FindSrcProperty(const char* pName,int pStartIndex=0) const { return RootProperty.FindSrcProperty(pName,pStartIndex); }

		/** Connects this object to a destination property.
		  * \param pProperty The destination property with which this object connects.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool ConnectDstProperty(const FbxProperty& pProperty) { return RootProperty.ConnectDstProperty(pProperty); }

		/** Determines if this object connects with the specified destination property.
		  * \param pProperty The specified destination property.
		  * \return \c True if this object connects with the specified destination property, \c false otherwise.
		  */
		inline bool IsConnectedDstProperty(const FbxProperty& pProperty) { return RootProperty.IsConnectedDstProperty(pProperty); }

		/** Disconnects this object from the specified destination property.
		  * \param pProperty The specified destination property.
		  * \return \c True on success, \c false otherwise.
		  */
		inline bool DisconnectDstProperty(const FbxProperty& pProperty) { return RootProperty.DisconnectDstProperty(pProperty); }

		/** Returns the number of destination properties with which this object connects. 
		  * \return The number of destination properties with which this object connects. 
		  */
		inline int GetDstPropertyCount() const { return RootProperty.GetDstPropertyCount(); }

		/** Returns the destination property at the specified index with which this object connects. 
		  * \param pIndex The specified index.
		  * \return The destination property at the specified index. 
		  */
		inline FbxProperty GetDstProperty(int pIndex=0) const { return RootProperty.GetDstProperty(pIndex); }

		/** Searches a destination property with which this object connects that has a specific name, starting at the specified index. 
		  * \param pName The specified property name.
		  * \param pStartIndex The start index.
		  * \return The destination property with the specified name. 
		  */
		inline FbxProperty FindDstProperty(const char* pName, int pStartIndex=0) const { return RootProperty.FindDstProperty(pName,pStartIndex); }
	//@}

	/**
	  * \name Off-Loading Management
	  * \remarks You can modify the unloaded state flag using the SetObjectFlags()
	  *         method. The ContentIsUnloaded() method below (implemented in this class)
	  *         is simply a synonym of GetObjectFlags(eCONTENT_UNLOADED_FLAG)
	  */
	//@{
		/** Unloads this object's content using the offload peripheral that is currently set in the document
		  * then flushes it from memory.
		  * \return 2 if the object's content is already unloaded or 1 if
		  *         this object's content has been successfully unloaded to the current
		  *         peripheral.
		  *
		  * \remarks If the content is locked more than once, or the peripheral cannot handle
		  *         this object's unloading, or if an error occurs, this method returns 0 and does not flush the content.         
		  */
		int ContentUnload();

		/** Loads this object's content using the offload peripheral that is currently set in the document.
		  * \return 1 if this object's content has been successfully loaded from the current
		  *         peripheral, 2 if the content is already loaded, and 0 if an error occurs or
		  *         the object's content is locked.
		  * \remarks On a successful Load attempt, the object content is locked.
		  */
		int ContentLoad();

		/** Judges if this object's content is loaded.
		  * \return \c True if this object's content is loaded, \c false otherwise.
		  * \remarks An object that has not been filled yet must be considered
		  * unloaded.
		  */
		bool ContentIsLoaded() const;

		/** Decreases the content lock count of an object. If the content lock count of an object
		  * is greater than 0, the content of the object is considered locked.
		  */
		void ContentDecrementLockCount();

		/** Increases the content lock count of an object. If the content lock count of an object
		  * is greater than 0, the content of the object is considered locked.
		  */
		void ContentIncrementLockCount();

		/** Judges if this object's content is locked. The content is considered locked if the content lock count
		  * is greater than 0
		  * \return \c True if this object's content is locked, \c false otherwise.
		  * \remarks A locked state prevents the object content from being unloaded from memory but
		  * does not block the loading.
		  */
		bool ContentIsLocked() const;

		/** Writes the content of the object to the given stream.
		  * \param pStream The destination stream.
		  * \return \c True if the content is successfully processed
		  * by the receiving stream, \c false otherwise.
		  */
		virtual bool ContentWriteTo(FbxStream& pStream) const;

		/** Reads the content of the object from the given stream.
		  * \param pStream The source stream.
		  * \return \c True if the object fills itself with the received data
		  * from the stream successfully, \c false otherwise.
		  */
		virtual bool ContentReadFrom(const FbxStream& pStream);
	//@}

	/**
	  * \name Logging.
	  */
	//@{
		/** Emits a message in all available message emitters in the document or SDK manager.
		  * \param pMessage The message to emit. 
		  * \remarks The ownership of the message is transferred, don't delete it.
		  */
		void EmitMessage(FbxMessage* pMessage) const;
	//@}

	/**
	  * \name Localization helper.
	  */
	//@{
		/** Localization helper function, it calls the implementation of FBX SDK manager.
		  * Sub-classes that manage their own localization could over-ride this function.
		  * \param pID The identifier of the text to be localized.
		  * \param pDefault The default text. Uses pID as the default text if pDefault is NULL.
		  * \return The localized text or the default text if the text can't be localized, .
		  */
		virtual const char* Localize(const char* pID, const char* pDefault=NULL) const;
	//@}

	/**
	  * \name Application Implementation Management
	  */
	//@{
		/** Returns a handle on the parent library of this object.
		  * \return The parent library of this object, or \c NULL if the parent library doesn't exist.
		  */
		FbxLibrary* GetParentLibrary() const;

		/** Adds an implementation.
		  * \param pImplementation The implementation to be added.
		  * \return \c True on success, \c false otherwise.
		  * \remarks To succeed this function must be called with an implementation that has not already been added to this node.
		  */
		bool AddImplementation(FbxImplementation* pImplementation);

		/** Removes an implementation.
		  * \param pImplementation The implementation to be removed.
		  * \return \c True on success, \c false otherwise.
		  * \remarks To succeed this function must be called with an implementation that has already been added to this node.
		  */
		bool RemoveImplementation(FbxImplementation* pImplementation);

		/** Determines if this shading node has a default implementation.
		  * \return \c True if this shading node has a default implementation, \c false otherwise.
		  */
		bool HasDefaultImplementation(void) const;

		/** Returns the default implementation of this shading node.
		  * \return The default implementation of this shading node.
		  */
		FbxImplementation* GetDefaultImplementation(void) const;

		/** Sets the default implementation of this shading node.
		  * \param pImplementation The implementation to be set.
		  * \return \c True on success, \c false otherwise.
		  * \remarks To succeed this function must be called with an implementation that has already been added to this node.
		  *	Only the implementation which has already been added can be set as the default implementation.
		  */
		bool SetDefaultImplementation(FbxImplementation* pImplementation);

		/** Returns the number of implementations that satisfy a given criteria.
		  * \param pCriteria The given criteria.
		  * \returns The number of implementations.
		  */
		int GetImplementationCount(const FbxImplementationFilter* pCriteria=NULL) const;

		/** Returns the implementation at the specified index that satisfies the given criteria.
		  * \param pIndex The specified index.
		  * \param pCriteria The given criteria.
		  * \return The implementation at the specified index, NULL if not found.
		  */
		FbxImplementation* GetImplementation(int pIndex, const FbxImplementationFilter* pCriteria=NULL) const;
	//@}

	/**
	  * \name Object Storage && Retrieval
	  */
	//@{
		/** Returns the URL of this object.
		  * \return The URL of this object.
		  * \remarks The URL indicates where the object is stored.
		  */
		virtual FbxString GetUrl() const;

		/** Sets the URL of this object.
		  * \param pUrl The URL to be set.
		  * \return \c True on success, \c false otherwise.
		  * \remarks The URL indicates where the object is stored.
		  */
		virtual bool SetUrl(char* pUrl);
	//@}

	/** \name Run-time ClassId Management */
	//@{
		/** Set the run-time ClassId for this class. In most contexts, users do not have to change the run-time ClassId, they are automatically generated when registered a new class during run-time.
		* \param pClassId	The ClassId to set as the run-time ClassId for this object. */
		void SetRuntimeClassId(const FbxClassId& pClassId);

		/** Retrieve the run-time ClassId for this object.
		* \return The run-time ClassId for this object. */
		FbxClassId GetRuntimeClassId() const;

		/** Test if this class is a hierarchical children of the specified class type. This test will be performed on the run-time class registered with the FBX SDK Manager rather than the static ClassId generated at compile time.
		* \param pClassId	The class type to test against self.
		* \return			True if the object is a hierarchical children of the type specified.
		* \remarks			This function will perform a complete search until it reaches the top level class, but it will stop as soon as one ClassId matches the test. */
		bool IsRuntime(const FbxClassId& pClassId) const;

		/** Find out if the ClassId was registered during run-time rather than at compile time.
		* \return True if the run-time ClassId is inequal to the ClassId. */
		bool IsRuntimePlug() const;
	//@}

	/** Compact the memory used by this object.
	* \remark Note that this function might not result in saved memory because it depends if the sub-class implements it, or if any memory can actually be saved. */
	virtual void Compact();

	//! The root property that holds all children property for this object
	FbxProperty RootProperty;

protected:
	/** Optional constructor override, automatically called by default constructor.
	* \param pFrom	If not null, the function must take it into account like a copy constructor.
	* \remark		In case it is decided to override this function, do not forget to call ParentClass::Construct(pFrom) at the beginning. */
	virtual void Construct(const FbxObject* pFrom);

	/** Optional property constructor override, automatically called by default constructor.
	* \param pForceSet	If the property value must be set regardless of default value.
	* \remark			If your object have properties, they must be initialized in this function. */
    virtual void ConstructProperties(bool pForceSet);

	/** Optional destructor override, automatically called by default destructor.
	* \param pRecursive	If true, children objects should be destroyed as well.
	* \remark			In case it is decided to override this function, do not forget to call ParentClass::Destruct(pResursive) at the end. */
	virtual void Destruct(bool pRecursive);

	/** Clears this object's content from memory. This method must be overridden in the derived classes.
	* \remark This method is called by ContentUnload() if the object content's unloading is successful. */
	virtual void ContentClear();

	/** Retrieves the peripheral of that object.
	* \return	The current peripheral for that object
	* \remark	A peripheral manipulates the content of an object. For instance, a peripheral can load the connections of an object on demand. */
	virtual FbxPeripheral* GetPeripheral();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
public:
    virtual bool Compare(FbxObject* pOtherObject);

	//Basic comparison operator implementation. It simply compare property values between source and target.
	//NOTE: If a property cannot be found on one of the object, the comparison fails (return false).
	//Different classid will fail comparison as well as different property count. Reference properties are not compared.
	bool operator==(const FbxObject& pObject);
	bool operator!=(const FbxObject& pObject);

    virtual void				SetDocument(FbxDocument* pDocument);

	inline FbxPropertyHandle&	GetPropertyHandle() { return RootProperty.mPropertyHandle; }

	//Important note: If this function is not implemented, the pFileSubTypeName string used when registering your
	//class via FbxManager::RegisterFbxClass will be used instead. This makes it useless to re-implement this
	//function if you do not intend to return a different string for the same class.
    virtual const char*			GetTypeName() const;
    virtual FbxStringList		GetTypeFlags() const;

	// This function will go as deep as possible to clear the Connection list without sending 
	// notifications to the connections to give them the chance to Disconnect themselves. 
	// This is a bypass of the intended workflow and should be used with care.
	void WipeAllConnections();

    //Used as global flag to modify the behavior of FbxObject::Destruct() during a ForceKill() on the scene. This is for internal use.
	static void SetWipeMode(bool pState);
	static bool GetWipeMode();

protected:
	FbxObject(FbxManager& pManager, const char* pName);

	enum EPropertyNotifyType
	{
		ePropertySetRequest,
		ePropertySet,
		ePropertyGet
	};

	virtual bool		ConnectNotify(const FbxConnectEvent& pEvent);
	virtual bool		PropertyNotify(EPropertyNotifyType pType, FbxProperty& pProperty);
	bool				Copyable(const FbxObject& pObject);

private:
    void				CopyPropertiesFrom(const FbxObject& pFrom);
	void				SetClassRootProperty(FbxProperty& lProperty);
	int					GetFlatPropertyCount() const;

    FbxNameHandler		mName;
    FbxClassId			mRuntimeClassId;
    FbxUserDataRecord*	mUserData;
    FbxManager*			mManager;
    FbxImplementation*	mDefaultImplementation;
    FbxUInt64			mUniqueID;
    FbxInt32			mObjectFlags;
    FbxInt32			mContentLockCount;
    FbxInt32			mUserDataCount;
	static bool			mWipeMode;

	friend class FbxProperty;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** A utility class for iterating over the properties (FbxProperty) of any FbxObject.
* \nosubgrouping
*/
template<typename FbxProperty> class FbxIterator
{
public:
	/** Constructor.
	*\param pObject  The object whose properties are going to be iterated.
	*/
	FbxIterator(const FbxObject* pObject) : mObject(pObject) {}

	/**  Get the first property of the object. 
	*    \return The first property of the object.
	*/
	inline const FbxProperty& GetFirst() { mProperty = mObject->GetFirstProperty(); return mProperty; }

	/**  Get next property of the object. 
	*    \return The next property of the object.
	*/
	inline const FbxProperty& GetNext() { mProperty = mObject->GetNextProperty(mProperty); return mProperty; }

private:
	FbxProperty        mProperty;
	const FbxObject*   mObject;
};

/** A utility class for iterating over source objects that connect to property (FbxProperty) or object (FbxObject).
* \nosubgrouping
*/
class FbxIteratorSrcBase
{
public:
	/**
	 * Constructor.
	 * \param pProperty Property object. The iterator will iterate source objects that connect to it.
	 * \param pClassId	The class ID specifies the type of the source objects.
	 */
	inline FbxIteratorSrcBase(FbxProperty& pProperty,FbxClassId pClassId) :
		mProperty(pProperty),
		mClassId(pClassId),
		mSize(0),
		mIndex(-1)
	{
		ResetToBegin();
	}

	/**
	 * Constructor.
	 * \param pObject	FBX object. The iterator will iterate source objects that connect to it. 	
	 * \param pClassId	The class ID specifies the type of the source objects.
	 */
	inline FbxIteratorSrcBase(FbxObject* pObject,FbxClassId pClassId) :
		mProperty(pObject->RootProperty),
		mClassId(pClassId),
		mSize(0),
		mIndex(-1)
	{
		ResetToBegin();
	}

	/**
	 * Get the first source object that connects to the property or object.
	 * \return The first source object.
	 */
	inline FbxObject* GetFirst()
	{
		ResetToBegin();
		return GetNext();
	}

	/**
	 * Get next source object that connects to the property or object.
	 * \return The next source object. If there are no more objects, return NULL.
	 */
	inline FbxObject* GetNext()
	{
		mIndex++;
		return ((mIndex>=0) && (mIndex<mSize)) ? mProperty.GetSrcObject(FbxCriteria::ObjectType(mClassId), mIndex) : NULL;
	}

	/**
	 * Get next source object that connects to the property or object.
	 * \return The next source object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 */
	inline FbxObject* GetSafeNext()
	{
		mSize = mProperty.GetSrcObjectCount(FbxCriteria::ObjectType(mClassId));
		return GetNext();
	}

	/**
	 * Get the last source object that connects to the property or object.
	 * \return The last source object.
	 */
	inline FbxObject* GetLast()
	{
		ResetToEnd();
		return GetPrevious();
	}

	/**
	 * Get previous source object that connects to the property or object.
	 * \return The previous source object. If there are no more objects, return NULL.
	 */
	inline FbxObject* GetPrevious()
	{
		mIndex--;
		return ((mIndex>=0) && (mIndex<mSize)) ? mProperty.GetSrcObject(FbxCriteria::ObjectType(mClassId), mIndex) : NULL;
	}

	/**
	 * Get previous source object that connects to the property or object.
	 * \return The previous source object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 *		   If the iterate index is out of bounds, the last source object is returned.
	 */
	inline FbxObject* GetSafePrevious()
	{
		mSize = mProperty.GetSrcObjectCount(FbxCriteria::ObjectType(mClassId));
		while (mIndex>mSize) mIndex--;
		return GetPrevious();
	}

protected:
	/**
	 * Reset the iterate index to the beginning.
	 */
	inline void ResetToBegin()
	{
		mSize = mProperty.GetSrcObjectCount(FbxCriteria::ObjectType(mClassId));
		mIndex = -1;
	}

	/**
	 * Reset the iterate index to the end.
	 */
	inline void ResetToEnd()
	{
		mSize = mProperty.GetSrcObjectCount(FbxCriteria::ObjectType(mClassId));
		mIndex = mSize;
	}

	FbxProperty	mProperty;	//! The property to iterate. If iterate an object, this is the root property of the object.
	FbxClassId	mClassId;	//! The class ID specifies the type of the source objects to be retrieved.
	int			mSize;		//! The number of source objects whose type is specified by mClassId.
	int			mIndex;		//! Iterate index.
};

/**
 * A utility class for iterating over source objects that connect to property (FbxProperty) or object (FbxObject).
 * The class is a wrapper of FbxIteratorSrcBase with template.
 * \nosubgrouping
 */
template<class Type> class FbxIteratorSrc : protected FbxIteratorSrcBase
{
public:
	/**
	 * Constructor.
	 * \param pObject	FBX object. The iterator will iterate source objects that connect to it.
	 */
    inline FbxIteratorSrc(FbxObject* pObject) : FbxIteratorSrcBase(pObject,Type::ClassId) {}
    
	/**
	 * Constructor.
	 * \param pProperty Property object. The iterator will iterate source objects that connect to it.
	 */
	inline FbxIteratorSrc(FbxProperty& pProperty) : FbxIteratorSrcBase(pProperty,Type::ClassId) {}

	/**
	 * Get the first source object that connects to the property or object.
	 * \return The first source object.
	 */
    inline Type* GetFirst()         { return (Type*)FbxIteratorSrcBase::GetFirst(); }
    
	/**
	 * Get next source object that connects to the property or object.
	 * \return The next source object. If there are no more objects, return NULL.
	 */
	inline Type* GetNext()          { return (Type*)FbxIteratorSrcBase::GetNext(); }
    
	/**
	 * Get next source object that connects to the property or object.
	 * \return The next source object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 */
	inline Type* GetSafeNext()      { return (Type*)FbxIteratorSrcBase::GetSafeNext(); }
    
	/**
	 * Get the last source object that connects to the property or object.
	 * \return The last source object.
	 */
	inline Type* GetLast()          { return (Type*)FbxIteratorSrcBase::GetLast(); }
    
	
	/**
	 * Get previous source object that connects to the property or object.
	 * \return The previous source object. If there are no more objects, return NULL.
	 */
	inline Type* GetPrevious()      { return (Type*)FbxIteratorSrcBase::GetPrevious(); }
    
	/**
	 * Get previous source object that connects to the property or object.
	 * \return The previous source object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 *		   If the iterate index is out of bounds, the last source object is returned.
	 */
	inline Type* GetSafePrevious()  { return (Type*)FbxIteratorSrcBase::GetSafePrevious(); }
};

/** A utility class for iterating over destination objects that connect to property (FbxProperty) or object (FbxObject).
* \nosubgrouping
*/
class FbxIteratorDstBase
{
protected:
	/** The property to iterate. If iterate an object, this is the root property of the object. */
	FbxProperty    mProperty;
	/** The class ID specifies the type of the destination objects to be retrieved. */
	FbxClassId     mClassId;
	/** The number of destination objects whose type is specified by mClassId. */
	int             mSize;
	/** Iterate index. */
	int             mIndex;

public:
	/**
	 * Constructor.
	 * \param pProperty Property object. The iterator will iterate destination objects that connect to it.
	 * \param pClassId	The class ID specifies the type of the destination objects.
	 */
    inline FbxIteratorDstBase(FbxProperty& pProperty,FbxClassId pClassId) :
        mProperty(pProperty),
        mClassId(pClassId),
        mSize(0),
        mIndex(-1)
    {
        ResetToBegin();
    }
    
	/**
	 * Constructor.
	 * \param pObject	FBX object. The iterator will iterate source objects that connect to it. 	
	 * \param pClassId	The class ID specifies the type of the source objects.
	 */	
	inline FbxIteratorDstBase(FbxObject* pObject,FbxClassId pClassId) :
        mProperty(pObject->RootProperty),
        mClassId(pClassId),
        mSize(0),
        mIndex(-1)
    {
        ResetToBegin();
    }

	/**
	 * Get the first destination object that connects to the property or object.
	 * \return The first destination object.
	 */
    inline FbxObject* GetFirst()
    {
        ResetToBegin();
        return GetNext();
    }

	/**
	 * Get next destination object that connects to the property or object.
	 * \return The next destination object. If there are no more objects, return NULL.
	 */
    inline FbxObject* GetNext()
    {
        mIndex++;
        return ((mIndex>=0) && (mIndex<mSize)) ? mProperty.GetDstObject(FbxCriteria::ObjectType(mClassId), mIndex) : NULL;
    }
    
	/**
	 * Get next destination object that connects to the property or object.
	 * \return The next destination object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 */
	inline FbxObject* GetSafeNext()
    {
        mSize = mProperty.GetDstObjectCount(FbxCriteria::ObjectType(mClassId));
        return GetNext();
    }
    
	/**
	 * Get the last destination object that connects to the property or object.
	 * \return The last destination object.
	 */
	inline FbxObject* GetLast()
    {
        ResetToEnd();
        return GetPrevious();
    }
    
	/**
	 * Get previous destination object that connects to the property or object.
	 * \return The previous destination object. If there are no more objects, return NULL.
	 */
	inline FbxObject* GetPrevious()
    {
        mIndex--;
        return ((mIndex>=0) && (mIndex<mSize)) ? mProperty.GetDstObject(FbxCriteria::ObjectType(mClassId), mIndex) : NULL;
    }
    
	/**
	 * Get previous destination object that connects to the property or object.
	 * \return The previous destination object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 *		   If the iterate index is out of bounds, the last destination object is returned.
	 */
	inline FbxObject* GetSafePrevious()
    {
        mSize = mProperty.GetDstObjectCount(FbxCriteria::ObjectType(mClassId));
        while (mIndex>mSize) mIndex--;
        return GetPrevious();
    }

protected:
    /**
	 * Reset the iterate index to the beginning.
	 */
	inline void ResetToBegin()
    {
        mSize = mProperty.GetDstObjectCount(FbxCriteria::ObjectType(mClassId));
        mIndex = -1;
    }
    
	/**
	 * Reset the iterate index to the end.
	 */
	inline void ResetToEnd()
    {
        mSize = mProperty.GetDstObjectCount(FbxCriteria::ObjectType(mClassId));
        mIndex = mSize;
    }
};

/**
 * A utility class for iterating over destination objects that connect to property (FbxProperty) or object (FbxObject).
 * The class is a wrapper of FbxIteratorDstBase with template.
 * \nosubgrouping
 */
template<class Type> class FbxIteratorDst : protected FbxIteratorDstBase
{
public:
	/**
	 * Constructor.
	 * \param pObject	FBX object. The iterator will iterate destination objects that connect to it.
	 */
    inline FbxIteratorDst(FbxObject* pObject) : FbxIteratorDstBase(pObject,Type::ClassId) {}
    
	/**
	 * Constructor.
	 * \param pProperty Property object. The iterator will iterate destination objects that connect to it.
	 */
	inline FbxIteratorDst(FbxProperty& pProperty) : FbxIteratorDstBase(pProperty,Type::ClassId) {}
    
	/**
	 * Get the first destination object that connects to the property or object.
	 * \return The first destination object.
	 */
	inline Type* GetFirst()         { return (Type*)FbxIteratorDstBase::GetFirst(); }
    
	/**
	 * Get next destination object that connects to the property or object.
	 * \return The next destination object. If there are no more objects, return NULL.
	 */
	inline Type* GetNext()          { return (Type*)FbxIteratorDstBase::GetNext(); }
    
	/**
	 * Get next destination object that connects to the property or object.
	 * \return The next destination object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 */
	inline Type* GetSafeNext()      { return (Type*)FbxIteratorDstBase::GetSafeNext(); }
    
	/**
	 * Get the last destination object that connects to the property or object.
	 * \return The last destination object.
	 */
	inline Type* GetLast()          { return (Type*)FbxIteratorDstBase::GetLast(); }
    
	/**
	 * Get previous destination object that connects to the property or object.
	 * \return The previous destination object. If there are no more objects, return NULL.
	 */
	inline Type* GetPrevious()      { return (Type*)FbxIteratorDstBase::GetPrevious(); }
    
	/**
	 * Get previous destination object that connects to the property or object.
	 * \return The previous destination object. If there are no more objects, return NULL.
	 * \remark This method makes sure the iterate index is not out of bounds.
	 *		   If the iterate index is out of bounds, the last destination object is returned.
	 */
	inline Type* GetSafePrevious()  { return (Type*)FbxIteratorDstBase::GetSafePrevious(); }
};

/** Convert the class type parameter into a C class parameter for other function inputs.
  * Usage example:
  * \code
  * //Assuming MyCamera is a valid FbxCamera object
  * bool AreCamerasObject = MyCamera->Is<FbxObject>(); //Should return true :)
  * \endcode
  */
#define FBX_TYPE(class) ((const class*)0)

/** Safe casting of FBX SDK objects into other FBX SDK class types. This cast will perform
  * the complete test to make sure the object inherits from the requested class type. This is
  * the equivalent of a dynamic_cast but much faster.
  * \param pObject	The object to try to cast into T type.
  * \return			A non-null pointer if the cast was successful.
  */
template <class T> inline T* FbxCast(FbxObject* pObject)
{
	return pObject && pObject->Is<T>() ? (T*)pObject : 0;
}

/** Safe const casting of FBX SDK objects into other FBX SDK class types. This cast will perform
  * the complete test to make sure the object inherits from the requested class type. This is
  * the equivalent of a dynamic_cast but much faster.
  * \param pObject	The object to try to cast into T type.
  * \return			A non-null pointer if the cast was successful.
  */
template <class T> inline const T* FbxCast(const FbxObject* pObject)
{
	return pObject && pObject->Is<T>() ? (const T*)pObject : 0;
}

//! Macro used to iterate over source or destination objects that connect to property (FbxProperty) or object (FbxObject).
#define FbxForEach(Iterator, Object) for((Object)=(Iterator).GetFirst();(Object)!=0;(Object)=(Iterator).GetNext())

//! Macro used to reversely iterate over source or destination objects that connect to property (FbxProperty) or object (FbxObject)
#define FbxForEachReverse(Iterator, Object) for(Object=(Iterator).GetLast();(Object)!=0;Object=(Iterator).GetPrevious())

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
class FBXSDK_DLL FbxConnectEvent
{
public:
	enum EType
	{
		eConnectRequest,
		eConnect,
		eConnected,
		eDisconnectRequest,
		eDisconnect,
		eDisconnected
	};

	enum EDirection
	{
		eSource,
		eDestination
	};

    inline FbxConnectEvent(EType pType,EDirection pDir,FbxProperty *pSrc,FbxProperty *pDst) :
		mType(pType),
		mDirection(pDir),
		mSrc(pSrc),
		mDst(pDst)
    {
    }
    inline EType GetType() const { return mType; }
    inline EDirection GetDirection() const { return mDirection; }
    inline FbxProperty& GetSrc() const { return *mSrc;  }
    inline FbxProperty& GetDst() const { return *mDst;  }
    template <class T> inline T* GetSrcIfObject() const { return mSrc->IsRoot() ? FbxCast<T>(mSrc->GetFbxObject()) : (T*)0; }
    template <class T> inline T* GetDstIfObject() const { return mDst->IsRoot() ? FbxCast<T>(mDst->GetFbxObject()) : (T*)0; }

private:
    EType			mType;
    EDirection		mDirection;
    FbxProperty*	mSrc;
    FbxProperty*	mDst;
};

class FbxObjectPropertyChanged : public FbxEvent<FbxObjectPropertyChanged>
{
	FBXSDK_EVENT_DECLARE(FbxObjectPropertyChanged);

public:
	FbxObjectPropertyChanged(FbxProperty pProp) : mProp(pProp) {}
	FbxProperty mProp;
};
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_OBJECT_H_ */
