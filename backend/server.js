const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// DATABASE
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((error) =>
    console.log("MongoDB Connection Error:", error.message)
  );

// ======================================================
// TOURNAMENT MODEL
// ======================================================

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    rounds: {
      type: Number,
      required: true,
      min: 1,
    },

    format: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model("Tournament", tournamentSchema);

// ======================================================
// PLAYER MODEL
// ======================================================

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    club: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 4000,
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

// ======================================================
// MATCH MODEL
// ======================================================

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
      min: 1,
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

// ======================================================
// HELPER
// ======================================================

const validObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.send("ChessMate API is running!");
});

// ======================================================
// TOURNAMENT ROUTES
// CREATE
// ======================================================

app.post("/api/tournaments", async (req, res) => {
  try {
    const { name, date, rounds, format, location } = req.body;

    if (!name || !date || !rounds || !format || !location) {
      return res.status(400).json({
        message: "All tournament fields are required",
      });
    }

    if (Number(rounds) < 1) {
      return res.status(400).json({
        message: "Rounds must be at least 1",
      });
    }

    const tournament = new Tournament({
      name: name.trim(),
      date,
      rounds: Number(rounds),
      format: format.trim(),
      location: location.trim(),
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

// ======================================================
// TOURNAMENT ROUTES
// READ ALL
// ======================================================

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

// ======================================================
// TOURNAMENT ROUTES
// READ ONE
// ======================================================

app.get("/api/tournaments/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load tournament",
    });
  }
});

// ======================================================
// TOURNAMENT ROUTES
// UPDATE
// ======================================================

app.put("/api/tournaments/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const { name, date, rounds, format, location } = req.body;

    if (!name || !date || !rounds || !format || !location) {
      return res.status(400).json({
        message: "All tournament fields are required",
      });
    }

    if (Number(rounds) < 1) {
      return res.status(400).json({
        message: "Rounds must be at least 1",
      });
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        date,
        rounds: Number(rounds),
        format: format.trim(),
        location: location.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    res.json(updatedTournament);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to update tournament",
    });
  }
});

// ======================================================
// TOURNAMENT ROUTES
// DELETE
// ======================================================

app.delete("/api/tournaments/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    // Delete matches belonging to this tournament
    await Match.deleteMany({
      tournament: req.params.id,
    });

    // Delete players belonging to this tournament
    await Player.deleteMany({
      tournament: req.params.id,
    });

    // Delete tournament
    await Tournament.findByIdAndDelete(req.params.id);

    res.json({
      message: "Tournament deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to delete tournament",
    });
  }
});

// ======================================================
// PLAYER ROUTES
// CREATE
// ======================================================

app.post("/api/players", async (req, res) => {
  try {
    const { name, club, rating, tournament } = req.body;

    if (!name || !club || !tournament) {
      return res.status(400).json({
        message: "Name, club and tournament are required",
      });
    }

    if (!validObjectId(tournament)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournamentExists = await Tournament.findById(tournament);

    if (!tournamentExists) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    const numericRating =
      rating === "" || rating === undefined ? 0 : Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 0 ||
      numericRating > 4000
    ) {
      return res.status(400).json({
        message: "Rating must be between 0 and 4000",
      });
    }

    const duplicatePlayer = await Player.findOne({
      tournament,
      name: {
        $regex: new RegExp(`^${name.trim()}$`, "i"),
      },
    });

    if (duplicatePlayer) {
      return res.status(400).json({
        message: "This player is already registered in the tournament",
      });
    }

    const player = new Player({
      name: name.trim(),
      club: club.trim(),
      rating: numericRating,
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

// ======================================================
// PLAYER ROUTES
// READ ALL
// ======================================================

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

// ======================================================
// PLAYER ROUTES
// READ ONE
// ======================================================

app.get("/api/players/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid player ID",
      });
    }

    const player = await Player.findById(req.params.id).populate(
      "tournament",
      "name"
    );

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.json(player);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load player",
    });
  }
});

// ======================================================
// PLAYER ROUTES
// UPDATE
// ======================================================

