// jsvariablefield.cs
//
// Copyright 2010 Microsoft Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using System.Collections.Generic;
using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Field type enumeration
    /// </summary>
    public enum FieldType
    {
        Local,
        Predefined,
        Global,
        Arguments,
        Argument,
        WithField,
        CatchError,
        GhostCatch,
        GhostFunction,
        UndefinedGlobal,
        Super,
    }

    public class JSVariableField
    {
        private ActivationObject m_owningScope; 
        private HashSet<INameReference> m_referenceTable;
        private HashSet<INameDeclaration> m_declarationTable;

        private bool m_canCrunch;// = false;
        private bool m_isDeclared; //= false;
        private bool m_isGenerated;
        private string m_crunchedName;// = null;

        public Context OriginalContext { get; set; }
        public string Name { get; private set; }
        public FieldType FieldType { get; set; }
        public FieldAttributes Attributes { get; set; }
        public Object FieldValue { get; set; }

        public bool IsFunction { get; internal set; }
        public bool IsAmbiguous { get; set; }
        public bool IsPlaceholder { get; set; }
        public bool HasNoReferences { get; set; }
        public bool InitializationOnly { get; set; }
        public int Position { get; set; }
        public bool WasRemoved { get; set; }
        public bool IsExported { get; set; }

        public JSVariableField OuterField { get; set; }

        public ActivationObject OwningScope 
        {
            get
            {
                // but the get -- if we are an inner field, we always
                // want to get the owning scope of the outer field
                return OuterField == null ? m_owningScope : OuterField.OwningScope;
            }
            set
            {
                // simple set -- should always point to the scope in whose
                // name table this field has been added, which isn't necessarily
                // the owning scope, because this may be an inner field. But keep
                // this value in case we ever break the link to the outer field.
                m_owningScope = value;
            }
        }

        public JSVariableField GhostedField { get; set; }

        public int RefCount
        {
            get
            {
                return m_referenceTable.Count;
            }
        }
        public ICollection<INameReference> References
        {
            get { return m_referenceTable; }
        }

        /// <summary>
        /// returns the only reference IF there is only ONE reference
        /// in the collection; otherwise returns false.
        /// </summary>
        public INameReference OnlyReference
        {
            get
            {
                var array = new INameReference[1];
                if (m_referenceTable.Count == 1)
                {
                    m_referenceTable.CopyTo(array, 0);
                }

                return array[0];
            }
        }

        public ICollection<INameDeclaration> Declarations
        {
            get { return m_declarationTable; }
        }

        /// <summary>
        /// returns the only declaration IF there is only ONE name declaration
        /// in the collection; otherwise returns null.
        /// </summary>
        public INameDeclaration OnlyDeclaration
        {
            get
            {
                var array = new INameDeclaration[1];
                if (m_declarationTable.Count == 1)
                {
                    m_declarationTable.CopyTo(array, 0);
                }

                return array[0];
            }
        }

        public bool IsLiteral
        {
            get
            {
                return ((Attributes & FieldAttributes.Literal) != 0);
            }
        }

        public bool CanCrunch
        {
            get { return m_canCrunch; }
            set 
            { 
                m_canCrunch = value;

                // if there is an outer field, we only want to propagate
                // our crunch setting if we are setting it to false. We never
                // want to set an outer field to true because we might have already
                // determined that we can't crunch it.
                if (OuterField != null && !value)
                {
                    OuterField.CanCrunch = false;
                }
            }
        }

        public bool IsDeclared
        {
            get { return m_isDeclared; }
            set 
            { 
                m_isDeclared = value;
                if (OuterField != null)
                {
                    OuterField.IsDeclared = value;
                }
            }
        }

        public bool IsGenerated
        {
            get
            {
                // if we are pointing to an outer field, return ITS flag, not ours
                return OuterField != null ? OuterField.IsGenerated : m_isGenerated;
            }
            set
            {
                // always set our flag, just in case
                m_isGenerated = value;

                // if we are pointing to an outer field, set it's flag as well
                if (OuterField != null)
                {
                    OuterField.IsGenerated = value;
                }
            }
        }

        public bool IsOuterReference
        {
            get
            {
                if (this.OuterField != null)
                {
                    // there is an outer field reference.
                    // go up the chain and make sure that there is a non-placeholder field
                    // somewhere up there. If there is nothing but placeholders (ghosts), then
                    // this is not an outer field.
                    var outerField = this.OuterField;
                    while (outerField != null)
                    {
                        if (!outerField.IsPlaceholder)
                        {
                            // we found an outer field that is not a placeholder, therefore
                            // the original field IS an outer field.
                            return true;
                        }

                        outerField = outerField.OuterField;
                    }
                }

                // if we get here, then we didn't find any real (non-placeholder)
                // outer field, so we are not an outer reference.
                return false;
            }
        }

        // we'll set this after analyzing all the variables in the
        // script in order to shrink it down even further
        public string CrunchedName
        {
            get
            {
                // return the outer field's crunched name if there is one,
                // otherwise return ours
                return (OuterField != null
                    ? OuterField.CrunchedName
                    : m_crunchedName);
            }
            set
            {
                // only set this if we CAN
                if (m_canCrunch)
                {
                    // if this is an outer reference, pass this on to the outer field
                    if (OuterField != null)
                    {
                        OuterField.CrunchedName = value;
                    }
                    else
                    {
                        m_crunchedName = value;
                    }
                }
            }
        }

        // we'll set this to true if the variable is referenced in a lookup
        public bool IsReferenced
        {
            get
            {
                // if the refcount is zero, we know we're not referenced.
                // if the count is greater than zero and we're a function definition,
                // then we need to do a little more work
                var funcObj = FieldValue as FunctionObject;
                if (funcObj != null)
                {
                    // ask the function object if it's referenced. 
                    return funcObj.IsReferenced;
                }
                else if (FieldValue is ClassNode)
                {
                    // classes are always referenced. For now.
                    return true;
                }

                return RefCount > 0;
            }
        }

        /// <summary>
        /// Gets a value that indicates whether this field is ever referenced in a scope
        /// other than the one in which it is defined
        /// </summary>
        public bool IsReferencedInnerScope
        {
            get
            {
                // walk the list of references for this field. If any of them
                // have an outer-field reference, then the reference is an inner reference
                // and we can return true.
                foreach (var reference in this.References)
                {
                    if (reference.VariableField.OuterField != null)
                    {
                        return true;
                    }
                }

                // if we get here, all the references (if any) are from within
                // the same scope as it is defined.
                return false;
            }
        }

        public JSVariableField(FieldType fieldType, string name, FieldAttributes fieldAttributes, object value)
        {
            m_referenceTable = new HashSet<INameReference>();
            m_declarationTable = new HashSet<INameDeclaration>();

            Name = name;
            Attributes = fieldAttributes;
            FieldValue = value;
            SetFieldsBasedOnType(fieldType);
        }

        internal JSVariableField(FieldType fieldType, JSVariableField outerField)
        {
            if (outerField == null)
            {
                throw new ArgumentNullException("outerField");
            }

            m_referenceTable = new HashSet<INameReference>();
            m_declarationTable = new HashSet<INameDeclaration>();

            // set values based on the outer field
            OuterField = outerField;

            Name = outerField.Name;
            Attributes = outerField.Attributes;
            FieldValue = outerField.FieldValue;
            IsGenerated = outerField.IsGenerated;

            // and set some other fields on our object based on the type we are
            SetFieldsBasedOnType(fieldType);
        }

        private void SetFieldsBasedOnType(FieldType fieldType)
        {
            FieldType = fieldType;
            switch (FieldType)
            {
                case FieldType.Argument:
                case FieldType.CatchError:
                    IsDeclared = true;
                    CanCrunch = true;
                    break;

                case FieldType.Arguments:
                    IsDeclared = false;
                    CanCrunch = false;
                    break;

                case FieldType.Global:
                case FieldType.Super:
                case FieldType.WithField:
                case FieldType.UndefinedGlobal:
                    CanCrunch = false;
                    break;

                case FieldType.Local:
                    CanCrunch = true;
                    break;

                case FieldType.Predefined:
                    IsDeclared = false;
                    CanCrunch = false;
                    break;

                case FieldType.GhostCatch:
                    CanCrunch = true;
                    IsPlaceholder = true;
                    break;

                case FieldType.GhostFunction:
                    CanCrunch = OuterField == null ? true : OuterField.CanCrunch;
                    IsFunction = true;
                    IsPlaceholder = true;
                    break;

                default:
                    // shouldn't get here
                    throw new ArgumentException("Invalid field type", "fieldType");
            }
        }

        public void AddReference(INameReference reference)
        {
            if (reference != null)
            {
                m_referenceTable.Add(reference);

                if (this.OuterField != null)
                {
                    this.OuterField.AddReference(reference);
                }
            }
        }

        public void AddReferences(IEnumerable<INameReference> references)
        {
            if (references != null)
            {
                foreach (var reference in references)
                {
                    AddReference(reference);
                }
            }
        }

        public void Detach()
        {
            OuterField = null;
        }

        public override string ToString()
        {
            string crunch = CrunchedName;
            return string.IsNullOrEmpty(crunch) ? Name : crunch;
        }


        public override int GetHashCode()
        {
            return Name.GetHashCode();
        }

        /// <summary>
        /// returns true if the fields point to the same ultimate reference object.
        /// Needs to walk up the outer-reference chain for each field in order to
        /// find the ultimate reference
        /// </summary>
        /// <param name="otherField"></param>
        /// <returns></returns>
        public bool IsSameField(JSVariableField otherField)
        {
            // shortcuts -- if they are already the same object, we're done;
            // and if the other field is null, then we are NOT the same object.
            if (this == otherField)
            {
                return true;
            }
            else if (otherField == null)
            {
                return false;
            }

            // get the ultimate field for this field
            var thisOuter = OuterField != null ? OuterField : this;
            while (thisOuter.OuterField != null)
            {
                thisOuter = thisOuter.OuterField;
            }

            // get the ultimate field for the other field
            var otherOuter = otherField.OuterField != null ? otherField.OuterField : otherField;
            while (otherOuter.OuterField != null)
            {
                otherOuter = otherOuter.OuterField;
            }

            // now that we have the same outer fields, check to see if they are the same
            return thisOuter == otherOuter;
        }
    }
}