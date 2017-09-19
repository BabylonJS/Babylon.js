// ModuleScope.cs
//
// Copyright 2013 Microsoft Corporation
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

using System.Collections.Generic;
using System.Reflection;

namespace Microsoft.Ajax.Utilities
{
    public class ModuleScope : ActivationObject
    {
        private Dictionary<string, JSVariableField> m_knownExports;

        /// <summary>
        /// Gets or sets a flag to indicate whether this module exports a default expression
        /// </summary>
        public bool HasDefaultExport { get; set; }

        /// <summary>
        /// Gets or sets a flag to indicate whether this module re-exports all exports from an unknown external module
        /// </summary>
        public bool IsNotComplete { get; set; }

        public ModuleScope(ModuleDeclaration module, ActivationObject parent, CodeSettings settings)
            : base(parent, settings)
        {
            Owner = module;
            UseStrict = true;
            ScopeType = ScopeType.Module;

            m_knownExports = new Dictionary<string, JSVariableField>();
        }

        /// <summary>
        /// Set up this scope's fields from the declarations it contains
        /// </summary>
        public override void DeclareScope()
        {
            // bind lexical declarations
            DefineLexicalDeclarations();

            // bind the variable declarations
            DefineVarDeclarations();

            // now that all the fields are created, check each one for whether or not it's exported
            // and add the exports to the collection
            foreach (var field in this.NameTable.Values)
            {
                if (field.IsExported)
                {
                    m_knownExports.Add(field.Name, field);
                }
            }
        }

        internal override void AnalyzeScope()
        {
            // do the default analyze stuff
            base.AnalyzeScope();

            //if (m_knownExports.Count > 0
            //    && Settings.LocalRenaming != LocalRenaming.KeepAll
            //    && Settings.IsModificationAllowed(TreeModifications.LocalRenaming))
            //{
            //    // now we need to take a look at our exports and see if it's worth 
            //    // minifying their names. if we minify them we might have to add code to
            //    // keep their external names unchanged, so it's not a slam-dunk.
            //    // First sort them by refcount and name length (decreasing, both).
            //    m_knownExports.Sort((left, right) => 
            //        {
            //            var comparison = right.RefCount - left.RefCount;
            //            if (comparison == 0)
            //            {
            //                comparison = right.Name.Length - left.Name.Length;
            //            }
            //            return comparison; 
            //        });
            //}
        }

        public override JSVariableField CreateField(string name, object value, FieldAttributes attributes)
        {
            return new JSVariableField(FieldType.Local, name, attributes, value);
        }
    }
}
