let aras = top.aras;
let topWnd = top.window;

function initPage() {
    document.getElementById("completeButton").addEventListener("click", executeComplete);
    document.getElementById("refresh-button").addEventListener("click",loadSignOffs);
    loadSignOffs();
}

function loadSignOffs(event) {
    clearExistingSignoffsFromDOM();
    console.log({event});
    addSignOffs()
    document.querySelectorAll('.voteOptions').forEach(item => {
        item.addEventListener('change', voteOptionsChange);
    });
}

function clearExistingSignoffsFromDOM() {
    let parentDiv = document.getElementById("signoffList");
    document.querySelectorAll("fieldset.signoff").forEach(item => {
        parentDiv.removeChild(item);
    });
}

function addSignOffs() {
    let signOffs = getSignOffs();
    for (let i = 0;i<signOffs.length;i++) {
        let signOff = signOffs[i];
        addSignOff(signOff.id, signOff.assignmentId ,signOff.description, signOff.voteOptions);
    }   
}

function addSignOff(id, assignmentId, description, options) {
    // Test to see if the browser supports the HTML template element by checking
    // for the presence of the template element's content attribute.
    if ('content' in document.createElement('template')) {
        let signOffsDiv = document.querySelector("#signoffList");
        let template = document.querySelector('#signoffTemplate');
        
        let clone = template.content.cloneNode(true);
        clone.querySelector("fieldSet").setAttribute("id",id);
        clone.querySelector("fieldSet").setAttribute("assignmentId",assignmentId);
        let descDiv = clone.querySelector(".signoff_description");
        descDiv.textContent = description;

        let select = clone.querySelector("select.voteOptions");
        options.forEach(option => {
            let optionEl = document.createElement("option");
            optionEl.setAttribute("value",option.id);
            optionEl.textContent = option.name;
            select.appendChild(optionEl);
        });
                
        signOffsDiv.appendChild(clone);

    } 
    else {
       // Find another way to add the rows to the table because
        // the HTML template element is not supported.
    }
}



async function executeComplete() {
  console.info("executeComplete");
  if (!verifyPassword()) return;

  let progress = document.getElementById("vote-progress");
  progress.value = 0;
  toggleProgressBarOn();
  
  let fieldSetsToVote = getFieldSetsToVote();
  let numberOfItemsToProcess = fieldSetsToVote.length;
  
  for (let i = 0; i < fieldSetsToVote.length; i++) {
      const fieldSet = fieldSetsToVote[i];
      await sleep(1000);
      let voteResult = applyVoteForFieldSet(fieldSet,hashedPwd);
      if (!voteResult.isError()) {
        fieldSet.style.display = 'none';
      }
      else {
        let resultDiv = fieldSet.querySelector(".resultMessage");
        resultDiv.textContent = voteResult.getErrorString();
      }
      
      progress.value = (i+1)*100/numberOfItemsToProcess;
  
  }
  
  clearPassword();

  // Hide when done after a second
  setTimeout(toggleProgressBarOff,1000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clearPassword() {
    let pwd =  document.getElementById("pwd");
    pwd.innerText = '';
    pwd.value = '';   
}

function toggleProgressBarOn() {
    console.log("toggleProgressBarOn");
    toggleProgressBar(true);
}

function toggleProgressBarOff() {
    console.log("toggleProgressBarOff");
    toggleProgressBar();
}

function toggleProgressBar(on) {
    debugger;
    console.log({on});
    let progressWrapper = document.getElementById("progress-wrapper");
    if (on) {
        progressWrapper.style.display = 'block';
    }
    else {
        progressWrapper.style.display = 'none';
    }
}


let hashedPwd;

function verifyPassword() {
    let pwd = document.getElementById("pwd").value;
    if (!pwd && pwd.length == 0) {
        aras.AlertError("Password required.", undefined, undefined, topWnd.window);
    }
    hashedPwd = md5(pwd);
    console.log({hashedPwd});
    // Copied code from Client\scripts\InBasket\InBasket-VoteDialog.aspx
    var resultXML = aras.ValidateVote(hashedPwd, "password");
    if (!resultXML) {
        aras.AlertError(aras.getResource("", "common.an_internal_error_has_occured"), aras.getResource("", "inbasketvd.validatevote_resultxml_empty"), aras.getResource("", "common.client_side_err"),aras.getMostTopWindowWithAras(window));
        return false;
    }

    var result = resultXML.selectSingleNode(aras.XPathResult());
    if (result.text != "pass") {
        aras.AlertError(aras.getResource("", "inbasketvd.pwd_invalid"), undefined, undefined, topWnd.window);
        return false;
    }
    console.log("Verified");
    return true;
}


function getFieldSetsToVote() {
    let items = [];
    let fieldSets = document.querySelectorAll("fieldSet.signoff");
    for (let i = 0; i < fieldSets.length; i++) {
        const fieldSet = fieldSets[i];
        let select = fieldSet.querySelector("select");
        let selectedValue = select.value;
        if (selectedValue && selectedValue.length > 0)  {
            items.push(fieldSet);
        }
    }
    return items;
}

function voteOptionsChange(event) {
  //handle click
  let valueSelect = event.target.value;
  console.info({valueSelect});
  let section = event.target.parentElement;
  
  if (valueSelect && valueSelect.length > 0) {
    section.classList.add("isSelected");  
  }
  else {
    section.classList.remove("isSelected");
  }
}

initPage();
