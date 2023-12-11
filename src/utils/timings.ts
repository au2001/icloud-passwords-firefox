export const debounce = (callback: () => void, delay = 300) => {
  let timeout: NodeJS.Timeout | undefined;

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
      callback();
    }, delay);
  };
};

export const throttle = (callback: () => void, delay = 300) => {
  let scheduled = false;
  let timeout: NodeJS.Timeout | undefined;

  const run = () => {
    if (timeout !== undefined) {
      scheduled = true;
      return;
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      if (scheduled) {
        scheduled = false;
        run();
      }
    }, delay);

    callback();
  };

  return run;
};
