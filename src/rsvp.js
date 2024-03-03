function updateText(text) {
  const para = document.getElementById("output");
  para.innerText = text;
}
function createGraphqlRequest(successCallback) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://ceremony-api.withjoy.com/graphql");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      successCallback(JSON.parse(xhr.responseText));
    } else {
      console.log(`Error: ${xhr.status}`);
    }
  };
  return xhr;
}
function queryGuestDetails(guestId, successCallback) {
  const request = createGraphqlRequest((response) => {
    successCallback(response.data.event.guestQuestions);
  });
  const body = JSON.stringify({
    "query":"query($eventId:ID!){\nevent(eventId:$eventId){\nguestQuestions{\nperson{\nhouseholdId\npersonId:personKey\nname\n}\nreadableQuestions{\nid\nquestionText\nanswer{\ndisplayValue\n}\n}\n}\n}\n}",
    "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff"}
  });
  request.setRequestHeader("x-joy-personid", guestId);
  request.send(body);
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
  const guestId = urlParams.get("id");
  queryGuestDetails(guestId, (guestQuestions) => {
    guestQuestions.forEach((guestQuestion) => {
      const guestId = guestQuestion.person.personId;
      const guestName = guestQuestion.person.name;
      const answers = Object.assign({}, ...guestQuestion.readableQuestions.map((question) => ({[question.id]: question.answer.displayValue})));
      createRsvpTableRow(guestName, guestId, answers);
    });
  });
}
function findMatchingGuest() {
  updateText("Loading...");
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const request = createGraphqlRequest((response) => {
    const matchCount = response.data.event.getPersonMatchResult.matchCount;
    if (matchCount > 0) {
      const matchId = response.data.event.getPersonMatchResult.match.personKey;
      window.location.href = "guest.html?id=" + matchId;
    } else {
      updateText("No guest found with name " + fname + " " + lname);
    }
  })
  const body = JSON.stringify({
    "query":"\nquery PersonMatchWithEmail($eventId: ID!, $firstName: String!, $lastName: String!, $email: String) {\n  event(eventId: $eventId) {\n    getPersonMatchResult(firstName: $firstName, lastName: $lastName, email: $email) {\nmatchCount\nmatch{\npersonKey\n}\n}\n}\n}\n",
    "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff","firstName":fname,"lastName":lname,"email":""}
  });
  request.send(body);
}