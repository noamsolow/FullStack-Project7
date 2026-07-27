import test from "node:test";
import assert from "node:assert/strict";
import { validateImage, validatePdf } from "../utils/files.js";

test("validates PDF magic bytes instead of trusting MIME alone", () => {
  const valid = {
    mimetype: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\n"),
  };
  assert.equal(validatePdf(valid), ".pdf");
  assert.throws(() => validatePdf({
    mimetype: "application/pdf",
    buffer: Buffer.from("not a pdf"),
  }));
});

test("validates supported image signatures", () => {
  assert.equal(validateImage({
    mimetype: "image/png",
    buffer: Buffer.from("89504e470d0a1a0a", "hex"),
  }), ".png");
  assert.throws(() => validateImage({
    mimetype: "image/png",
    buffer: Buffer.from("89504e47", "hex"),
  }));
});

