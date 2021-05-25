export function testFunction(prefix: string, ...args: string[]): string {
  return `${prefix}: ` + args.join(',');
}
