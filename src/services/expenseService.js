function calculateBalances(expenses, tripMembers) {
  const balances = {};
  
  // Initialize balances to 0 for all members
  tripMembers.forEach(m => balances[m.userId] = 0);

  expenses.forEach(exp => {
    // Check if the person who paid is in the balances, if not add them
    if (balances[exp.paidById] === undefined) {
      balances[exp.paidById] = 0;
    }
    
    // person who paid gets credit
    balances[exp.paidById] += exp.amount;
    
    // each participant is debited their share
    exp.participants.forEach(p => {
      if (balances[p.userId] === undefined) {
        balances[p.userId] = 0;
      }
      balances[p.userId] -= p.share;
    });
  });

  // net balance: positive = owed money, negative = owes money
  return balances;
}

function calculateSplitShares(amount, splitType, participants) {
  if (splitType === 'equal') {
    const share = amount / participants.length;
    return participants.map(p => ({ userId: p.userId, share }));
  }
  if (splitType === 'percentage') {
    return participants.map(p => ({
      userId: p.userId,
      share: (amount * p.percentage) / 100
    }));
  }
  if (splitType === 'custom') {
    return participants; // caller provides exact shares in the participants array
  }
}

module.exports = { calculateBalances, calculateSplitShares };
