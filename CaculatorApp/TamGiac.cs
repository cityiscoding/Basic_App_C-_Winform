using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CaculatorApp
{
    public class TamGiac
    {
        private int canhA;
        private int canhB;
        private int canhC;
        public TamGiac(int a, int b, int c)
        {
            canhA = a;
            canhB = b;
            canhC = c;
        }

        public string LoaiTamGiac
        {
            get
            {
                if (canhA + canhB <= canhC || canhA + canhC <= canhB || canhB + canhC <= canhA)
                {
                    return "khong hop le. Xin kiem tra lai !";
                }
                else if (canhA == canhB && canhB == canhC)
                {
                    return "Deu";
                }
                else if (canhA * canhA + canhB * canhB == canhC * canhC || canhA * canhC + canhC * canhC == canhB * canhB || canhB * canhB + canhC * canhC == canhA * canhC)
                {
                    return "Vuong";
                }
                else if (canhA == canhB || canhA == canhC || canhB == canhC)
                {
                    return "Can";
                }
                else
                {
                    return "Thuong";
                }
            }
        
        }
        public double TinhChuVi()
        {
            if (canhA + canhB <= canhC || canhA + canhC <= canhB || canhB + canhC <= canhA)
            {
                MessageBox.Show("Tam giác không hợp lệ");
                return 0;
            }
            else
            {
                return canhA + canhB + canhC;
            }
        }

        public double TinhDienTich()
        {
            if (canhA + canhB <= canhC || canhA + canhC <= canhB || canhB + canhC <= canhA)
            {
                MessageBox.Show("Tam giác không hợp lệ");
                return 0;
            }
            else
            {
                double p = (canhA + canhB + canhC) / 2;
                return Math.Sqrt(p * (p - canhA) * (p - canhB) * (p - canhC));
            }
        }


    }
}