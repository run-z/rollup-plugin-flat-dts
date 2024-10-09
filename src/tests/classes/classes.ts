export class BaseClass {
  foo(): string {
    return 'foo';
  }
}

export class TestClass extends BaseClass {
  override foo(): string {
    return 'bar';
  }
}
