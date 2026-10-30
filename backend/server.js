const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --------------------
// DATABASE
// --------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((error) => console.log("MongoDB Connection Error:", error));

// --------------------
// TOURNAMENT MODEL
// --------------------

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    rounds: {
      type: Number,
      required: true,
    },

    format: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model("Tournament", tournamentSchema);

// --------------------
// PLAYER MODEL
// --------------------

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    club: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    points: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Player = mongoose.model("Player", playerSchema);

// --------------------
// MATCH MODEL
// --------------------

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    round: {
      type: Number,
      required: true,
    },

    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    result: {
      type: String,
      enum: ["Pending", "1-0", "0-1", "1/2-1/2"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model("Match", matchSchema);

// --------------------
// TEST ROUTE
// --------------------

app.get("/", (req, res) => {
  res.send("ChessMate API is running!");
});

// --------------------
// TOURNAMENT ROUTES
// --------------------

app.post("/api/tournaments", async (req, res) => {
  try {
    const { name, date, rounds, format, location } = req.body;

    const tournament = new Tournament({
      name,
      date,
      rounds,
      format,
      location,
    });

    const savedTournament = await tournament.save();

    res.status(201).json(savedTournament);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create tournament",
    });
  }
});

app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({
      createdAt: -1,
    });

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load tournaments",
    });
  }
});

// --------------------
// PLAYER ROUTES
// --------------------

app.post("/api/players", async (req, res) => {
  try {
    const { name, club, rating, tournament } = req.body;

    const player = new Player({
      name,
      club,
      rating,
      tournament,
    });

    const savedPlayer = await player.save();

    const populatedPlayer = await savedPlayer.populate(
      "tournament",
      "name"
    );

    res.status(201).json(populatedPlayer);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create player",
    });
  }
});

app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find()
      .populate("tournament", "name")
      .sort({
        createdAt: -1,
      });

    res.json(players);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load players",
    });
  }
});

app.delete("/api/players/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.json({
      message: "Player deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete player",
    });
  }
});

// --------------------
// MATCH ROUTES
// --------------------

app.post("/api/matches", async (req, res) => {
  try {
    const {
      tournament,
      round,
      whitePlayer,
      blackPlayer,
    } = req.body;

    if (whitePlayer === blackPlayer) {
      return res.status(400).json({
        message: "White and Black players cannot be the same",
      });
    }

    const match = new Match({
      tournament,
      round,
      whitePlayer,
      blackPlayer,
    });

    const savedMatch = await match.save();

    const populatedMatch = await savedMatch.populate([
      {
        path: "tournament",
        select: "name",
      },
      {
        path: "whitePlayer",
        select: "name rating",
      },
      {
        path: "blackPlayer",
        select: "name rating",
      },
    ]);

    res.status(201).json(populatedMatch);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to create match",
    });
  }
});

app.get("/api/matches", async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("tournament", "name")
      .populate("whitePlayer", "name rating")
      .populate("blackPlayer", "name rating")
      .sort({
        round: 1,
        createdAt: 1,
      });

    res.json(matches);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load matches",
    });
  }
});

// --------------------
// AUTO PAIR ROUND
// --------------------

app.post("/api/matches/auto-pair", async (req, res) => {
  try {
    const { tournament, round } = req.body;

    if (!tournament || !round) {
      return res.status(400).json({
        message: "Tournament and round are required",
      });
    }

    const existingMatches = await Match.find({
      tournament,
      round,
    });

    if (existingMatches.length > 0) {
      return res.status(400).json({
        message: "This round already has matches",
      });
    }

    const players = await Player.find({
      tournament,
    }).sort({
      points: -1,
      rating: -1,
    });

    if (players.length < 2) {
      return res.status(400).json({
        message: "At least 2 players are required",
      });
    }

    const createdMatches = [];

    for (let i = 0; i < players.length - 1; i += 2) {
      const whitePlayer = players[i];
      const blackPlayer = players[i + 1];

      const match = new Match({
        tournament,
        round,
        whitePlayer: whitePlayer._id,
        blackPlayer: blackPlayer._id,
      });

      await match.save();

      createdMatches.push(match);
    }

    let byePlayer = null;

    if (players.length % 2 !== 0) {
      byePlayer = players[players.length - 1];

      await Player.findByIdAndUpdate(
        byePlayer._id,
        {
          $inc: {
            points: 1,
          },
        }
      );
    }

    const populatedMatches = await Match.find({
      tournament,
      round,
    })
      .populate("tournament", "name")
      .populate("whitePlayer", "name rating")
      .populate("blackPlayer", "name rating");

    res.status(201).json({
      message: "Round paired successfully",
      matches: populatedMatches,
      byePlayer: byePlayer
        ? {
            id: byePlayer._id,
            name: byePlayer.name,
          }
        : null,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to auto pair round",
    });
  }
});

// --------------------
// RESULT
// --------------------

app.put("/api/matches/:id/result", async (req, res) => {
  try {
    const { result } = req.body;

    const allowedResults = [
      "1-0",
      "0-1",
      "1/2-1/2",
    ];

    if (!allowedResults.includes(result)) {
      return res.status(400).json({
        message: "Invalid result",
      });
    }

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.result !== "Pending") {
      return res.status(400).json({
        message: "Result already entered",
      });
    }

    let whitePoints = 0;
    let blackPoints = 0;

    if (result === "1-0") {
      whitePoints = 1;
    }

    if (result === "0-1") {
      blackPoints = 1;
    }

    if (result === "1/2-1/2") {
      whitePoints = 0.5;
      blackPoints = 0.5;
    }

    await Player.findByIdAndUpdate(
      match.whitePlayer,
      {
        $inc: {
          points: whitePoints,
        },
      }
    );

    await Player.findByIdAndUpdate(
      match.blackPlayer,
      {
        $inc: {
          points: blackPoints,
        },
      }
    );

    match.result = result;

    await match.save();

    const populatedMatch = await match.populate([
      {
        path: "tournament",
        select: "name",
      },
      {
        path: "whitePlayer",
        select: "name rating points",
      },
      {
        path: "blackPlayer",
        select: "name rating points",
      },
    ]);

    res.json(populatedMatch);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to update match result",
    });
  }
});

// --------------------
// STANDINGS
// --------------------

app.get("/api/standings/:tournamentId", async (req, res) => {
  try {
    const players = await Player.find({
      tournament: req.params.tournamentId,
    }).sort({
      points: -1,
      rating: -1,
    });

    res.json(players);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load standings",
    });
  }
});

// --------------------
// SERVER
// --------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChessMate server running on port ${PORT}`);
});