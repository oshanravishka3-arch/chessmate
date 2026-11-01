import { useEffect, useMemo, useState } from 'react'



import './App.css'







function App() {



  const [tournaments, setTournaments] = useState([])



  const [players, setPlayers] = useState([])



  const [matches, setMatches] = useState([])







  const [selectedTournament, setSelectedTournament] = useState('')







  const [showTournamentForm, setShowTournamentForm] = useState(false)



  const [showPlayerForm, setShowPlayerForm] = useState(false)



  const [showLogin, setShowLogin] = useState(false)







  const [isAdmin, setIsAdmin] = useState(false)



  const [editingTournamentId, setEditingTournamentId] = useState(null)

  const [editingPlayerId, setEditingPlayerId] = useState(null)







  const [loginForm, setLoginForm] = useState({



    username: '',



    password: '',



  })







  const [loginMessage, setLoginMessage] = useState('')







  const [tournamentLoading, setTournamentLoading] = useState(false)



  const [playerLoading, setPlayerLoading] = useState(false)



  const [pairLoading, setPairLoading] = useState(false)







  const [tournamentMessage, setTournamentMessage] = useState('')



  const [playerMessage, setPlayerMessage] = useState('')



  const [pairMessage, setPairMessage] = useState('')







  const [tournamentForm, setTournamentForm] = useState({



    name: '',



    date: '',



    rounds: '',



    format: 'Swiss',



    location: '',



  })







  const [playerForm, setPlayerForm] = useState({



    name: '',



    club: '',



    rating: '',



    tournament: '',



  })







  const [pairRound, setPairRound] = useState(1)
  // -----------------------------  // LOAD DATA  // -----------------------------
  const fetchTournaments = async () => {



    try {



      const response = await fetch(



        'https://chessmate-backend-gx30.onrender.com/api/tournaments'



      )







      if (!response.ok) {



        throw new Error('Failed to load tournaments')



      }







      const data = await response.json()



      setTournaments(data)







      if (!selectedTournament && data.length > 0) {



        setSelectedTournament(data[0]._id)



      }



    } catch (error) {



      console.error(error)



    }



  }







  const fetchPlayers = async () => {



    try {



      const response = await fetch(



        'https://chessmate-backend-gx30.onrender.com/api/players'



      )







      if (!response.ok) {



        throw new Error('Failed to load players')



      }







      const data = await response.json()



      setPlayers(data)



    } catch (error) {



      console.error(error)



    }



  }







  const fetchMatches = async () => {



    try {



      const response = await fetch(



        'https://chessmate-backend-gx30.onrender.com/api/matches'



      )







      if (!response.ok) {



        throw new Error('Failed to load matches')



      }







      const data = await response.json()



      setMatches(data)



    } catch (error) {



      console.error(error)



    }



  }







  useEffect(() => {



    fetchTournaments()



    fetchPlayers()



    fetchMatches()



  }, [])
  // -----------------------------  // FILTERED DATA  // -----------------------------
  const filteredPlayers = useMemo(() => {



    if (!selectedTournament) return []







    return players.filter((player) => {



      const tournamentId =



        typeof player.tournament === 'object'



          ? player.tournament?._id



          : player.tournament







      return tournamentId === selectedTournament



    })



  }, [players, selectedTournament])







  const filteredMatches = useMemo(() => {



    if (!selectedTournament) return []







    return matches.filter((match) => {



      const tournamentId =



        typeof match.tournament === 'object'



          ? match.tournament?._id



          : match.tournament







      return tournamentId === selectedTournament



    })



  }, [matches, selectedTournament])







  const standings = useMemo(() => {



    return [...filteredPlayers].sort((a, b) => {



      if (b.points !== a.points) {



        return b.points - a.points



      }







      return b.rating - a.rating



    })



  }, [filteredPlayers])







  const selectedTournamentData = tournaments.find(



    (tournament) => tournament._id === selectedTournament



  )







  const completedMatches = filteredMatches.filter(



    (match) => match.result !== 'Pending'



  )







  const activeRounds = new Set(



    filteredMatches



      .filter((match) => match.result === 'Pending')



      .map((match) => match.round)



  ).size
  // -----------------------------  // ADMIN LOGIN  // -----------------------------
  const handleLoginChange = (e) => {



    const { name, value } = e.target







    setLoginForm((prev) => ({



      ...prev,



      [name]: value,



    }))



  }







  const handleLogin = (e) => {



    e.preventDefault()







    if (



      loginForm.username === 'admin' &&



      loginForm.password === 'chess123'



    ) {



      setIsAdmin(true)



      setShowLogin(false)



      setLoginMessage('')







      setLoginForm({



        username: '',



        password: '',



      })



    } else {



      setLoginMessage('Invalid username or password')



    }



  }







  const handleLogout = () => {

    setIsAdmin(false)

    setShowTournamentForm(false)

    setShowPlayerForm(false)

    setEditingTournamentId(null)

    setEditingPlayerId(null)

  }
  // -----------------------------  // TOURNAMENT  // -----------------------------
  const handleTournamentChange = (e) => {



    const { name, value } = e.target







    setTournamentForm((prev) => ({



      ...prev,



      [name]: value,



    }))



  }







  const openTournamentForm = () => {

    setEditingTournamentId(null)

    setTournamentMessage('')

    setTournamentForm({

      name: '',

      date: '',

      rounds: '',

      format: 'Swiss',

      location: '',

    })

    setShowTournamentForm(true)

  }



  const editTournament = (tournament) => {

    setEditingTournamentId(tournament._id)

    setTournamentMessage('')

    setTournamentForm({

      name: tournament.name || '',

      date: tournament.date ? tournament.date.slice(0, 10) : '',

      rounds: tournament.rounds ?? '',

      format: tournament.format || 'Swiss',

      location: tournament.location || '',

    })

    setShowTournamentForm(true)

  }



  const deleteTournament = async (id) => {

    const confirmed = window.confirm(

      'Delete this tournament? Its players and matches will also be deleted.'

    )

    if (!confirmed) return



    try {

      const response = await fetch(

        `https://chessmate-backend-gx30.onrender.com/api/tournaments/${id}`,

        { method: 'DELETE' }

      )

      const data = await response.json()



      if (!response.ok) {

        throw new Error(data.message || 'Failed to delete tournament')

      }



      if (selectedTournament === id) {

        setSelectedTournament('')

      }



      await Promise.all([

        fetchTournaments(),

        fetchPlayers(),

        fetchMatches(),

      ])

    } catch (error) {

      console.error(error)

      alert(error.message)

    }

  }



  const handleTournamentSubmit = async (e) => {

    e.preventDefault()



    setTournamentLoading(true)

    setTournamentMessage('')



    try {

      const isEditing = Boolean(editingTournamentId)

      const url = isEditing

        ? `https://chessmate-backend-gx30.onrender.com/api/tournaments/${editingTournamentId}`

        : 'https://chessmate-backend-gx30.onrender.com/api/tournaments'



      const response = await fetch(url, {

        method: isEditing ? 'PUT' : 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          ...tournamentForm,

          rounds: Number(tournamentForm.rounds),

        }),

      })



      const data = await response.json()



      if (!response.ok) {

        throw new Error(

          data.message ||

            (isEditing

              ? 'Failed to update tournament'

              : 'Failed to create tournament')

        )

      }



      setTournamentMessage(

        isEditing

          ? 'Tournament updated successfully!'

          : 'Tournament created successfully!'

      )



      setTournamentForm({

        name: '',

        date: '',

        rounds: '',

        format: 'Swiss',

        location: '',

      })



      setEditingTournamentId(null)



      await Promise.all([

        fetchTournaments(),

        fetchPlayers(),

        fetchMatches(),

      ])



      setSelectedTournament(data._id)

    } catch (error) {

      console.error(error)

      setTournamentMessage(error.message)

    } finally {

      setTournamentLoading(false)

    }

  }
  // -----------------------------  // PLAYER  // -----------------------------
  const handlePlayerChange = (e) => {



    const { name, value } = e.target







    setPlayerForm((prev) => ({



      ...prev,



      [name]: value,



    }))



  }







  const openPlayerForm = () => {

    setEditingPlayerId(null)

    setPlayerMessage('')

    setPlayerForm({

      name: '',

      club: '',

      rating: '',

      tournament: selectedTournament || '',

    })

    setShowPlayerForm(true)

  }



  const editPlayer = (player) => {

    const tournamentId =

      typeof player.tournament === 'object'

        ? player.tournament?._id

        : player.tournament



    setEditingPlayerId(player._id)

    setPlayerMessage('')

    setPlayerForm({

      name: player.name || '',

      club: player.club || '',

      rating: player.rating ?? '',

      tournament: tournamentId || selectedTournament || '',

    })

    setShowPlayerForm(true)

  }







  const handlePlayerSubmit = async (e) => {

    e.preventDefault()



    setPlayerLoading(true)

    setPlayerMessage('')



    try {

      const isEditing = Boolean(editingPlayerId)

      const url = isEditing

        ? `https://chessmate-backend-gx30.onrender.com/api/players/${editingPlayerId}`

        : 'https://chessmate-backend-gx30.onrender.com/api/players'



      const response = await fetch(url, {

        method: isEditing ? 'PUT' : 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          ...playerForm,

          rating: Number(playerForm.rating),

        }),

      })



      const data = await response.json()



      if (!response.ok) {

        throw new Error(

          data.message ||

            (isEditing

              ? 'Failed to update player'

              : 'Failed to register player')

        )

      }



      setPlayerMessage(

        isEditing

          ? 'Player updated successfully!'

          : 'Player registered successfully!'

      )



      setPlayerForm({

        name: '',

        club: '',

        rating: '',

        tournament: selectedTournament || '',

      })



      setEditingPlayerId(null)

      await fetchPlayers()

    } catch (error) {

      console.error(error)

      setPlayerMessage(error.message)

    } finally {

      setPlayerLoading(false)

    }

  }







  const deletePlayer = async (id) => {



    const confirmed = window.confirm(



      'Are you sure you want to delete this player?'



    )







    if (!confirmed) return







    try {



      const response = await fetch(



        `https://chessmate-backend-gx30.onrender.com/api/players/${id}`,



        {



          method: 'DELETE',



        }



      )







      const data = await response.json()



      if (!response.ok) {

        throw new Error(data.message || 'Failed to delete player')

      }



      await fetchPlayers()

    } catch (error) {

      console.error(error)

      alert(error.message)

    }



  }
  // -----------------------------  // AUTO PAIR  // -----------------------------
  const handleAutoPair = async (e) => {



    e.preventDefault()







    setPairLoading(true)



    setPairMessage('')







    try {



      const response = await fetch(



        'https://chessmate-backend-gx30.onrender.com/api/matches/auto-pair',



        {



          method: 'POST',



          headers: {



            'Content-Type': 'application/json',



          },



          body: JSON.stringify({



            tournament: selectedTournament,



            round: Number(pairRound),



          }),



        }



      )







      const data = await response.json()







      if (!response.ok) {



        throw new Error(



          data.message || 'Failed to create pairings'



        )



      }







      setPairMessage(



        `Round ${pairRound} pairings created successfully!`



      )







      await Promise.all([



        fetchMatches(),



        fetchPlayers(),



      ])



    } catch (error) {



      console.error(error)



      setPairMessage(error.message)



    } finally {



      setPairLoading(false)



    }



  }
  // -----------------------------  // RESULT  // -----------------------------
  const updateResult = async (matchId, result) => {



    if (!result) return







    try {



      const response = await fetch(



        `https://chessmate-backend-gx30.onrender.com/api/matches/${matchId}/result`,



        {



          method: 'PUT',



          headers: {



            'Content-Type': 'application/json',



          },



          body: JSON.stringify({



            result,



          }),



        }



      )







      const data = await response.json()







      if (!response.ok) {



        throw new Error(



          data.message || 'Failed to update result'



        )



      }







      await Promise.all([



        fetchMatches(),



        fetchPlayers(),



      ])



    } catch (error) {



      console.error(error)



      alert(error.message)



    }



  }







  return (



    <div className="app">







      {/* NAVBAR */}







      <nav className="navbar">







        <div className="brand">







          <div className="brand-icon">



            ♞



          </div>







          <div>



            <h2>ChessMate</h2>



            <span>Tournament Manager</span>



          </div>







        </div>







        <div className="nav-links">



          <a href="#home">Home</a>



          <a href="#tournaments-list">Tournaments</a>



          <a href="#players-list">Players</a>



          <a href="#standings">Standings</a>



        </div>







        {!isAdmin ? (



          <button



            className="admin-btn"



            onClick={() => {



              setLoginMessage('')



              setShowLogin(true)



            }}



          >



            Admin Login



          </button>



        ) : (



          <button



            className="admin-btn"



            onClick={handleLogout}



          >



            Logout



          </button>



        )}







      </nav>







      {/* LOGIN */}







      {showLogin && (







        <div className="login-overlay">







          <div className="login-card">







            <div className="form-header">







              <div>



                <span>Administrator</span>



                <h2>Admin Login</h2>



              </div>







              <button



                className="close-btn"



                onClick={() => setShowLogin(false)}



              >



                ✕



              </button>







            </div>







            <form onSubmit={handleLogin}>







              <div className="form-group">







                <label>



                  Username



                </label>







                <input



                  type="text"



                  name="username"



                  value={loginForm.username}



                  onChange={handleLoginChange}



                  placeholder="admin"



                  required



                />







              </div>







              <div className="form-group">







                <label>



                  Password



                </label>







                <input



                  type="password"



                  name="password"



                  value={loginForm.password}



                  onChange={handleLoginChange}



                  placeholder="Enter password"



                  required



                />







              </div>







              <button



                type="submit"



                className="primary-btn form-submit-btn"



              >



                Login



              </button>







              {loginMessage && (



                <p className="login-error">



                  {loginMessage}



                </p>



              )}







            </form>







          </div>







        </div>







      )}







      {/* HERO */}







      <section className="hero" id="home">







        <div className="hero-content">







          <div className="hero-badge">



            ♟ Smart Tournament Management



          </div>







          <h1>



            Organize Chess.



            <br />



            <span>Manage Champions.</span>



          </h1>







          <p>



            Create tournaments, register players, manage rounds,



            record results and generate live standings — all from



            one simple platform.



          </p>







          <div className="hero-actions">







            {isAdmin ? (







              <>



                <button

                  className="primary-btn"

                  onClick={openTournamentForm}

                >



                  Create Tournament



                  <span>→</span>



                </button>







                <button



                  className="outline-btn"



                  onClick={openPlayerForm}



                >



                  Add Player



                </button>



              </>







            ) : (







              <a



                href="#standings"



                className="primary-btn"



              >



                View Standings



                <span>→</span>



              </a>







            )}







          </div>







          <div className="hero-info">







            <div>



              <strong>Easy</strong>



              <span>Player Management</span>



            </div>







            <div>



              <strong>Fast</strong>



              <span>Result Updates</span>



            </div>







            <div>



              <strong>Live</strong>



              <span>Leaderboard</span>



            </div>







          </div>







        </div>







        <div className="hero-visual">







          <div className="tournament-card">







            <div className="card-header">







              <div>



                <span className="small-label">



                  SELECTED TOURNAMENT



                </span>







                <h3>



                  {selectedTournamentData?.name ||



                    'No Tournament Selected'}



                </h3>



              </div>







              <div className="status-badge">



                Live



              </div>







            </div>







            <div className="chess-visual">



              <span>♜</span>



              <span>♞</span>



              <span>♝</span>



              <span>♛</span>



              <span>♚</span>



            </div>







            <div className="tournament-details">







              <div>



                <span>Players</span>



                <strong>{filteredPlayers.length}</strong>



              </div>







              <div>



                <span>Rounds</span>



                <strong>



                  {selectedTournamentData?.rounds || 0}



                </strong>



              </div>







              <div>



                <span>Format</span>



                <strong>



                  {selectedTournamentData?.format || '-'}



                </strong>



              </div>







            </div>







            <div className="current-match">







              <div>



                <span>Location</span>







                <strong>



                  {selectedTournamentData?.location || '-'}



                </strong>



              </div>







              <div className="score">



                Active



              </div>







            </div>







          </div>







        </div>







      </section>







      {/* TOURNAMENT SELECT */}







      <section className="tournament-form-section">







        <div className="tournament-form-card">







          <div className="form-header">







            <div>



              <span>Tournament Control</span>



              <h2>Select Tournament</h2>



            </div>







          </div>







          <div className="form-group">







            <select



              value={selectedTournament}



              onChange={(e) =>



                setSelectedTournament(e.target.value)



              }



            >







              {tournaments.map((tournament) => (



                <option



                  key={tournament._id}



                  value={tournament._id}



                >



                  {tournament.name}



                </option>



              ))}







            </select>







          </div>







        </div>







      </section>







      {/* CREATE TOURNAMENT */}







      {isAdmin && showTournamentForm && (







        <section className="tournament-form-section">







          <div className="tournament-form-card">







            <div className="form-header">







              <div>



                <span>

                  {editingTournamentId ? 'Edit Tournament' : 'Create Tournament'}

                </span>



                <h2>

                  {editingTournamentId

                    ? 'Update Tournament Details'

                    : 'Start a New Chess Tournament'}

                </h2>



              </div>







              <button



                className="close-btn"



                onClick={() => {

                  setShowTournamentForm(false)

                  setEditingTournamentId(null)

                  setTournamentMessage('')

                }}



              >



                ✕



              </button>







            </div>







            <form onSubmit={handleTournamentSubmit}>







              <div className="form-group">







                <label>



                  Tournament Name



                </label>







                <input



                  type="text"



                  name="name"



                  value={tournamentForm.name}



                  onChange={handleTournamentChange}



                  required



                />







              </div>







              <div className="form-row">







                <div className="form-group">







                  <label>Date</label>







                  <input



                    type="date"



                    name="date"



                    value={tournamentForm.date}



                    onChange={handleTournamentChange}



                    required



                  />







                </div>







                <div className="form-group">







                  <label>Number of Rounds</label>







                  <input



                    type="number"



                    min="1"



                    name="rounds"



                    value={tournamentForm.rounds}



                    onChange={handleTournamentChange}



                    required



                  />







                </div>







              </div>







              <div className="form-row">







                <div className="form-group">







                  <label>Format</label>







                  <select



                    name="format"



                    value={tournamentForm.format}



                    onChange={handleTournamentChange}



                  >



                    <option value="Swiss">Swiss</option>



                    <option value="Round Robin">Round Robin</option>



                    <option value="Knockout">Knockout</option>



                  </select>







                </div>







                <div className="form-group">







                  <label>Location</label>







                  <input



                    type="text"



                    name="location"



                    value={tournamentForm.location}



                    onChange={handleTournamentChange}



                    required



                  />







                </div>







              </div>







              <button



                type="submit"



                className="primary-btn form-submit-btn"



                disabled={tournamentLoading}



              >



                {tournamentLoading

                  ? editingTournamentId

                    ? 'Updating...'

                    : 'Creating...'

                  : editingTournamentId

                    ? 'Update Tournament'

                    : 'Create Tournament'}



              </button>







              {tournamentMessage && (



                <p className="form-message">



                  {tournamentMessage}



                </p>



              )}







            </form>







          </div>







        </section>







      )}







      {/* ADD PLAYER */}







      {isAdmin && showPlayerForm && (







        <section className="tournament-form-section">







          <div className="tournament-form-card">







            <div className="form-header">







              <div>



                <span>

                  {editingPlayerId ? 'Player Update' : 'Player Registration'}

                </span>



                <h2>

                  {editingPlayerId ? 'Edit Player' : 'Add a New Player'}

                </h2>



              </div>







              <button



                className="close-btn"



                onClick={() => {

                  setShowPlayerForm(false)

                  setEditingPlayerId(null)

                  setPlayerMessage('')

                }}



              >



                ✕



              </button>







            </div>







            <form onSubmit={handlePlayerSubmit}>







              <div className="form-group">







                <label>Player Name</label>







                <input



                  type="text"



                  name="name"



                  value={playerForm.name}



                  onChange={handlePlayerChange}



                  required



                />







              </div>







              <div className="form-row">







                <div className="form-group">







                  <label>



                    University / Club



                  </label>







                  <input



                    type="text"



                    name="club"



                    value={playerForm.club}



                    onChange={handlePlayerChange}



                    required



                  />







                </div>







                <div className="form-group">







                  <label>FIDE Rating</label>







                  <input



                    type="number"



                    min="0"



                    name="rating"



                    value={playerForm.rating}



                    onChange={handlePlayerChange}



                    required



                  />







                </div>







              </div>







              <div className="form-group">







                <label>Tournament</label>







                <select



                  name="tournament"



                  value={playerForm.tournament}



                  onChange={handlePlayerChange}



                  required



                >







                  <option value="">



                    Select Tournament



                  </option>







                  {tournaments.map((tournament) => (



                    <option



                      key={tournament._id}



                      value={tournament._id}



                    >



                      {tournament.name}



                    </option>



                  ))}







                </select>







              </div>







              <button



                type="submit"



                className="primary-btn form-submit-btn"



                disabled={playerLoading}



              >



                {playerLoading

                  ? editingPlayerId

                    ? 'Updating...'

                    : 'Registering...'

                  : editingPlayerId

                    ? 'Update Player'

                    : 'Register Player'}



              </button>







              {playerMessage && (



                <p className="form-message">



                  {playerMessage}



                </p>



              )}







            </form>







          </div>







        </section>







      )}







      {/* STATS */}







      <section className="stats-section">







        <div className="stat-card">



          <div className="stat-icon">♟</div>







          <div>



            <h3>{filteredPlayers.length}</h3>



            <p>Selected Tournament Players</p>



          </div>



        </div>







        <div className="stat-card">



          <div className="stat-icon">♛</div>







          <div>



            <h3>{tournaments.length}</h3>



            <p>Total Tournaments</p>



          </div>



        </div>







        <div className="stat-card">



          <div className="stat-icon">♜</div>







          <div>



            <h3>{completedMatches.length}</h3>



            <p>Matches Played</p>



          </div>



        </div>







        <div className="stat-card">



          <div className="stat-icon">★</div>







          <div>



            <h3>{activeRounds}</h3>



            <p>Active Rounds</p>



          </div>



        </div>







      </section>







      {/* TOURNAMENTS */}







      <section



        className="tournaments-section"



        id="tournaments-list"



      >







        <div className="section-heading">







          <span>Saved Tournaments</span>







          <h2>Your Chess Tournaments</h2>







          <p>



            Select a tournament to view its players,



            matches and standings.



          </p>







        </div>







        <div className="tournaments-grid">







          {tournaments.map((tournament) => (







            <div



              className="saved-tournament-card"



              key={tournament._id}



            >







              <div className="saved-card-top">







                <span className="saved-format">



                  {tournament.format}



                </span>







                <span className="saved-chess-icon">



                  ♞



                </span>







              </div>







              <h3>



                {tournament.name}



              </h3>







              <div className="saved-details">







                <div>



                  <span>Date</span>







                  <strong>



                    {new Date(



                      tournament.date



                    ).toLocaleDateString()}



                  </strong>



                </div>







                <div>



                  <span>Rounds</span>



                  <strong>



                    {tournament.rounds}



                  </strong>



                </div>







                <div>



                  <span>Location</span>



                  <strong>



                    {tournament.location}



                  </strong>



                </div>







              </div>







              <div

                style={{

                  marginTop: '18px',

                  display: 'flex',

                  gap: '10px',

                  flexWrap: 'wrap',

                }}

              >

                <button

                  className="outline-btn"

                  onClick={() => setSelectedTournament(tournament._id)}

                >

                  View Tournament

                </button>



                {isAdmin && (

                  <>

                    <button

                      className="outline-btn"

                      onClick={() => editTournament(tournament)}

                    >

                      Edit

                    </button>



                    <button

                      className="delete-player-btn"

                      onClick={() => deleteTournament(tournament._id)}

                    >

                      Delete

                    </button>

                  </>

                )}

              </div>







            </div>







          ))}







        </div>







      </section>







      {/* PLAYERS */}







      <section



        className="players-section"



        id="players-list"



      >







        <div className="section-heading">







          <span>Registered Players</span>







          <h2>



            {selectedTournamentData?.name ||



              'Tournament'}{' '}



            Players



          </h2>







        </div>







        <div className="players-container">







          {filteredPlayers.map((player, index) => (







            <div



              className="player-row"



              key={player._id}



            >







              <div className="player-number">



                {index + 1}



              </div>







              <div className="player-main">



                <strong>{player.name}</strong>



                <span>{player.club}</span>



              </div>







              <div className="player-info">



                <span>Rating</span>



                <strong>{player.rating}</strong>



              </div>







              <div className="player-info">



                <span>Tournament</span>



                <strong>



                  {selectedTournamentData?.name}



                </strong>



              </div>







              <div className="player-points">



                <span>Points</span>



                <strong>{player.points}</strong>



              </div>







              {isAdmin && (

                <div

                  style={{

                    display: 'flex',

                    gap: '8px',

                    flexWrap: 'wrap',

                  }}

                >

                  <button

                    className="outline-btn"

                    onClick={() => editPlayer(player)}

                  >

                    Edit

                  </button>



                  <button

                    className="delete-player-btn"

                    onClick={() => deletePlayer(player._id)}

                  >

                    Delete

                  </button>

                </div>

              )}







            </div>







          ))}







        </div>







      </section>







      {/* ADMIN ROUND MANAGEMENT */}







      {isAdmin && (







        <section className="tournament-form-section">







          <div className="tournament-form-card">







            <div className="form-header">







              <div>



                <span>Round Management</span>



                <h2>Auto Pair Round</h2>



              </div>







            </div>







            <form onSubmit={handleAutoPair}>







              <div className="form-row">







                <div className="form-group">







                  <label>Tournament</label>







                  <input



                    value={



                      selectedTournamentData?.name || ''



                    }



                    disabled



                  />







                </div>







                <div className="form-group">







                  <label>



                    Round Number



                  </label>







                  <input



                    type="number"



                    min="1"



                    value={pairRound}



                    onChange={(e) =>



                      setPairRound(e.target.value)



                    }



                  />







                </div>







              </div>







              <button



                type="submit"



                className="primary-btn form-submit-btn"



                disabled={pairLoading}



              >



                {pairLoading



                  ? 'Creating Pairings...'



                  : 'Generate Pairings'}



              </button>







              {pairMessage && (



                <p className="form-message">



                  {pairMessage}



                </p>



              )}







            </form>







          </div>







        </section>







      )}







      {/* MATCHES */}







      <section className="players-section">







        <div className="section-heading">







          <span>Rounds & Results</span>







          <h2>Match Management</h2>







        </div>







        <div className="players-container">







          {filteredMatches.map((match) => (







            <div



              className="player-row"



              key={match._id}



            >







              <div className="player-main">



                <strong>



                  Round {match.round}



                </strong>







                <span>Match</span>



              </div>







              <div className="player-info">







                <span>White</span>







                <strong>



                  {match.whitePlayer?.name}



                </strong>







              </div>







              <div className="player-points">



                <strong>VS</strong>



              </div>







              <div className="player-info">







                <span>Black</span>







                <strong>



                  {match.blackPlayer?.name}



                </strong>







              </div>







              <div className="player-info">







                <span>Result</span>







                <strong>



                  {match.result}



                </strong>







              </div>







              {isAdmin &&



              match.result === 'Pending' ? (







                <select



                  className="result-select"



                  defaultValue=""



                  onChange={(e) =>



                    updateResult(



                      match._id,



                      e.target.value



                    )



                  }



                >







                  <option value="">



                    Enter Result



                  </option>







                  <option value="1-0">



                    1-0



                  </option>







                  <option value="0-1">



                    0-1



                  </option>







                  <option value="1/2-1/2">



                    ½ - ½



                  </option>







                </select>







              ) : (







                <div className="score">



                  {match.result === 'Pending'



                    ? 'Waiting'



                    : 'Completed'}



                </div>







              )}







            </div>







          ))}







        </div>







      </section>







      {/* STANDINGS */}







      <section



        className="tournaments-section"



        id="standings"



      >







        <div className="section-heading">







          <span>Leaderboard</span>







          <h2>Standings</h2>







          <p>



            {selectedTournamentData?.name}



          </p>







        </div>







        <div className="players-container">







          {standings.map((player, index) => (







            <div



              className="player-row"



              key={player._id}



            >







              <div className="player-number">



                {index + 1}



              </div>







              <div className="player-main">







                <strong>



                  {player.name}



                </strong>







                <span>



                  {player.club}



                </span>







              </div>







              <div className="player-info">



                <span>Rating</span>



                <strong>{player.rating}</strong>



              </div>







              <div className="player-info">



                <span>Rank</span>



                <strong>#{index + 1}</strong>



              </div>







              <div className="player-points">



                <span>Points</span>



                <strong>{player.points}</strong>



              </div>







            </div>







          ))}







        </div>







      </section>







      <footer>







        <div className="footer-brand">



          ♞ ChessMate



        </div>







        <p>



          Chess Tournament Management System



        </p>







        <span>



          © 2026 ChessMate



        </span>







      </footer>







    </div>



  )



}

export default App
