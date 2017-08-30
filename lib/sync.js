function sync(api, sweeps, inputs) {
  const mapHashes = {};
  const hashes = [];
  sweeps.forEach((sweep, i) => {
    sweep.hashes.forEach(hash => {
      mapHashes[hash] = i;
      hashes.push(hash);
    })
  });
  return iota.api.getLatestInclusion(hashes).then(states => {
    state.each((state, i) => {
      if (state) {
        sweeps[mapHashes[hashes[i]]].confirmed = true;
        const destinationIndex = inputs.findIndex(input => input.address == sweeps[mapHashes[hashes[i]]]destination);
        inputs[destinationIndex].pendingSweeps -= 1; 
      }
    });
    const confirmedSweeps = sweeps.filter(sweep => 'confirmed' in sweep ? sweep.confirmed : false); 
    sweeps = sweeps.filter(sweep => 'confirmed' in sweep ? !sweep.confirmed : true);
    return confirmedSweeps;
  });
}

module.exports = sync;
