/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsymbol.h
#ifndef _FBXSDK_CORE_SYMBOL_H_
#define _FBXSDK_CORE_SYMBOL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxmap.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Defines a symbol string. A symbol string is a string that is unique and stored in a global symbol table.
* \nosubgrouping */
class FBXSDK_DLL FbxSymbol
{
public:
    /**
    * \name Constructors and Destructor
    */
    //@{

    /** Constructor.
    * Construct a symbol and add it to global symbol table.
    * \param pName Symbol name.
    * \param pRealm The real value for this symbol. 
    */
    FbxSymbol(const char* pName, const char* pRealm);

    //! Destructor.
    ~FbxSymbol();
    //@}

    /**
    * \name Access function.
    */
    //@{
    /**
    * Get ID in global symbol table.
    * \return Symbol ID in global symbol table.
    */
    unsigned int GetID() const;
    //@}

    /**
    * \name Symbol comparison
    */
    //@{
    /** Equality operator.
    * \param pSymbol The symbol to be compared. 
    */
    bool operator==(FbxSymbol const& pSymbol) const;

    /** Inequality operator.
    * \param pSymbol The symbol to be compared. 
    */
    bool operator!=(FbxSymbol const& pSymbol) const;
    //@}

private:
    unsigned int mID;
};

typedef FbxMap< FbxString, int, FbxStringCompare > FbxStringSymbolMap;


/** This class is to mark a string as symbol.
  * String Symbol only has its name.
  * /remarks Each symbol is unique. That means there are no symbols which have the same name.
* \nosubgrouping */
class FBXSDK_DLL FbxStringSymbol
{
public:
    /**
    * \name Constructors and Destructor
    */
    //@{

    //! Default constructor.
    FbxStringSymbol();

    /** Constructor.
    * Construct a symbol and add it to global symbol table.
    * \param pName Symbol name.
    */
    FbxStringSymbol(const char* pName);

    //! Copy constructor.
    FbxStringSymbol(const FbxStringSymbol& pOther);

    //! Destructor.
    ~FbxStringSymbol();
    //@}

    //! Cast operator to const char* type.
    inline operator const char*() const { return mItem ? ((const char*) mItem->GetKey()) : NULL; }


    /** Determine the symbol empty or not.
    * \return \c true if empty. \c false otherwise.
    */    
    inline bool IsEmpty() const
    {
        return !mItem || mItem->GetKey().IsEmpty();
    }

    //! Static function to allocate global string symbol map.
    static void AllocateGlobalStringSymbolMap();

    //! Static function to deallocate global string symbol map.
    static void FreeGlobalStringSymbolMap();

    /** Assignment operator.
    * \param pName  The symbol value. 
    * \return       The self after assignment.
    */
    FbxStringSymbol& operator=(const char* pName);

private:
    FbxStringSymbolMap::RecordType* mItem;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_SYMBOL_H_ */
