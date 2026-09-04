using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorIdToDriver : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VendorId",
                table: "Drivers",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_VendorId",
                table: "Drivers",
                column: "VendorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Drivers_Vendors_VendorId",
                table: "Drivers",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Drivers_Vendors_VendorId",
                table: "Drivers");

            migrationBuilder.DropIndex(
                name: "IX_Drivers_VendorId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "Drivers");
        }
    }
}
