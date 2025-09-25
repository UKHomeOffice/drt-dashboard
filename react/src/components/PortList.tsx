import React from "react";
import {Box, Typography} from "@mui/material";
import {PortRegion} from "../model/Config";
import {PortListStraight} from "./PortListStraight";
import {PortListByRegion} from "./PortListByRegion";
import {UserProfile} from "../model/User";

interface IProps {
    user: UserProfile;
    allRegions: PortRegion[]
    userPorts: string[];
    drtDomain: string;
    isRccUser: Boolean;
}

export const PortList = (props: IProps) => {
    const isRccRegion = (regionName : string) => {
        return props.user.roles.includes("rcc:" + regionName.toLowerCase())
    }

    const userRegions: PortRegion[] = props.allRegions.map(region => {
        const userPorts: string[] = props.userPorts.filter(p => region.ports.includes(p));
        return {...region, ports: userPorts} as PortRegion
    }).filter(r => r.ports.length > 0 || isRccRegion(r.name))


    return <Box sx={{width: '100%'}}>
        <Typography variant="h1">Welcome to DRT</Typography>
        {props.isRccUser ?
            <Typography variant="body1">Click on your region or ports</Typography> :
            <Typography variant="body1">Select your destination</Typography>
        }
        {userRegions.length > 1 || props.isRccUser ?
            <PortListByRegion user={props.user} regions={userRegions} drtDomain={props.drtDomain}/> :
            <PortListStraight ports={props.userPorts} drtDomain={props.drtDomain}/>
        }
    </Box>
}

