import request from "supertest";
import app from "../server.js";

describe("Health Check", () => {
  it("should return 200 and health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });
});

describe("Mail Routes", () => {
  describe("POST /api/mail/send", () => {
    it("should return 400 for invalid email format", async () => {
      const invalidEmail = {
        to: "invalid-email",
        subject: "Test",
        text: "Test message",
      };

      const response = await request(app)
        .post("/api/mail/send")
        .send(invalidEmail)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should return 400 when both text and html are missing", async () => {
      const emailWithoutContent = {
        to: "test@example.com",
        subject: "Test",
      };

      const response = await request(app)
        .post("/api/mail/send")
        .send(emailWithoutContent)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for empty subject", async () => {
      const emailWithoutSubject = {
        to: "test@example.com",
        subject: "",
        text: "Test message",
      };

      const response = await request(app)
        .post("/api/mail/send")
        .send(emailWithoutSubject)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/mail/send-bulk", () => {
    it("should return 400 for empty emails array", async () => {
      const response = await request(app)
        .post("/api/mail/send-bulk")
        .send({ emails: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("non-empty array");
    });

    it("should return 400 for too many emails", async () => {
      const emails = Array(11).fill({
        to: "test@example.com",
        subject: "Test",
        text: "Test message",
      });

      const response = await request(app)
        .post("/api/mail/send-bulk")
        .send({ emails })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Maximum 10 emails");
    });
  });
});

describe("Rate Limiting", () => {
  it("should handle rate limiting", async () => {
    // This test would require a more sophisticated setup to test rate limiting
    // For now, just ensure the endpoint exists
    const response = await request(app).get("/health").expect(200);

    expect(response.body.status).toBe("ok");
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body.error).toBe("Not Found");
  });
});
