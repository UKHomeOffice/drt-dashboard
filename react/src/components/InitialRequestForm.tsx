import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import {Box} from "@mui/material";

interface IProps {
    rccAccess: string;
    handleRccOptionCallback: (option:string) => void;
}

export default function InitialRequestForm(props: IProps) {
    const handleEvent = (event:any) => {
        props.handleRccOptionCallback(event.target.value)
    }

    return (
        <Box sx={{width: '100%'}}>
            <FormControl>
                <FormLabel id="initial-radio-buttons-group-label"><b>I require access to</b></FormLabel>
                <RadioGroup
                    aria-labelledby="initial-radio-buttons-group-label"
                    defaultValue={props.rccAccess}
                    name="radio-buttons-group"
                >
                    <FormControlLabel value="port" control={<Radio/>} onClick={handleEvent} label="Port level data"/>
                    <FormControlLabel value="rccu" control={<Radio/>} onClick={handleEvent} label="RCC level data"/>
                </RadioGroup>
            </FormControl>
        </Box>
    );
}