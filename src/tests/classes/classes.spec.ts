import { testDts } from '../test-dts';

describe('For class', () => {
  it('emits type definitions', async () => {

    const { files: [{ content }] } = await testDts('classes');

    expect(content).toMatchSnapshot();
  });
  it('emits declaration map', async () => {

    const { files } = await testDts('classes', { compilerOptions: { declarationMap: true } });

    expect(files).toHaveLength(2);

    const [dts, sourceMap] = files;

    expect(dts.path).toBe('index.d.ts');
    expect(sourceMap.path).toBe('index.d.ts.map');

    expect(dts.content).toMatchSnapshot('dts');
    expect(sourceMap.content).toMatchSnapshot('source map');
  });
});
