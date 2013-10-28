using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;

namespace BabylonExport.Interface
{

    [ServiceContract]
    public interface IService
    {
        [OperationContract]
        bool Convert(string file, string outputName);
    }
}
