import React from 'react';

import AccessRequestForm from "./AccessRequestForm";
import {PortList} from "./PortList";
import {Box} from "@mui/material";
import {UserProfile} from "../model/User";
import {ConfigValues} from "../model/Config";
import { useNavigate } from "react-router-dom";


interface IProps {
    user: UserProfile;
    config: ConfigValues;
}


export const Home = (props: IProps) => {
    const navigate = useNavigate();
    const isRccUser = () => {
        return props.user.roles.includes("rcc:central") || props.user.roles.includes("rcc:heathrow") || props.user.roles.includes("rcc:north") || props.user.roles.includes("rcc:south")
    }

    if (isRccUser() || props.user.roles.includes('national:view') || props.user.roles.includes('forceast:view')){
        navigate('/national-pressure');
    }

    return <Box className="App-header">
        {props.user.ports.length === 0 && !isRccUser() ?
            <AccessRequestForm regions={props.config.portsByRegion} teamEmail={props.config.teamEmail}/> :
            <PortList user={props.user} allRegions={props.config.portsByRegion} userPorts={props.user.ports}
                      drtDomain={props.config.domain} isRccUser={isRccUser()}/>
        }
    </Box>
}
