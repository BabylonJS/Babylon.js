// objectliteralfield.cs
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

namespace Microsoft.Ajax.Utilities
{
    public class ObjectLiteralField : ConstantWrapper, INameDeclaration
    {
        public bool IsIdentifier { get; set; }

        public Context ColonContext { get; set; }

        public ObjectLiteralField(Object value, PrimitiveType primitiveType, Context context)
            : base(value, primitiveType, context)
        {
        }

        public override void Accept(IVisitor visitor)
        {
            if (visitor != null)
            {
                visitor.Visit(this);
            }
        }

        public string Name
        {
            get 
            { 
                return this.ToString(); 
            }
        }

        public AstNode Initializer
        {
            get { return null; }
        }

        public bool IsParameter
        {
            get { return false; }
        }

        public bool RenameNotAllowed
        {
            get 
            { 
                // this represents an object property name, so we can't rename it
                return true; 
            }
        }

        public JSVariableField VariableField { get; set; }
    }
}
