using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesAndProcurementModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SalesQuotations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IndentId = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    WinningVendorQuotationId = table.Column<int>(type: "integer", nullable: true),
                    BaseRate = table.Column<decimal>(type: "numeric", nullable: false),
                    Margin = table.Column<decimal>(type: "numeric", nullable: false),
                    SellingPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesQuotations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalesQuotations_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalesQuotations_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalesQuotations_Indents_IndentId",
                        column: x => x.IndentId,
                        principalTable: "Indents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalesQuotations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalesQuotations_VendorQuotations_WinningVendorQuotationId",
                        column: x => x.WinningVendorQuotationId,
                        principalTable: "VendorQuotations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CustomerPurchaseOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    IndentId = table.Column<int>(type: "integer", nullable: true),
                    SalesQuotationId = table.Column<int>(type: "integer", nullable: true),
                    PONumber = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPurchaseOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerPurchaseOrders_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerPurchaseOrders_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerPurchaseOrders_Indents_IndentId",
                        column: x => x.IndentId,
                        principalTable: "Indents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CustomerPurchaseOrders_SalesQuotations_SalesQuotationId",
                        column: x => x.SalesQuotationId,
                        principalTable: "SalesQuotations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CustomerPurchaseOrders_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPurchaseOrders_CompanyId",
                table: "CustomerPurchaseOrders",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPurchaseOrders_CustomerId",
                table: "CustomerPurchaseOrders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPurchaseOrders_IndentId",
                table: "CustomerPurchaseOrders",
                column: "IndentId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPurchaseOrders_SalesQuotationId",
                table: "CustomerPurchaseOrders",
                column: "SalesQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPurchaseOrders_TenantId",
                table: "CustomerPurchaseOrders",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesQuotations_CompanyId",
                table: "SalesQuotations",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesQuotations_CustomerId",
                table: "SalesQuotations",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesQuotations_IndentId",
                table: "SalesQuotations",
                column: "IndentId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesQuotations_TenantId",
                table: "SalesQuotations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesQuotations_WinningVendorQuotationId",
                table: "SalesQuotations",
                column: "WinningVendorQuotationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerPurchaseOrders");

            migrationBuilder.DropTable(
                name: "SalesQuotations");
        }
    }
}
