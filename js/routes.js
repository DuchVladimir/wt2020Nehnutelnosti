
import { render } from "mustache";
//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML,

    },


    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },


    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },


    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: createHtml4addOpinions

    },
    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    },
    {
        hash:"main",
        target:"router-view",
        getTemplate:createHtml4Main
    }
];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage =20;

function createHtml4Main(targetElm, current,totalCount){

    current=parseInt(current);
    totalCount=parseInt(totalCount);
    const data4rendering={
        currPage:current/articlesPerPage,
        currPageShow:current/articlesPerPage+1,
        pageCount:totalCount,
        pageCountShow:totalCount/articlesPerPage+1
    };



    if(current>1){
        data4rendering.prevPage=current-articlesPerPage;
        data4rendering.prevPage1=current-articlesPerPage+1;
    }

    if(current<totalCount){
        data4rendering.nextPage=current+articlesPerPage;
    }


    document.getElementById(targetElm).innerHTML = render(
        document.getElementById("template-main").innerHTML,
        data4rendering
    );


    /*
        return `<h1>Main Content</h1>
                ${current} <br>
                ${totalCount} <br>
                ${JSON.stringify(data4rendering)}
                `;
    */


}


function createHtml4addOpinions(targetElm) {
    document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
    document.getElementById("nameElm").value=getUserName();
    document.getElementById("emlElm").value=getUserEmail();
}

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.createdDate = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"Dozvedel som sa Äo som potreboval. ":"Nedozvedel som sa Äo som potreboval.";
        });
    }

    document.getElementById(targetElm).innerHTML = render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}


function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash){
    const offset=Number(offsetFromHash);
    const totalCount=Number(totalCountFromHash);

    let urlQuery = "";

    if (offset && totalCount){
        urlQuery=`?offset=${offset}&max=${articlesPerPage}`;
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }

    const url = `${urlBase}/article${urlQuery}`;


    let tmpHtmlElm2CreatePreview = document.createElement("div");
    const articlesElm = document.getElementById(targetElm);
    const errorElm = document.getElementById("error");
    const previewStringLenght=20;
    const serverUrl = "http://wt.kpi.fei.tuke.sk/api/article";

    let articleList =[];

    fetch(url)  //there may be a second parameter, an object wih options, but we do not need it now.
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Failed to access the list of articles. Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            articleList=responseJSON.articles;
            console.log(JSON.parse(JSON.stringify(articleList)));
            return Promise.resolve();
        })
        .then( ()=> {
            let cntRequests = articleList.map(
                article => fetch(`${serverUrl}/${article.id}`)
            );

            return Promise.all(cntRequests);
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{

                //create the content preview string and add it to the article object in the articleList
                tmpHtmlElm2CreatePreview.innerHTML=article.content;
                articleList[index].contentPrev=tmpHtmlElm2CreatePreview.textContent.substring(0,previewStringLenght)+"...";

            });
            console.log(JSON.parse(JSON.stringify(articleList)));
            return Promise.resolve();
        })
        .then( () => {
            let commRequests = articleList.map(
                article => fetch(`${serverUrl}/${article.id}/comment`)
            );
            return Promise.all(commRequests)
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the comments with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(comments => {
            comments.forEach((artComments,index) =>{
                articleList[index].comments=artComments.comments;
            });

            return Promise.resolve();
        }).then( () =>{
        renderArticles(articleList);

    })
        .then( () =>{
            createHtml4Main("main",offset,totalCount);

        })
        .catch(error => errorHandler && errorHandler(error));



    function errorHandler(error) {
        errorElm.innerHTML=`Error reading data from the server. ${error}`; //write an error message to the page
    }

    function renderArticles(articles) {
        articlesElm.innerHTML=render(document.getElementById("template-articles").innerHTML, articles); //write some of the response object content to the page using Mustache
    }



}

function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}





function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
let articleID;

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    articleID=artIdFromHash;
    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {

            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;


                document.getElementById(targetElm).innerHTML =
                    render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            }else{

                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                   render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}

function deleteArticle(targetElm, urlBase) {
    const targettElm = document.getElementById(targetElm);

    const id2Delete = articleID;

    const deleteReqSettings =
        {
            method: 'DELETE'
        };
    //3. Execute the request
    targettElm.innerHTML=`Attempting to delete article with id=${id2Delete}<br />... <br /> <br />`;

    fetch(`${urlBase}/article/${id2Delete}`, deleteReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                targettElm.innerHTML+=`Article successfully deleted.`; //no response this time, so we end here
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .catch(error => { ////here we process all the failed promises
            targettElm.innerHTML+=`Attempt failed. Details: <br />  ${error}`;
        });

}




