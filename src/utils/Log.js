import R from 'ramda'

const logElement = document.querySelector('.js-log');
const logElementContainer = document.querySelector('.js-log');

const logToHTML = msg => {
  const paragraph = document.createElement('p');
  paragraph.innerText = msg;
  logElement.appendChild(paragraph);
  logElement.scrollTop = logElement.scrollHeight;
  return msg;
}

export const log = R.pipe(
  R.tap(console.log),
  logToHTML
)