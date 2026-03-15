export const parseArgs = (tokens) => {
  const result = {};
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].startsWith('--')) {
      const key = tokens[i].slice(2);
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('--')) {
        result[key] = tokens[i + 1];
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
};
