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
    public partial class frmApp1 : Form
    {
        public frmApp1()
        {
            InitializeComponent();
        }

        private void Calculate(Action<int, int> operation)
        {
            string so1 = txtSo1.Text.Trim();
            string so2 = txtSo2.Text.Trim();

            if (!int.TryParse(so1, out int a))
            {
                MessageBox.Show("Số thứ nhất không hợp lệ!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (!int.TryParse(so2, out int b))
            {
                MessageBox.Show("Số thứ hai không hợp lệ!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            

            operation(a, b);
        }

        private void button1_Click(object sender, EventArgs e)
        {
            Calculate((a, b) =>
            {
                int Ketqua = Caculator.Add(a, b);
                txtKq.Text = Ketqua.ToString();
            });
        }

        private void button2_Click(object sender, EventArgs e)
        {
            Calculate((a, b) =>
            {
                int Ketqua = Caculator.Sub(a, b);
                txtKq.Text = Ketqua.ToString();
            });
        }

        private void button3_Click(object sender, EventArgs e)
        {
            Calculate((a, b) =>
            {
                int Ketqua = Caculator.Mul(a, b);
                txtKq.Text = Ketqua.ToString();
            });
        }

        private void button4_Click(object sender, EventArgs e)
        {
            Calculate((a, b) =>
            {
                int Ketqua = Caculator.Div(a, b);
                txtKq.Text = Ketqua.ToString();
            });
        }

        private void frmApp1_FormClosing(object sender, FormClosingEventArgs e)
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
            txtKq.Text = "";
            txtSo1.Text = "";
            txtSo2.Text = "";
            
        }
    }

}
