import { describe, expect, it } from "vitest";
import { contactInitials, contactPhotoUrl } from "@/modules/contacts/contact-photo";

describe("existing WhatsApp contact photos", () => {
  it("uses the contact photo URL already provided", () => {
    expect(contactPhotoUrl("https://example.com/ana.jpg")).toBe("https://example.com/ana.jpg");
  });
  it("resolves backend-relative photos", () => {
    expect(contactPhotoUrl("/public/company2/ana.jpg")).toBe("https://api.notasflex.com.br/public/company2/ana.jpg");
  });
  it("does not invent a photo when none is available", () => {
    expect(contactPhotoUrl(null)).toBeUndefined();
    expect(contactPhotoUrl(" ")).toBeUndefined();
  });
  it("rejects non-image URL schemes", () => {
    expect(contactPhotoUrl("javascript:alert(1)")).toBeUndefined();
  });
  it("uses initials when a contact has no photo", () => {
    expect(contactInitials("JL casa decor" )).toBe("JD");
    expect(contactInitials("Thiago")).toBe("T");
    expect(contactInitials(" ")).toBe("#");
  });
});