/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxproperty.h
#ifndef _FBXSDK_CORE_PROPERTY_H_
#define _FBXSDK_CORE_PROPERTY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxquery.h>
#include <fbxsdk/core/fbxpropertydef.h>
#include <fbxsdk/core/fbxpropertytypes.h>
#include <fbxsdk/core/fbxdatatypes.h>
#include <fbxsdk/core/base/fbxmap.h>
#include <fbxsdk/core/base/fbxset.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxObject;
class FbxAnimStack;
class FbxAnimLayer;
class FbxAnimCurveNode;
class FbxAnimCurve;
class FbxAnimEvaluator;

/** \brief Class to hold user properties.
* \nosubgrouping
*/
class FBXSDK_DLL FbxProperty
{
public:
	/**
	  * \name Constructor and Destructor.
	  */
	//@{
		/** Creates a runtime property on the specified property.
		  * \param pCompoundProperty	The parent property of this property.
		  * \param pDataType			The data type of this property.
		  * \param pName				The property name. 
		  * \param pLabel				The label of this property.
		  * \param pCheckForDup			If \c true, parent property checks if it has a child property already with pName, if \c false, the new property is created. 
		  * \param pWasFound			If pCheckForDup is \c true, this flag is set to indicate whether the pCompoundProperty already has a child property with pName.  
		  */
		static FbxProperty Create(const FbxProperty& pCompoundProperty, const FbxDataType& pDataType, const char* pName, const char* pLabel="", bool pCheckForDup=true, bool* pWasFound=NULL);

		/** Creates a runtime property on the specified object.
		  * \param pObject		The object on which the property will be created.
		  * \param pDataType	The data type of this property.
		  * \param pName		The property name.
		  * \param pLabel		The label of this property.
		  * \param pCheckForDup	If \c true, pObject checks whether it already has a property with pName, if \c false, a new property is created.
		  * \param pWasFound	If pCheckForDup is \c true, this flag is set to indicate whether the pObject already has a child property with pName.
		  */
		static FbxProperty Create(FbxObject* pObject, const FbxDataType& pDataType, const char* pName, const char* pLabel="", bool pCheckForDup=true, bool* pWasFound=NULL);

		/** Creates a dynamic property from another property on the specified property.
		  * \param pCompoundProperty	The parent property of this property.
		  * \param pFromProperty		The property copied by this property. 
		  * \param pCheckForDup			If \c true, parent property checks if it already has a child property that has the name of pFromProperty, if \c false, a new property is created. 
		  * \remark						Only the property name, label, min/max, enums and flags are copied.
		  */
		static FbxProperty CreateFrom(const FbxProperty& pCompoundProperty, FbxProperty& pFromProperty, bool pCheckForDup=true);

		/** Creates a dynamic property from another property on the specified object.
		  * \param pObject			The object that contains this property.
		  * \param pFromProperty	The property copied by this property. 
		  * \param pCheckForDup		If \c true, pObject checks if it already has a property that has the name of pFromProperty, if \c false, a new property is created. 
		  * \remark					Only the property name, label, min/max, enums and flags are copied.
		  */
		static FbxProperty CreateFrom(FbxObject* pObject, FbxProperty& pFromProperty, bool pCheckForDup=true);

		/** Destroys a dynamic property.
		  */
		void Destroy();

		/** Destroys a dynamic property and its children
		* \remarks Destroy all children of current property, and current property will also be destroyed.
		*/
		void DestroyRecursively();

		/** Destroys children of a dynamic property.
		* \remarks Destroy all children of current property, and current property will not be destroyed.
		*/
		void DestroyChildren();

		/** Static property constructor.
		  */
		FbxProperty();

		/** Copy constructor for properties.
		  * \param pProperty The property copied to this one.
		  */
		FbxProperty(const FbxProperty& pProperty);

		/** Copy constructor for properties.
		  * \param pPropertyHandle The property handle copied to this property handle. 
		  */
		FbxProperty(const FbxPropertyHandle& pPropertyHandle);

		/** Static property destructor.
		  */
		~FbxProperty();
	//@}

	/**
	  * \name Property Identification.
	  */
	//@{
		/** Returns the property data type. 
		  * \return The property data type.
		  */
		FbxDataType GetPropertyDataType() const;

		/** Returns the internal name of the property. 
		  * \return Property internal name string.
		  */
		FbxString GetName() const;

		/** Returns the internal name of the property. 
		  * \return Property internal name string.
		  */
		const char* GetNameAsCStr() const;

		/** Returns the hierarchical name of the property.
		  * \return Property hierarchical name string.
		  */
		FbxString GetHierarchicalName() const;

		/** Returns the property label.
		  * \param pReturnNameIfEmpty If \c true, lets this method return the internal name if the label is empty. 
		  * \return The property label if set, or the property internal name if the pReturnNameIfEmpty
		  *         flag is set to \c true and the label has not been defined.
		  * \remarks Some applications may ignore the label field and work uniquely with the
		  *          internal name. Therefore, it should not be taken for granted that a label exists. Also, remember
		  *          that the label does not get saved in the FBX file. It only exists while the property object is
		  *          in memory.
		  */
		FbxString GetLabel(bool pReturnNameIfEmpty=true) const;


		/** Sets a label for the property.
		  * \param pLabel Label string.
		  */
		void SetLabel(const FbxString& pLabel);

		/** Returns the object that contains the property.
		  * \return The property object owner (or null if the property is an orphan).
		  */
		FbxObject* GetFbxObject() const;
	//@}

	/**
	  * \name User data
	  */
	//@{
		/** Sets the user tag.
		  * \param pTag The user tag to be set.
		  */
		void SetUserTag(int pTag);
		    
		//! Gets the user tag.
		int GetUserTag();

		/** Sets the user data pointer.
		  * \param pUserData The user data pointer.
		  */            
		void SetUserDataPtr(void* pUserData);

		/** Gets the user data pointer.
		  * \return The user data pointer.
		  */
		void* GetUserDataPtr();
	//@}

	/**
	  * \name Property Flags.
	  */
	//@{
		/** Changes the property attribute.
		  * \param pFlag Property attribute identifier.
		  * \param pValue New state of pFlag.
		  */
		void ModifyFlag(FbxPropertyFlags::EFlags pFlag, bool pValue);

