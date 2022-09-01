import { describe, expect, it } from '@jest/globals';
import { testDts } from '../test-dts';

describe('With multiple entries', () => {
  it('emits multiple definition files when entry file name specified', async () => {
    const { files } = await testDts('entries', {
      entries: {
        entry1: { file: 'entry1.d.ts' },
        entry2: { file: 'entry2.d.ts' },
      },
    });

    expect(files).toHaveLength(3);

    const [{ content: file1 }, { content: file2 }, { content: file3 }] = files;

    expect(file1).toMatchSnapshot('file1');
    expect(file2).toMatchSnapshot('file2');
    expect(file3).toMatchSnapshot('file3');
  });
  it('emits one definition file when entry file name omitted', async () => {
    const { files } = await testDts('entries', {
      entries: {
        entry1: {},
        entry2: {},
      },
    });

    expect(files).toHaveLength(1);

    const [{ content }] = files;

    expect(content).toMatchSnapshot();
  });
  it('renames the entry when its final name specified', async () => {
    const { files } = await testDts('entries', {
      entries: {
        entry1: { as: 'test-entry1' },
        entry2: { as: 'test-entry2' },
      },
    });

    expect(files).toHaveLength(1);

    const [{ content }] = files;

    expect(content).toMatchSnapshot();
  });
  it('merges multiple entries with the same file name', async () => {
    const { files } = await testDts('entries', {
      entries: {
        entry1: { file: 'entries.d.ts' },
        entry2: { file: 'entries.d.ts' },
      },
    });

    expect(files).toHaveLength(2);

    const [{ content: file1 }, { content: file2 }] = files;

    expect(file1).toMatchSnapshot('file1');
    expect(file2).toMatchSnapshot('file2');
  });
});
