using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CalculatorApp
{
    public static class XL_QuenMatKhau
    {
        private static readonly string ConnectionString = "Data Source=DESKTOP-E532F7N;Initial Catalog=TEST;Integrated Security=True";
        private static readonly string SelectQuery = "SELECT password FROM [User] WHERE phone = @phone";
        public static bool TestConnection()
        {
            bool result = false;
            try
            {
                using (SqlConnection con = new SqlConnection(ConnectionString))
                {
                    con.Open();
                    result = true;
                }
            }
            catch (Exception)
            {
                MessageBox.Show("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
            return result;
        }
        public static bool KiemTraThongTin(string Phone)
        {
            // Kiểm tra các trường thông tin
            if (string.IsNullOrEmpty(Phone))
            {
                MessageBox.Show("Vui lòng nhập đầy đủ thông tin!");
                return false;
            }
            if (!Regex.IsMatch(Phone, @"^0\d{9}$"))
            {
                MessageBox.Show("Số điện thoại không hợp lệ!", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            return true;
        }

        public static bool QuenMatKhau(string Phone)
        {
            if (!KiemTraThongTin(Phone))
            {
                return false;
            }
            if(!TestConnection())
            {
                return false;
            }
            bool resulf = false;
            try
            {
                using (SqlConnection con = new SqlConnection(ConnectionString))
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand(SelectQuery, con))
                    {
                        cmd.Parameters.AddWithValue("@phone", Phone);
                        using (SqlDataReader dr = cmd.ExecuteReader())
                        {
                            if (dr.HasRows)
                            {
                                dr.Read();
                                string password = dr.GetString(0);
                                MessageBox.Show("Mật khẩu tìm được là: " + password, "Tìm Thành Công! Ok để Copy Mật Khẩu" , MessageBoxButtons.OK, MessageBoxIcon.Information, MessageBoxDefaultButton.Button1);
                                Clipboard.SetText(password);
                                return true;
                            }
                            else
                            {
                                MessageBox.Show("Số điện thoại không tồn tại hoặc chưa được đăng ký!", "Lỗi!", MessageBoxButtons.OK, MessageBoxIcon.Error, MessageBoxDefaultButton.Button1);
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                TestConnection();
            }
            return resulf;
        }

    }
}
