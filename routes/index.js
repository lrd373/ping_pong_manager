var express = require('express');
var router = express.Router();

let registeredPlayers = [];
let playerOneName;
let playerTwoName;
let currentServe;
let serveCounter = 0;
let scorePlayerOne = 0;
let scorePlayerTwo = 0;
let thisMatchWinner;
let previousMatches = []; // this will be an array of objs with three Key:values -> winner, pl1score, pl2score
let leaderboard = []; // array[objs] {playerName, totalWins, avgDiff, latestWin}

resetGameVars = () => {
  playerOneName = "";
  playerTwoName = "";
  currentServe = "";
  scorePlayerOne = 0;
  scorePlayerTwo = 0;
};

sortLeaderboard = (playerA, playerB) => {
  if (playerA.totalWins < playerB.totalWins) {
    return 1;
  } else if (playerA.avgDiff < playerB.avgDiff) {
    return 1;
  } else if (playerA.latestWin < playerB.latestWin) {
    return 1;
  } else {
    return -1;
  }
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { leaderboard });
});


// PLAYER ONE SET UP *****************************************
router.post('/', (req, res, next) => {
  res.redirect('/player-one-setup');
});

router.get('/player-one-setup', (req, res, next) => {
  res.render('playerOneSetUp', {registeredPlayers});
});

router.post('/player-one-name', (req, res, next) => {
  // If player selected both checkboxes
  if (req.body.add_new_name && req.body.choose_previous_name) {
    res.render('playerOneSetUp', {error: "Please only choose one", registeredPlayers: registeredPlayers});
 
  // If player selected to register a new name, render with new name form
  } else if (req.body.add_new_name) {
    res.render('playerOneSetUp', {addNewName: true, registeredPlayers: registeredPlayers});
    
  // Player has entered new name
  } else if (req.body.add_player_one_name) {
    if(registeredPlayers.findIndex(playerName => playerName === req.body.add_player_one_name) !== -1) {
      console.log("Found player's entered name in list of registered players");
      res.render('playerOneSetUp', {error: "Sorry, that player name is already registered", registeredPlayers: registeredPlayers});
    } else {
      console.log("Didn't find player's entered name, adding name to list of registered players.");
      registeredPlayers.push(req.body.add_player_one_name);
      playerOneName = req.body.add_player_one_name;
      
      console.log("added name to list. Moving on to player 2");
      res.redirect("/player-two-setup");
    }
  } else if (req.body.choose_previous_name) {
    res.render('playerOneSetUp', {choosePreviousName: true, registeredPlayers: registeredPlayers}); 
  
  // Player selected a previously registered name to play
  } else if (req.body.registeredPlayer) {
      playerOneName = req.body.registeredPlayer;
      res.redirect('/player-two-setup');
  }
});


// PLAYER TWO SET-UP *****************************************
router.get("/player-two-setup", (req, res, next) => {
  res.render('playerTwoSetUp', {registeredPlayers: registeredPlayers});
});

router.post('/player-two-name', (req, res, next) => {
  console.log(req.body);

  // If player selected both checkboxes
  if (req.body.add_new_name && req.body.choose_previous_name) {
    res.render('playerTwoSetUp', {error: "Please only choose one", registeredPlayers: registeredPlayers});
 
  // If player selected to register a new name, render with new name form
  } else if (req.body.add_new_name) {
    res.render('playerTwoSetUp', {addNewName: true, registeredPlayers: registeredPlayers});

  // Player has entered new name
  } else if (req.body.add_player_two_name) {
    if(registeredPlayers.findIndex(playerName => playerName === req.body.add_player_two_name) !== -1) {
      console.log("Found player's entered name in list of registered players");
      res.render('playerTwoSetUp', {error: "Sorry, that player name is already registered", registeredPlayers: registeredPlayers});
    } else {
      console.log("Didn't find player's entered name, adding name to list of registered players.");
      registeredPlayers.push(req.body.add_player_two_name);
      playerTwoName = req.body.add_player_two_name;
      
      console.log("added name to list. Moving on to choosing player to serve to start.");
      res.redirect(`/choose-first-serve`);
    }

  // If player selected to choose from previously selected player names
  } else if (req.body.choose_previous_name) {
    res.render('playerTwoSetUp', {choosePreviousName: true, registeredPlayers: registeredPlayers});
  
  // Player selected a previously registered name to play
  } else if (req.body.registeredPlayer) {
    if (req.body.registeredPlayer === playerOneName) {
      res.render('playerTwoSetUp', {error: "Sorry, player one has already chosen that name!", registeredPlayers: registeredPlayers});
    } else {
      playerTwoName = req.body.registeredPlayer;
      res.redirect('choose-first-serve');
    }
  }
});

// CHOOSING FIRST SERVE *************************************

router.get('/choose-first-serve', (req, res, next) => {
  res.render('chooseFirstServe', {playerOneName: playerOneName, playerTwoName: playerTwoName});
});

