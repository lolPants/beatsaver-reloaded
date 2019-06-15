import { createHash } from 'crypto'
import fileType from 'file-type'
import imageSize from 'image-size'
import JSZip from 'jszip'
import { parse } from 'path'
import { validJSON } from '../../utils/json'

import {
  ERR_BEATMAP_AUDIO_INVALID,
  ERR_BEATMAP_AUDIO_NOT_FOUND,
  ERR_BEATMAP_COVER_INVALID,
  ERR_BEATMAP_COVER_NOT_FOUND,
  ERR_BEATMAP_COVER_NOT_SQUARE,
  ERR_BEATMAP_COVER_TOO_SMOL,
  ERR_BEATMAP_DIFF_NOT_FOUND,
  ERR_BEATMAP_INFO_INVALID,
  ERR_BEATMAP_INFO_NOT_FOUND,
} from './errors'

export const parseBeatmap: (
  zipBuf: Buffer
) => Promise<{
  parsed: IParsedBeatmap
  cover: Buffer
  zip: Buffer
}> = async zipBuf => {
  const zip = new JSZip()
  await zip.loadAsync(zipBuf)

  const info = zip.file('info.dat')
  if (info === null) throw ERR_BEATMAP_INFO_NOT_FOUND

  let infoDAT = await info.async('text')
  if (!validJSON(infoDAT)) throw ERR_BEATMAP_INFO_INVALID
  const infoJSON: IBeatmapInfo = JSON.parse(infoDAT)

  const coverEntry = zip.file(infoJSON._coverImageFilename)
  if (coverEntry === null) {
    throw ERR_BEATMAP_COVER_NOT_FOUND(infoJSON._coverImageFilename)
  }

  const cover = await coverEntry.async('nodebuffer')
  const coverType = fileType(cover)
  if (
    coverType === undefined ||
    (coverType.mime !== 'image/png' && coverType.mime !== 'image/jpeg')
  ) {
    throw ERR_BEATMAP_COVER_INVALID
  }

  const size = imageSize(cover)
  if (size.width !== size.height) throw ERR_BEATMAP_COVER_NOT_SQUARE
  if (size.width < 256 || size.height < 256) throw ERR_BEATMAP_COVER_TOO_SMOL

  const audioEntry = zip.file(infoJSON._songFilename)
  if (audioEntry === null) {
    throw ERR_BEATMAP_AUDIO_NOT_FOUND(infoJSON._songFilename)
  }

  const audio = await audioEntry.async('nodebuffer')
  const audioType = fileType(audio)
  if (
    audioType === undefined ||
    (audioType.mime !== 'audio/ogg' && audioType.mime !== 'audio/wav')
  ) {
    throw ERR_BEATMAP_AUDIO_INVALID
  }

  const { name, ext } = parse(infoJSON._songFilename)
  if (ext === '.ogg') {
    const eggName = `${name}.egg`

    zip.remove(infoJSON._songFilename)
    zip.file(eggName, audio)

    infoJSON._songFilename = `${name}.egg`
    infoDAT = `${JSON.stringify(infoJSON, null, 2)}\n`

    zip.remove('info.dat')
    zip.file('info.dat', infoDAT)
  }

  const difficulties = ([] as IDifficultyBeatmap[]).concat(
    ...infoJSON._difficultyBeatmapSets.map(x => x._difficultyBeatmaps)
  )

  for (const diff of difficulties) {
    const diffEntry = zip.file(diff._beatmapFilename)
    if (diffEntry === null) {
      throw ERR_BEATMAP_DIFF_NOT_FOUND(diff._beatmapFilename)
    }
  }

  const diffBuffers = await Promise.all(
    difficulties.map(x => zip.file(x._beatmapFilename).async('nodebuffer'))
  )

  const hash = createHash('sha1')
  hash.update(infoDAT)
  for (const b of diffBuffers) {
    hash.update(b)
  }

  const sha1 = hash.digest('hex')
  const parsed: IParsedBeatmap = {
    hash: sha1,

    metadata: {
      levelAuthorName: infoJSON._levelAuthorName,
      songAuthorName: infoJSON._songAuthorName,
      songName: infoJSON._songName,
      songSubName: infoJSON._songSubName,

      bpm: infoJSON._beatsPerMinute,

      difficulties: {
        easy: difficulties.some(x => x._difficultyRank === 1),
        expert: difficulties.some(x => x._difficultyRank === 7),
        expertPlus: difficulties.some(x => x._difficultyRank === 9),
        hard: difficulties.some(x => x._difficultyRank === 5),
        normal: difficulties.some(x => x._difficultyRank === 3),
      },

      characteristics: infoJSON._difficultyBeatmapSets.map(
        x => x._beatmapCharacteristicName
      ),
    },

    coverExt: `.${coverType.ext}`,
  }

  const newZip = await zip.generateAsync({ type: 'nodebuffer' })
  return { parsed, cover, zip: newZip }
}
