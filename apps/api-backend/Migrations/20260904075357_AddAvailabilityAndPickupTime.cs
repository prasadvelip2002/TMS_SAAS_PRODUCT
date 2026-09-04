using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilityAndPickupTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trips_Vendors_VendorId",
                table: "Trips");

            migrationBuilder.AddColumn<DateTime>(
                name: "AvailableDate",
                table: "VendorQuotations",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvailableTime",
                table: "VendorQuotations",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "VendorId",
                table: "Trips",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "LoadingTime",
                table: "Indents",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Trips_Vendors_VendorId",
                table: "Trips",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trips_Vendors_VendorId",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "AvailableDate",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "AvailableTime",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "LoadingTime",
                table: "Indents");

            migrationBuilder.AlterColumn<int>(
                name: "VendorId",
                table: "Trips",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Trips_Vendors_VendorId",
                table: "Trips",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