app.put("/api/players/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid player ID",
      });
    }

    const { name, club, rating, tournament } = req.body;

    if (!name || !club || !tournament) {
      return res.status(400).json({
        message: "Name, club and tournament are required",
      });
    }

    if (!validObjectId(tournament)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournamentExists = await Tournament.findById(tournament);

    if (!tournamentExists) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    const numericRating =
      rating === "" || rating === undefined ? 0 : Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 0 ||
      numericRating > 4000
    ) {
      return res.status(400).json({
        message: "Rating must be between 0 and 4000",
      });
    }

    const duplicatePlayer = await Player.findOne({
      _id: {
        $ne: req.params.id,
      },
      tournament,
      name: {
        $regex: new RegExp(`^${name.trim()}$`, "i"),
      },
    });

    if (duplicatePlayer) {
      return res.status(400).json({
        message: "Another player with this name is already registered",
      });
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        club: club.trim(),
        rating: numericRating,
        tournament,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("tournament", "name");

    if (!updatedPlayer) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.json(updatedPlayer);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to update player",
    });
  }
});

// ======================================================
// PLAYER ROUTES
// DELETE
// ======================================================

app.delete("/api/players/:id", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid player ID",
      });
    }

    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    const playerHasMatches = await Match.exists({
      $or: [
        {
          whitePlayer: req.params.id,
        },
        {
          blackPlayer: req.params.id,
        },
      ],
    });

    if (playerHasMatches) {
      return res.status(400).json({
        message:
          "Cannot delete this player because the player already has matches",
      });
    }

    await Player.findByIdAndDelete(req.params.id);

    res.json({
      message: "Player deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to delete player",
    });
  }
});

// ======================================================
// MATCH ROUTES
// CREATE
// ======================================================

app.post("/api/matches", async (req, res) => {
  try {
    const {
      tournament,
      round,
      whitePlayer,
      blackPlayer,
    } = req.body;

    if (!tournament || !round || !whitePlayer || !blackPlayer) {
      return res.status(400).json({
        message: "All match fields are required",
      });
    }

    if (
      !validObjectId(tournament) ||
      !validObjectId(whitePlayer) ||
      !validObjectId(blackPlayer)
    ) {
      return res.status(400).json({
        message: "Invalid tournament or player ID",
      });
    }

    if (whitePlayer === blackPlayer) {
      return res.status(400).json({
        message: "White and Black players cannot be the same",
      });
    }

    const numericRound = Number(round);

    if (Number.isNaN(numericRound) || numericRound < 1) {
      return res.status(400).json({
        message: "Round must be at least 1",
      });
    }

    const match = new Match({
      tournament,
      round: numericRound,
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

// ======================================================
// MATCH ROUTES
// READ
// ======================================================

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

// ======================================================
// AUTO PAIR ROUND
// ======================================================

app.post("/api/matches/auto-pair", async (req, res) => {
  try {
    const { tournament, round } = req.body;

    if (!tournament || !round) {
      return res.status(400).json({
        message: "Tournament and round are required",
      });
    }

    if (!validObjectId(tournament)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const numericRound = Number(round);

    if (Number.isNaN(numericRound) || numericRound < 1) {
      return res.status(400).json({
        message: "Round must be at least 1",
      });
    }

    const tournamentData = await Tournament.findById(tournament);

    if (!tournamentData) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    if (numericRound > tournamentData.rounds) {
      return res.status(400).json({
        message: `This tournament has only ${tournamentData.rounds} rounds`,
      });
    }

    const existingMatches = await Match.find({
      tournament,
      round: numericRound,
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
        round: numericRound,
        whitePlayer: whitePlayer._id,
        blackPlayer: blackPlayer._id,
      });

      await match.save();

      createdMatches.push(match);
    }

    let byePlayer = null;

    if (players.length % 2 !== 0) {
      byePlayer = players[players.length - 1];

      await Player.findByIdAndUpdate(byePlayer._id, {
        $inc: {
          points: 1,
        },
      });
    }

    const populatedMatches = await Match.find({
      tournament,
      round: numericRound,
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

// ======================================================
// MATCH RESULT
// ======================================================

app.put("/api/matches/:id/result", async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid match ID",
      });
    }

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

    await Player.findByIdAndUpdate(match.whitePlayer, {
      $inc: {
        points: whitePoints,
      },
    });

    await Player.findByIdAndUpdate(match.blackPlayer, {
      $inc: {
        points: blackPoints,
      },
    });

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

// ======================================================
// STANDINGS
// ======================================================

app.get("/api/standings/:tournamentId", async (req, res) => {
  try {
    if (!validObjectId(req.params.tournamentId)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

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

// ======================================================
// 404 API ROUTE
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChessMate server running on port ${PORT}`);
});