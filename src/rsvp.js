function scrollToBtf() {
  const firstEvent = document.getElementsByClassName("event")[0];
  firstEvent.scrollIntoView({ behavior: "smooth", block: "start" });
}
function updateText(text) {
  const para = document.getElementById("output");
  para.innerText = text;
}
function createGraphqlRequest() {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://ceremony-api.withjoy.com/graphql");
  xhr.setRequestHeader("Content-Type", "application/json");
  return xhr;
}
function queryGuestDetails(guestId) {
  return new Promise((resolve, reject) => {
    const request = createGraphqlRequest();
    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        resolve(JSON.parse(request.responseText).data.event.guestQuestions);
      } else {
        reject(`Error: ${request.status}`);
      }
    };
    const body = JSON.stringify({
      "query":"query($eventId:ID!){\nevent(eventId:$eventId){\nguestQuestions{\nperson{\nhouseholdId\npersonId:personKey\nname\nfirstName\nlastName\n}\nreadableQuestions{\nid\nquestionText\nanswer{\ndisplayValue\n}\n}\n}\n}\n}",
      "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff"}
    });
    request.setRequestHeader("x-joy-personid",  guestId);
    request.send(body);
  });
}
/**
 * @param {String} HTML representing a single element.
 * @param {Boolean} flag representing whether or not to trim input whitespace, defaults to true.
 * @return {Element | HTMLCollection | null}
 */
