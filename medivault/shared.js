/* MediVault main entry point.
 * Keep this parser-loaded before each page's inline scripts. The ordered,
 * synchronous imports preserve the existing global functions those pages use.
 */
'use strict';

(function loadMediVaultSteps() {
  const entryScript = document.currentScript;
  if (!entryScript) {
    throw new Error('MediVault shared.js must be included by a script tag in the HTML page.');
  }

  const steps = [
    'js/00-state.js',
    'js/01-utilities.js',
    'js/02-preprocessing.js',
    'js/03-encryption-hashing.js',
    'js/04-ipfs-storage.js',
    'js/05-blockchain.js',
    'js/06-retrieval-decryption.js',
    'js/07-reports-audit.js',
    'js/08-navigation.js'
  ];

  const stepScripts = steps.map((file) => {
    const src = new URL(file, entryScript.src).href;
    return '<script src="' + src + '"></script>';
  }).join('\n');

  // document.write keeps these classic scripts ordered and loaded before the
  // page's following inline script starts. Do not add async/defer here.
  document.write(stepScripts);
})();