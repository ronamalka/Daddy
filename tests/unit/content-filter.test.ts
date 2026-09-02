import { describe, it, expect } from "vitest";
import { scanMessage } from "../../services/chat/src/content-filter";

describe("content-filter", () => {
  // -----------------------------------------------------------------------
  // Phone numbers
  // -----------------------------------------------------------------------
  describe("phone numbers", () => {
    it("blocks a standard Israeli mobile number", () => {
      const result = scanMessage("תתקשר 0501234567");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("phone_number");
    });

    it("blocks a phone with dashes", () => {
      const result = scanMessage("050-123-4567");
      expect(result.blocked).toBe(true);
    });

    it("blocks a phone with spaces", () => {
      const result = scanMessage("050 123 4567");
      expect(result.blocked).toBe(true);
    });

    it("blocks a phone with dots", () => {
      const result = scanMessage("050.123.4567");
      expect(result.blocked).toBe(true);
    });

    it("blocks +972 format", () => {
      const result = scanMessage("תתקשר +972501234567");
      expect(result.blocked).toBe(true);
    });

    it("blocks 972 without plus", () => {
      const result = scanMessage("972-50-123-4567");
      expect(result.blocked).toBe(true);
    });

    it("does not block short numbers in normal conversation", () => {
      expect(scanMessage("אני מגיע ב-3").blocked).toBe(false);
      expect(scanMessage("קומה 5").blocked).toBe(false);
      expect(scanMessage("יש לי 3 חדרים").blocked).toBe(false);
      expect(scanMessage("המחיר 500 שקל").blocked).toBe(false);
    });

    it("does not block 4-digit numbers", () => {
      expect(scanMessage("קוד 1234").blocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Email addresses
  // -----------------------------------------------------------------------
  describe("email addresses", () => {
    it("blocks a standard email", () => {
      const result = scanMessage("שלח לי מייל ל test@example.com");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("email_address");
    });

    it("blocks an email with subdomain", () => {
      const result = scanMessage("user@mail.co.il");
      expect(result.blocked).toBe(true);
    });

    it("blocks an email with plus addressing", () => {
      const result = scanMessage("user+tag@gmail.com");
      expect(result.blocked).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Messenger apps
  // -----------------------------------------------------------------------
  describe("messenger app mentions", () => {
    it("blocks WhatsApp in English", () => {
      const result = scanMessage("send me on WhatsApp");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("messenger_app");
    });

    it("blocks וואצאפ in Hebrew", () => {
      expect(scanMessage("שלח לי בוואצאפ").blocked).toBe(true);
    });

    it("blocks ווטסאפ variant", () => {
      expect(scanMessage("דבר איתי בווטסאפ").blocked).toBe(true);
    });

    it("blocks telegram", () => {
      expect(scanMessage("יש לי טלגרם").blocked).toBe(true);
    });

    it("blocks signal", () => {
      expect(scanMessage("אני בסיגנל").blocked).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Payment apps
  // -----------------------------------------------------------------------
  describe("payment app mentions", () => {
    it("blocks bit in Hebrew", () => {
      const result = scanMessage("תשלם לי בביט");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("payment_app");
    });

    it("blocks bit in English with word boundary", () => {
      expect(scanMessage("pay me via bit").blocked).toBe(true);
    });

    it("blocks paybox", () => {
      expect(scanMessage("יש לי פייבוקס").blocked).toBe(true);
    });

    it("blocks paypal", () => {
      expect(scanMessage("שלח לי בפייפאל").blocked).toBe(true);
    });

    it("blocks pepper", () => {
      expect(scanMessage("תעביר לי בפפר").blocked).toBe(true);
    });

    it("does not block 'bit' inside other words", () => {
      // "a bit of work" should not trigger
      expect(scanMessage("I need a rabbit").blocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Contact phrases
  // -----------------------------------------------------------------------
  describe("contact phrases", () => {
    it("blocks המספר שלי", () => {
      const result = scanMessage("המספר שלי הוא...");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("contact_phrase");
    });

    it("blocks האימייל שלי", () => {
      expect(scanMessage("האימייל שלי הוא...").blocked).toBe(true);
    });

    it("blocks תתקשר אליי", () => {
      expect(scanMessage("תתקשר אליי מחר").blocked).toBe(true);
    });

    it("blocks בוא נדבר ב", () => {
      expect(scanMessage("בוא נדבר בווטסאפ").blocked).toBe(true);
    });

    it("blocks תשלח לי ב", () => {
      expect(scanMessage("תשלח לי בפרטי").blocked).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // External URLs
  // -----------------------------------------------------------------------
  describe("external URLs", () => {
    it("blocks http links", () => {
      const result = scanMessage("תסתכל ב http://example.com");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("external_url");
    });

    it("blocks https links", () => {
      expect(scanMessage("https://my-site.co.il/page").blocked).toBe(true);
    });

    it("allows aballeh.com links", () => {
      expect(scanMessage("https://aballeh.com/gig/123").blocked).toBe(false);
    });

    it("allows www.aballeh.com links", () => {
      expect(scanMessage("https://www.aballeh.com/profile").blocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Obfuscated digits
  // -----------------------------------------------------------------------
  describe("obfuscated digits", () => {
    it("blocks digits separated by spaces (7+)", () => {
      const result = scanMessage("0 5 0 1 2 3 4 5 6 7");
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.pattern).toBe("phone_number"); // stripped version hits phone first
    });

    it("blocks digits separated by dots forming long sequence", () => {
      // This should be caught by phone or obfuscated
      const result = scanMessage("the number is 1.2.3.4.5.6.7.8.9");
      expect(result.blocked).toBe(true);
    });

    it("does not block a few separated digits", () => {
      // "בניין 3, קומה 5" has digits but not 7+ in a row
      expect(scanMessage("בניין 3, קומה 5, דירה 12").blocked).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Hebrew digit words
  // -----------------------------------------------------------------------
  describe("Hebrew digit word obfuscation", () => {
    it("blocks a phone spelled with Hebrew digit words", () => {
      const result = scanMessage("אפס חמש אפס אחת שתיים שלוש ארבע חמש שש שבע");
      expect(result.blocked).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Normal messages that MUST pass through
  // -----------------------------------------------------------------------
  describe("normal messages (should pass)", () => {
    it("allows a greeting", () => {
      expect(scanMessage("שלום, מעוניין בשירות שלך").blocked).toBe(false);
    });

    it("allows a price discussion", () => {
      expect(scanMessage("המחיר 500 שקל, כולל חומרים").blocked).toBe(false);
    });

    it("allows an address description", () => {
      expect(scanMessage("אני בקומה 5, בניין ירוק").blocked).toBe(false);
    });

    it("allows a scheduling message", () => {
      expect(scanMessage("אני פנוי ביום שלישי ב-3 אחרי הצהריים").blocked).toBe(false);
    });

    it("allows a work description", () => {
      expect(
        scanMessage("צריך לתקן ברז במטבח ולהחליף 2 שקעים בסלון").blocked,
      ).toBe(false);
    });

    it("allows numbers in context", () => {
      expect(scanMessage("זה ייקח 3 ימים").blocked).toBe(false);
      expect(scanMessage("יש 4 חדרים בדירה").blocked).toBe(false);
    });

    it("allows empty content", () => {
      expect(scanMessage("").blocked).toBe(false);
    });

    it("allows an aballeh link in conversation", () => {
      expect(
        scanMessage("תסתכל על השירות שלי https://aballeh.com/gig/abc123").blocked,
      ).toBe(false);
    });
  });
});
