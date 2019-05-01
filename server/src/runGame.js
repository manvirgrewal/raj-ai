const { Game } = require("./gameLogic.js");

var wins = 0;
var plays = 1;
var n = 0;




function runGames(){

  while(n < plays){

    let newGame = new Game();
    //ai is always added first so it can make choices first
    newGame.addPlayer("AI", 1);
    newGame.addPlayer("You", 0);
    //newGame.addPlayer("AI2", 0);
    //newGame.addPlayer("Somebody", 0);
    newGame.start()
    if(newGame.winner == newGame.playerList[0] ){
      wins++;
    } n++;
  }
  //console.log("Total Ai Wins: " +wins);
}


runGames();



module.exports = {
  runGames
};
