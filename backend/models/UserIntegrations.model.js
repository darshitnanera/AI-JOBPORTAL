import mongoose from "mongoose";

const userIntegrationsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  github: {
    connected: {
      type: Boolean,
      default: false
    },
    username: {
      type: String,
      default: ""
    },
    accessToken: {
      type: String,
      default: ""
    },
    lastSync: {
      type: Date,
      default: null
    },
    data: {
      languages: [{
        name: String,
        percentage: Number,
        color: String
      }],
      topRepos: [{
        name: String,
        url: String,
        description: String,
        stars: Number,
        language: String
      }],
      commits: {
        total: {
          type: Number,
          default: 0
        },
        last30Days: {
          type: Number,
          default: 0
        }
      },
      followers: {
        type: Number,
        default: 0
      },
      following: {
        type: Number,
        default: 0
      },
      publicRepos: {
        type: Number,
        default: 0
      },
      profileUrl: String,
      avatar: String
    }
  },
  leetcode: {
    connected: {
      type: Boolean,
      default: false
    },
    username: {
      type: String,
      default: ""
    },
    lastSync: {
      type: Date,
      default: null
    },
    data: {
      totalSolved: {
        type: Number,
        default: 0
      },
      easy: {
        type: Number,
        default: 0
      },
      medium: {
        type: Number,
        default: 0
      },
      hard: {
        type: Number,
        default: 0
      },
      rating: {
        type: Number,
        default: 0
      },
      ranking: {
        type: Number,
        default: 0
      },
      acceptanceRate: {
        type: Number,
        default: 0
      }
    }
  },
  linkedin: {
    connected: {
      type: Boolean,
      default: false
    },
    profileUrl: {
      type: String,
      default: ""
    },
    headline: {
      type: String,
      default: ""
    },
    profileVerified: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

export default mongoose.model("UserIntegrations", userIntegrationsSchema);
