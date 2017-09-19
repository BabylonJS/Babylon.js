// ComprehensionClause.cs
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


namespace Microsoft.Ajax.Utilities
{
    /// <summary>
    /// Base class for ComprehensionForClause and ComprehensionIfClause
    /// </summary>
    public abstract class ComprehensionClause : AstNode
    {
        public Context OperatorContext { get; set; }

        public Context OpenContext { get; set; }

        public Context CloseContext { get; set; }

        protected ComprehensionClause(Context context)
            : base(context)
        {
        }
    }
}
