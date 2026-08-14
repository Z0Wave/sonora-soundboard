
export const formatHotkeyDisplay = (hotkey?: string) => {
  if (!hotkey) return "SET BIND";
  return hotkey
    .replace(/CommandOrControl/g, "CTRL")
    .replace(/Shift/g, "SHIFT")
    .replace(/Alt/g, "ALT")
    .split("+")
    .join(" + ");
};