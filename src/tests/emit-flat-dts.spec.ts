import { describe, expect, it } from '@jest/globals';
import { testDts } from './test-dts';

describe('emitFlatDts', () => {
  describe('file.path', () => {
    it('defaults to `index.d.ts`', async () => {
      const {
        files: [{ path }],
      } = await testDts('interfaces');

      expect(path).toBe('index.d.ts');
    });
    it('respects custom file name', async () => {
      const {
        files: [{ path }],
      } = await testDts('interfaces', { file: 'custom.d.ts' });

      expect(path).toBe('custom.d.ts');
    });
  });
});
