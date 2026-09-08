using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldsToAdditionalCharge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BillableToCustomer",
                table: "AdditionalCharges",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "AdditionalCharges",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PayableToVendor",
                table: "AdditionalCharges",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BillableToCustomer",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "PayableToVendor",
                table: "AdditionalCharges");
        }
    }
}
