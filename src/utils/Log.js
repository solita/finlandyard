import R from 'ramda'

const logElement = document.querySelector('.js-log');

const logToHTML = (msg, status) => {
  if(typeof msg === 'object') {
    msg = JSON.stringify(msg, null, 2);
  }
  const paragraph = document.createElement('p');
  paragraph.innerText = msg;
  paragraph.classList.add(status);
  logElement.appendChild(paragraph);
  logElement.scrollTop = logElement.scrollHeight;
}

export const log = (msg, status = 'neutral') => {
  console.log(msg);
  logToHTML(msg, status);
}
