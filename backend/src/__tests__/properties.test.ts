import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { Property, MonthRecord } from "../models/index.js";

describe("Properties API", () => {
  describe("CRUD Property", () => {
    it("crea una nuova proprietà", async () => {
      const res = await request(app).post("/api/properties").send({
        name: "Casa Mare",
        address: "Via Roma 1",
        startDate: "2024-05-01",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Casa Mare");
      expect(res.body.data.archived).toBe(false);
    });

    it("ottiene la lista di proprietà senza archiviate di default", async () => {
      await Property.create({ name: "P1", startDate: "2024-01-01" });
      await Property.create({
        name: "P2_Archived",
        startDate: "2024-01-01",
        archived: true,
      });

      const res = await request(app).get("/api/properties");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("P1");

      const resArch = await request(app).get("/api/properties?archived=true");
      expect(resArch.body.data.length).toBe(2);
    });

    it("ottiene singola, aggiorna ed elimina (cascade)", async () => {
      const prop = await Property.create({
        name: "Da Aggiornare",
        startDate: "2024-01-01",
      });
      await MonthRecord.create({
        propertyId: prop.id,
        year: 2024,
        month: 1,
        agencyNetIncome: 1000,
      });

      // GET
      const resGet = await request(app).get(`/api/properties/${prop.id}`);
      expect(resGet.status).toBe(200);
      expect(resGet.body.data.name).toBe("Da Aggiornare");

      // PUT
      const resPut = await request(app)
        .put(`/api/properties/${prop.id}`)
        .send({ name: "Case Nuove", startDate: "2024-01-01" });

      expect(resPut.status).toBe(200);
      expect(resPut.body.data.name).toBe("Case Nuove");

      // DELETE
      const resDel = await request(app).delete(`/api/properties/${prop.id}`);
      expect(resDel.status).toBe(200);

      const checkProp = await Property.findByPk(prop.id);
      expect(checkProp).toBeNull();

      // Verifica CASCADE (sqlite in-memory setta le foreign key action correttamente tramite gli option Sequelize)
      const checkMonth = await MonthRecord.findOne({
        where: { propertyId: prop.id },
      });
      expect(checkMonth).toBeNull();
    });
  });

  describe("Archive / Unarchive", () => {
    it("archivia e disarchivia una proprietà", async () => {
      const prop = await Property.create({
        name: "Zio",
        startDate: "2024-01-01",
      });

      // Archive
      const resArch = await request(app).patch(
        `/api/properties/${prop.id}/archive`,
      );
      expect(resArch.status).toBe(200);
      expect(resArch.body.data.archived).toBe(true);

      // Unarchive
      const resUnarch = await request(app).patch(
        `/api/properties/${prop.id}/unarchive`,
      );
      expect(resUnarch.status).toBe(200);
      expect(resUnarch.body.data.archived).toBe(false);
    });
  });
});
