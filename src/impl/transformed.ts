import type ts from 'typescript';
import type { ModuleInfo } from './module-info';

export interface Transformed<T extends unknown[]> {
  readonly to: T | [];
  readonly dia?: ts.Diagnostic[];
  readonly refs?: ModuleInfo[];
}

export type TopLevelStatement = readonly [target: ModuleInfo, statement: ts.Statement];

const NONE_TRANSFORMED: Transformed<any[]> = { to: [] };

export function noneTransformed<T extends unknown[]>(): Transformed<T> {
  return NONE_TRANSFORMED as Transformed<T>;
}

export async function allTransformed<T>(
    transformed: Promise<Transformed<T[]>>[],
): Promise<Transformed<T[]>> {

  const list = await Promise.all(transformed);

  return list.reduce(
      (
          {
            to: all,
            dia: fullDia,
            refs: allRefs,
          },
          {
            to,
            dia,
            refs,
          },
      ) => ({
        to: [...all, ...to],
        dia: dia ? (fullDia ? [...fullDia, ...dia] : dia) : fullDia,
        refs: refs ? (allRefs ? [...allRefs, ...refs] : refs) : allRefs,
      }),
      noneTransformed<T[]>(),
  );
}
