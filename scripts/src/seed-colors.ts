import { ensureSchema, seedDressToImpressColors } from "@workspace/db";

ensureSchema();
seedDressToImpressColors();

console.log("✓ Paleta Dress to Impress (glitch) aplicada correctamente.");
