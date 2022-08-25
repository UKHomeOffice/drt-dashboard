import React from "react";
import {styled} from '@mui/material/styles';
import ApiClient from "../services/ApiClient";
import axios from "axios";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import {Box, Button, Divider, FormControl, TextField, Typography} from "@mui/material";
import {PortRegion, PortRegionHelper} from "../model/Config";
import {PortsByRegionCheckboxes} from "./PortsByRegionCheckboxes";
import InitialRequestForm from "./InitialRequestForm";
import AccessRequestFormModal from "./AccessRequestFormModal";
import _ from "lodash/fp";

const Declaration = styled('div')(({theme}) => ({
    textAlign: "left",
    padding: theme.spacing(2),
    width: '100%',
}))

const StyledTypography = styled(Typography)(() => ({
    fontWeight: "bold"
}))

const DeclarationUl = styled('ul')(({theme}) => ({
    ...theme.typography.body1,
    listStyleType: "circle"
}));

const ThankYouBox = styled(Box)(() => ({
    width: "75%"
}));

interface IProps {
    regions: PortRegion[];
    teamEmail: string;
}

interface IState {
    portsRequested: string[];
    staffing: boolean;
    regionsRequested: string[];
    lineManager: string;
    agreeDeclaration: boolean;
    requestSubmitted: boolean;
    rccOption: string;
    portOrRegionText: string;
    staffText: string;
}

