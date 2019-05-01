/**Class representing monte carlo search algorithm*/


const { Deck } = require("./cards.js");
const { State } = require("./state.js");
const cloneDeep = require('../node_modules/lodash/cloneDeep');
const { gameSim } = require("./gameSim.js");

//turns console logs off
var console = {};
console.log = function(){};

class monteCarlo{

  constructor(turn, player, predictedVal){
    //Deep clones to set mc per simulation back to current turn
    this.frozenTurn = cloneDeep(turn); //do not touch
    this.playerCopy = cloneDeep(player); //do not touch

    //Maintain state/turn details
    this.turn = cloneDeep(this.frozenTurn);
    this.player = player;
    this.state = new State(this.turn); //state holds important turn properties
    this.newSimGame = null; //holds gameSim instance


    //Simulation Stats
    this.thePrize = this.turn.turnPrize;
    this.simGameNum = 0;
    this.simRuns = 1000;
    this.simWins = 0;
    this.cardsThatWon = new Deck().createMoneyCountDeck(); //[Card, numberOfWins];

    //for prediction
    this.totalPrize = 0;

    //Prediction Simulation Stats
    this.losingCards = [];
    this.winningCards = [];

    //value predicted by prediction alg to simulate games again using this one as "winCard"
    //and determine the chances of winning if that card was played for the totalTurnPrize
    this.predictedVal = null || predictedVal;

  }

  //sets certain attribs back to start of current turn
  resetMC(){
    this.turn = cloneDeep(this.frozenTurn);
    this.player = cloneDeep(this.playerCopy);
    this.state = new State(this.turn); //state holds important turn properties
    this.newSimGame = null; //holds gameSim instance
  }

  //runs montecarlo alg, and returns the best move
  runMc(){
    let bestMove = this.bestMove(); //find the best move for the current turn
    this.outputStats();
    return bestMove;
  }

  outputStats(){
    console.log("Sim Stats:" + "\nPrize: " + this.thePrize.getName() + ": " + this.thePrize.getValue() + "\nRuns: " + this.simRuns + "\nWins: " + this.simWins + "\nWinRatio: " + (this.simWins/this.simRuns) + "\nCards that have won: " + JSON.stringify(this.cardsThatWon));
  }


  bestMove(){
    //we want to simulate what would happen if we won this prize
    let sims = 0;
    while (sims<this.simRuns){
      this.simulate();
      sims++;
      this.resetMC();
    }
    return this.calculateBestMove(); //using available Mc statistics, figure out optimal card choice
  }

  calculateBestMove(){
    let winChance = this.simWins/this.simRuns; //chance that gaining the current prize will lead to a win
    let bestMove = null;
    //2players = 0.4, 0.4-0.2
    //3players = 0.15, 0.15-0.05
    //win chance must be updated depending on the number of players in the game
    if(winChance >= 0.4){
      bestMove = this.highestChanceCard();
    }else if(winChance < 0.4 && winChance >0.02){
      bestMove = this.midChanceCard();
    }else{
      bestMove = this.lowestChanceCard();
    }
    return bestMove;
  }

  highestChanceCard(){
    let theCard = null;
    let cardWins = 0;
    for(let card of this.cardsThatWon.deck){
      let cardExists = this.player.mCards.deck.some(el => el.getName() === card[0].name);
      if (card[1] >= cardWins && cardExists){
        cardWins = card[1];
        theCard = card[0];
      }
    }return theCard;
  }

  midChanceCard(){
    let theCard = null;
    let cardMaxWins = 0;
    let cardMinWins = Infinity;
    for(let card of this.cardsThatWon.deck){
      let cardExists = this.player.mCards.deck.some(el => el.getName() === card[0].name);
      if (card[1] > cardMaxWins && card[1] < cardMinWins && cardExists){
        cardMaxWins = Math.floor(card[1]/2);
        theCard = card[0];
      }
    }return theCard;
  }

  lowestChanceCard(){
    let theCard = null;
    let cardWins = Infinity;
    for(let card of this.cardsThatWon.deck){
      let cardExists = this.player.mCards.deck.some(el => el.getName() === card[0].name);
      if (card[1] < cardWins && cardExists){
        cardWins = card[1];
        theCard = card[0];
      }
    }return theCard;
  }

  simulate(){
    this.simGameNum++;
    this.newSimGame = new gameSim(this.state, 0);
    this.newSimGame.start();
    //&& this.newSimGame.winner.getName() === this.player.getName()
    if(this.newSimGame.winner != null){this.simWins++;}
    let mergeWinningCards = this.mergeAddArray(this.cardsThatWon.deck, this.newSimGame.bestCards.deck);
    this.cardsThatWon.deck = mergeWinningCards;

  }


  predictionSim(simType){
    this.simGameNum++;
    this.newSimGame = new gameSim(this.turn, this.state, simType, this.player, this.predictedVal);
    this.newSimGame.start();
    var simWinner = this.newSimGame.winner;
    if(simWinner != null && simWinner.getName() === this.player.getName()){
      this.simWins++;
      this.winningCards.push(this.newSimGame.possibleWinCard.getValue());
    }else{
    }
  }

  //merge two bestCard arrays, sums the values
  mergeAddArray(dest, src){
    for(let i=0; i<dest.length; i++){
      if(dest[i][0].getName() === src[i][0].getName()){
        dest[i][1] += src[i][1];
      }
    }//console.log(src);
    return dest;
  }
}


module.exports = {
  monteCarlo
};