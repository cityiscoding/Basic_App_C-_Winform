using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CalculatorApp
{
    public static class Calculator
    {
        public static bool KiemTraThongTin(string so1, string so2)
        {
            // Kiểm tra các trường thông tin
            if (string.IsNullOrEmpty(so1) || string.IsNullOrEmpty(so2))
            {
                MessageBox.Show("Vui lòng nhập đầy đủ thông tin!");
                return false;
            }
            if (!int.TryParse(so1, out int a) || !int.TryParse(so2, out int b))
            {
            MessageBox.Show("Số nhập vào không hợp lệ!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return false;
            }
        return true;
        }
        public static int Add(string so1, string so2)
        {
            if (!KiemTraThongTin(so1, so2)) // Check input validity
                return 0;

            int a = int.Parse(so1);
            int b = int.Parse(so2);

            return a + b;
        }

        public static int Sub(string so1, string so2)
        {
            if (!KiemTraThongTin(so1, so2)) // Check input validity
                return 0;

            int a = int.Parse(so1);
            int b = int.Parse(so2);

            return a - b;
        }

        public static int Mul(string so1, string so2)
        {
            if (!KiemTraThongTin(so1, so2)) // Check input validity
                return 0;

            int a = int.Parse(so1);
            int b = int.Parse(so2);

            return a * b;
        }

        public static int Div(string so1, string so2)
        {
            if (!KiemTraThongTin(so1, so2)) // Check input validity
                return 0;

            int a = int.Parse(so1);
            int b = int.Parse(so2);

            if (b == 0) // Check for divide by zero error
            {
                MessageBox.Show("Không thể chia cho 0!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 0;
            }

            return a / b;
        }

    }
}