export default function AccessRequestForm(props: IProps) {
    const [selectedPorts, setSelectedPorts]: [string[], ((value: (((prevState: string[]) => string[]) | string[])) => void)] = React.useState<string[]>([])
    const [selectedRegions, setSelectedRegions]: [string[], ((value: (((prevState: string[]) => string[]) | string[])) => void)] = React.useState<string[]>([])
    const [portOrRegionText, setPortOrRegionText]: [string, ((value: (((prevState: string) => string) | string)) => void)] = React.useState<string>("")
    const [staffText, setStaffText]: [string, ((value: (((prevState: string) => string) | string)) => void)] = React.useState<string>("")

    const [state, setState]: [IState, ((value: (((prevState: IState) => IState) | IState)) => void)] = React.useState(
        {
            portsRequested: [],
            staffing: false,
            regionsRequested: [],
            lineManager: "",
            agreeDeclaration: false,
            requestSubmitted: false,
            rccOption: "port",
            portOrRegionText: "",
            staffText: ""
        } as IState);

    const handleLineManagerChange = (state: IState, newValue: string) => {
        return {...state, lineManager: newValue};
    };

    const handleRccOption = (childData) => {
        setState({
            ...state,
            portsRequested: [],
            staffing: false,
            lineManager: "",
            regionsRequested: [],
            agreeDeclaration: false
        })
        setSelectedPorts([])
        setSelectedRegions([])
        setPortOrRegionText("")
        setStaffText("")
        setState({...state, rccOption: childData})
    }

    const setRequestFinished = () => setState({...state, requestSubmitted: true});

    const save = () => {
        const allPortsRequested = _.isEmpty(_.xor(selectedPorts, PortRegionHelper.portsInRegions(props.regions)))
        axios.post(ApiClient.requestAccessEndPoint, {
            ...state,
            portsRequested: selectedPorts,
            regionsRequested: selectedRegions,
            portOrRegionText: portOrRegionText,
            staffText: staffText,
            allPorts: allPortsRequested
        })
            .then(setRequestFinished)
            .then(() => axios.get(ApiClient.logoutEndPoint))
            .then(() => console.log("User has been logged out."))
    }

    const pageMessage = () => {
        if (state.rccOption === "rccu")
            return "Please select the RCCU region you require access to"
        else
            return "Please select the ports you require access to"
    }

    const moreInfoConditionCheck = () => {
        return (((selectedPorts.length > 1 && state.rccOption === "port") ||
            (selectedPorts.length > 0 && state.rccOption === "port" && state.staffing) ||
            (selectedRegions.length > 1 && state.rccOption === "rccu") ||
            (selectedRegions.length > 0 && state.rccOption === "rccu" && state.staffing)))
    }

    function form() {
        return <Box sx={{width: '100%'}}>
            <h1>Welcome to DRT</h1>
            <InitialRequestForm rccAccess={state.rccOption} handleRccOptionCallback={handleRccOption}/>
            <Divider/>
            <p>{pageMessage()}</p>
            <List>
                <ListItem>
                    <PortsByRegionCheckboxes portDisabled={state.rccOption === "rccu"}
                                             regions={props.regions}
                                             setPorts={setSelectedPorts}
                                             selectedPorts={selectedPorts}
                                             setSelectedRegions={setSelectedRegions}
                                             selectedRegions={selectedRegions}/>
                </ListItem>
                <Divider/>
                <ListItem
                    button
                    key={'staffing'}
                    onClick={() => setState({...state, staffing: !state.staffing})}>
                    <ListItemIcon>
                        <Checkbox
                            inputProps={{'aria-labelledby': "staffing"}}
                            name="staffing"
                            checked={state.staffing}
                        />
                    </ListItemIcon>
                    <ListItemText id="staffing"
                                  primary="I require access to enter staffing figures as my role includes planning"/>
                </ListItem>
                <ListItem key={'line-manager'}>
                    <FormControl fullWidth>
                        <TextField
                            id="outlined-helperText"
                            label="Line manager's email address"
                            helperText={moreInfoConditionCheck() ? "Required (we need to query your request)" : "Optional (this may be helpful if we need to query your request)"}
                            required={moreInfoConditionCheck()}
                            variant="outlined"
                            onChange={event => setState(handleLineManagerChange(state, event.target.value))}
                        />
                    </FormControl>
                </ListItem>
                <Divider/>
                <ListItem>
                    <Declaration>
                        <StyledTypography>Declaration</StyledTypography>
                        <Typography>I understand that:</Typography>
                        <DeclarationUl>
                            <li>data contained in DRT is marked as OFFICIAL-SENSITIVE</li>
                        </DeclarationUl>
                        <Typography>I confirm that:</Typography>
                        <DeclarationUl>
                            <li>I will not share any DRT data with any third party</li>
                            <li>I will contact the DRT team at <a href="mailto:props.teamEmail">{props.teamEmail}</a> if
                                I'm asked to share any data
                            </li>
                        </DeclarationUl>
                    </Declaration>
                </ListItem>
                <ListItem
                    button
                    key={'agreeDeclaration'}
                    onClick={() => setState({...state, agreeDeclaration: !state.agreeDeclaration})}>
                    <ListItemIcon>
                        <Checkbox
                            inputProps={{'aria-labelledby': "agreeDeclaration"}}
                            name="agreeDeclaration"
                            checked={state.agreeDeclaration}
                        />
                    </ListItemIcon>
                    <ListItemText id="agreeDeclaration" primary="I understand and agree with the above declarations"/>
                </ListItem>
                {moreInfoConditionCheck() && state.lineManager.length > 4 && state.agreeDeclaration ?
                    <AccessRequestFormModal rccOption={state.rccOption === "rccu"}
                                            rccRegions={selectedRegions}
                                            ports={selectedPorts}
                                            manageStaff={state.staffing}
                                            portOrRegionText={portOrRegionText}
                                            setPortOrRegionText={setPortOrRegionText}
                                            staffText={staffText}
                                            setStaffText={setStaffText}
                                            saveCallback={save}
                    /> :
                    <Button
                        disabled={!(((selectedPorts.length === 1 && state.rccOption === "port") ||
                            (selectedRegions.length === 1 && state.rccOption === "rccu")) &&
                            state.agreeDeclaration && !state.staffing)}
                        onClick={save}
                        variant="contained"
                        color="primary"
                    >
                        Request access
                    </Button>
                }
            </List>
        </Box>;
    }

    return state.requestSubmitted ?
        <ThankYouBox>
            <Declaration>
                <h1>Thank you</h1>
                <p>You'll be notified by email when your request has been processed. This usually happens within a
                    couple of hours, but may take longer outside core working hours (Monday to Friday, 9am to 5pm).</p>
            </Declaration>
        </ThankYouBox> :
        form();
}