		/** Returns the state of the property attribute. 
		  * \param pFlag Property attribute identifier.
		  * \return The state of the property attribute(pFlag).
		  */
		bool GetFlag(FbxPropertyFlags::EFlags pFlag) const;

		/** Returns the state of all of the property attributes.
		  * \return The state of the property attributes(pFlags).
		  */
		FbxPropertyFlags::EFlags GetFlags() const;

		/** Returns the inheritance type of the given flag, similar to GetValueInheritType().
		  * \param pFlag The flag to be queried.
		  * \return The inheritance type of the specific flag.
		  */
		FbxPropertyFlags::EInheritType GetFlagInheritType( FbxPropertyFlags::EFlags pFlag ) const;

		/** Sets the inheritance type for the specific flag, similar to SetValueInheritType().
		  * \param pFlag The flag to be set.
		  * \param pType The inheritance type to be set.
		  * \return \c True on success, \c false otherwise.
		  */
		bool SetFlagInheritType( FbxPropertyFlags::EFlags pFlag, FbxPropertyFlags::EInheritType pType );

		/** Checks if the property flag has been modified from its default value.
		  * \param pFlag The flag to be queried.
		  * \return \c True if the value of this property has changed, \c false otherwise
		  */
		bool ModifiedFlag( FbxPropertyFlags::EFlags pFlag ) const;
	//@}

	/**
	  * \name Assignment and comparison operators
	  */
	//@{
		/** Assignment operator.
		  * \param pProperty The property assigned to this property.
		  * \return This property.
		  */
		FbxProperty& operator= (const FbxProperty& pProperty);

		/** Equivalence operator.
		  * \param pProperty The property compared to this property.
		  * \return \c True if equal, \c false otherwise.
		  */            
		bool operator== (const FbxProperty& pProperty) const;

		/** Non-equivalence operator.
		  * \param pProperty The property compared to this property.
		  * \return \c True if unequal, \c false otherwise.
		  */    
		bool operator!= (const FbxProperty& pProperty) const;

		/** Lesser operator, used to sort property in map.
		* \param pProperty The property compared to this property.
		* \return \c true if less, \c false otherwise. */
		bool operator< (const FbxProperty& pProperty) const;

		/** Greater operator, used to sort property in map.
		* \param pProperty The property compared to this property.
		* \return \c true if greater, \c false otherwise. */
		bool operator> (const FbxProperty& pProperty) const;

		/** Equivalence operator.
		  * \param pValue The value compared to this property.
		  * \return \c True if this property is valid and pValue doesn't equal zero, or this property is invalid and pValue equals zero, \c false otherwise.
		  */    
		inline bool operator== (int pValue) const { return (pValue == 0) ? !IsValid() : IsValid(); }

		/** Non-equivalence operator.
		  * \param pValue The value compared to this property.
		  * \return \c True if this property is valid and pValue equals zero, or this property is invalid and pValue doesn't equal zero, \c false otherwise.
		  */    
		inline bool operator!= (int pValue) const { return (pValue != 0) ? !IsValid() : IsValid(); }

		/** Compares this property's value to another property's value.
		  * \param pProperty The property whose value is compared with this property's value.
		  * \return \c True if equal, \c false otherwise.
		  */
		bool CompareValue(const FbxProperty& pProperty) const;
	//@}

	/** Copies the value of a property.
	  * \param pProperty The property from which to derive the value.
	  * \return \c True if value has been copied successfully, \c false otherwise.
	  */
	bool CopyValue(const FbxProperty& pProperty);

	/**
	  * \name Value management.
	  */
	//@{
		/** Gets the value of the property.
		  * \tparam T The data type of the value.
		  * \return The property value.
		  */
		template <class T> inline T Get() const { T lValue; Get(&lValue, FbxTypeOf(lValue)); return lValue; }

		/** Sets the value of the property.
		  * \param pValue The new value
		  * \return \c True if type is compatible and the value is set successfully, \c false otherwise.
		  */
		template <class T> inline bool Set(const T& pValue){ return Set(&pValue, FbxTypeOf(pValue)); }

		/** Judges the property's validity.
		  * \return \c True if this property is valid, \c false otherwise. 
		  */
		bool IsValid() const;

		/** Checks if the specified property's value has changed from its default value.
		  * \param pProperty Property that is tested.
		  * \return \c True if the property value is still the default, \c false otherwise.
		  * \remarks If the inheritance type of pProperty's value is eOverride, pProperty's value should
		  *          have been modified, so pProperty doesn't have the default value.
		  *          If the inheritance type of pProperty's value is eInherit, that means pProperty's value inherits
		  *          the referenced object's property value, so pProperty has the default value. 
		  */
		static bool HasDefaultValue(FbxProperty& pProperty);

		/** Queries the inheritance type of the property.
		  * Use this method to determine if this property's value is overridden from the default
		  * value, or from the referenced object, if this object is a clone.
		  * \return The inheritance type of the property.
		  */
		FbxPropertyFlags::EInheritType GetValueInheritType() const;

		/** Sets the inheritance type of the property.
		  * Use the method to explicitly override the default value of the property,
		  * or the referenced object's property value, if this object is a clone.
		  *
		  * You can also use this to explicitly inherit the default value of the property,
		  * or the referenced object's property value, if this object is a clone.
		  *
		  * \param pType The new inheritance type.
		  * \return \c True on success, \c false otherwise.
		  */
		bool SetValueInheritType( FbxPropertyFlags::EInheritType pType );

		/** Checks if the property's value has been modified from its default value.
		  * \return \c True if the value of the property has changed, \c false otherwise.
		  * \remarks If the inheritance type of the property's value is eOverride, the property's value should
		  *          have been modified, it returns \c true.
		  *          If the inheritance type of the property's value is eInherit, that means the property's value inherits
		  *          the referenced object's property value, so the property's value is not modified and it returns \c false. 
		  */
		bool Modified() const;
	//@}

	/**
	  * \name Property Limits.
	  * Property limits are provided for convenience if some applications desire to
	  * bound the range of possible values for a given type property. FBX will never 
	  * apply these limits internally, however it will store and retrieve the limits values
	  * from files, and will assure that they are persistent in memory 
	  * while the property exists.
	  *
	  * Notes: 
	  * - The limit value is truncated to the property data type.
	  *
	  * - These limits are meaningless for the boolean type. It is the responsibility of the
	  *   calling application to implement the necessary instructions to limit the property of boolean type.
	  *
	  * - The SetMinLimit/SetMaxLimit methods will do nothing if SupportSetLimitsAsDoube() returns false.
	  */
	//@{
		/** Returns whether setting limits as a double number on this property type is allowed. 
		   * \return \c True if allowed, \c false otherwise.
		   */
		bool SupportSetLimitAsDouble() const;

