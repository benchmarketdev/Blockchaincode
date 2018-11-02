// loading flag selector
const selector = actions => state => {
  return actions.some(action => {
    return state.loading[action];
  });
};

export default selector;
