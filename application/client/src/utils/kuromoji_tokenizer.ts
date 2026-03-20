import type { Tokenizer, IpadicFeatures } from "kuromoji";

let cachedTokenizer: Tokenizer<IpadicFeatures> | null = null;

export const getTokenizer = async (): Promise<Tokenizer<IpadicFeatures>> => {
  if (cachedTokenizer) {
    return cachedTokenizer;
  }

  const kuromoji = await import("kuromoji");

  const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>(
    (resolve, reject) => {
      kuromoji.builder({ dicPath: "/dicts" }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    },
  );

  cachedTokenizer = tokenizer;
  return tokenizer;
};