		/** Sets a minimum property value limit.
		  * \param pMin Minimum value allowed.
		  * \return \c True if the limit has been set, \c false otherwise.
		  */
		bool SetMinLimit(double pMin);

		/** Returns whether a minimum limit exists, if it returns false, 
		   * calling GetMinLimit() produces undefined behavior.
		   * \return \c True when a minimum limit exists, \c false otherwise.
		   */
		bool HasMinLimit() const;

		/** Returns the minimum property value limit.
		  * \return The minimum value limit.
		  */
		double GetMinLimit() const;

		/** Returns whether a maximum limit exists, if it returns false, 
		   * calling GetMaxLimit() produces undefined behavior.
		   * \return \c True when a maximum limit exists, \c false otherwise.
		   */
		bool HasMaxLimit() const;

		/** Sets a maximum property value limit.
		  * \param pMax Maximum value allowed.
		  * \return \c True if the limit has been set, \c false otherwise.
		  */
		bool SetMaxLimit(double pMax);

		/** Returns the maximum property value.
		  * \return The maximum value limit.
		  */
		double GetMaxLimit() const;

		/** Sets the minimum and maximum value limit of the property. 
		  * \param pMin Minimum value allowed.
		  * \param pMax Maximum value allowed.
		  \return \c True if both the min and max limit have been set, \c false otherwise.
		  */
		bool SetLimits(double pMin, double pMax);
	//@}

	/**
	  * \name Enum and property list
	  */
	//@{
		/** Adds a string value at the end of the enumeration list.
		  * \param pStringValue The string value to be added.
		  * \return The index in the list where the string is added or -1 if the action failed.
		  * \remarks This function is only valid if the property type is eFbxEnum or eFbxEnumM.
		  * \remarks If the property is of type eFbxEnum, trying to add a value that is already
          * in the enumeration list will fail. 
		  * Empty strings are not allowed.
		  */
		int AddEnumValue(const char* pStringValue);

		/** Inserts a string value at the specific index.
		  * \param pIndex Zero bound index.
		  * \param pStringValue The string value to be inserted.
		  * \remarks This function is only valid if the property type is eFbxEnum or eFbxEnumM.
		  * \remarks If the property is of type eFbxEnum, trying to insert a value that is already
          * in the enumeration list will fail. 
		  * pIndex must be in the range [0, ListValueGetCount()].
		  * Empty strings are not allowed.
		  */
		void InsertEnumValue(int pIndex, const char* pStringValue);

		/** Returns the number of elements in the enumeration list.
		  * \return The number of elements in the enumeration list.
		  * \remarks This function returns 0 if the property type is not eFbxEnum or eFbxEnumM.
		  */
		int GetEnumCount() const;

		/** Sets a string value at the specific index.
		  * \param pIndex Zero bound index.
		  * \param pStringValue The string value at the specific index.
		  * \remarks This function is only valid if the property type is eFbxEnum or eFbxEnumM.
		  * \remarks If the property is of type eFbxEnum, trying to set a value that is already
          * in the enumeration list will fail. 
		  * The function assigns the string value to the specific index.
		  * A string value must exist at the specific index in order to be changed.
		  * Empty strings are not allowed.
		  */
		void SetEnumValue(int pIndex, const char* pStringValue);

		/** Removes the string value at the specified index.
		  * \param pIndex Index of the string value to be removed.
		  * \remarks This function is only valid if the property type is eFbxEnum or eFbxEnuM.
		  */
		void RemoveEnumValue(int pIndex);

		/** Returns a string value at the specified index
		  * \param pIndex Zero bound index.
		  * \remarks This function is only valid if the property type is eFbxEnum or eFbxEnumM.
		  */
		const char* GetEnumValue(int pIndex) const;
	//@}

	/**
	  * \name Hierarchical properties
	  */
	//@{
		/** Judges if this property is the root property. 
		  * \return \c True when this property is a root property, \c false otherwise.
		  */
		inline bool IsRoot() const { return mPropertyHandle.IsRoot(); }

		/** Judges whether this property is a child of the specified property.
		  * \param pParent The specified property.
		  * \return \c True when this property is a child of the specified property, \c false otherwise.
		  */
		inline bool IsChildOf(const FbxProperty& pParent) const { return mPropertyHandle.IsChildOf(pParent.mPropertyHandle); }

		/** Judges whether this property is a descendant of the specified property.
		  * \param pAncestor The specified property.
		  * \return \c True when this property is a descendant of the specified property, \c false otherwise.
		  */
		inline bool IsDescendentOf(const FbxProperty& pAncestor) const { return mPropertyHandle.IsDescendentOf(pAncestor.mPropertyHandle); }

		/** Returns the parent property of this property.
		  * \return The parent of this property.
		  */
		inline FbxProperty GetParent() const { return FbxProperty(mPropertyHandle.GetParent());  }

		/** Returns the first child of this property.
		  * \return The first child of this property, if there is none, an invalid property is returned.
		  */
		inline FbxProperty GetChild() const { return FbxProperty(mPropertyHandle.GetChild());   }

		/** Returns the sibling of this property.
		  * \return The sibling of this property, if there is none, an invalid property is returned.
		  */
		inline FbxProperty GetSibling() const { return FbxProperty(mPropertyHandle.GetSibling()); }

		/** Returns the first property that is a descendant of this property. 
		  * \return The first descendant of this property, if there is none, an invalid property is returned.
		  */
		inline FbxProperty GetFirstDescendent() const { return FbxProperty(mPropertyHandle.GetFirstDescendent());   }

		/** Returns the property that follows pProperty that is a descendant of this property. 
		  * \param pProperty The last found descendant.
		  * \return The property that follows pProperty, if there is none, an invalid property is returned.
		  */
		inline FbxProperty GetNextDescendent(const FbxProperty& pProperty) const { return FbxProperty(mPropertyHandle.GetNextDescendent(pProperty.mPropertyHandle)); }

