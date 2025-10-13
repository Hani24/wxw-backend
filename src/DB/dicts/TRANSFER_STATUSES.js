module.exports = [
  'none',
  'transfered', // only transfered from [stripe:account] to [stripe:account]
  'completed', // transfered + sent to the card/bank
  'errored',
];
