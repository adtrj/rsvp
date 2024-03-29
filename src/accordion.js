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
function loadFAQs(expandButtonPng) {
  const faqs = document.getElementById("faqs");

  [1,2,3].forEach((i) => {
    const row = fromHTML('<div class="accordion">' +
          '<button class="accordion-btn noSelect">' +
          '<img src="'+ expandButtonPng +'" alt="expand">' +
          "Question " + i + "?" + '</button>' +
          '<div class="panel"> <p>' +
          "Answer to Question " + i + "." +
          '</p></div></div>');
    faqs.append(row);
  });

  var accordionButtons = document.querySelectorAll('.accordion-btn');
  var accordionPanels = document.querySelectorAll('.panel');

  accordionButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      var panel = this.nextElementSibling;
      const panelClosed = panel.style.maxHeight === '' || panel.style.maxHeight === '0px';

      // Close all panels
      accordionPanels.forEach(function(panel) {
        panel.style.maxHeight = '0';
      });
      
      accordionButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });

      // Toggle panel state
      if (panelClosed) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        this.classList.add('active');
      }
    });
  });
}