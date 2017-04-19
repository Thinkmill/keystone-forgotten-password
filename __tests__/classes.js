'use strict';

class Person {
    static schema () {
      return {
        name: 'test'
      };
    }
}

function Rest (Type) {
  const t = new Type();
  console.log(t);
  return Type;
}

Rest(Person);
