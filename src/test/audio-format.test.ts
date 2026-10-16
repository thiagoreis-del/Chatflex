import { describe, expect, it } from "vitest";
import { audioExtension, isAudioMedia, isDangerousFile, pickAudioMime } from "@/modules/tickets/audio-format";

describe("audio format", () => {
  it("prefers OGG/Opus when supported", () => {
    expect(pickAudioMime(() => true)).toBe("audio/ogg;codecs=opus");
  });
  it("falls back to webm opus, then mp4", () => {
    expect(pickAudioMime((m) => m !== "audio/ogg;codecs=opus")).toBe("audio/webm;codecs=opus");
    expect(pickAudioMime((m) => m === "audio/mp4")).toBe("audio/mp4");
    expect(pickAudioMime(() => false)).toBeNull();
  });
  it("maps extensions", () => {
    expect(audioExtension("audio/ogg;codecs=opus")).toBe("ogg");
    expect(audioExtension("audio/mp4")).toBe("m4a");
    expect(audioExtension("audio/webm;codecs=opus")).toBe("webm");
  });
  it("recognizes audio media types", () => {
    expect(isAudioMedia("audio/ogg")).toBe(true);
    expect(isAudioMedia("audio")).toBe(true);
    expect(isAudioMedia("image")).toBe(false);
  });
  it("rejects dangerous files", () => {
    expect(isDangerousFile("virus.exe")).toBe(true);
    expect(isDangerousFile("nota.pdf")).toBe(false);
  });
});
