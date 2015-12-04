/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbindingoperator.h
#ifndef _FBXSDK_SCENE_SHADING_BINDING_OPERATOR_H_
#define _FBXSDK_SCENE_SHADING_BINDING_OPERATOR_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxbindingtablebase.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This object represents a binding operation on a FbxObject or FbxProperty.
  * For example, FbxBindingOperator can be used to bind a light object
  * to a parameter of shader via FbxNodeDirectionBOF or FbxNodePositionBOF.
  * \code
  *  //Create an entry lEntry of binding table lTable.
  *  FbxBindingTableEntry& lEntry = lTable->AddNewEntry();
  *  
  *  //Create a NodePositionConvert binding operator and add it as source of the lEntry.
  *  FbxOperatorEntryView lSrc(&lEntry, true, true);
  *  lSrc.SetOperatorName( "NodePositionConvert");
  *  FbxBindingOperator* lOp = pImpl.AddNewBindingOperator( "NodePositionConvert", FbxNodePositionBOF::FunctionName);
  *  
  *  //Add a property entry to the binding operator.
  *  FbxBindingTableEntry& lEntryPropParam = lOp->AddNewEntry();
  *  FbxPropertyEntryView lPropSrc(&lEntryPropParam, true, true);
  *  //Set the shader parameter (the property's name) as source of the lEntryPropParam.
  *  lPropSrc.SetProperty(lProp.GetHierarchicalName());
  *  //Set the operator function FbxNodePositionBOF as destination of the lEntryPropParam.
  *  lEntryPropParam.SetDestination( FbxNodePositionBOF::FunctionName );
  *  
  *  //Set the shader parameter as destination of the lEntry.
  *  FbxSemanticEntryView lDst( &lEntry, false, true );
  *  lDst.SetSemantic( lProp.GetName() );
  * \endcode
  * \nosubgrouping
  * \see FbxOperatorEntryView, FbxBindingTableEntry, FbxPropertyEntryView
  */
class FBXSDK_DLL FbxBindingOperator : public FbxBindingTableBase
{
    FBXSDK_OBJECT_DECLARE(FbxBindingOperator, FbxBindingTableBase);

public:
    /** Run the operator on the given object.
      * \param pObject The object that will be evaluated.
      * \param pResult A pointer to a buffer to hold the result.
      * \return \c true on success, \c false otherwise.
      */
    template <class FBXTYPE>
    bool Evaluate(const FbxObject* pObject, FBXTYPE* pResult) const
    {
        EFbxType lResultType;
        void* lResult = NULL;

        bool lSuccess = Evaluate(pObject, &lResultType, &lResult);

        if (lSuccess)
        {
            FbxTypeCopy(*pResult, lResult, lResultType);
        }

        FreeEvaluationResult(lResultType, lResult);

        return lSuccess;
    }
    
    /** Run the inverse operator on the given object,
      * assigning the result directly to the object.
      * \param pObject The object that will be evaluated.
      * \param pInOut Type of value being reversed.
      * \param setObj Control to set the property (only to query by the default ).
      * \param index Used only in FbxMultiplyDistBOF.
      * \return \c true on success, \c false otherwise.
      */
    template <class FBXTYPE>
    bool ReverseEvaluation(const FbxObject* pObject, FBXTYPE * pInOut, 
                            bool setObj=false, int index=0) const
    {

        const void* lIn = pInOut;
        void* lOut = NULL;
        EFbxType lOutType;

        bool lSuccess = ReverseEvaluate(pObject, lIn, &lOut, &lOutType, setObj, index);

        if (lSuccess)
        {
            FbxTypeCopy(*pInOut, lOut, lOutType);
        }

        FreeEvaluationResult(lOutType, lOut);

        return lSuccess;
    }

