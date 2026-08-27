using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class MultiCompanySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "WhatsAppLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "WhatsAppLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "WhatsAppLogs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "WhatsAppLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "WhatsAppLogs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "WhatsAppLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Vendors",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Vendors",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Vendors",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Vendors",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "VendorQuotations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "VendorQuotations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "VendorQuotations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "VendorQuotations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "VendorQuotations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Vehicles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Vehicles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Vehicles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Vehicles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Trips",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Trips",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Trips",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Trips",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Trips",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "TripEvents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "TripEvents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TripEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "TripEvents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "TripEvents",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SupplierQuotations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "SupplierQuotations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "SupplierQuotations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SupplierQuotations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "SupplierQuotations",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "PurchaseOrders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "PurchaseOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "PurchaseOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PurchaseOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "PurchaseOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Payments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Invoices",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Invoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Indents",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Indents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Indents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Indents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Indents",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "GRPOs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "GRPOs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "GRPOs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "GRPOs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "GRPOs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Drivers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Drivers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Drivers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Drivers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Drivers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Documents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Customers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Customers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Customers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "CustomerRateContracts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "CustomerRateContracts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CustomerRateContracts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CustomerRateContracts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "CustomerRateContracts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Branches",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Branches",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Branches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Branches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "Branches",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "AdditionalCharges",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "AdditionalCharges",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "AdditionalCharges",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "AdditionalCharges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                table: "AdditionalCharges",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    GSTIN = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Companies_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WhatsAppLogs_CompanyId",
                table: "WhatsAppLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_CompanyId",
                table: "Vendors",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotations_CompanyId",
                table: "VendorQuotations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CompanyId",
                table: "Users",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Trips_CompanyId",
                table: "Trips",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_TripEvents_CompanyId",
                table: "TripEvents",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierQuotations_CompanyId",
                table: "SupplierQuotations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CompanyId",
                table: "Payments",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CompanyId",
                table: "Notifications",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CompanyId",
                table: "Invoices",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Indents_CompanyId",
                table: "Indents",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_GRPOs_CompanyId",
                table: "GRPOs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_CompanyId",
                table: "Drivers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CompanyId",
                table: "Documents",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_CompanyId",
                table: "Customers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRateContracts_CompanyId",
                table: "CustomerRateContracts",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_CompanyId",
                table: "Branches",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalCharges_CompanyId",
                table: "AdditionalCharges",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_TenantId",
                table: "Companies",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalCharges_Companies_CompanyId",
                table: "AdditionalCharges",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_Companies_CompanyId",
                table: "Branches",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerRateContracts_Companies_CompanyId",
                table: "CustomerRateContracts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Companies_CompanyId",
                table: "Documents",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Drivers_Companies_CompanyId",
                table: "Drivers",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GRPOs_Companies_CompanyId",
                table: "GRPOs",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Indents_Companies_CompanyId",
                table: "Indents",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Companies_CompanyId",
                table: "Notifications",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SupplierQuotations_Companies_CompanyId",
                table: "SupplierQuotations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TripEvents_Companies_CompanyId",
                table: "TripEvents",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Trips_Companies_CompanyId",
                table: "Trips",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Companies_CompanyId",
                table: "Users",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Companies_CompanyId",
                table: "Vehicles",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorQuotations_Companies_CompanyId",
                table: "VendorQuotations",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vendors_Companies_CompanyId",
                table: "Vendors",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WhatsAppLogs_Companies_CompanyId",
                table: "WhatsAppLogs",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalCharges_Companies_CompanyId",
                table: "AdditionalCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_Branches_Companies_CompanyId",
                table: "Branches");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomerRateContracts_Companies_CompanyId",
                table: "CustomerRateContracts");

            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Companies_CompanyId",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Companies_CompanyId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Drivers_Companies_CompanyId",
                table: "Drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_GRPOs_Companies_CompanyId",
                table: "GRPOs");

            migrationBuilder.DropForeignKey(
                name: "FK_Indents_Companies_CompanyId",
                table: "Indents");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Companies_CompanyId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Companies_CompanyId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_SupplierQuotations_Companies_CompanyId",
                table: "SupplierQuotations");

            migrationBuilder.DropForeignKey(
                name: "FK_TripEvents_Companies_CompanyId",
                table: "TripEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Trips_Companies_CompanyId",
                table: "Trips");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Companies_CompanyId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Companies_CompanyId",
                table: "Vehicles");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorQuotations_Companies_CompanyId",
                table: "VendorQuotations");

            migrationBuilder.DropForeignKey(
                name: "FK_Vendors_Companies_CompanyId",
                table: "Vendors");

            migrationBuilder.DropForeignKey(
                name: "FK_WhatsAppLogs_Companies_CompanyId",
                table: "WhatsAppLogs");

            migrationBuilder.DropTable(
                name: "Companies");

            migrationBuilder.DropIndex(
                name: "IX_WhatsAppLogs_CompanyId",
                table: "WhatsAppLogs");

            migrationBuilder.DropIndex(
                name: "IX_Vendors_CompanyId",
                table: "Vendors");

            migrationBuilder.DropIndex(
                name: "IX_VendorQuotations_CompanyId",
                table: "VendorQuotations");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Users_CompanyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Trips_CompanyId",
                table: "Trips");

            migrationBuilder.DropIndex(
                name: "IX_TripEvents_CompanyId",
                table: "TripEvents");

            migrationBuilder.DropIndex(
                name: "IX_SupplierQuotations_CompanyId",
                table: "SupplierQuotations");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_Payments_CompanyId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_CompanyId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CompanyId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Indents_CompanyId",
                table: "Indents");

            migrationBuilder.DropIndex(
                name: "IX_GRPOs_CompanyId",
                table: "GRPOs");

            migrationBuilder.DropIndex(
                name: "IX_Drivers_CompanyId",
                table: "Drivers");

            migrationBuilder.DropIndex(
                name: "IX_Documents_CompanyId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Customers_CompanyId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_CustomerRateContracts_CompanyId",
                table: "CustomerRateContracts");

            migrationBuilder.DropIndex(
                name: "IX_Branches_CompanyId",
                table: "Branches");

            migrationBuilder.DropIndex(
                name: "IX_AdditionalCharges_CompanyId",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "WhatsAppLogs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "WhatsAppLogs");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "WhatsAppLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "WhatsAppLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "WhatsAppLogs");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "VendorQuotations");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "TripEvents");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "TripEvents");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TripEvents");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "TripEvents");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "TripEvents");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "SupplierQuotations");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SupplierQuotations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SupplierQuotations");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "SupplierQuotations");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "GRPOs");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "GRPOs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "GRPOs");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "GRPOs");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "CustomerRateContracts");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "CustomerRateContracts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CustomerRateContracts");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CustomerRateContracts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "CustomerRateContracts");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AdditionalCharges");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "AdditionalCharges");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "WhatsAppLogs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "VendorQuotations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Trips",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "SupplierQuotations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "PurchaseOrders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Invoices",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Indents",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "GRPOs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "AdditionalCharges",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