		/** Searches a property using its name.
		  * \param pName The name of the property as a \c NULL terminated string.
		  * \param pCaseSensitive Whether the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty Find (const char* pName, bool pCaseSensitive = true) const { return FbxProperty(mPropertyHandle.Find(pName,pCaseSensitive));  }

		/** Searches a property using its name and data type.
		  * \param pName The name of the property as a \c NULL terminated string.
		  * \param pDataType The data type of the property.
		  * \param pCaseSensitive Whether the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty Find (const char* pName, const FbxDataType& pDataType, bool pCaseSensitive = true) const { return FbxProperty(mPropertyHandle.Find(pName,pDataType.GetTypeInfoHandle(),pCaseSensitive));  }

		/** Searches a property using its full name.
		  * \param pName The full name of the property as a \c NULL terminated string.
		  * \param pCaseSensitive whether the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindHierarchical (const char* pName, bool pCaseSensitive = true) const { return FbxProperty(mPropertyHandle.Find(pName,sHierarchicalSeparator,pCaseSensitive));  }

		/** Searches a property using its full name and data type.
		  * \param pName The full name of the property as a \c NULL terminated string.
		  * \param pDataType The data type of the property.
		  * \param pCaseSensitive whether the name is case-sensitive.
		  * \return A valid FbxProperty if the property is found, else
		  *         an invalid FbxProperty. See FbxProperty::IsValid()
		  */
		inline FbxProperty FindHierarchical (const char* pName, const FbxDataType& pDataType, bool pCaseSensitive = true) const { return FbxProperty(mPropertyHandle.Find(pName,sHierarchicalSeparator,pDataType.GetTypeInfoHandle(),pCaseSensitive));  }
	//@}

	/**
	  * \name Optimizations
	  */
	//@{
		//! Internal function for building a property name map.
		inline void BeginCreateOrFindProperty(){ mPropertyHandle.BeginCreateOrFindProperty(); }

		//! Internal function for clearing the property name map. 
		inline void EndCreateOrFindProperty(){ mPropertyHandle.EndCreateOrFindProperty(); }

		//!This is an internal class that you can use to build and clear the name map of properties. You can use the name map to speed up searching for property names.
		class FbxPropertyNameCache
		{
		public:
			/** Constructor, the name map is created in the constructor.
			  * \param prop Property for building and clearing the name map.
			  */
			FbxPropertyNameCache(const FbxProperty& prop) : mProp(const_cast<FbxProperty&>(prop)){ mProp.BeginCreateOrFindProperty(); }

			//! Destructor, the name map is destroyed in destructor.
			~FbxPropertyNameCache(){ mProp.EndCreateOrFindProperty(); }

		private:
			FbxProperty& mProp;
			FbxPropertyNameCache& operator=(const FbxPropertyNameCache& pOther){ mProp = pOther.mProp; mProp.BeginCreateOrFindProperty(); return *this; }
		};
	//@}

	/**
	  * \name Animation Curve Management
	  */
	//@{
		/** Retrieve the proper animation evaluator to use for this property.
		* \return If the object has no scene, returns the default evaluator, otherwise the object's scene evaluator. */
		FbxAnimEvaluator* GetAnimationEvaluator() const;

		/** Find out if the property is animated: has a curve node with curves.
		* \param pAnimLayer The animation layer to test for curve presence. Set to NULL if you want to use the default animation layer of the default animation stack.
		* \return \c true if the property is animated. */
		bool IsAnimated(FbxAnimLayer* pAnimLayer=NULL) const;

		/** Evaluate the value of a property if it has animation and return the result as the template type.
		* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		* \return The property value at the specified time converted to the template type provided, if possible.
		* \remark If the property type versus the template cannot be converted, the result is unknown. */
		template <class T> T EvaluateValue(const FbxTime& pTime=FBXSDK_TIME_INFINITE, bool pForceEval=false);

		/** Evaluate the value of a property if it has animation and return the result.
		* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
		* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		* \return The property value at the specified time. */
		FbxPropertyValue& EvaluateValue(const FbxTime& pTime=FBXSDK_TIME_INFINITE, bool pForceEval=false);

		/** Creates a FbxAnimCurveNode on the specified layer.
		* \param pAnimLayer The animation layer the FbxAnimCurveNode object is attached to.
		* \return Pointer to the created FbxAnimCurveNode.
		* \remarks This function check the property FbxPropertyFlags::eAnimatable flag and fails to execute if it is not set.
		* \remarks If created, the FbxAnimCurveNode is automatically connected to the property and the animation layer.
		* \remarks The created FbxAnimCurveNode does not automatically allocate anim curves.
		* \remarks On the successful execution of this function, the property eAnimated flag is set to \c true. */
		FbxAnimCurveNode* CreateCurveNode(FbxAnimLayer* pAnimLayer);

		/** Get the property's animation curve node on the default animation stack and base layer.
		* \param pCreate If \c true, create the animation curve node and return it if none were found.
		* \return The animation curve node of this property, if found or created, otherwise NULL.
		* \remark If the property flag FbxPropertyFlags::eAnimatable is not set, creating the curve node will fail. */
		FbxAnimCurveNode* GetCurveNode(bool pCreate=false);

		/** Get the property's animation curve node on the specified animation stack, using its base layer.
		* \param pAnimStack The animation stack to use to get or create the property's animation curve node.
		*                   \c NULL can be passed to automatically specify the default animation stack.
		* \param pCreate If \c true, create the animation curve node and return it if none were found.
		* \return The animation curve node of this property, if found or created, otherwise NULL.
		* \remark If the property flag FbxPropertyFlags::eAnimatable is not set, creating the curve node will fail. */
		FbxAnimCurveNode* GetCurveNode(FbxAnimStack* pAnimStack, bool pCreate=false);

		/** Get the property's animation curve node on the specified animation layer.
		* \param pAnimLayer The animation layer to use to get or create the property's animation curve node. Cannot be NULL.
		* \param pCreate If \c true, create the animation curve node and return it if none were found.
		* \return The animation curve node of this property, if found or created, otherwise NULL.
		* \remark If the property flag FbxPropertyFlags::eAnimatable is not set, creating the curve node will fail. */
		FbxAnimCurveNode* GetCurveNode(FbxAnimLayer* pAnimLayer, bool pCreate=false);

