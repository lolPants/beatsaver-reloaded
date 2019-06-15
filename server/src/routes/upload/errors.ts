import CodedError from '../../utils/CodedError'

export const ERR_NO_BEATMAP = new CodedError(
  'no beatmap uploaded',
  0x30001,
  'ERR_NO_BEATMAP',
  400
)

export const ERR_UNKNOWN_BEATMAP = new CodedError(
  'beatmap file type is unknown',
  0x30002,
  'ERR_UNKNOWN_BEATMAP',
  400
)

export const ERR_BEATMAP_NOT_ZIP = new CodedError(
  'beatmap is not a zip',
  0x30003,
  'ERR_BEATMAP_NOT_ZIP',
  400
)

export const ERR_DUPLICATE_BEATMAP = new CodedError(
  'beatmap hash already exists',
  0x30004,
  'ERR_DUPLICATE_BEATMAP',
  409
)

export const ERR_BEATMAP_SAVE_FAILURE = new CodedError(
  'beatmap failed to save',
  0x30005,
  'ERR_BEATMAP_SAVE_FAILURE',
  500
)

export const ERR_BEATMAP_INFO_NOT_FOUND = new CodedError(
  'info.dat not found',
  0x30006,
  'ERR_BEATMAP_INFO_NOT_FOUND',
  400
)

export const ERR_BEATMAP_INFO_INVALID = new CodedError(
  'invalid info.dat',
  0x30007,
  'ERR_BEATMAP_INFO_INVALID',
  400
)

export const ERR_BEATMAP_DIFF_NOT_FOUND = (filename: string) =>
  new CodedError(
    `${filename} not found`,
    0x30008,
    'ERR_BEATMAP_DIFF_NOT_FOUND',
    400
  )

export const ERR_BEATMAP_COVER_NOT_FOUND = (filename: string) =>
  new CodedError(
    `${filename} not found`,
    0x30009,
    'ERR_BEATMAP_COVER_NOT_FOUND',
    400
  )

export const ERR_BEATMAP_COVER_INVALID = new CodedError(
  'beatmap cover image invalid',
  0x3000a,
  'ERR_BEATMAP_COVER_INVALID',
  400
)

export const ERR_BEATMAP_COVER_NOT_SQUARE = new CodedError(
  'beatmap cover image not a square',
  0x3000b,
  'ERR_BEATMAP_COVER_NOT_SQUARE',
  400
)

export const ERR_BEATMAP_COVER_TOO_SMOL = new CodedError(
  'beatmap cover image is too smol',
  0x3000c,
  'ERR_BEATMAP_COVER_TOO_SMOL',
  400
)

export const ERR_BEATMAP_AUDIO_NOT_FOUND = (filename: string) =>
  new CodedError(
    `${filename} not found`,
    0x3000d,
    'ERR_BEATMAP_AUDIO_NOT_FOUND',
    400
  )

export const ERR_BEATMAP_AUDIO_INVALID = new CodedError(
  'beatmap audio file invalid',
  0x3000e,
  'ERR_BEATMAP_AUDIO_INVALID',
  400
)
