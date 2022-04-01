let innovator = top.aras.IomInnovator;

function getSignOffs() {
    let signOffList = [];
    let activities = getActivities();
    if (activities.isError()) return signOffList;
    
    for (let i = 0; i < activities.getItemCount(); i++) {
        const activity = activities.getItemByIndex(i);
        let soAct = convertToSignoff(activity);
        if (soAct) {
            signOffList.push(soAct);
        }
        
    }

    console.log("getSignOffs");
    
    
    // let signOffActivity = { 
    //     "id": "ABC", 
    //     "description": "New thing to sign off", 
    //     "voteOptions": ["approve", "reject"]};
    // signOffList.push(signOffActivity);
    
    // signOffActivity = {
    //     "id": "ABD", 
    //     "description": "Another thing to sign off", 
    //     "voteOptions": ["approve", "reject"]};
    // signOffList.push(signOffActivity);
    
    return signOffList;
}

function convertToSignoff(activity) {
    let signOffActivity = new Object();
    signOffActivity.id = activity.getID();
    signOffActivity.assignmentId = activity.getItemsByXPath(".//Item[@type='Activity Assignment']").getID();

    let sourceItem = getSourceItem(signOffActivity.id);
    if (sourceItem.isError()) return null; // Probably deleted Source Item
    let description = sourceItem.getProperty("item_number") + ": " + sourceItem.getProperty("title")
    signOffActivity.description = description;
    signOffActivity.voteOptions = [];
    let paths = activity.getItemsByXPath(".//Item[@type='Workflow Process Path']");
    for (let i = 0; i < paths.getItemCount(); i++) {
        const pathItem = paths.getItemByIndex(i);
        const pathName = pathItem.getProperty("name");
        const pathId = pathItem.getID();
        let path = new Object();
        path.name = pathName;
        path.id = pathId;
        signOffActivity.voteOptions.push(path);
    }
    return signOffActivity;
}


function getSourceItem(activityId) {
    let aml = `<AML>
        <Item action='get' type='Workflow Process' select='name'>
            <Relationships>
                <Item action='get' type='Workflow Process Activity'>
                    <related_id>
                        <Item action='get' type='Activity' select='id' id='${activityId}' />
                    </related_id>
                </Item>
            </Relationships>
        </Item>
    </AML>`;
    let workflowProcess = innovator.applyAML(aml);
    
    let wfpId = workflowProcess.getID();
    aml = `<AML>
        <Item action='get' type='Workflow' select='source_id,source_type'>
            <related_id>${wfpId}</related_id>
        </Item>
    </AML>`;
    let workflow = innovator.applyAML(aml);
    if (workflow.isError()) {
        return workflow; // Use Case: When Source Item has been deleted.
    } 
    let itemType = workflow.getPropertyAttribute("source_type", "keyed_name");
    let sourceId = workflow.getProperty("source_id","N/A");

    aml = `<AML>
        <Item action='get' type='${itemType}' id='${sourceId}' select='item_number,title' >
        </Item>
    </AML>`;

    let sourceItem = innovator.applyAML(aml);
    return sourceItem;
}

function getActivities() {
    let identityId = aras.user.identityId;
    let aml = `<AML>
        <Item action='get' type='Activity' orderBy='created_on DESC' select='message,name'>
        <closed_date condition='is null'></closed_date>
        <state>Active</state>
        <Relationships>
            <Item action='get' type='Activity Assignment' select='id'>
            <related_id>${identityId}</related_id>
            </Item>
            <Item action='get' type='Workflow Process Path' select='name'></Item>
        </Relationships>
        </Item>
    </AML>`;
    let result = innovator.applyAML(aml);
    let activityCount = result.getItemCount();
    console.log({activityCount});
    return result;
}

function applyVoteForFieldSet(fieldSet,hashedPwd) {
    debugger;
    let activityId = fieldSet.getAttribute("id");
    let assignmentId = fieldSet.getAttribute("assignmentId");

    let select = fieldSet.querySelector("select");
    let pathId = select.value;
    let comments = fieldSet.querySelector("textarea").value;
    let result = applyVote(activityId,assignmentId,pathId,hashedPwd,comments);
    console.log({result});
    return result;
}

function applyVote(activityId, assignmentId, pathId,  pwdHash, comments) {
    let AuthMode = "password";
    let body = "";
    body += '<Item type="Activity" action="EvaluateActivity">';
    body += "<Activity>" + activityId + "</Activity>";
    body += "<ActivityAssignment>" + assignmentId + "</ActivityAssignment>";

    body += "<Paths>";
    body += "<Path id='" + pathId + "'></Path>";
    body += "</Paths>";
    body += "<Tasks/>";
    body += "<Variables/>";
    body += "<Authentication mode='" + AuthMode + "'>" + pwdHash + "</Authentication>";
    body += "<Comments>" + comments + "</Comments>";
    body += "<Complete>1</Complete>";
    body += "</Item>";

    let aml = "<AML>";
    aml += body;
    aml += "</AML>";
    console.log({aml});
    return innovator.applyAML(aml);
}

