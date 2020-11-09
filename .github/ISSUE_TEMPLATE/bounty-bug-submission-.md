---
name: 'Bounty bug submission '
about: Please check the box that best fits your Bounty bug
title: Bounty bug for review
labels: Bounty Bug
assignees: timstackblock

---

_PLEASE CHECK THE BOX THAT BEST FITS THE BOUNTY BUG YOU DISCOVERED. THEN SCROLL TO THE BOTTOM AND ENTER THE BUG DETAILS BELOW._

### Critical, Launch Blocking Bugs
**Consensus critical bugs**
- [ ] Can cause a chain split
- [ ] Can cause an invalid transaction to get mined
- [ ] Can cause an invalid block to get accepted
- [ ] Can cause a node to stall

**State corruption**
- [ ] Can modify a smart contract’s data maps and data vars without a `contract-call?

**Stolen funds**
- [ ] Any address losing STX without a corresponding transfer
- [ ] Modify token balances and NFT ownership in other contracts without a `contract-call?`

**Take control and/or bring network to a halt**
- [ ] Take control and/or bring network to a halt

### Major, Launch Blocking Bugs
**Major bugs**
- [ ] Performance or correctness bugs that don’t rise to P0 level
- [ ] Stress test or DoS attacks that slow things down enough
- [ ] Resource exhaustion
- [ ] Expected functionality doesn’t work in obvious ways (important to be super specific with this wording)


### Minor, Non-launch blocking bugs
**Minor bugs**
- [ ] Bugs in non-critical software (CLI, UI, etc) that doesn’t impact critical functionality

-----------------------------------------------------------------------------------

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - Browser [e.g. stock browser, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