		/** Get the FbxAnimCurve from the specified animation layer.
		* This function expects to find a FbxAnimCurveNode object with the same name as the property and it
		* attempts to retrieve the FbxAnimCurve from it.
		* \param pAnimLayer The searched animation layer.
		* \param pCreate Create a FbxAnimCurve if not found.
		* \return Pointer to the FbxAnimCurve. Returns NULL in case of errors or pCreate is \c false and the curve is not found.
		* \remark If the FbxAnimCurveNode does not exists but the property has the FbxPropertyFlags::eAnimatable flag set and
		*         pCreate is true, then this function will first create the FbxAnimCurveNode object and then the FbxAnimCurve.
		* \remark If more than one FbxAnimCurveNode matching the name criteria are connected, the first one is returned. */
		inline FbxAnimCurve* GetCurve(FbxAnimLayer* pAnimLayer, bool pCreate=false)
		{
			return GetCurve(pAnimLayer, GetName(), NULL, pCreate);
		}

		/** Get the FbxAnimCurve from the specified animation layer.
		* This function expects to find a FbxAnimCurveNode object with the same name as the property and it
		* attempts to retrieve the FbxAnimCurve from it.
		* \param pAnimLayer The searched animation layer.
		* \param pChannel Name of the channel we are looking for the animation curve. If NULL use the first defined channel.
		* \param pCreate Create a FbxAnimCurve if not found.
		* \return Pointer to the FbxAnimCurve. Returns NULL in case of errors or pCreate is \c false and the curve is not found.
		* \remark If the FbxAnimCurveNode does not exists but the property has the FbxPropertyFlags::eAnimatable flag set and
		*         pCreate is true, then this function will first create the FbxAnimCurveNode object and then the FbxAnimCurve.
		* \remark If more than one FbxAnimCurveNode matching the name criteria are connected, the first one is returned. */
		inline FbxAnimCurve* GetCurve(FbxAnimLayer* pAnimLayer, const char* pChannel, bool pCreate=false)
		{
			return GetCurve(pAnimLayer, GetName(), pChannel, pCreate);
		}

		/** Get the FbxAnimCurve of the specified channel from the specified animation layer.
		* This function looks for the FbxAnimCurveNode named pName and the channel pChannel. It
		* will retrieves the FbxAnimCurve from it.
		* \param pAnimLayer The searched animation layer.
		* \param pName Name of the curve node. It is an error to leave this field empty.
		* \param pChannel Name of the channel we are looking for the animation curve. If NULL
		*         use the first defined channel.
		* \param pCreate Create a FbxAnimCurve if not found.
		* \return Pointer to the FbxAnimCurve. Returns NULL in case of errors or pCreate is \c false and the curve is not found.
		* \remark If the FbxAnimCurveNode does not exists but the property has the FbxPropertyFlags::eAnimatable flag set and
		*         pCreate is true, then this function will first create the FbxAnimCurveNode object and then the FbxAnimCurve.
		* \remark If more than one FbxAnimCurveNode matching the name criteria are connected, the first one is returned.
		* \remark If pChannel is NULL, this function is the equivalent of GetCurve(FbxAnimLayer*, bool). */
		FbxAnimCurve* GetCurve(FbxAnimLayer* pAnimLayer, const char* pName, const char* pChannel, bool pCreate);
	//@}

	/**
	  * \name General Object Connection and Relationship Management
	  */
	//@{
		/** Connects this property to one source object.
		  * \param pObject The source object to which this property connects.
		  * \param pType The connection type between the property and the object.
		  * \return \c True on success, \c false otherwise.
		  */
		bool ConnectSrcObject(FbxObject* pObject, FbxConnection::EType pType=FbxConnection::eNone);

		/** Judges whether this property connects with the source object.
		  * \param pObject The source object.
		  * \return \c True if this property connects with the source object, \c false otherwise.
		  */
		bool IsConnectedSrcObject(const FbxObject* pObject) const;

		/** Disconnects this property from one source object.
		  * \param pObject The source object from which this property will be disconnected.
		  * \return \c True on success, \c false otherwise.
		  */
		bool DisconnectSrcObject(FbxObject* pObject);

		/** Disconnects this property from all the source objects.
		  * \return \c True if it disconnects all the source objects successfully, \c false otherwise.
		  */
		bool DisconnectAllSrcObject();

		/** Disconnects this property from all source objects that satisfy a given criteria. 
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all the source objects successfully, \c false otherwise.
		  */
		bool DisconnectAllSrcObject(const FbxCriteria& pCriteria);

		/** Returns the number of source objects with which this property connects.
		  * \return The number of source objects with which this property connects. 
		  */
		int	 GetSrcObjectCount() const;

		/** Returns the number of source objects that satisfy the given criteria with which this property connects.
		  * \param pCriteria The given criteria.
		  * \return The number of source objects that satisfy the given criteria with which this property connects.
		  */
		int GetSrcObjectCount(const FbxCriteria& pCriteria) const;

		/** Returns the source object at the specified index with which this property connects.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object at the specified index, NULL if not found.
		  */
		FbxObject* GetSrcObject(const int pIndex=0) const;

		/** Returns the source object that satisfies the criteria at the specified index with which this property connects.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object that satisfies the given criteria at the specified index, NULL if not found.
		  */
		FbxObject* GetSrcObject(const FbxCriteria& pCriteria, const int pIndex=0) const;

		/** Searches the source object with the specified name, starting with the specified index.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		FbxObject* FindSrcObject(const char* pName, const int pStartIndex=0) const;

		/** Searches the source object with the specified name which satisfies the given criteria, starting with the specified index.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		FbxObject* FindSrcObject(const FbxCriteria& pCriteria, const char* pName, const int pStartIndex=0) const;

		/** Disconnects this property from all source objects of the specified class type.
		  * \tparam T The specified class type.
		  * \return \c True if it disconnects all source objects successfully, \c false otherwise.
		  */
		template <class T> inline bool DisconnectAllSrcObject(){ return DisconnectAllSrcObject(FbxCriteria::ObjectType(T::ClassId)); }

