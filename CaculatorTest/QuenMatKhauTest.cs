using CalculatorApp;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CaculatorTest
{
    [TestClass]
    public class QuenMatKhauTest
    {
        [TestMethod]
        public void KiemTraThongTin_Should_Return_False_When_Phone_Is_Null_Or_Empty()
        {
            // Arrange
            string nullPhone = null;
            string emptyPhone = string.Empty;

            // Act
            bool nullResult = XL_QuenMatKhau.KiemTraThongTin(nullPhone);
            bool emptyResult = XL_QuenMatKhau.KiemTraThongTin(emptyPhone);

            // Assert
            Assert.IsFalse(nullResult);
            Assert.IsFalse(emptyResult);
        }

        [TestMethod]
        public void KiemTraThongTin_Should_Return_False_When_Phone_Is_Invalid()
        {
            // Arrange
            string invalidPhone1 = "1234567890";
            string invalidPhone2 = "01234567891";
            string invalidPhone3 = "098765432111";

            // Act
            bool result1 = XL_QuenMatKhau.KiemTraThongTin(invalidPhone1);
            bool result2 = XL_QuenMatKhau.KiemTraThongTin(invalidPhone2);
            bool result3 = XL_QuenMatKhau.KiemTraThongTin(invalidPhone3);

            // Assert
            Assert.IsFalse(result1);
            Assert.IsFalse(result2);
            Assert.IsFalse(result3);
        }

        [TestMethod]
        public void KiemTraThongTin_Should_Return_True_When_Phone_Is_Valid()
        {
            // Arrange
            string validPhone1 = "0857332962";

            // Act
            bool result1 = XL_QuenMatKhau.KiemTraThongTin(validPhone1);

            // Assert
            Assert.IsTrue(result1);
        }
        [TestMethod]
        public void KiemTraQuenMatKhau()
        {
            // Arrange
            string validPhone1 = "0857133292";

            // Act
            bool result1 = XL_QuenMatKhau.QuenMatKhau(validPhone1);

            // Assert
            Assert.IsTrue(result1);
        }
    }
}
