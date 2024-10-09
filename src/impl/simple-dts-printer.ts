import type { FlatDts } from '../api';
import { DtsPrinter } from './dts-printer';

export class SimpleDtsPrinter extends DtsPrinter {
  toFiles(name: string): readonly FlatDts.File[] {
    return [this.createFile(name)];
  }
}
