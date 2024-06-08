function scrollToBtf() {
  const firstEvent = document.getElementsByClassName("event")[0];
  firstEvent.scrollIntoView({ behavior: "smooth", block: "start" });
}
function updateText(text) {
  const para = document.getElementById("output");
  para.innerText = text;
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
async function updateRsvpFormWithGuestInfo(guests, bangalore) {
  const form = document.getElementById("form");
  const parentElement = form.parentElement;
  const newForm = fromHTML('<form id="form"></form>');

  function handleForm(event) { event.preventDefault(); } 
  newForm.addEventListener('submit', handleForm);

  form.remove();
  parentElement.appendChild(newForm);

  const metadata = JSON.stringify(guests);
  const metadataInput = fromHTML('<input type="hidden" id="metadata" name="metadata" value=\'' + metadata + '\'>');
  newForm.appendChild(metadataInput);

  guests.forEach((guest, index, array) => {
    const personId = guest.firstName + "-" + guest.lastName;
    const rsvp = bangalore ? guest.bangaloreRsvp : guest.bentotaRsvp;

    const guestDetails = fromHTML('<div class="rsvp-answers"><div><span class="gravity-font">' + guest.firstName +
      '</span><br><span class="maxi-font">' + guest.lastName +
      '</span></div><div class="radio-buttons rsvp-answers"><label class="sq-radio" for="yes-' + personId +
      '">Yes<input type="radio" id="yes-' + personId + '" name="rsvp-' + personId +
      '" value="Yes"><span class="checkmark"></span></label><label class="sq-radio" for="no-' + personId +
      '">No<input type="radio" id="no-' + personId + '" name="rsvp-' + personId +
      '" value="No"><span class="checkmark"></span></label></div></div>');

    newForm.appendChild(guestDetails);

    if (rsvp === true) {
      const button = document.getElementById("yes-" + personId);
      button.setAttribute("checked", "checked");
    }
    if (rsvp === false) {
      const button = document.getElementById("no-" + personId);
      button.setAttribute("checked", "checked");
    }

    if (index !== array.length - 1){ 
      const andDelimiter = fromHTML('<div class="rsvp-and">AND</div>');
      newForm.appendChild(andDelimiter);
    }
  });

  const outputText = fromHTML('<p id="output"></p>');
  const submitButton = fromHTML('<button class="rsvp noSelect color" onclick="saveGuestResponse(' + bangalore + ')">ENTER</button>');
  newForm.appendChild(outputText);
  newForm.appendChild(submitButton);

  // resize bottom sheet to new height
  const bottomSheet = document.getElementById('bottomSheet');
  const bottomSheetContent = document.getElementById('bottomSheetContent');
  bottomSheet.style.height = (bottomSheetContent.scrollHeight + 28) + "px"; // Don't know why but the submit button isn't being factored in
}
async function saveGuestResponse(bangalore) {
  updateText("Saving...");
  const guests = JSON.parse(document.getElementById("metadata").value);
  const promises = [];
  guests.forEach((guest, index, array) => {
    const personId = guest.firstName + "-" + guest.lastName;
    const rsvpSelected = document.querySelector('input[name="rsvp-' + personId + '"]:checked');
    if (rsvpSelected !== null) {
      rsvp = rsvpSelected.value === "Yes";
      if (bangalore) {
        guest.bangaloreRsvp = rsvp;
      } else {
        guest.bentotaRsvp = rsvp;
      }
    }
    promises.push(sendRsvp(guest));
  });
  await Promise.all(promises);
  updateText("Saved");
}
async function findMatchingGuest(bangalore) {
  updateText("Loading...");
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const guests = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", "https://api.adtrj.com/rsvp/?firstName=" + fname + "&lastName=" + lname);
    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        resolve(JSON.parse(request.responseText));
      } else {
        reject(`Error: ${request.status}`);
      }
    };
    request.send();
  });
  if (guests.length > 0) {
    updateRsvpFormWithGuestInfo(guests, bangalore);
  } else {
    updateText("No guest found with name " + fname + " " + lname);
  }
}
function sendRsvp(guest) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "https://api.adtrj.com/rsvp/");
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        resolve(JSON.parse(request.responseText));
      } else {
        reject(`Error: ${request.status}`);
      }
    };
    const body = JSON.stringify(guest);
    request.send(body);
  });
}
function showBottomSheet(bangalore) {
  // Update the find guest button with whether or not they are rsvp-ing for the Bangalore event
  const button = document.getElementById('formButton');
  if (button !== null) {
    button.onclick = function() { findMatchingGuest(bangalore); };
  }

  // Update the form with the right content if available
  const metadata = document.getElementById("metadata");
  if (metadata !== null) {
    const guests = JSON.parse(metadata.value);
    updateRsvpFormWithGuestInfo(guests, bangalore);
  }

  const bottomSheet = document.getElementById('bottomSheet');
  bottomSheet.style.height = bottomSheet.scrollHeight + "px";
  document.getElementById("modal-overlay").style.display = "unset";
}
function hideBottomSheet() {
  document.getElementById('bottomSheet').classList.remove('open');
  bottomSheet.style.height = "0";
  document.getElementById("modal-overlay").style.display = "none";
}