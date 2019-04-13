

class State{

  constructor(turn){
    //saved state details:
      this.turn = turn;
      this.playerList = turn.game.getPlayerList();
      this.prizes = turn.game.getPrizes();
      this.currPrizes = turn.getAllTurnPrizes();
  }

}

module.exports = {
  State
};
