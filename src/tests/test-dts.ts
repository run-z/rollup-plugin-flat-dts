import type { FlatDts } from '../api';
import { emitFlatDts } from '../api';

export function testDts(
    root: string,
    options?: FlatDts.Options,
): Promise<FlatDts> {
  return emitFlatDts({
    tsconfig: `src/tests/${root}/tsconfig.json`,
    ...options,
  });
}
