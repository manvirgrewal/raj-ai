const { monteCarlo } = require("./monteCarlo.js");
const readlineSync = require('../node_modules/readline-sync/lib/readline-sync.js');
const { Card } = require("./cards.js");
const { Response } = require("./playerModel.js");
const { predictor } = require("./prediction.js");



class Turn{

  constructor(turnNum, game){
    //do not change
    this.game = game; //what game this turn is apart of
    this.turnNum = turnNum; //turn number
    this.turnPrize = null; //prize card that was drawn this turn
    this.allTurnPrizes = []; //current turn prize and rolled over prize(s)

    //change
    this.rollOverPrizesValue = 0; //cal sum of rollover prizes; if tie: update
    this.totalTurnPrize = 0; //cal sum of rollover + this.turnPrize
    this.cappedTotalTurnPrize = 0; //for pModel responses: we can't have any cards less or more than actual prize cards

    //returns
    this.turnWinner = null; //this turns winner
  }


  //returns list of all turn prizes -pretty sure I used this in another file.
  getAllTurnPrizes(){
    return this.allTurnPrizes;
  }


  //starts turn
  turn(){
    //draws prize card for turn, and adds in rolled over prize values
    this.turnDraw();
    //checks if any prizes rolled over from last turn and displays them
    this.rollOverPrizes();
    //cycles through all players and let them choose
    this.turnChoose();
    //calculates and displays turn winner
    this.turnWin();
  }//end turn

  //draws prize for turn
  turnDraw(){
    //console.log(`// Prizes Left ${this.game.prizes.getValsSorted()} //`);
    //set turnPrize attrib to prize drawn
    this.turnPrize = this.game.prizes.deal();
    //add prize drawn to list in case of roll overs
    this.allTurnPrizes.push(this.turnPrize);
    //add this turns prize to total turn prize
    this.totalTurnPrize += this.turnPrize.getValue();
    //output drawn prize card
    console.log("Prize Card Drawn: " + this.turnPrize.getName() + ". It has as a value of: " + this.turnPrize.getValue() + " million!");
  }

  //deals with potential roll over prizes from past turns
  rollOverPrizes(){
    if(this.game.rollOverPrizes.length > 0){
      console.log("Additional prize(s) from last turn(s): ");
      //iterate through all roll over prizes and add them to this turn attribs
      for(let prize of this.game.rollOverPrizes){
        this.allTurnPrizes.push(prize);
        this.rollOverPrizesValue += prize.getValue(); //sum rolled over prize values
        console.log(prize.getName() + ": " + prize.getValue() + " million");
      }
      //add roll over prize values to total turn prize
      this.totalTurnPrize += this.rollOverPrizesValue;
      console.log("Total value of prizes this turn: " + this.totalTurnPrize + " million!");
    }
    //Do this regardless:
    //fixes the issue of rolled over prizes adding up to more or less than any actual prize card value
    //Note: FUTURE UPDATE: add another parm to pModel response that takes into account values less or more than actual prize cards for prediction
    //Meant for player prediction, and not card simulation
    if(this.totalTurnPrize > 10){
      this.cappedTotalTurnPrize = 10;
    }else if (this.totalTurnPrize < -5){
      this.cappedTotalTurnPrize = -5;
    }else{
      this.cappedTotalTurnPrize = this.totalTurnPrize;
    }
  }

  //POSSIBLE METHODS OF INPUT SO FAR:
        //this.chooseWithInput(player);
        //this.chooseRandomly(player);
        //this.chooseWithDoubleAbs(player);
        //this.chooseWithMonte(player);

  turnChoose(){
    console.log("Please place a bid!\n");
    //Cycle through all players and let them choose
    for (var player of this.game.playerList){
      //If player is an AI.. else...
      if (player.aiEnable === 1){
        //console.log(`-AI- Hand: ${player.mCards.getVals()}`);
        //If we have heuristic data, then the ai can use it to make it's choices, otherwise use something else
        if (this.game.pModelFileIsEmpty == true) { //file is empty: no heuristic data to use: resort to backup methods
          this.chooseWithMonte(player);
        } else {
          //initialize and run predicting algorithm
          var predict = new predictor(this, player);
          console.log("The A.I is thinking...")
          var cardVal = predict.canWin(player, this.totalTurnPrize);

          // var predict2 = new predictor(this, player);
          // var cardValUsingPredicted = predict2.canWinWithPredicted(player, this.cappedTotalTurnPrize, cardVal);
          // //console.log(`Card Value Using Predicted Card Value: ${cardValUsingPredicted}`);

          let cardName = cardVal + "k";
          let cardIndex = player.mCards.deck.findIndex(card => card.name === cardName);
          player.mCards.deck.splice(cardIndex, 1);
          player.numMcards--;
          player.currCard = new Card(cardName, cardVal);
        }
      } else {
        console.log(player.getName() + "'s hand: " + player.mCards.getVals());
        //Initialize a Response for player
        let response = new Response(null, player.mCards.getVals(), player.currScore, this.game.getOtherPlayerNames(player), this.game.prizes.getValsSorted(), this.totalTurnPrize);
        //Let play choose via console input
        this.chooseWithInput(player);
        //Set response -> get player model -> push response -> update playerModels
        response.cardSelected = player.currCard;
        let thisPlayersModel = this.game.getPModel(player.getName());
        thisPlayersModel.add(response, this.cappedTotalTurnPrize);
        this.game.playerModels.set(player.getName(), thisPlayersModel);
      }
    }
    //Console output for player choices
    this.printChosenCards();
  }

