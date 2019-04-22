const { Deck } = require("./cards.js");
const { Player } = require("./players.js");
const { Turn } = require("./turn.js");
const { pModel } = require("./playerModel.js");
const fs = require('fs');
const jsesc = require('jsesc');
const modelsFile = require('./playersModelData.js');
const jsonfile = require('jsonfile');
const playersFile = './players.json';


//the gameLogic consists of two classes: Game and Turn
//the game class creates the general game, and allows one to add players, then begins the gameloop
//the turn class creates 'turn objects' that are created by the game object

class Game{

  constructor(){
    //default game attribs
    this.playerList = []; //empty player list
    this.prizes = new Deck().createPrizeDeck(); //default prize deck
    this.winner = null; //no winner
    this.rollOverPrizes = []; //keeps track of rolled over prizes from past turns
    this.playerModels = new Map();

    this.fileNotEmpty = false;
    //Load Models
    if(typeof modelsFile.loadPlayerModels == 'function'){
      console.log("Existing Player Model(s) loaded!");
      let tempModels = modelsFile.loadPlayerModels();
      this.playerModels = this.reAssignAllProto(tempModels);
      this.fileNotEmpty = true;
    }
  }

  reAssignAllProto(playerModelsMap){
    playerModelsMap.forEach(this.reAssignProto);
    return playerModelsMap;
  }

  reAssignProto(playerModel, playerName, models){
    //playerModel.prototype = Object.create(pModel.prototype);
    //playerModel.prototype.constructor = pModel;
    let reModel = new pModel(playerModel);
    models.set(playerName, reModel);
  }

  savePlayersNames(reBuildFirst){
    if(reBuildFirst === true){
      console.log("Players have been saved!")
      fs.writeFileSync("./players.json", JSON.stringify(this.getPlayerNames(this.playerList)));
    }else{
      console.log("...player models rebuilding ...")
    }
  }

  rebuildPlayerModels(){
    for(let player of this.playerList){
      if(!this.playerExistsInFile(player.getName()) && player.aiEnable === 0){
        console.log("pModel created for: " + player.getName());
        this.createPlayerModel(player);
      }
    }return true;
  }

  playerExistsInFile(player){
    let playersInFile = jsonfile.readFileSync(playersFile);
      if(playersInFile.includes(player)){
        return true;
      }else{
        return false;
      }
  }

  playerModelExists(player){
    if(this.playerModels.has(player.getName())){
      return true;
    }else{
      return false;
    }
  }

  createPlayerModel(player){
    //map the player -> pModels
    let playerModel = new pModel();
    this.playerModels.set(player.getName(), playerModel);
  }

  getPModel(playerName){
    let pModel = this.playerModels.get(playerName);
    return pModel;
  }

  getPlayerList(){
    return this.playerList;
  }//end getPlayerList

  getPlayerNames(){
    let playerNames = [];
    for(let p of this.playerList){
      playerNames.push(p.getName());
    }return playerNames;
  }

  getOtherPlayerNames(player){
    let otherPlayers = [];
    for(let p of this.playerList){
      if(p != player){
        otherPlayers.push(p.getName());
      }
    }return otherPlayers;
  }

  getPrizes(){
    return this.prizes;
  }//end getPrizes

  //adds a player to the game
  addPlayer(name, isAI){
    let player = new Player(name, isAI);
    this.playerList.push(player);
    console.log(name + " has been added to the game!");
  }//end addPlayer

  //creates a new turn
  newTurn(turnNum, game){
    let newTurn = new Turn(turnNum, game);
    return newTurn;
  }//end newTurn

  //starts a game
  start(){
    //check to make sure atleast two players are apart of the game
    if (this.playerList.length < 2){
      console.log("There must be atleast two players to start game!");
    }else{
      this.savePlayersNames(this.rebuildPlayerModels());
      console.log("\nThe Game Is Commencing...");
      this.gameLoop();
    }
  }//end start

  gameLoop(){
    //gameLoop:
    let turnNum = 0;
    while(this.checkIfPlayersStillHaveCards()){ //do while everyone has money cards
      //Increment Turn Number
      turnNum++;
      console.log("\nTurn Number: " +turnNum);
      //Create and Start Turn
      let newTurn = this.newTurn(turnNum, this);
      newTurn.turn();
    }
    console.log("\nGame has ended!");
    this.setWinner(); //looks for player with highest score and sets attrib
    if(this.winner == null){
      console.log("\nThe game was tied!");
    }else{
      console.log("\nThe winner is: " + this.winner.getName() + " with $" + this.winner.currScore + " million!");
    }
    this.savePlayerModels();
  }//end gameLoop


  savePlayerModels(){
    let prefix = "function loadPlayerModels(){return "
    fs.writeFileSync('playersModelData.js', prefix + jsesc(this.playerModels,{
      'es6': true,
      'compact': false,
    }) + ";} module.exports = { loadPlayerModels };");
  }

  checkIfPlayersStillHaveCards(){
    let playersHaveCards = true;
    for(let player of this.playerList){
      if (player.numMcards === 0){
        playersHaveCards = false;
      }else{
        playersHaveCards = true;
      }
    }return playersHaveCards;
  }

  setWinner(){
    let theWinner = null;
    let winnerScore = -Infinity;
    for(let player of this.playerList){
      if(player.currScore > winnerScore){
        theWinner = player;
        winnerScore = player.currScore;
      } else if (player.currScore === winnerScore){
        theWinner = null;
      }
    }this.winner = theWinner;
  }
}//end Game class


module.exports = {
  Game
};
