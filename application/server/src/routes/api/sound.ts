import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertSoundToMp3 } from "@web-speed-hackathon-2026/server/src/utils/convert_sound";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || (!type.mime.startsWith("audio/") && type.ext !== EXTENSION)) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  // まずメタデータを抽出（変換前のファイルから）
  const { artist, title } = await extractMetadataFromSound(req.body);

  // MP3 以外の音声ならサーバー側で MP3 に変換
  const mp3Buffer = type.ext === EXTENSION ? req.body : await convertSoundToMp3(req.body, { artist, title });

  const soundId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, mp3Buffer);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