  //chooses card closest to the absolute value of double the total turn prize
  chooseWithDoubleAbs(player){
    let chosenCard = null;
    let prizeVal = Math.abs(this.totalTurnPrize)*2;
    chosenCard = player.mCards.getClosestCard(prizeVal);
    let currCardIndex = player.mCards.deck.findIndex(card => card.getValue() === chosenCard.getValue());
    player.mCards.deck.splice(currCardIndex, 1);//remove chosenCard from hand
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = chosenCard; //set current card to best card
  }

  chooseRandomly(player){
    let min = 0;
    let max = player.numMcards;
    let random = Math.floor(Math.random() * max) + min;
    let chosenCard = player.mCards.deck[random];
    player.mCards.deck.splice(random, 1);
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = chosenCard; //set current card to best card
  }

  //Chooses based on data from psuedo montecarlo algorithm
  chooseWithMonte(player){
    //Simulate this turn with monteCarlo:
    let mC = new monteCarlo(this, player);
    let bestCard = mC.runMc();
    //find the chosen best card in player hand, remove it, and decrement remaining cards
    let currCardIndex = player.mCards.deck.findIndex(card => card.name === bestCard.getName());
    player.mCards.deck.splice(currCardIndex, 1);//remove chosenCard from hand
    player.numMcards--; //decrement number of mcards remaining
    player.currCard = bestCard; //set current card to best card
  }

  //Chooses via manual console input
  chooseWithInput(player){
    let cardVal = parseInt(readlineSync.question("Enter card num: ", {
    }));
    let cardExists = player.mCards.deck.some(el => el.getValue() === cardVal);

    while(!cardExists){
      console.log("This card does not exist in your hand.");
      cardVal = parseInt(readlineSync.question("Enter card num: ", {
      }));
      cardExists = player.mCards.deck.some(el => el.getValue() === cardVal);
    }

    let cardName = cardVal + "k";
    let cardIndex = player.mCards.deck.findIndex(card => card.name === cardName);

    player.mCards.deck.splice(cardIndex, 1);
    player.numMcards--;
    player.currCard = new Card(cardName, cardVal);
  }

  //Outputs cards that were chosen
  printChosenCards(){
    for (let player of this.game.playerList){
      console.log(player.name + " selected: " + player.currCard.getName());
    }
  }

  //Finds out who won the turn
  turnWin(){
    //calculate turn winner based on their currCard and the current total prize value
    this.turnWinner = this.calculateTurnWinner(this.totalTurnPrize);
    //if there is no winner, roll over
    if (this.turnWinner == null){
      console.log("All cards cancelled out so the prize rolls over to the next turn!");
      this.game.rollOverPrizes.push(this.turnPrize);
    }else{
      //output winner, sum score, and reset rollover and total prize value
      console.log("This turns winner is: " + this.turnWinner.getName());

      this.turnWinner.currScore += this.totalTurnPrize;
      this.game.rollOverPrizes = []; //reset rollOverPrizes after they are won
      this.allTurnPrizes = [];
      this.totalTurnPrize = 0;
      //outputs each players total score
      this.printScores();
    }
  }

  //Helper for turnWin()
  calculateTurnWinner(turnPrize){
    //first remove any players that played the card with the same values
    let uniqueVals = this.uniqueCardPlayers();
    //find the players in uniqueVals that has highest and lowest 'value' card in currCard
    let highestValPlayer = this.getHighestValPlayer(uniqueVals);
    let lowestValPlayer = this.getLowestValPlayer(uniqueVals);
    if(uniqueVals === []){ //if everyone placed the same card, the prize rolls over
      return null;
    }else if(this.totalTurnPrize > 0){
      //if the drawn card was positive, highest val player gets it
      return highestValPlayer;
    }else{
      //otherwise, the lowest val player gets it
      return lowestValPlayer;
    }
  }//end calculateTurnWinner

  //Outputs player scores
  printScores(){
    for(let player of this.game.playerList){
      console.log("\n" + player.getName() + "'s total prize score is: " + player.currScore);
    }
  }

  //Below are more helpers for turnWin -> calculateTurnWinner
  //Players who didn't play the same card
  uniqueCardPlayers(){
    var uniqueVals = [];
    var dupes = [];
    //iterate through the playerList and compare each player to one another for dupes
    for(let i=0; i<this.game.playerList.length; i++){
      var currPlayer = this.game.playerList[i];
      for(let j=0; j<this.game.playerList.length; j++){
        //we continue if the comparison was with oneself
        if (currPlayer.getName() == this.game.playerList[j].getName()){
          continue; //if comparing with the same player, skip to next
        }else if(currPlayer.currCard.getValue() == this.game.playerList[j].currCard.getValue()){
          dupes.push(currPlayer);
          dupes.push(this.game.playerList[j]);
        }else{
          continue;
        }
      }
      if(!dupes.includes(currPlayer)){uniqueVals.push(currPlayer);}
    }
    return uniqueVals;
  }

  getHighestValPlayer(uniqueValPlayers){
    var highestVal = 0;
    var highestPlayer;
    for(let player of uniqueValPlayers){
      if(player.currCard.getValue() > highestVal){
        highestVal = player.currCard.getValue();
        highestPlayer = player;
      }else{
        continue;
      }
    }return highestPlayer;
  }

  getLowestValPlayer(uniqueValPlayers){
    var lowestVal = Infinity;
    var lowestPlayer;
    for(let player of uniqueValPlayers){
      if(player.currCard.getValue() < lowestVal){
        lowestVal = player.currCard.getValue();
        lowestPlayer = player;
      }else{
        continue;
      }
    }return lowestPlayer;
  }

} //end turn class

module.exports = {
  Turn
};


//array utility remove:
function removeA(arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
      what = a[--L];
      while ((ax= arr.indexOf(what)) !== -1) {
          arr.splice(ax, 1);
      }
  }
  return arr;
}