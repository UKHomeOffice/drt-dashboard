import Validator from "../../services/Validator"
import moment from "moment"
import { FormValidations } from "../../services/Validator";


export const downloadManagerFormValidation :FormValidations = {
  startDate: [
    {
      name: 'isDate',
      validator: Validator.common.isDate,
      message: 'Please select a valid start date using the datepicker',
    },
    {
      name: 'required',
      validator: Validator.common.required,
      message: 'Please select a valid start date using the datepicker',
    },
  ],
  endDate: [
    {
      name: 'isDate',
      validator: Validator.common.isDate,
      message: 'Please select a valid end date using the datepicker',
    },
    {
      name: 'required',
      validator: Validator.common.required,
      message: 'Please select a valid end date using the datepicker',
    },
    {
      name: 'isAfterStart',
      validator: (value, otherFields) => {
        if (!otherFields?.startDate) return false;

        let start = moment(otherFields?.startDate);
        let end = moment(value);
        return end.isAfter(start, 'day');
      },
      message: 'The end date must be after the start date.',
    },
  ],
  ports: [
    {
      name: 'required',
      validator: (value) => {
        return (value.length > 0);
      },
      message: 'Please select one or more ports',
    }

  ],
}
