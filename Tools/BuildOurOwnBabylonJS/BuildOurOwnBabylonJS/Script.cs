using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Reflection;
using System.Xml.Linq;

namespace BuildOurOwnBabylonJS
{
    public class Script
    {
        public const string TAGNAME = "script";
        public const string ID_ATTRIBUTENAME = "id";
        public const string SRC_ATTRIBUTENAME = "src";
        public const string DEPENDSON_TAGNAME = "dependsOn";
        public const string SCRIPTREF_ATTRIBUTENAME = "scriptref";

        private string _id;
        public string Id { get { return _id; } }

        private string _src;
        public string Src { get { return _src; } }

        private List<Script> _dependencies = Enumerable.Empty<Script>().ToList();
        public IEnumerable<Script> Dependencies { get { return _dependencies; } }

        private static Dictionary<string, Script> _scripts = new Dictionary<string, Script>();
        public static IDictionary<string, Script> Scripts { get { return _scripts; } }

        private bool _written;
        
        // caution: it doesn't take into account xml namespaces
        public static Script Load(XElement scriptElement, 
            IEnumerable<XElement> scriptElements)
        {
            if (scriptElement == null)
                throw new ArgumentNullException("script");
            if (scriptElements == null)
                throw new ArgumentNullException("root");

            if (scriptElement.Name != TAGNAME)
                throw new Exception("Wrong tag name");

            var srcAttribute = scriptElement.Attribute(SRC_ATTRIBUTENAME);

            if (srcAttribute == null)
                throw new Exception("Must have the " + SRC_ATTRIBUTENAME + " attribute");

            var src = srcAttribute.Value;
            var id = src;

            var idAttribute = scriptElement.Attribute(ID_ATTRIBUTENAME);

            if (idAttribute != null && !String.IsNullOrEmpty(idAttribute.Value))
                id =  idAttribute.Value;

            Script _this;

            if (_scripts.TryGetValue(id, out _this))
                return _this;

            _this = new Script();
            _this._id = id;
            _this._src = src;

            _scripts.Add(_this.Id, _this);

            var dependsOnFiles = scriptElement.Elements(DEPENDSON_TAGNAME);

            foreach (var dependOnFile in dependsOnFiles)
            {
                var scriptrefAttribute = dependOnFile.Attribute(SCRIPTREF_ATTRIBUTENAME);

                if (scriptrefAttribute == null)
                    throw new Exception(id + ": its dependency must have the " + SCRIPTREF_ATTRIBUTENAME + " attribute");

                var scriptref = scriptrefAttribute.Value;

                Script scriptRef;

                if (!_scripts.TryGetValue(scriptref, out scriptRef))
                {
                    var newScriptElement = scriptElements
                        .FirstOrDefault(script =>
                        {
                            var idAttr = script.Attribute(ID_ATTRIBUTENAME);

                            if (idAttr == null)
                                return false;

                            return idAttr.Value == scriptref;
                        });

                    if (newScriptElement == null)
                        throw new Exception(id +": couldn't find its dependency '" + scriptref + "'");

                    scriptRef = Load(newScriptElement, scriptElements);
                }

                if (scriptRef == null)
                    throw new Exception(id + ": couldn't find its dependency '" + scriptref + "'");

                _this._dependencies.Add(scriptRef);
            }

            return _this;
        }

        public void GetDependenciesList(ref List<string> result, 
            List<string> dependenciesLoopStack = null)
        {
            dependenciesLoopStack = dependenciesLoopStack ?? new List<string>(_scripts.Count);

            if (dependenciesLoopStack.FirstOrDefault(src => src == _src) != null)
                throw new Exception(_id + ": there is a dependency loop");

            if (_written)
            {
                var dlsC = dependenciesLoopStack.Count;

                if (dlsC == 0)
                    return;

                var lastId = dependenciesLoopStack[dlsC - 1];
                
                for(var i = 0; i < result.Count ; ++i)
                {
                    var tmp = result[i];

                    if (tmp != _src)
                        continue;

                    var firstToAdd = -1;

                    for (var j = 0 ; j < dependenciesLoopStack.Count ; ++j)
                    {
                        var k = 0;
                        var dls = dependenciesLoopStack[j];

                        if (firstToAdd == -1)
                        {
                            for (; k < i; ++k)
                            {
                                if (dls == result[k])
                                    break;
                            }

                            if (k < i)
                                continue;

                            firstToAdd = j;
                        }

                        // i + j - firstToAdd should always be < result.Count - 1
                        result[i + j - firstToAdd] = dls;
                    }

                    var moveTo = i + (dlsC - firstToAdd);

                    // moveTo should always be < result.Count - 1

                    if (result[moveTo] != lastId)
                    {
                        for (var k = result.Count - 1; k > moveTo; --k)
                        {
                            result[k] = result[k-1];
                        }
                    }

                    result[moveTo] = tmp;

                    break;
                }

                return;
            }

            _written = true;

            dependenciesLoopStack.Add(_src);

            result.Add(_src);
            
            foreach (var dependency in _dependencies)
            {
                dependency.GetDependenciesList(ref result, dependenciesLoopStack);
            }

            dependenciesLoopStack.RemoveAll(src => src == _src); // Remove(_src) should be enough
        }
    }
}
