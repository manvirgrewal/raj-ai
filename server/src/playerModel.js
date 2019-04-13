
class pModel{

    //adds an individual response to a list of all responses 
    //then maps prize -> allResponses
    constructor(aModel){
        this.allResponses = []; //array of all responses to a prize 
        //a map of all prizes, each with an array of all it's response objects 
        this.responses = new Map(); //[[prize, allResponses],... [prizeN, allResponsesN]]
        if(aModel){
            this.responses = aModel.responses;
        }
        /*
            [  
                [   prize, [ResponseObj1, ResponseObj2, ...ResponseObjN]     ], 
                
                [   prize2, [ResponseObj1, ResponseObj2, ...ResponseObjN]     ]   
                                                                                ]  
                                                                                    */
    }

    //adds response to a specific prize
    add(response, prize){
        var oldAllResponses = this.responses.get(prize); //array of oldallResponses
        if(oldAllResponses == null){
            this.responses.set(prize, [JSON.stringify(response)]);
        }else{
            oldAllResponses.push(JSON.stringify(response)); //push responses to oldallResponses
            this.responses.set(prize, oldAllResponses); //update the prize -> allResponses map 
        }
    }


}

class Response{
    //gathers response of player to the last turns attributes ie. what they played for the drawn prize 
    constructor(cardSelected, handAtResp, scoreAtResp, playersAtResp, prizesAtResp, totalTurnPrize){
        this.cardSelected = cardSelected; //Card{'name':'2k','value':2}
        this.handAtResp = handAtResp; //[1,2,3,4,5]
        this.scoreAtResp = scoreAtResp; //20
        this.playersAtResp = playersAtResp; //["Manvir":Response*, "Glafki":Response*]
        this.prizesAtResp = prizesAtResp; //[2mil, 5mil, 10mil]
        this.totalTurnPrize = totalTurnPrize; //sum of curr prize + rolled over prizes 
    }

}

module.exports = {
    pModel, 
    Response
};