export const cx = (...names: Array<string | false | undefined>) =>
  names.filter(Boolean).join(" ");
