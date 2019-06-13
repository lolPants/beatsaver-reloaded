import mongoose, { Document, PaginateModel, Schema, Types } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import { BEATSAVER_EPOCH } from '../../constants'
import { IS_DEV, PORT } from '../../env'
import withoutKeys from '../plugins/withoutKeys'
import withVirtuals from '../plugins/withVirtuals'
import { IUserModel } from './User'

export interface IVoteLean {
  direction: -1 | 1
  voterUID: string
}

export interface IBeatmapLean {
  key: string
  name: string
  description: string

  uploader: IUserModel['_id']
  uploaded: Date
  deletedAt: Date | null

  metadata: {
    songName: string
    songSubName: string
    songAuthorName: string
    levelAuthorName: string

    bpm: number

    difficulties: {
      easy: boolean
      normal: boolean
      hard: boolean
      expert: boolean
      expertPlus: boolean
    }

    characteristics: string[]
  }

  stats: {
    downloads: number
    plays: number

    upVotes: number
    downVotes: number

    rating: number
    heat: number
  }

  votes: Types.DocumentArray<IVoteLean & Document>

  directDownload: string
  downloadURL: string
  coverURL: string
  coverExt: string

  hash: string
}

export type IBeatmapModel = IBeatmapLean & Document

const schema: Schema = new Schema({
  key: {
    get: (v: number) => v.toString(16),
    required: true,
    set: (v: string) => parseInt(v, 16),
    type: Number,
    unique: true,
  },

  description: { type: String, default: '', maxlength: 10000 },
  name: { type: String, required: true, index: true, maxlength: 255 },

  deletedAt: { type: Date, default: null, index: true },
  uploaded: { type: Date, default: Date.now, index: true },
  uploader: { type: Schema.Types.ObjectId, required: true, ref: 'user' },

  metadata: {
    levelAuthorName: {
      maxlength: 255,
      required: true,
      type: String,
    },
    songAuthorName: {
      maxlength: 255,
      required: true,
      type: String,
    },
    songName: { type: String, required: true, maxlength: 255 },
    songSubName: { type: String, maxlength: 255 },

    bpm: { type: Number, required: true },

    difficulties: {
      easy: { type: Boolean, required: true },
      expert: { type: Boolean, required: true },
      expertPlus: { type: Boolean, required: true },
      hard: { type: Boolean, required: true },
      normal: { type: Boolean, required: true },
    },

    characteristics: { type: [String], default: [] },
  },

  stats: {
    downloads: { type: Number, default: 0 },
    plays: { type: Number, default: 0 },
  },

  votes: [
    {
      direction: { type: Number, required: true, default: 1, min: -1, max: 1 },
      voterUID: { type: String, required: true, index: true },
    },
  ],

  coverExt: { type: String, required: true, maxlength: 5 },
  hash: { type: String, required: true, index: true, maxlength: 40 },
})

schema.virtual('stats.upVotes').get(function(this: IBeatmapModel) {
  return this.votes.filter(x => x.direction === 1).length
})

schema.virtual('stats.downVotes').get(function(this: IBeatmapModel) {
  return this.votes.filter(x => x.direction === -1).length
})

schema.virtual('stats.rating').get(function(this: IBeatmapModel) {
  const total = this.votes.length
  if (total === 0) return 0

  const upVotes = this.votes.filter(x => x.direction === 1).length
  const score = upVotes / total

  return score - (score - 0.5) * Math.pow(2, -Math.log10(total + 1))
})

schema.virtual('stats.heat').get(function(this: IBeatmapModel) {
  const epoch = new Date(Date.UTC(1970, 0, 1))
  const seconds =
    (this.uploaded.getTime() - epoch.getTime()) / 1000 - BEATSAVER_EPOCH

  const score = this.votes.reduce((acc, curr) => acc + curr.direction, 0)
  const absolute = Math.abs(score)
  const sign = score < 0 ? -1 : score > 0 ? 1 : 0

  const order = Math.log10(Math.max(absolute, 1))
  const heat = sign * order + seconds / 45000

  return parseFloat(heat.toFixed(7))
})

schema.virtual('directDownload').get(function(this: IBeatmapModel) {
  const absolute = `/cdn/${this.key}/${this.hash}.zip`
  return IS_DEV ? `http://localhost:${PORT}${absolute}` : absolute
})

schema.virtual('downloadURL').get(function(this: IBeatmapModel) {
  const absolute = `/download/key/${this.key}`
  return IS_DEV ? `http://localhost:${PORT}${absolute}` : `/api${absolute}`
})

schema.virtual('coverURL').get(function(this: IBeatmapModel) {
  const absolute = `/cdn/${this.key}/${this.hash}${this.coverExt}`
  return IS_DEV ? `http://localhost:${PORT}${absolute}` : absolute
})

schema.plugin(paginate)
schema.plugin(withoutKeys(['__v', 'votes', 'id', 'coverExt', 'directDownload']))
schema.plugin(withVirtuals)

schema.index(
  {
    'metadata.levelAuthorName': 'text',
    'metadata.songAuthorName': 'text',
    'metadata.songName': 'text',
    'metadata.songSubName': 'text',
    name: 'text',
  },
  {
    name: 'full_search',
    weights: {
      'metadata.levelAuthorName': 1,
      'metadata.songAuthorName': 1,
      'metadata.songName': 2,
      'metadata.songSubName': 2,
      name: 5,
    },
  }
)

const Beatmap = mongoose.model<IBeatmapModel>(
  'beatmap',
  schema
) as PaginateModel<IBeatmapModel>
export default Beatmap
