function bindNamedParameters(values = {}) {
  return Object.entries(values).reduce((accumulator, [key, value]) => {
    accumulator[`@${key}`] = value;
    return accumulator;
  }, {});
}

module.exports = {
  bindNamedParameters,
};