    /** Evaluate the value of an operator parameter.
      * \param pObject The object that will be evaluated.
      * \param pEntryDestinationName The name of the parameter.
	  *                              This is used to get the property or operator that is related to this parameter,
	  *                              then to evaluate the property or operator.
      * \param pResult A pointer to the result.
	  * \return \c true on success, \c false otherwise.
	  * \remarks This method can handle different types of entries. For property entry and constant entry,
	  *          this method will find out the property via the pEntryDestinationName and then evaluate its value;
	  *          for operator entry, this method will find out the operator via the pEntryDestinationName and
	  *          evaluate the operator function to get the property's value; for any other types of entry, this method
	  *          is meaningless.
      */
    template <class FBXTYPE>
    bool EvaluateEntry(const FbxObject* pObject, const char* pEntryDestinationName, FBXTYPE* pResult) const
    {
        EFbxType lResultType;
        void* lResult = NULL;

        bool lSuccess = EvaluateEntry(pObject, pEntryDestinationName, &lResultType, &lResult);

        if (lSuccess)
        {
            FbxTypeCopy(*pResult, lResult, lResultType);
        }

        FreeEvaluationResult(lResultType, lResult);

        return lSuccess;
    }

	/** This property stores the name of function.
	  *
	  * Default value is "".
	  */
    FbxPropertyT<FbxString> FunctionName;

	/** This property stores the name of target.
	*
	* Default value is "".
	*/
    FbxPropertyT<FbxString> TargetName;

    //////////////////////////////////////////////////////////////////////////
    // Static values
    //////////////////////////////////////////////////////////////////////////

	//! Function name.
    static const char* sFunctionName;
	//! Target name.
    static const char* sTargetName;

    //! Default value for function name.
    static const char* sDefaultFunctionName;
	//! Default value for target name.
    static const char* sDefaultTargetName;


    //////////////////////////////////////////////////////////////////////////
    // Functions
    //////////////////////////////////////////////////////////////////////////

    /** \internal
      * 
      */
    static void RegisterFunctions();

    /** \internal 
      * 
      */
    static void UnregisterFunctions();


    /** It represents a binding relationship between current object and the target.
      * Any binding operation need to specify a certain kind of binding function.
      * \nosubgrouping
      */
    class FBXSDK_DLL Function
    {
    public:
		//!Destructor.
        virtual ~Function() {}

		/** Run the operator on the given object.
		  * \param pOperator The operator that will be applied.
		  * \param pObject The object that will be evaluated.
		  * \param pResultType Will be filled by the type of the result.
		  * \param pResult Will be filled by a pointer to a buffer that hold the result.
		  * The caller must call FreeEvaluationResult() when it is done with this pointer.
		  * \return \c true on success, \c false otherwise.
		  */
        virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const = 0;
        
		/** Run the inverse operator on the given object,
		  * assigning the result directly to the object.
		  * \param pOperator The operator that will be applied.
		  * \param pTarget The object that will be evaluated.
		  * \param pIn
		  * \param pOut
		  * \param pOutType Type of value being reversed.
		  * \param setObj Control to set the property (only to query by the default ).
		  * \param index Used only in FbxMultiplyDistBOF.
		  * \return \c true on success, \c false otherwise.
		  */
		virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const = 0;
    };

    /** The abstract factory class for binding function.
      * \nosubgrouping
      */
    class FBXSDK_DLL FunctionCreatorBase
    {
    public:
		//!Destructor.
        virtual ~FunctionCreatorBase() {}

		/** Get name of the function.
		  * \return The name of the function.
		  */
        virtual const char* GetFunctionName() const = 0;

		/** Create the function.
		*/
        virtual Function* CreateFunction() const = 0;
    };

    /** The concrete factory class for binding function.
      * \nosubgrouping
      */
    template <class FUNCTION>
    class FunctionCreator : public FunctionCreatorBase
    {
    public:

		/** Get Name of the operation function.
		  * \return The Name of the operation function.
		  */
        virtual const char* GetFunctionName() const
        {
            return FUNCTION::FunctionName;
        }

		/** Create the operation function.
		*/
        virtual Function* CreateFunction() const
        {
            return FbxNew< FUNCTION >();
        }
    };

