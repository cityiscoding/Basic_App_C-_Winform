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
    public partial class frmApp4 : Form
    {
        public frmApp4()
        {
            InitializeComponent();
        }

        private void btnKiemTra_Click(object sender, EventArgs e)
        {
            if (int.TryParse(txtCanhA.Text, out int canhA) && int.TryParse(txtCanhB.Text, out int canhB) && int.TryParse(txtCanhC.Text, out int canhC))
            {
                TamGiac tamGiac = new TamGiac(canhA, canhB, canhC);
                string loaiTamGiac = tamGiac.LoaiTamGiac;
                MessageBox.Show($"Day la tam giac: {loaiTamGiac}");
            }
            else
            {
                MessageBox.Show("Vui long nhap cac canh cua tam giac bang so nguyen duong!");
            }
        }

        private void frmApp4_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            frmManHinhChinh mhc = new frmManHinhChinh();
            this.Hide();
            mhc.Show();
        }

        private void btnChuVi_Click(object sender, EventArgs e)
        {
            if (int.TryParse(txtCanhA.Text, out int canhA) && int.TryParse(txtCanhB.Text, out int canhB) && int.TryParse(txtCanhC.Text, out int canhC))
            {
                TamGiac tamGiac = new TamGiac(canhA, canhB, canhC);
                double chuVi = tamGiac.TinhChuVi();
                MessageBox.Show($"Chu vi tam giac la: {chuVi}");
            }
            else
            {
                MessageBox.Show("Vui long nhap cac canh cua tam giac bang so nguyen duong!");
            }
        }

        private void btnDienTich_Click(object sender, EventArgs e)
        {
            if (int.TryParse(txtCanhA.Text, out int canhA) && int.TryParse(txtCanhB.Text, out int canhB) && int.TryParse(txtCanhC.Text, out int canhC))
            {
                TamGiac tamGiac = new TamGiac(canhA, canhB, canhC);
                double dienTich = tamGiac.TinhDienTich();
                MessageBox.Show($"Dien tich tam giac la: {dienTich}");
            }
            else
            {
                MessageBox.Show("Vui long nhap cac canh cua tam giac bang so nguyen duong!");
            }
        }

        private void btnClear_Click(object sender, EventArgs e)
        {
            txtCanhA.Text = "";
            txtCanhB.Text = "";
            txtCanhC.Text = "";
        }
    }
}
