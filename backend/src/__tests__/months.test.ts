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

  describe("GET /api/properties/:propId/history", () => {
    it("raggruppa i dati storici per anno, calcola i totali esatti ed esclude l'anno in corso", async () => {
      // Calcoliamo l'anno corrente dinamicamente per non far rompere il test l'anno prossimo
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const twoYearsAgo = currentYear - 2;

      // --- 1. DATI ANNO PASSATO (Es. 2025) ---
      const m1 = await MonthRecord.create({
        propertyId,
        year: lastYear,
        month: 6,
        agencyNetIncome: 1000,
      });
      await Expense.create({ monthRecordId: m1.id, amount: 200 });

      const m2 = await MonthRecord.create({
        propertyId,
        year: lastYear,
        month: 8,
        agencyNetIncome: 2000,
      });
      await Expense.create({ monthRecordId: m2.id, amount: 500 });
      // Attese per lastYear: Income 3000, Expenses 700, Net 2300

      // --- 2. DATI DUE ANNI FA (Es. 2024) ---
      const m3 = await MonthRecord.create({
        propertyId,
        year: twoYearsAgo,
        month: 12,
        agencyNetIncome: 5000,
      });
      await Expense.create({ monthRecordId: m3.id, amount: 1000 });
      // Attese per twoYearsAgo: Income 5000, Expenses 1000, Net 4000

      // --- 3. DATI ANNO IN CORSO (YTD - Da ignorare) ---
      const mCurrent = await MonthRecord.create({
        propertyId,
        year: currentYear,
        month: 1,
        agencyNetIncome: 1500,
      });
      await Expense.create({ monthRecordId: mCurrent.id, amount: 100 });
      // Questo mese NON deve apparire nei risultati dell'API

      // --- ESECUZIONE E ASSERTS ---
      // (Assicurati che l'URL combaci con come hai montato la rotta in Express)
      const res = await request(app).get(
        `/api/properties/${propertyId}/history`,
      );

      expect(res.status).toBe(200);

      // Deve ritornare solo 2 record (il currentYear viene escluso)
      expect(res.body.data.length).toBe(2);

      // L'ordine deve essere decrescente: prima l'anno scorso (lastYear)
      const first = res.body.data[0];
      expect(first.year).toBe(lastYear);
      expect(first.totalIncome).toBe(3000);
      expect(first.totalExpenses).toBe(700);
      expect(first.netIncome).toBe(2300);

      // Poi due anni fa (twoYearsAgo)
      const second = res.body.data[1];
      expect(second.year).toBe(twoYearsAgo);
      expect(second.totalIncome).toBe(5000);
      expect(second.totalExpenses).toBe(1000);
      expect(second.netIncome).toBe(4000);
    });
  });
});
