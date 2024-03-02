function updateText(text) {
  const para = document.getElementById("output");
  para.innerText = text;
}
function declareGuestFound() {
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://ceremony-api.withjoy.com/graphql");
  xhr.setRequestHeader("Content-Type", "application/json");
  const body = JSON.stringify({
    "query":"\nquery ($eventId: ID, $firstName: String!, $lastName: String!, $email: String!){\nevent(eventId: $eventId){\nfindPerson(\nemail: $email,\nfirstName: $firstName,\nlastName: $lastName\n){\npersonKey\nname\nfirstName\nlastName\n}\n}\n}\n",
    "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff","firstName":fname,"lastName":lname,"email":""}
  });
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const personKey = JSON.parse(xhr.responseText).data.event.findPerson.personKey;
      updateText("Person found with id " + personKey);
    } else {
      console.log(`Error: ${xhr.status}`);
    }
  };
  xhr.send(body);
}
function findMatchingGuest() {
  updateText("Loading...");
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://ceremony-api.withjoy.com/graphql");
  xhr.setRequestHeader("Content-Type", "application/json");
  const body = JSON.stringify({
    "query":"\nquery PersonMatchWithEmail($eventId: ID!, $firstName: String!, $lastName: String!, $email: String) {\n  event(eventId: $eventId) {\n    getPersonMatchResult(firstName: $firstName, lastName: $lastName, email: $email) {\n      matchCount\n    }\n  }\n}\n",
    "variables":{"eventId":"eeead714910ff206bf0cb4fccd51adad6961ca37af9c87eff","firstName":fname,"lastName":lname,"email":""}
  });
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const matchCount = JSON.parse(xhr.responseText).data.event.getPersonMatchResult.matchCount;
      if (matchCount > 0) {
        declareGuestFound();
      } else {
        updateText("No guest found with name " + fname + " " + lname);
      }
    } else {
      console.log(`Error: ${xhr.status}`);
    }
  };
  xhr.send(body);
}