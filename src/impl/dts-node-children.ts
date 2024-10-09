import ts from 'typescript';

export class DtsNodeChildren extends Set<ts.Node> {
  constructor(node: ts.Node) {
    super();

    ts.forEachChild(node, child => {
      this.add(child);
    });
  }
}
