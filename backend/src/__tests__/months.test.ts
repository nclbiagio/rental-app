import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import {
  Property,
  ExpenseCategory,
  MonthRecord,
  Expense,
} from "../models/index.js";

describe("Months & Expenses API", () => {
  let propertyId: string;
  let categoryId1: string;

  beforeEach(async () => {
    const prop = await Property.create({
      name: "Appartamento X",
      startDate: "2024-01-01",
    });
    propertyId = prop.id;

    const cat = await ExpenseCategory.create({
      propertyId,
      name: "Luce",
      isRecurring: true,
      recurringAmount: 50,
    });
    categoryId1 = cat.id;
  });

  describe("POST /api/properties/:propId/months", () => {
    it("crea un mese e auto-genera spese ricorrenti", async () => {
      const res = await request(app)
        .post(`/api/properties/${propertyId}/months`)
        .send({
          year: 2024,
          month: 1,
          agencyNetIncome: 1200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.year).toBe(2024);
      expect(res.body.data.Expenses.length).toBe(1);
      expect(Number(res.body.data.Expenses[0].amount)).toBe(50); // from db sum cast
      expect(res.body.data.Expenses[0].categoryId).toBe(categoryId1);
    });

    it("ritorna 409 duplicato se il mese esiste", async () => {
      await MonthRecord.create({
        propertyId,
        year: 2024,
        month: 1,
        agencyNetIncome: 1000,
      });

      const res = await request(app)
        .post(`/api/properties/${propertyId}/months`)
        .send({
          year: 2024,
          month: 1,
          agencyNetIncome: 1200,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE_MONTH");
    });
  });

  describe("GET /api/properties/:propId/months", () => {
    it("ritorna i mesi col calcolo corretto di netResult e deviazione media", async () => {
      // Create 2 months
      const m1 = await MonthRecord.create({
        propertyId,
        year: 2024,
        month: 1,
        agencyNetIncome: 1000,
      });
      await Expense.create({ monthRecordId: m1.id, amount: 200 }); // Net 800

      const m2 = await MonthRecord.create({
        propertyId,
        year: 2024,
        month: 2,
        agencyNetIncome: 1500,
      });
      await Expense.create({ monthRecordId: m2.id, amount: 300 }); // Net 1200

      // Media storica entrate = (1000 + 1500) / 2 = 1250

      const res = await request(app).get(
        `/api/properties/${propertyId}/months`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);

      // Order is DESC: m2 first
      const first = res.body.data[0];
      expect(first.year).toBe(2024);
      expect(first.month).toBe(2);
      expect(first.netResult).toBe(1200); // 1500 - 300
      expect(first.avgDeviation).toBe(250); // 1500 - 1250

      const second = res.body.data[1];
      expect(second.netResult).toBe(800);
      expect(second.avgDeviation).toBe(-250); // 1000 - 1250
    });
  });

  describe("PUT /api/properties/:propId/months/:id", () => {
    it("aggiorna i dati base di un mese", async () => {
      const month = await MonthRecord.create({
        propertyId,
        year: 2024,
        month: 1,
        agencyNetIncome: 1000,
      });

      const res = await request(app)
        .put(`/api/properties/${propertyId}/months/${month.id}`)
        .send({ agencyNetIncome: 1300, notes: "Mese OK" });

      expect(res.status).toBe(200);
      expect(res.body.data.agencyNetIncome).toBe(1300);
      expect(res.body.data.notes).toBe("Mese OK");
    });
  });
});
