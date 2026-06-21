function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function findPotentialDuplicates(newName, newEmail, existingEntries, type = 'business') {
  if (!newName && !newEmail) return [];
  const normName = normalize(newName);
  const normEmail = normalize(newEmail);
  const results = [];

  for (const entry of existingEntries) {
    if (type === 'business') {
      const existingName = normalize(entry.name);
      if (!existingName) continue;
      if (existingName === normName) {
        results.push({ entry, confidence: 'high', matchReason: 'Same name' });
      } else if (normName.length >= 5 && existingName.startsWith(normName.slice(0, 5))) {
        results.push({ entry, confidence: 'medium', matchReason: 'Similar name' });
      } else if (existingName.includes(normName) || normName.includes(existingName)) {
        if (Math.abs(existingName.length - normName.length) > 2 || normName.length >= 3) {
          results.push({ entry, confidence: 'medium', matchReason: 'Similar name' });
        }
      }
    } else {
      const existingName = normalize(entry.full_name);
      const existingEmail = normalize(entry.email);
      if (normEmail && existingEmail === normEmail) {
        results.push({ entry, confidence: 'high', matchReason: 'Same email' });
      } else if (normName && existingName === normName) {
        results.push({ entry, confidence: 'high', matchReason: 'Same name' });
      } else if (normName.length >= 5 && existingName.startsWith(normName.slice(0, 5))) {
        results.push({ entry, confidence: 'medium', matchReason: 'Similar name' });
      }
    }
  }

  const priority = { high: 0, medium: 1 };
  results.sort((a, b) => priority[a.confidence] - priority[b.confidence]);
  return results.slice(0, 3);
}