/* eslint-disable no-undef */
const DarkReader = require('darkreader');

document.addEventListener('DOMContentLoaded', () => {
  let isDarkReaderEnabled = false;

  try {
    console.log('DomContentLoaded');

    setInterval(() => {
      const { hostname } = document.location;
      if (hostname === 'accounts.google.com') {
        console.log('DisablingDarkReader');
        if (!isDarkReaderEnabled) return;
        isDarkReaderEnabled = false;
        DarkReader.disable();
      } else {
        if (isDarkReaderEnabled) return;
        console.log('EnablingDarkReader');
        isDarkReaderEnabled = true;
        DarkReader.auto({
          brightness: 100,
          contrast: 90,
          sepia: 10,
        });
      }
    }, 100);

    console.log('DarkReader initialized');
  } catch (e) {
    console.log('error', e);
  }
});
