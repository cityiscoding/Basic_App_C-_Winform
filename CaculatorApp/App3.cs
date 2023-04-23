using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CaculatorApp
{
    public partial class frmApp3 : Form
    {
        public frmApp3()
        {
            InitializeComponent();
        }

        private void frmApp3_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            frmManHinhChinh mhc = new frmManHinhChinh();
            this.Hide();
            mhc.Show();
        }

        private void btnClear_Click(object sender, EventArgs e)
        {
            txtA.Text = "";
            txtB.Text = "";
            txtC.Text = "";
        }

        private void button1_Click(object sender, EventArgs e)
        {

            double a = double.Parse(txtA.Text);
            double b = double.Parse(txtB.Text);
            double c = double.Parse(txtC.Text);
            if (!double.TryParse(txtA.Text, out a) || !double.TryParse(txtB.Text, out b) || !double.TryParse(txtC.Text, out c))
            {
                MessageBox.Show("Dữ liệu nhập vào không phải là số!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            // Kiểm tra giá trị a
            if (a == 0)
            {
                MessageBox.Show("Nếu a = 0.Đây là phương trình bậc 1 , không phải phương trình bậc 2", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            string ketQua = PtBac2.KiemTraPhuongTrinh(a, b, c);
            MessageBox.Show(ketQua);
        }
    }

  
}
