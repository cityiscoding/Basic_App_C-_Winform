using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaculatorApp
{
    public class PtBac2
    {
        private double a;
        private double b;
        private double c;

        public PtBac2(double a, double b, double c)
        {
            this.a = a;
            this.b = b;
            this.c = c;
        }
        public static string KiemTraPhuongTrinh(double a, double b, double c)
        {
            if (a == 0)
            {
                if (b == 0)
                {
                    if (c == 0)
                    {
                        return "Phuong trinh vo so nghiem";
                    }
                    else
                    {
                        return "Phuong trinh vo nghiem";
                    }
                }
                else
                {
                    double x = -c / b;
                    return $"Phuong trinh co nghiem duy nhat x = {x}";
                }
            }
            else
            {
                double delta = b * b - 4 * a * c;
                if (delta < 0)
                {
                    return "Phuong trinh vo nghiem Delta < 0.";
                }
                else if (delta == 0)
                {
                    double x = -b / (2 * a);
                    return $"Phuong trinh co nghiem kep Delta = 0. x = {x}";
                }
                else
                {
                    double x1 = (-b + Math.Sqrt(delta)) / (2 * a);
                    double x2 = (-b - Math.Sqrt(delta)) / (2 * a);
                    return $"Phuong trinh co 2 nghiem phan biet x1 Delta > 0. = {x1}, x2 = {x2}";
                }
            }
        }

    }
}