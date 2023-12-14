import axios, {AxiosResponse} from "axios"


interface IValidator {
  validate: (schema: object, values: object) => object[]
}

export default class Validator implements IValidator {

  public validate(schema: object, values: object) {
    console.log(schema, values);
    return []
  }
}
