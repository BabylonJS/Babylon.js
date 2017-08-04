using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LegoConvertDat.Models
{
    public class DatPart
    {
        public string Name { get; set; }
        public List<Polygone> Polygones { get; internal set; }

        public DatPart()
        {
            Polygones = new List<Polygone>();
        }

        public void AddPolygone(Polygone pol)
        {          
            Polygones.Add(pol);
        }
        public void AddPolygones(List<Polygone> pol)
        {
            Polygones.AddRange(pol);
        }
    }
}
