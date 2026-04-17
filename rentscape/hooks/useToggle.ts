import { useCallback, useState } from "react";

export function useToggle<T extends string>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const set = useCallback((next: T) => setValue(next), []);
  return { value, set };
}
