const { monteCarlo } = require("./monteCarlo.js");
const readlineSync = require('../node_modules/readline-sync/lib/readline-sync.js');
const { Card } = require("./cards.js");
const { Response } = require("./playerModel.js");
const { predictor } = require("./prediction.js");



class Turn{

  constructor(turnNum, game){
    this.game = game; //what game this turn is apart of
    this.turnNum = turnNum; //turn number
    this.turnPrize = null; //this turns prize
      this.allTurnPrizes = []; //current turn prize and rolled over prize
      this.rollOverPrizesValue = 0; //sum value of rolled over prizes
      this.totalTurnPrize = 0; //sum value of all prizes, including rolled over
    this.turnWinner = null; //this turns winner
  }


  //returns list
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
  }

  turnChoose(){
    console.log("Please place a bid!\n");
    //console.log("Other prizes remaining: "+ this.game.getPrizes().getCardNames());
    //cycle through all players and let them choose


    for (let player of this.game.playerList){
      if (player.aiEnable === 1){
        //this.chooseWithMonte(player);
        //console.log(player.getName() + "'s hand: " + player.mCards.getVals());
        //console.log("Prizes Left: " + this.game.prizes.getValsSorted());

        //first game - employ monte carlo or random or doubleabs
        if(this.game.fileNotEmpty == false){
          //this.chooseWithDoubleAbs(player);
          this.chooseWithMonte(player);
        }else{
          if(this.totalTurnPrize > 10){
            var turnPrize = 15;
          }else if (this.totalTurnPrize < -5){
            var turnPrize = -5;
          }else{
            var turnPrize = this.totalTurnPrize;
          }

            var predict = new predictor(this, player);
            var cardVal = predict.canWin(player, turnPrize);

            let cardName = cardVal + "k";
            let cardIndex = player.mCards.deck.findIndex(card => card.name === cardName);
            player.mCards.deck.splice(cardIndex, 1);
            player.numMcards--;
            player.currCard = new Card(cardName, cardVal);
        }

        //this.chooseWithInput(player);
        //this.chooseRandomly(player);
        //this.chooseWithDoubleAbs(player);
        //this.chooseWithMonte(player);

      }else{
        console.log(player.getName() + "'s hand: " + player.mCards.getVals());
        //Initialize a Response for player
        //Treat Total Turn Prizes Like Regular Prize Cards!

        if(this.totalTurnPrize > 10){
          var responsePrize = 10;
        }else if (this.totalTurnPrize < -5){
          var responsePrize = -5;
        }else{
          var responsePrize = this.totalTurnPrize;
        }

        var response = new Response(null, player.mCards.getVals(), player.currScore, this.game.getOtherPlayerNames(player), this.game.prizes.getValsSorted(), this.totalTurnPrize);

        this.chooseWithInput(player);
        //player.currCard = player.chooseCard();
        //this.chooseWithDoubleAbs(player);
        //this.chooseRandomly(player);

        //PLAYER MODEL UPDATE
        response.cardSelected = player.currCard;
        var thisPlayersModel = this.game.getPModel(player.getName());

        thisPlayersModel.add(response, responsePrize);
        //update playerModel
        this.game.playerModels.set(player.getName(), thisPlayersModel);
        //console.log(thisPlayersModel);
      }
    }this.printChosenCards();
  }

  chooseWithDoubleAbs(player){
    let chosenCard = null;
    let prizeVal = Math.abs(this.totalTurnPrize)*2;
    chosenCard = player.mCards.getCard(prizeVal);
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

  //output chosen cards
  printChosenCards(){
    for (let player of this.game.playerList){
      console.log(player.name + " selected: " + player.currCard.getName());
    }
  }

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
  //outputs every players score
  printScores(){
    for(let player of this.game.playerList){
      console.log("\n" + player.getName() + "'s total prize score is: " + player.currScore);
    }
  }

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

  //players who didn't play the same card
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