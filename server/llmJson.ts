import { invokeLLM, type JsonSchema } from "./_core/llm";

/** Strukturált (JSON-sémás) választ kér az LLM-től, és visszaadja a feldolgozott objektumot. */
export async function kerdezJson<T>(rendszer: string, felhasznalo: string, sema: JsonSchema): Promise<T> {
  const valasz = await invokeLLM({
    messages: [
      { role: "system", content: rendszer },
      { role: "user", content: felhasznalo },
    ],
    responseFormat: { type: "json_schema", json_schema: sema },
  });

  const tartalom = valasz.choices[0]?.message.content;
  const szoveg =
    typeof tartalom === "string"
      ? tartalom
      : (tartalom ?? []).map(p => (p.type === "text" ? p.text : "")).join("");

  return JSON.parse(szoveg) as T;
}

export function datumSzoveg(d: Date): string {
  const ev = d.getFullYear();
  const ho = String(d.getMonth() + 1).padStart(2, "0");
  const nap = String(d.getDate()).padStart(2, "0");
  return `${ev}-${ho}-${nap}`;
}
