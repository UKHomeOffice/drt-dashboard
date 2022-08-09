import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrivalExport from './ArrivalExport';
import {UserProfile} from "../model/User";
import {ConfigValues} from "../model/Config";
import Button from '@mui/material/Button';

interface IProps {
    user: UserProfile;
    config: ConfigValues;
    region: string;
}

export const RegionalPort = (props: IProps) => {
    return <div class="flex-container">
        {props.user.roles.includes("rcc:" + props.region.toLowerCase()) ?
            <div>
                <Box>
                    <Typography align="left" variant="h6" component="h2">
                        {props.region} region dashboard
                    </Typography>
                    <p> This is a new page on DRT. You can download an arrivals export covering all port terminals in
                        this region.</p>
                    <div align="left"><ArrivalExport region={props.region}/></div>
                    <p> A member of the team will be in touch to get your thoughts about how this
                        page could be more useful. You can also get in touch with the team by email at
                        <a href={"mailto:" + props.config.teamEmail}> {props.config.teamEmail}</a>.</p>
                </Box>
                <Button style={{float: 'right'}} href="/">back</Button>
            </div> :
            <div>
                <Box>
                    <p> You don't have access to this page. To request access please get in touch with the team at <a
                        href={"mailto:" + props.config.teamEmail}> {props.config.teamEmail}</a>.</p>
                </Box>
            </div>
        }
    </div>
}