    /** This utility class is used to register and unregister the binding function creators.
      * \nosubgrouping
      */
    class FBXSDK_DLL FunctionRegistry
    {
    public:
		/** To register the binding function creator.
		* \param pCreator The binding function creator to register.
		*/
        static void RegisterFunctionCreator(FunctionCreatorBase const& pCreator)
        {
            sRegistry.Insert(pCreator.GetFunctionName(), &pCreator);
        }

		/** To unregister the binding function creator.
		* \param pCreator The binding function creator to unregister.
		*/
        static void UnregisterFunctionCreator(FunctionCreatorBase const& pCreator)
        {
            sRegistry.Remove(pCreator.GetFunctionName());
        }

		/** To find the binding function creator by name.
		* \param pName The name of the operation function creator to find.
		*/
        static const FunctionCreatorBase* FindCreator(const char* pName)
        {
            RegistryType::RecordType* lRecord = sRegistry.Find(pName);

            if (lRecord)
            {
                return lRecord->GetValue();
            }
            else
            {
                return NULL;
            }
        }

    private:
        typedef FbxMap<const char*, const FunctionCreatorBase*, FbxCharPtrCompare> RegistryType;
        static RegistryType sRegistry;
    };


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    bool EvaluateEntry(const FbxObject* pObject, const char* pEntryDestinationName, EFbxType* pResultType, void** pResult) const;
    bool GetEntryProperty(const FbxObject* pObject, const char* pEntryDestinationName, FbxProperty & pProp) const;

protected:
    virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);
    virtual void ConstructProperties(bool pForceSet);

    void InstantiateFunction();
    bool Evaluate(const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    bool ReverseEvaluate(const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    void FreeEvaluationResult(EFbxType pResultType, void* pResult) const;

    Function* mFunction;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/**  An evaluation operator to get the position of the node that is bound with this operator via a certain property.
  *  The position of the node is represented by translation.
  */
class FbxNodePositionBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
	static const char* FunctionName;

	/** Evaluate the position of the node that is bound with this operator via a certain property.
	  *   The position of the node is represented by translation.
	  *
	  * \param pOperator Operator running on the object.
	  * \param pObject The object that will be evaluated.
	  * \param pResultType The type of the result to be returned, eFbxDouble4 in this case.
	  * \param pResult A pointer to a buffer that can hold the result.
	  * \return \c true on success, \c false otherwise.
	  */
	virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
	
	//! Inverse evaluation for this binding function is not implemented yet.
	virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxNodePositionBOF();
	virtual ~FbxNodePositionBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/**  An evaluation operator to get the direction of the node that is bound with this operator via a certain property.
  *  The direction of the node is represented by Euler rotation.
  */
class FbxNodeDirectionBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
	static const char* FunctionName;

	/** Evaluate the direction of the node that is bound with this operator via a certain property.
	  *   The direction of the node is represented by Euler rotation.
	  *
	  * \param pOperator Operator running on the object.
	  * \param pObject The object that will be evaluated.
	  * \param pResultType The type of the result to be returned, eFbxDouble4 in this case.
	  * \param pResult A pointer to a buffer that can hold the result.
	  * \return \c true on success, \c false otherwise.
	  */
	virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
	
	//! Inverse evaluation for this binding function is not implemented yet.
	virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxNodeDirectionBOF();
	virtual ~FbxNodeDirectionBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** A pass through operator used to assign constants to parameters.
*/
class FbxAssignBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "X" and returns it.
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType Will be filled by the type of the result.
    * \param pResult Will be filled by a pointer to a buffer that hold the result.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    
	//! Inverse evaluation for this binding function is not implemented yet.
	virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxAssignBOF();
    virtual ~FbxAssignBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/** A conditional operator that outputs one out of two properties, based on
  * the value of a predicate property.
  */
class FbxConditionalBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "predicate".
    * If the property value is true (!= 0, != ""), returns the value of the
    * property specified by "ifTrue", else returns the value of the property
    * specified by "ifFalse".
    *
    * Currently the data types supported for the input property are
    * limited to "integer", "boolean", "float", "double" and "string".
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxConditionalBOF();
    virtual ~FbxConditionalBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/** A switch operator that outputs one out of n properties, based on
  * the value of a predicate property.
  */
class FbxSwitchBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "predicate".
    * Returns the value of the property specified by "case_n", where n
    * is the value of "predicate". If there is no case_n entry, returns
    * the value of the property specified by "default".
    *
    * Currently the data types supported for the predicate property are
    * limited to "integer" and "boolean".
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxSwitchBOF();
    virtual ~FbxSwitchBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxTRSToMatrixBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "T", "R" and "S" and
    *   return a transform matrix.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxTRSToMatrixBOF();
    virtual ~FbxTRSToMatrixBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxAddBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X" and "Y"
    *   return X+Y as a float.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxAddBOF();
    virtual ~FbxAddBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxSubstractBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X" and "Y"
    *   return X-Y as a float.
    *
   * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxSubstractBOF();
    virtual ~FbxSubstractBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxMultiplyBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X" and "Y"
    *   return X*Y as a float.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    //Set index to 1 to get realWorldScale.  
	virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxMultiplyBOF();
    virtual ~FbxMultiplyBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxMultiplyDistBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X" and "Y"
    *   return X*Y as a float.
    *
   * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxMultiplyDistBOF();
    virtual ~FbxMultiplyDistBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FbxOneOverXBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X"
    *   return 1/X as a float.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxOneOverXBOF();
    virtual ~FbxOneOverXBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FbxPowerBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object properties specified by "X" and "Y"
    *   return X^Y as a float.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxPowerBOF();
    virtual ~FbxPowerBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FbxDegreeToRadianBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "X"
    *   return X converted to radian as a float.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxDegreeToRadianBOF();
    virtual ~FbxDegreeToRadianBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


class FbxVectorDegreeToVectorRadianBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "X"
    *   return X converted to radian as a vector3.
    *
   * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxVectorDegreeToVectorRadianBOF();
    virtual ~FbxVectorDegreeToVectorRadianBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};



class FbxSphericalToCartesianBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Evaluates the object property specified by "rho", "theta" and "phi"
    *   return the converted Cartesian coordinates as a double3.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxSphericalToCartesianBOF();
    virtual ~FbxSphericalToCartesianBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};



class FbxIsYupBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Check if the scene coordinate system is y-up
    *   return a bool.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxIsYupBOF();
    virtual ~FbxIsYupBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};



/** A symbol(string) operator that search the string table and return its corresponding unique id, based on
  * the value of a predicate property.
  */
class FbxSymbolIDBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Check in the symbol table the string and returns its unique ID as an integer
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxSymbolIDBOF();
    virtual ~FbxSymbolIDBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/**  A chooser operator that check spot distribution and returns the correct value, based on
  *  the value of a predicate property.
  */
class FbxSpotDistributionChooserBOF : public FbxBindingOperator::Function
{
public:
	//! Name of the operation function.
    static const char* FunctionName;

    /** Check the enum of the spot distribution and returns the correct value
    *   as an int.
    *
    * \param pOperator Operator running on the object.
    * \param pObject The object that will be evaluated.
    * \param pResultType The type of the result to be returned.
    * \param pResult A pointer to a buffer that can hold the result.
    * \return \c true on success, \c false otherwise.
    */
    virtual bool Evaluate(const FbxBindingOperator* pOperator, const FbxObject* pObject, EFbxType* pResultType, void** pResult) const;
    
	//! Inverse evaluation for this binding function is not implemented yet.
	virtual bool ReverseEvaluate(const FbxBindingOperator* pOperator, const FbxObject* pTarget, const void* pIn, void** pOut, EFbxType* pOutType, bool setObj, int index) const;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxSpotDistributionChooserBOF();
    virtual ~FbxSpotDistributionChooserBOF();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_BINDING_OPERATOR_H_ */
