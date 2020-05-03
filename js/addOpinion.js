/*
 * Created by Stefan Korecko, 2020
 * Form processing functionality
 */


function processOpnFrmData(event){

    //1.prevent normal event (form sending) processing
    event.preventDefault();

    //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
    const inputs = document.getElementById("opnFrm").elements;
    const nopName = inputs[0].value.trim();
    const nopEmail = inputs[1].value.trim();
    const nopKey = inputs[2].value.trim();
    const nopOpn = inputs[3].value.trim();
    let nopRank;
    if (inputs[4].checked)nopRank = "Dobre"; else if
    (inputs[5].checked)nopRank ="Zle";
    else nopRank ="Neutralne";
    const nopWillReturn = inputs[7].checked;

    //3. Verify the data
    if(nopName=="" || nopOpn==""){
        window.alert("Please, enter both your name and opinion");
        return;
    }

    //3. Add the data to the array opinions and local storage
    const newOpinion =
        {
            willReturn: nopWillReturn,
            rank: nopRank,
            name: nopName,
            email: nopEmail,
            key: nopKey,
            comment: nopOpn,
            created: new Date()
        };


    let opinions = [];

    if(localStorage.myTreesComments){
        opinions=JSON.parse(localStorage.myTreesComments);
    }
    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);


    //5. Go to the opinions
    window.location.hash="#opinions";

}
