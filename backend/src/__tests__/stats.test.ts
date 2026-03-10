import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import {
  Property,
  MonthRecord,
  Expense,
  ExpenseCategory,
} from "../models/index.js";

describe("Stats API", () => {
  let propertyId: string;

  beforeEach(async () => {
    // Seed initial property
    const prop = await Property.create({
      name: "Villa Serena",
      startDate: "2024-01-01",
    });
    propertyId = prop.id;
  });

  it("calcola stats a 0 mesi", async () => {
    const res = await request(app).get(`/api/properties/${propertyId}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data.allTimeAvg).toBe(0);
    expect(res.body.data.bestMonth).toBeNull();
    expect(res.body.data.worstMonth).toBeNull();
  });

  it("calcola media con 1 mese", async () => {
    const month = await MonthRecord.create({
      propertyId,
      year: 2024,
      month: 1,
      agencyNetIncome: 1000,
    });
    await Expense.create({
      monthRecordId: month.id,
      amount: 200,
    });

    const res = await request(app).get(`/api/properties/${propertyId}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.data.allTimeAvg).toBe(800);
    expect(res.body.data.bestMonth.amount).toBe(800);
  });

  it("calcola stats con N mesi e verifica avgDeviation", async () => {
    // Setup categories
    const catCondominio = await ExpenseCategory.create({
      propertyId,
      name: "Condominio",
    });
    const catManutenzione = await ExpenseCategory.create({
      propertyId,
      name: "Manutenzione",
    });

    // Mese 1: 1000 - 200 = 800 netti
    const m1 = await MonthRecord.create({
      propertyId,
      year: 2024,
      month: 1,
      agencyNetIncome: 1000,
    });
    await Expense.create({
      monthRecordId: m1.id,
      categoryId: catCondominio.id,
      amount: 200,
    });

    // Mese 2: 1200 - 300 = 900 netti
    const m2 = await MonthRecord.create({
      propertyId,
      year: 2024,
      month: 2,
      agencyNetIncome: 1200,
    });
    await Expense.create({
      monthRecordId: m2.id,
      categoryId: catManutenzione.id,
      amount: 300,
    });

    // Mese 3: 500 - 600 = -100 netti
    const m3 = await MonthRecord.create({
      propertyId,
      year: 2024,
      month: 3,
      agencyNetIncome: 500,
    });
    await Expense.create({
      monthRecordId: m3.id,
      categoryId: catManutenzione.id,
      amount: 600,
    });

    const res = await request(app).get(`/api/properties/${propertyId}/stats`);
    expect(res.status).toBe(200);

    const stats = res.body.data;
    // Total Net: 800 + 900 - 100 = 1600. Avg: 1600 / 3 = 533.33
    expect(stats.allTimeAvg).toBeCloseTo(533.33, 1);

    // Best: Mese 2 (900), Worst: Mese 3 (-100)
    expect(stats.bestMonth.year).toBe(2024);
    expect(stats.bestMonth.month).toBe(2);
    expect(stats.bestMonth.amount).toBe(900);

    expect(stats.worstMonth.month).toBe(3);
    expect(stats.worstMonth.amount).toBe(-100);

    // Categories
    // Condominio: 200 (200 / 1100 = 18.18%)
    // Manutenzione: 900 (900 / 1100 = 81.81%)
    expect(stats.expensesByCategory.length).toBe(2);
    const catManStats = stats.expensesByCategory.find(
      (c: any) => c.categoryName === "Manutenzione",
    );
    expect(catManStats.total).toBe(900);
    expect(catManStats.percentage).toBeCloseTo(81.81, 1);
  });
});