router.post('/choose-first-serve', (req, res, next) => {
  if (req.body.firstServe) {
    currentServe = req.body.firstServe;
    res.redirect('/start-round');
  } else {
    res.render('chooseFirstServe', {error: "Please select a player to serve first", playerOneName: playerOneName, playerTwoName: playerTwoName});
  }
});

// ************* GAME ****************************************************
router.get('/start-round', (req, res, next) => {

  // Check scores for win condition
  // if win, head to game over condition, update leaderboard
  if (scorePlayerOne === 11 ) {
    console.log("player 1 reached 11 pts");
    if (scorePlayerTwo <= 9) {
      thisMatchWinner = 'playerOne';
      res.redirect('/game-over');
    }
  } else if (scorePlayerTwo === 11) {
    console.log("player2 reached 11 pts");
    if (scorePlayerOne <= 9) {
      thisMatchWinner = 'playerTwo';
      res.redirect('/game-over');
    }
  } else if (scorePlayerOne > 11) {
    console.log("player one exceeded 11 pts");
    if (scorePlayerTwo <= (scorePlayerOne - 2)) {
      thisMatchWinner = 'playerOne';
      res.redirect('/game-over');
    }
  } else if (scorePlayerTwo > 11) {
    console.log("player two exceeded 11 pts");
    if (scorePlayerOne <= (scorePlayerTwo - 2)) {
      thisMatchWinner = 'playerTwo';
      res.redirect('/game-over');
    }
  } 
  
  // if no one has won:
  if (serveCounter === 2) {
    if (currentServe === "playerOne") {
      currentServe = "playerTwo";
    } else if (currentServe === "playerTwo") {
      currentServe = "playerOne";
    }
    serveCounter = 0;
  }
  res.redirect('/game-board');

});

router.get('/game-board', (req, res, next) => {
  res.render('game-board', {
    playerOneName, 
    playerTwoName, 
    currentServe, 
    serveCounter,
    scorePlayerOne,
    scorePlayerTwo
  });
});

router.post('/game-board', (req, res, next) => {
  if (req.body.who_scored) {
    if (req.body.who_scored === "playerOne") {
      scorePlayerOne ++;
      serveCounter ++;
      res.redirect("/start-round");
    } else if (req.body.who_scored === "playerTwo") {
      scorePlayerTwo ++;
      serveCounter ++;
      res.redirect("/start-round");
    } else {
      res.redirect("/game-board");
    }
  } else {
    res.redirect("/game-board");
  }
});


// GAME OVER ************************************************
router.get('/game-over', (req, res, next) => {
  //update previousMatches and the leaderboard first
  let winner;
  let winningScore;
  let losingScore;
  let thisDiff;

  if (thisMatchWinner === "playerOne") {
    winner = playerOneName;
    thisDiff = scorePlayerOne - scorePlayerTwo;
  } else {
    winner = playerTwoName;
    thisDiff = scorePlayerTwo - scorePlayerOne;
  }
  let thisPlayer;

  // If player is not in leaderboard yet
  if (leaderboard.findIndex(player => player.playerName === winner) === -1) {
    thisPlayer = {
      playerName: winner,
      totalWins: 1,
      avgDiff: thisDiff,
      latestWin: Date.now()
    };
    leaderboard.push(thisPlayer);

  // If player is in leaderboard, update their record
  } else {
    let indexOfPlayer = leaderboard.findIndex(player => player.playerName === winner);
    thisPlayer = leaderboard[indexOfPlayer];

    let thisPlayerTotalWins = thisPlayer.totalWins;
    let thisPlayerAvgDiff = thisPlayer.avgDiff;
    let updatedTotalWins = thisPlayerTotalWins + 1;
    let updatedAvgDiff = (thisDiff + thisPlayerAvgDiff) / updatedTotalWins;

    let updatedPlayer = {
      playerName: thisPlayer.playerName,
      totalWins: updatedTotalWins,
      avgDiff: updatedAvgDiff,
      latestWin: Date.now()
    }

    leaderboard[indexOfPlayer] = updatedPlayer;
  }

  // Sort leaderboard before rendering
  leaderboard.sort(sortLeaderboard);
  console.log("After sort");
  console.log(leaderboard);

  res.render('game-over', { 
    thisMatchWinner,
    playerOneName,
    playerTwoName,
    scorePlayerOne,
    scorePlayerTwo, 
    leaderboard
  });

  console.log("player one name:" + playerOneName);
  resetGameVars();
  thisMatchWinner = "";
  console.log("after reset");
  console.log("player one name:" + playerOneName);
});

router.post('/game-over', (req, res, next) => {
  res.redirect('/player-one-setup');
}); 

// EXITING GAME *********************************************
router.post('/exit-game', (req, res, next) => {
  resetGameVars();
  thisMatchWinner = "";
  res.redirect('/');
});

module.exports = router;
