/**
 * The longest delay `setTimeout` accepts: 2^31 - 1 ms (~24.8 days). Longer delays overflow and fire immediately.
 * @internal
 */
export const MaximumTimerDelay = 2 ** 31 - 1;