		/** Disconnects this property from all source objects which are of the specified class type and satisfy the given criteria.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all source objects successfully, \c false otherwise.
		  */
		template <class T> inline bool DisconnectAllSrcObject(const FbxCriteria& pCriteria){ return DisconnectAllSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the number of source objects of a specific class type with which this property connects.
		  * \tparam T The specified class type.
		  * \return The number of source objects of the specified class type with which this property connects.
		  */
		template <class T> inline int GetSrcObjectCount() const { return GetSrcObjectCount(FbxCriteria::ObjectType(T::ClassId)); }

		/** Returns the number of source objects which are of the specified class type and satisfy the given criteria with which this property connects.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \return The number of source objects which are of the specified class type and satisfy the given criteria.
		  */
		template <class T> inline int GetSrcObjectCount(const FbxCriteria& pCriteria) const { return GetSrcObjectCount(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the source object of the specified class type at the specified index.
		  * \tparam T The specified class type.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object of a specified class type at the specified index, NULL if not found.
		  */
		template <class T> inline T* GetSrcObject(const int pIndex=0) const { return (T*)GetSrcObject(FbxCriteria::ObjectType(T::ClassId), pIndex); }

		/** Returns the source object which is of the specified class type and satisfies the given criteria at the specified index.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The source object which is of the specified class type and satisfies the given criteria at the specified index, NULL if not found.
		  */
		template <class T> inline T* GetSrcObject(const FbxCriteria& pCriteria, const int pIndex=0) const { return (T*)GetSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pIndex); }

		/** Searches the source object with the specified name which is of the specified class type, starting with the specified index.
		  * \tparam T The specified class type.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		template <class T> inline T* FindSrcObject(const char* pName, const int pStartIndex=0) const { return (T*)FindSrcObject(FbxCriteria::ObjectType(T::ClassId), pName, pStartIndex); }

		/** Searches the source object with the specified name which is of the specified class type and satisfies the given criteria, starting with the specified index.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		template <class T> inline T* FindSrcObject(const FbxCriteria& pCriteria, const char* pName, const int pStartIndex=0) const { return (T*)FindSrcObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pName, pStartIndex); }

		/** Connects this property to one destination object.
		  * \param pObject The destination object with which this property connects.
		  * \param pType The connection type between this property and the object.
		  * \return \c True on success, \c false otherwise.
		  */
		bool ConnectDstObject(FbxObject* pObject, FbxConnection::EType pType=FbxConnection::eNone);

		/** Judges whether this property connects with the destination object.
		  * \param pObject The destination object.
		  * \return \c True if this property connects with the destination object, \c false otherwise.
		  */
		bool IsConnectedDstObject(const FbxObject* pObject) const;

		/** Disconnects this property from the destination object.
		  * \param pObject The destination object from which this property disconnects from.
		  * \return \c True on success, \c false otherwise.
		  */
		bool DisconnectDstObject(FbxObject* pObject);

		/** Disconnects this property from all the destination objects.
		  * \return \c True if it disconnects all the destination objects successfully, \c false otherwise.
		  */
		bool DisconnectAllDstObject();

		/** Disconnects this property from all the destination objects that satisfy given criteria.
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all the destination objects successfully, \c false otherwise.
		  */
		bool DisconnectAllDstObject(const FbxCriteria& pCriteria);

		/** Returns the number of destination objects with which this property connects. 
		  * \return The number of destination objects with which this property connects. 
		  */
		int GetDstObjectCount() const;

		/** Returns the number of destination objects that satisfy the given criteria with which this property connects. 
		  * \param pCriteria The given criteria.
		  * \return The number of destination objects that satisfy given criteria with which this property connects. 
		  */
		int GetDstObjectCount(const FbxCriteria& pCriteria) const;

		/** Returns the destination object at the specified index with which this property connects.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object at the specified index, NULL if not found.
		  */
		FbxObject* GetDstObject(const int pIndex=0) const;

		/** Returns the destination object that satisfies given criteria at the specified index with which this property connects.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object that satisfies given criteria at the specified index, NULL if not found.
		  */
		FbxObject* GetDstObject(const FbxCriteria& pCriteria, const int pIndex=0) const;

		/** Searches the destination object with the specified name, starting with the specified index.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The destination object with the name, NULL if not found.
		  */
		FbxObject* FindDstObject(const char* pName, const int pStartIndex=0) const;

		/** Searches the destination object with the specified name which satisfies the given criteria, starting with the specified index.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The destination object with the name, NULL if not found.
		  */
		FbxObject* FindDstObject(const FbxCriteria& pCriteria, const char* pName, const int pStartIndex=0) const;

		/** Disconnects this property from all the destination objects of the specified class type.
		  * \tparam T The specified class type.
		  * \return \c True if it disconnects all the destination objects successfully, \c false otherwise.
		  */
		template <class T> inline bool DisconnectAllDstObject(){ return DisconnectAllDstObject(FbxCriteria::ObjectType(T::ClassId)); }

		/** Disconnects this property from all the destination objects which are of the specified class type and satisfy the given criteria.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \return \c True if it disconnects all the destination objects successfully, \c false otherwise.
		  */
		template <class T> inline bool DisconnectAllDstObject(const FbxCriteria& pCriteria){ return DisconnectAllDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the number of destination objects of the specified class type with which this property connects.
		  * \tparam T The specified class type.
		  * \return The number of destination objects of the specified class type with which this property connects.
		  */
		template <class T> inline int GetDstObjectCount() const { return GetDstObjectCount(FbxCriteria::ObjectType(T::ClassId)); }

		/** Returns the number of destination objects which are of the specified class type and satisfy the given criteria with which this property connects.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \return The number of destination objects which are of the specified class type and satisfy the given criteria with which this property connects.
		  */
		template <class T> inline int GetDstObjectCount(const FbxCriteria& pCriteria) const { return GetDstObjectCount(FbxCriteria::ObjectType(T::ClassId) && pCriteria); }

		/** Returns the destination object of the specified class type at the specified index with which this property connects.
		  * \tparam T The specified class type.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object of the specified class type at the specified index, NULL if not found.
		  */
		template <class T> inline T* GetDstObject(const int pIndex=0) const { return (T*)GetDstObject(FbxCriteria::ObjectType(T::ClassId), pIndex); }

		/** Returns the destination object which is of the specified class type and satisfies the given criteria at the specified index with which this property connects.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \param pIndex The specified index whose default value is 0.
		  * \return The destination object which is of the specified class type and satisfies the given criteria at the specified index, NULL if not found.
		  */
		template <class T> inline T* GetDstObject(const FbxCriteria& pCriteria, const int pIndex=0) const { return (T*)GetDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pIndex); }

		/** Searches the destination object with the specified name which is of the specified class type, starting with the specified index.
		  * \tparam T The specified class type.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		template <class T> inline T* FindDstObject(const char* pName, const int pStartIndex=0) const { return (T*)FindDstObject(FbxCriteria::ObjectType(T::ClassId), pName, pStartIndex); }

		/** Searches the destination object with the specified name which is of the specified class type and satisfies the given criteria, starting with the specified index.
		  * \tparam T The specified class type.
		  * \param pCriteria The given criteria.
		  * \param pName The object name.
		  * \param pStartIndex The start index.
		  * \return The source object with the name, NULL if not found.
		  */
		template <class T> inline T* FindDstObject(const FbxCriteria& pCriteria, const char* pName, const int pStartIndex=0) const { return (T*)FindDstObject(FbxCriteria::ObjectType(T::ClassId) && pCriteria, pName, pStartIndex); }
	//@}

	/**
	  * \name General Property Connection and Relationship Management
	  */
	//@{
		// Properties
		/** Connects this property to a source property.
		  * \param pProperty The source property with which this property connects.
		  * \return \c True on success, \c false otherwise.
		  */
		bool ConnectSrcProperty(const FbxProperty& pProperty);

		/** Judges whether this property connects with the specified source property.
		  * \param pProperty The specified source property.
		  * \return \c True if this property connects with the specified source property, \c false otherwise.
		  */
		bool IsConnectedSrcProperty(const FbxProperty& pProperty);

		/** Disconnects this property from the specified source property.
		  * \param pProperty The specified source property.
		  * \return \c True on success, \c false otherwise.
		  */
		bool DisconnectSrcProperty(const FbxProperty& pProperty);

		/** Returns the number of source properties with which this property connects. 
		  * \return The number of source properties with which this property connects. 
		  */
		int GetSrcPropertyCount() const;            

		/** Connects this property to a destination property.
		  * \param pProperty The destination property with which this property connects.
		  * \return \c True on success, \c false otherwise.
		  */
		bool ConnectDstProperty(const FbxProperty&  pProperty);

		/** Judges if this property connects with the specified destination property.
		  * \param pProperty The specified destination property.
		  * \return \c True if this property connects with the specified destination property, \c false otherwise.
		  */
		bool IsConnectedDstProperty(const FbxProperty& pProperty);

		/** Disconnects this property from the specified destination property.
		  * \param pProperty The specified destination property.
		  * \return \c True on success, \c false otherwise.
		  */
		bool DisconnectDstProperty(const FbxProperty& pProperty);

		/** Returns the number of destination properties with which this property connects. 
		  * \return The number of destination properties with which this property connects. 
		  */
		int GetDstPropertyCount() const;

		//!Clears the connection cache of this property, this cache is used to store the connections that satisfy the given criteria. 
		void ClearConnectCache();

		/** Returns the source property at the specified index with which this property connects. 
		  * \param pIndex The specified index.
		  * \return The source property at the specified index. 
		  */
		FbxProperty	GetSrcProperty(const int pIndex=0) const;

		/** Searches the source property with the specified name, starting with the specified index with which this property connects. 
		  * \param pName The specified property name.
		  * \param pStartIndex The start index.
		  * \return The source property with the specified name. 
		  */
		FbxProperty FindSrcProperty(const char* pName, const int pStartIndex=0) const;

		/** Returns the destination property at the specified index with which this property connects. 
		  * \param pIndex The specified index.
		  * \return The destination property at the specified index. 
		  */
		FbxProperty GetDstProperty(const int pIndex=0) const;

		/** Searches the destination property with the specified name, starting with the specified index with which this property connects. 
		  * \param pName The specified property name.
		  * \param pStartIndex The start index.
		  * \return The destination property with the specified name. 
		  */
		FbxProperty FindDstProperty(const char* pName, const int pStartIndex=0) const;
	//@}

    //! Hierarchical separator of properties.
	static const char* sHierarchicalSeparator;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    FbxProperty(FbxObject* pObject, const char* pName, const FbxDataType& pDataType=FbxDataType(), const char* pLabel="");
    FbxProperty(const FbxProperty& pParent, const char* pName, const FbxDataType& pDataType, const char* pLabel);

	bool Set(const void* pValue, const EFbxType& pValueType, bool pCheckForValueEquality=true);
	bool Get(void* pValue, const EFbxType& pValueType) const;

	bool NotifySetRequest();
	bool NotifySet();
	bool NotifyGet() const;

private:
	inline void*	Get() const { FBX_ASSERT_NOW("Cannot get property value as void!"); return NULL; }
	inline bool		Set(const void* &){ FBX_ASSERT_NOW("Cannot set property value as void!"); return false; }

    bool			ConnectSrc(const FbxProperty& pProperty, FbxConnection::EType pType=FbxConnection::eNone);
    bool			DisconnectSrc(const FbxProperty& pProperty);
    bool			DisconnectAllSrc();
    bool			DisconnectAllSrc(const FbxCriteria& pCriteria);
    bool			IsConnectedSrc(const FbxProperty& pProperty) const;
    int				GetSrcCount() const;
    int				GetSrcCount(const FbxCriteria& pCriteria) const;
    FbxProperty		GetSrc(int pIndex=0) const;
    FbxProperty		GetSrc(const FbxCriteria& pCriteria, int pIndex=0) const;
    FbxProperty		FindSrc(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const;

    bool			ConnectDst(const FbxProperty& pProperty, FbxConnection::EType pType=FbxConnection::eNone);
    bool			DisconnectDst(const FbxProperty& pProperty);
    bool			DisconnectAllDst();
    bool			DisconnectAllDst(const FbxCriteria& pCriteria);
    bool			IsConnectedDst(const FbxProperty& pProperty) const;
    int				GetDstCount() const;
    int				GetDstCount(const FbxCriteria& pCriteria) const;
    FbxProperty		GetDst(int pIndex=0) const;
    FbxProperty		GetDst(const FbxCriteria& pCriteria, int pIndex=0) const;
    FbxProperty		FindDst(const FbxCriteria& pCriteria, const char* pName, int pStartIndex=0) const;

    mutable FbxPropertyHandle mPropertyHandle;

    friend class FbxObject;
	friend class FbxIOSettings;
	friend class FbxBindingOperator;
	friend class FbxAnimEvalClassic;
    friend void FbxMarkObject(FbxObject* pObject, FbxMap<FbxObject*, int>& pObjectDstDisconnectCount, FbxSet<FbxObject*>& pObjectsToDeleted, FbxArray<FbxObject*>& pObjectToDeletedInSequence);
    friend void FbxCleanUpConnectionsAtDestructionBoundary(FbxScene* pObject, FbxArray<FbxObject*>& pObjectToDeletedInSequence);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** \brief This template class is used to contain user properties of specific data types.
* \nosubgrouping
*/
template <class T> class FbxPropertyT : public FbxProperty
{
public:
	/**
	  * \name Static initialization.
	  */
	//@{
		/** Creates a property and initializes it using a specific value and flag.
		  * \param pObject The object that contains this property.
		  * \param pName   The name of the property.
		  * \param pValue  The value of the property.
		  * \param pForceSet If \c true, the value is forcibly set, if \c false the value is not set when it equals the default value. 
		  * \param pFlags  The property flag.
		  */
		FbxProperty& StaticInit(FbxObject* pObject, const char* pName, const T& pValue, bool pForceSet, FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone)
		{
			return StaticInit(pObject, pName, FbxGetDataTypeFromEnum(FbxTypeOf(*((T*)0))), pValue, pForceSet, pFlags);
		}

		/** Creates a property and initializes it using a specific value and flag.
		  * \param pObject The object that contains this property.
		  * \param pName   The name of the property.
		  * \param pDataType  The property data type.
		  * \param pValue  The property value.
		  * \param pForceSet If \c true, the value is forcibly set, if \c false the value is not set when it equals the default value. 
		  * \param pFlags  The property flag.
		  */
		FbxProperty& StaticInit(FbxObject* pObject, const char* pName, const FbxDataType& pDataType, const T& pValue, bool pForceSet, FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone)
		{
			bool lWasFound = false;
			*this = Create(pObject, pDataType, pName, "", true, &lWasFound);
			if( pForceSet || !lWasFound )
			{
				ModifyFlag(pFlags, true);	// modify the flags before we set the value
				FbxProperty::Set(&pValue, FbxTypeOf(pValue), false);
			}
			ModifyFlag(FbxPropertyFlags::eStatic, true);
			return *this;
		}

		/** Creates a property and initializes it using a specific value and flag.
		  * \param pCompound The parent property of this property.
		  * \param pName   The name of the property.
		  * \param pDataType  The property data type.
		  * \param pValue  The property value.
		  * \param pForceSet If \c true, the value is forcibly set, if \c false the value is not set when it equals to the default value. 
		  * \param pFlags  The property flag.
		  */
		FbxProperty& StaticInit(FbxProperty pCompound, const char* pName, const FbxDataType& pDataType, const T& pValue, bool pForceSet=true, FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone)
		{
			bool lWasFound = false;
			*this = Create(pCompound, pDataType, pName, "", true, &lWasFound);
			if( pForceSet || !lWasFound )
			{
				ModifyFlag(pFlags, true);	// modify the flags before we set the value
				FbxProperty::Set(&pValue, FbxTypeOf(pValue), false);
			}
			ModifyFlag(FbxPropertyFlags::eStatic, true);
			return *this;
		}
	//@}

	/** \name Value Management */
	//@{
		/** Assignment function
		* \param pValue The value assigned to this property.
		* \return This property. */
		FbxPropertyT& Set(const T& pValue){ FbxProperty::Set(&pValue, FbxTypeOf(pValue)); return *this; }

		/** Retrieve function
		* \return The value of the property. */
		T Get() const { T lValue; FbxProperty::Get(&lValue, FbxTypeOf(lValue)); return lValue; }

		/** Assignment operator
		* \param pValue The value of type T assigned to this property.
		* \return This property. */
		FbxPropertyT& operator=(const T& pValue){ return Set(pValue); }

		/** Type cast operator
		* \return The value of the property of type T. */
		operator T() const { return Get(); }
	//@}

	/** \name Animation Evaluation */
	//@{
		/** Evaluate the value of a property if it has animation and return the result.
		* \param pTime The time used for evaluate.
		* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
		* \return The property value at the specified time. */
		T EvaluateValue(const FbxTime& pTime=FBXSDK_TIME_INFINITE, bool pForceEval=false)
		{
			return GetAnimationEvaluator()-> template GetPropertyValue<T>(*this, pTime, pForceEval);
		}
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxPropertyT() : FbxProperty(){}
	FbxPropertyT(const FbxProperty& pProperty) : FbxProperty(pProperty){}
	~FbxPropertyT(){}
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
template <> class FbxPropertyT<FbxReference> : public FbxProperty
{
public:
	FbxPropertyT() : FbxProperty(){}
	FbxPropertyT(const FbxProperty& pProperty) : FbxProperty(pProperty){}
	~FbxPropertyT(){}

	const FbxProperty& StaticInit(FbxObject* pObject, const char* pName, const FbxReference& pValue, bool pForceSet, FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone)
	{
		return StaticInit(pObject, pName, FbxGetDataTypeFromEnum(FbxTypeOf(*((FbxReference*)0))), pValue, pForceSet, pFlags);
	}

	const FbxProperty& StaticInit(FbxObject* pObject, const char* pName, const FbxDataType& pDataType, const FbxReference& pValue, bool pForceSet, FbxPropertyFlags::EFlags pFlags=FbxPropertyFlags::eNone)
	{
		bool lWasFound = false;
		*this = Create(pObject, pDataType, pName, "", true, &lWasFound);
		if( pForceSet || !lWasFound )
		{
			ModifyFlag(pFlags, true);	// modify the flags before we set the value
			Set(pValue);			// since we will trigger callbacks in there!
		}
		ModifyFlag(FbxPropertyFlags::eStatic, true);
		return *this;
	}

	FbxReference Get() const
	{
		FbxProperty::NotifyGet();
		return GetSrcObject();
	}

	FbxPropertyT& Set(const FbxReference& pValue)
	{
		if( FbxProperty::NotifySetRequest() )
		{
			DisconnectAllSrcObject();
			if( ConnectSrcObject(pValue) ) 
			{
				FbxProperty::SetValueInheritType(FbxPropertyFlags::eOverride);
				FbxProperty::NotifySet();
			}
		}
		return *this;
	}

	operator FbxReference() const
	{
		return Get();
	}

	FbxPropertyT& operator=(const FbxReference& pValue)
	{
		return Set(pValue);
	}
};
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_PROPERTY_H_ */
