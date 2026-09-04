using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class SplitVendorBankDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BankDetails",
                table: "Vendors",
                newName: "BankName");

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Vendors",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankIFSC",
                table: "Vendors",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "BankIFSC",
                table: "Vendors");

            migrationBuilder.RenameColumn(
                name: "BankName",
                table: "Vendors",
                newName: "BankDetails");
        }
    }
}