function fromHTML(html, trim = true) {
  // Process the HTML string.
  html = trim ? html.trim() : html;
  if (!html) return null;

  // Then set up a new template element.
  const template = document.createElement('template');
  template.innerHTML = html;
  const result = template.content.children;

  // Then return either an HTMLElement or HTMLCollection,
  // based on whether the input HTML had one or more roots.
  if (result.length === 1) return result[0];
  return result;
}
function createRsvpTableRow(guestName, guestId, answers) {
  const row = fromHTML('<tr><td><div>' + guestName +
    '<input type="radio" id="yes-'+guestId+'" name="rsvp-'+guestId+'" value="Yes">' +
    '<label for="yes-'+guestId+'">Yes</label>' +
    '<input type="radio" id="no-'+guestId+'" name="rsvp-'+guestId+'" value="No">' +
    '<label for="no-'+guestId+'">No</label><br>' +
    'Notes <input type="text" id="notes-'+guestId+'" name="notes"></div></td></tr>');
  const table = document.getElementById("table");
  table.append(row);
  if (answers["rsvp"] === "Y") {
    const button = document.getElementById("yes-" + guestId);
    button.setAttribute("checked", "checked");
  }
  if (answers["rsvp"] === "N") {
    const button = document.getElementById("no-" + guestId);
    button.setAttribute("checked", "checked");
  }
  if (answers["funFact"]) {
    const textInput = document.getElementById("notes-" + guestId);
    textInput.setAttribute("placeholder", answers["funFact"]);
  }
}
function displayGuestDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestIdPromise = urlParams.get("id");
  queryGuestDetails(guestIdPromise, (guestQuestions) => {
    /*
[
  {
    "person": {
      "householdId": "person-invitee-NrWtyR7vkrJ2H9Ox3rx",
      "personId": "person-invitee-NrWtyR7vkrJ2H9Ox3rx",
      "name": "Rahul Jaisimha"
    },
    "readableQuestions": [
      {
        "id": "rsvp",
        "questionText": "Will you be able to join us at our wedding? Kindly reply by the date of ____.",
        "answer": {
          "displayValue": "Y"
        }
      },
      {
        "id": "address",
        "questionText": "What is your mailing address?",
        "answer": {
          "displayValue": "address"
        }
      },
      {
        "id": "funFact",
        "questionText": "Notes",
        "answer": {
          "displayValue": "love"
        }
      }
    ]
  },
  {
    "person": {
      "householdId": "person-invitee-NrWtyR7vkrJ2H9Ox3rx",
      "personId": "person-invitee-NrWtyV7hSV8I4xiP9dh",
      "name": "Aditi Verma"
    },
    "readableQuestions": [
      {
        "id": "rsvp",
        "questionText": "Will you be able to join us at our wedding? Kindly reply by the date of ____.",
        "answer": {
          "displayValue": "Y"
        }
      },
      {
        "id": "funFact",
        "questionText": "Notes",
        "answer": {
          "displayValue": "boogaloo"
        }
      }
    ]
  }
]
    */
    guestQuestions.forEach((guestQuestion) => {
      const guestId = guestQuestion.person.personId;
      const guestName = guestQuestion.person.name;
      const guestFirstName = guestQuestion.person.firstName;
      const guestLastName = guestQuestion.person.lastName;
      const answers = Object.assign({}, ...guestQuestion.readableQuestions.map((question) => ({[question.id]: question.answer.displayValue})));
      createRsvpTableRow(guestName, guestId, answers);
    });
  });
}
function getAnswers(guestQuestion) {
  return Object.assign({}, ...guestQuestion.readableQuestions.map((question) => ({[question.id]: question.answer.displayValue})));
}
async function updateRsvpFormWithGuestInfo(guestId) {

  const form = document.getElementById("form");
  const parentElement = form.parentElement;
  const newForm = fromHTML('<form id="form"></form>');

  function handleForm(event) { event.preventDefault(); } 
  newForm.addEventListener('submit', handleForm);

  // Get guest details from guestId
  const guestQuestions = await queryGuestDetails(guestId);

  form.remove();
  parentElement.appendChild(newForm);

  const metadata = JSON.stringify(guestQuestions);
  const metadataInput = fromHTML('<input type="hidden" id="metadata" name="metadata" value=\'' + metadata + '\'>');
  newForm.appendChild(metadataInput);

  guestQuestions.forEach((guestQuestion, index, array) => {
    const personId = guestQuestion.person.personId;
    const guestName = guestQuestion.person.name;
    const guestFirstName = guestQuestion.person.firstName;
    const guestLastName = guestQuestion.person.lastName;
    const answers = getAnswers(guestQuestion);

    const guestDetails = fromHTML('<div class="rsvp-answers"><div><span class="gravity-font">' + guestFirstName +
      '</span><br><span class="maxi-font">' + guestLastName +
      '</span></div><div class="radio-buttons rsvp-answers"><label class="sq-radio" for="yes-' + personId +
      '">Yes<input type="radio" id="yes-' + personId + '" name="rsvp-' + personId +
      '" value="Yes"><span class="checkmark"></span></label><label class="sq-radio" for="no-' + personId +
      '">No<input type="radio" id="no-' + personId + '" name="rsvp-' + personId +
      '" value="No"><span class="checkmark"></span></label></div></div>');

    newForm.appendChild(guestDetails);

    if (answers["rsvp"] === "Y") {
      const button = document.getElementById("yes-" + personId);
      button.setAttribute("checked", "checked");
    }
    if (answers["rsvp"] === "N") {
      const button = document.getElementById("no-" + personId);
      button.setAttribute("checked", "checked");
    }

    if (index !== array.length - 1){ 
      const andDelimiter = fromHTML('<div class="rsvp-and">AND</div>');
      newForm.appendChild(andDelimiter);
    }
  });

  const outputText = fromHTML('<p id="output"></p>');
  const submitButton = fromHTML('<button class="rsvp noSelect color" onclick="saveGuestResponse()">ENTER</button>');
  newForm.appendChild(outputText);
  newForm.appendChild(submitButton);

  // resize bottom sheet to new height
  const bottomSheet = document.getElementById('bottomSheet');
  const bottomSheetContent = document.getElementById('bottomSheetContent');
  bottomSheet.style.height = (bottomSheetContent.scrollHeight + 28) + "px"; // Don't know why but the submit button isn't being factored in
}
async function saveGuestResponse(bangalore) {
  updateText("Saving...");
  const guestQuestions = JSON.parse(document.getElementById("metadata").value);
  const promises = [];
  guestQuestions.forEach((guestQuestion, index, array) => {
    const personId = guestQuestion.person.personId;
    const guestName = guestQuestion.person.name;
    const guestFirstName = guestQuestion.person.firstName;
    const guestLastName = guestQuestion.person.lastName;
    const answers = getAnswers(guestQuestion);
    const rsvpSelection = document.querySelector('input[name="rsvp-' + personId + '"]:checked').value === "Yes";
    const bangaloreRsvp = bangalore ? "Y" : "N";
    promises.push(sendRsvp(guestFirstName, guestLastName, personId, rsvpSelection, bangaloreRsvp));
  });
  await Promise.all(promises);
  updateText("Saved");
}
async function findMatchingGuest() {
  updateText("Loading...");
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const guestId = await new Promise((resolve, reject) => {
    const request = createGraphqlRequest();
    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        const response = JSON.parse(request.responseText);
        const matchCount = response.data.event.getPersonMatchResult.matchCount;
        if (matchCount > 0) {
          const matchId = response.data.event.getPersonMatchResult.match.personKey;
          resolve(matchId);
        } else {
          resolve();
        }
      } else {
        reject(`Error: ${request.status}`);
      }
    };
    const body = JSON.stringify({
      "query":"\nquery PersonMatchWithEmail($eventId: ID!, $firstName: String!, $lastName: String!, $email: String) {\n  event(eventId: $eventId) {\n    getPersonMatchResult(firstName: $firstName, lastName: $lastName, email: $email) {\nmatchCount\nmatch{\npersonKey\n}\n}\n}\n}\n",
      "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff","firstName":fname,"lastName":lname,"email":""}
    });
    request.send(body);
  });
  if (typeof guestId !== "undefined") {
    updateRsvpFormWithGuestInfo(guestId);
  } else {
    updateText("No guest found with name " + fname + " " + lname);
  }
}
function sendRsvp(fname, lname, personId, rsvpSelection, bangaloreRsvp) {
  const inviteeId = personId.replace('person-invitee', '');
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", 'https://ceremony-api.withjoy.com/events/eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff/invites/' + inviteeId + '/sendRSVPCompleteToUser');
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseText);
      } else {
        reject(`Error: ${request.status}`);
      }
    };
    const body = JSON.stringify({
      "targetInviteeData": {
        "name": fname + " " + lname,
        "email": "",
        "personKey": "person-invitee" + inviteeId,
        "keys": {
          "userIds": [],
          "inviteeIds": [
            inviteeId
          ]
        }
      },
      "rsvpResponses": [
        {
          "key": "contact",
          "question": "What is your contact info?",
          "title": "Contact Info",
          "answer": {
            "personKey": "person-invitee" + inviteeId,
            "name": fname + " " + lname,
            "email": "",
            "keys": {
              "users": [],
              "invitees": [
                inviteeId
              ]
            }
          }
        },
        {
          "key": "rsvp",
          "question": "Will you be able to join us at our wedding? Kindly reply by the date of ____.",
          "title": "RSVP",
          "answer": "Joyfully Accept",
          "boolean_answer": rsvpSelection
        },
        {
          "key": "address",
          "question": "When does your flight arrive?",
          "title": "arrival",
          "answer": ""
        },
        {
          "key": "funFact",
          "question": "When does your flight depart?",
          "title": "departure",
          "answer": ""
        },
        {
          "key": "-NvTpKRM_M8iI6U5AVO2",
          "question": "Will you be attending Bangalore?",
          "title": "Bangalore",
          "answer": bangaloreRsvp
        }
      ],
      "getTheAppLinkData": {
        "eventId": "eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff",
        "firstName": fname,
        "lastName": lname,
        "email": "",
        "personKey": "person-invitee" + inviteeId,
        "personData": {
          "userIds": [],
          "inviteeIds": [
            inviteeId
          ]
        }
      }
    });
    request.send(body);
  });
}
function showRsvpModal() {
  const modal = document.getElementById("form-modal");
  const overlay = document.getElementById("modal-overlay");
  overlay.style.display = "unset";
  modal.style.display = "unset";
}
function hideRsvpModal() {
  const modal = document.getElementById("form-modal");
  const overlay = document.getElementById("modal-overlay");
  overlay.style.display = "none";
  modal.style.display = "none";
}
function showBottomSheet() {
  const bottomSheet = document.getElementById('bottomSheet');
  bottomSheet.style.height = bottomSheet.scrollHeight + "px";
  document.getElementById("modal-overlay").style.display = "unset";
}
function hideBottomSheet() {
  document.getElementById('bottomSheet').classList.remove('open');
  bottomSheet.style.height = "0";
  document.getElementById("modal-overlay").style.display = "none";
}