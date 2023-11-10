import React, {useEffect, useState} from "react";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import axios, {AxiosResponse} from "axios";

interface FeedbackData {
    question_1: string;
    question_2: string;
    question_3: string;
    question_4: string;
    question_5: string;

}

export function CreateFeedback() {
    const [currentQuestion, setCurrentQuestion] = React.useState(1);
    const [error, setError] = React.useState(false);
    const [value, setValue] = React.useState('');
    const [otherValue, setOtherValue] = React.useState('');
    const [question1, setQuestion1] = React.useState('')
    const [question2, setQuestion2] = React.useState('')
    const [question3, setQuestion3] = React.useState('')
    const [question4, setQuestion4] = useState('');
    const [question5, setQuestion5] = useState('');
    const [errorText, setErrorText] = useState('');
    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            response.data
            setCurrentQuestion(6)
        } else {
            setError(true);
            setCurrentQuestion(5)
            response.data
        }
    }

    const saveFeedback = () => {
        if (value === '') {
            setError(true)
            return
        } else {
            setError(false)
        }
        setQuestion5(value)
        console.log('question5' + question5)
        const feedbackData: FeedbackData = {
            question_1: question1,
            question_2: question2,
            question_3: question3,
            question_4: question4,
            question_5: value
        }

        axios.post('/feedback/save', feedbackData)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                setErrorText('There was a problem saving the feedback data. Please try again later.');
                console.error(error);
            });

        console.log(feedbackData)
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue((event.target as HTMLInputElement).value);
    };

    const handleOtherChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOtherValue((event.target as HTMLInputElement).value);
    }

    const handleSubmit = (event: React.FormEvent, questionValue: number) => {
        event.preventDefault();
        if (questionValue === 1) {
            if (value === '') {
                setError(true)
                return
            } else {
                setError(false)
            }
            if (value === 'other') {
                if (otherValue === '') {
                    setError(true)
                    return
                }
                setQuestion1(otherValue)
            } else {
                setQuestion1(value)
            }
            setOtherValue('')
            setValue('')
            setCurrentQuestion(2)
        }
        if (questionValue === 2) {
            if (value === '') {
                setError(true)
                return
            } else {
                setError(false)
            }
            setQuestion2(value)
            setValue('')
            setCurrentQuestion(3)
        }

        if (questionValue === 3) {
            setQuestion3(value)
            setValue('')
            setCurrentQuestion(4)
        }
        if (questionValue === 4) {
            setQuestion4(value)
            setValue('')
            setCurrentQuestion(5)
        }

    }
    const questionOne = () => {
        return <form onSubmit={(event) => handleSubmit(event, 1)}>
            <Typography>{"Question 1 of 5"}</Typography>
            <FormControl>
                <FormLabel id="demo-radio-buttons-group-label">
                    <Typography variant="h5" sx={{fontWeight: 'bold', color: '#111224'}}>
                        How would you describe your role at Border-force ? : <div
                        style={{display: 'inline-block', "color": "#DB0F24"}}>*</div>
                    </Typography>
                </FormLabel>
                <Typography sx={{
                    "color": "#DB0F24",
                    fontWeight: 'bold'
                }}>{error ? "Please select your role at Borderforce" : ""}</Typography>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="other"
                    value={value}
                    onChange={handleChange}
                    name="radio-buttons-group"
                    sx={{
                        ...(error && {
                            borderLeft: '4px solid red',
                            pl: 1,
                            ml: -1
                        })
                    }}>
                    <FormControlLabel value="National manager" control={<Radio/>} label="National manager"/>
                    <FormControlLabel value="Regional manager" control={<Radio/>} label="Regional manager"/>
                    <FormControlLabel value="Operational - Front line" control={<Radio/>}
                                      label="Operational - Front line (including Watch-House and Duty Managers)"/>
                    <FormControlLabel value="Operational - Back line" control={<Radio/>}
                                      label="Operational - Back line (including Support, Planning, Rostering, Performance)"/>
                    <FormControlLabel value="other" control={<Radio/>} label="Other"/>
                    {value === 'other' && (
                        <TextField
                            label="Please specify"
                            onChange={handleOtherChange}
                            value={otherValue}
                        />
                    )}
                </RadioGroup>
                <br/>
                <Button type="submit" sx={{float: "left", width: 'auto', maxWidth: '120px', padding: '6px 12px'}}
                        variant="outlined">Continue</Button>
            </FormControl>
        </form>
    }

    const questionTwo = () => {
        return <form onSubmit={(event) => handleSubmit(event, 2)}>
            <Typography>{"Question 2 of 5"}</Typography>
            <FormControl>
                <FormLabel id="demo-radio-buttons-group-label">
                    <Typography variant="h5" sx={{fontWeight: 'bold', color: '#111224'}}>
                        Overall, what did you think of the quality of DRT ? <div
                        style={{display: 'inline-block', "color": "#DB0F24"}}>*</div>
                    </Typography>
                </FormLabel>
                <Typography
                    sx={{"color": "#DB0F24", fontWeight: 'bold'}}>{error ? "Please select an option" : ""}</Typography>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="other"
                    value={value}
                    onChange={handleChange}
                    name="radio-buttons-group"
                    sx={{
                        ...(error && {
                            borderLeft: '4px solid red',
                            pl: 1,
                            ml: -1
                        })
                    }}>
                    <FormControlLabel value="Very good" control={<Radio/>} label="Very good"/>
                    <FormControlLabel value="Good" control={<Radio/>} label="Good"/>
                    <FormControlLabel value="Average" control={<Radio/>}
                                      label="Average"/>
                    <FormControlLabel value="Bad" control={<Radio/>}
                                      label="Bad"/>
                    <FormControlLabel value="Very bad" control={<Radio/>} label="Very bad"/>
                </RadioGroup>
                <br/>
                <Button type="submit" sx={{float: "left", width: 'auto', maxWidth: '120px', padding: '6px 12px'}}
                        variant="outlined">Continue</Button>
            </FormControl>
        </form>
    }

    const questionThree = () => {
        return <Box>
            <Typography>{"Question 3 of 5"}</Typography>
            <FormControl sx={{
                ...(error && {
                    borderLeft: '4px solid red',
                    pl: 1,
                    ml: -1
                })
            }}>
                <FormLabel id="demo-radio-buttons-group-label">
                    <Typography variant="h5" sx={{fontWeight: 'bold', color: '#111224'}}>
                        What did you like about DRT? (optional)
                    </Typography>
                </FormLabel>
                <Typography>If possible, please give examples</Typography>
                <br/>
                <textarea
                    onChange={handleChange}
                    placeholder=""
                    style={{height: '100px', width: '400px'}}/>
                <br/>
                <Grid container>
                    <Grid xs={3}>
                        <Button type="submit"
                                sx={{float: "left", width: 'auto', maxWidth: '120px', padding: '6px 12px'}}
                                variant="outlined" onClick={(event) => handleSubmit(event, 3)}>Continue</Button>
                    </Grid>
                    <Grid xs={9} sx={{float: "left", padding: '6px 12px'}}>
                        <Link href="#" onClick={(event: React.FormEvent<Element>) => handleSubmit(event, 3)}>Skip</Link>
                    </Grid>
                </Grid>
            </FormControl>
        </Box>
    }

    const questionFour = () => {
        return <Box>
            <Typography>{"Question 4 of 5"}</Typography>
            <FormControl>
                <FormLabel id="demo-radio-buttons-group-label" sx={{
                    ...(error && {
                        borderLeft: '4px solid red',
                        pl: 1,
                        ml: -1
                    })
                }}><Typography variant="h5" sx={{fontWeight: 'bold', color: '#111224'}}>
                    What did you think could be improved in DRT ? (optional)
                </Typography>
                </FormLabel>
                <Typography>If possible, please give examples and provide suggestions</Typography>
                <br/>
                <textarea
                    onChange={handleChange}
                    placeholder=""
                    style={{height: '100px', width: '400px'}}/>
                <br/>
                <Grid container>
                    <Grid xs={2}>
                        <Button type="submit"
                                sx={{float: "left", width: 'auto', maxWidth: '120px', padding: '6px 12px'}}
                                variant="outlined" onClick={(event) => handleSubmit(event, 4)}>Continue</Button>
                    </Grid>
                    <Grid xs={10} sx={{float: "left", padding: '6px 12px'}}>
                        <Link href="#" onClick={(event: React.FormEvent<Element>) => handleSubmit(event, 4)}>Skip</Link>
                    </Grid>
                </Grid>
            </FormControl>
        </Box>
    }

    const questionFive = () => {
        return <Box><Typography>{"Question 5 of 5"}</Typography>
            <FormControl>
                <FormLabel id="demo-radio-buttons-group-label">
                    <Typography variant="h5" sx={{fontWeight: 'bold', color: '#111224'}}>
                        Would you be interested in participating in a workshop? (approx. 30 mins) <div
                        style={{display: 'inline-block', "color": "#DB0F24"}}>*</div>
                    </Typography>
                </FormLabel>
                <Typography><p>You can share ideas with other teams and [regional officer] to improve DRT.</p>
                    <p>We'll send you an email to inform you about upcoming sessions.</p></Typography>
                <Typography sx={{color: '#DB0F24', fontWeight: 'bold'}}>
                    {error ? "Please select if you would be interested in participating in a workshop" : ""}
                </Typography>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="Yes"
                    value={value}
                    onChange={handleChange}
                    name="radio-buttons-group"
                    sx={{
                        ...(error && {
                            borderLeft: '4px solid red',
                            pl: 1,
                            ml: -1
                        })
                    }}>
                    <FormControlLabel value="Yes" control={<Radio/>} label="Yes"/>
                    <FormControlLabel value="No" control={<Radio/>} label="No"/>
                </RadioGroup>
                <br/>
                <Button type="submit" sx={{float: "left", width: 'auto', maxWidth: '200px', padding: '6px 12px'}}
                        variant="contained" onClick={() => saveFeedback()}>Submit Feedback</Button>
            </FormControl>
            <br/>
            <Typography sx={{fontWeight: 'bold', color: '#DB0F24'}}>
                {errorText ? "Error while sending feedback . Please try again in sometime" : ""}
            </Typography>
        </Box>
    }

    const closeFeedback = () => {
        return <div>
            <Typography variant="h5" sx={{float: "centre", fontWeight: 'bold', color: '#111224'}}>
                Thank you for your feedback
            </Typography>
            <br/>
            <Button variant="outlined" sx={{float: "centre"}} onClick={() => window.close()}>Close</Button>
        </div>
    }

    const displayQuestion = () => {
        return currentQuestion === 1 ? questionOne() :
            currentQuestion === 2 ? questionTwo() :
                currentQuestion === 3 ? questionThree() :
                    currentQuestion === 4 ? questionFour() :
                        currentQuestion === 5 ? questionFive() :
                            closeFeedback()
    }

    useEffect(() => {
        console.log("useEffect" + currentQuestion)
    }, [currentQuestion])

    return (

        <div>
            <Typography
                variant="h1"
                sx={{
                    fontWeight: 'bold',
                    color: '#233E82'
                }}>DRT Feedback</Typography>
            {displayQuestion()}


        </div>
    )
}
