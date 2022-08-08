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
    return <div>
        {props.user.roles.includes("rcc:view") ?
            <div>
                <Box>
                    <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                        {props.region} region dashboard
                    </Typography>
                    <Typography id="modal-modal-description" sx={{mt: 2}}>
                        <p> This is a new page on DRT. You can download an arrivals export covering all port terminals
                            in this region. A member of the team will be in touch to get your thoughts about how this
                            page could be more useful. You can also get in touch with the team by email at
                            drtpoiseteam@homeoffice.gov.uk.</p>
                    </Typography>
                </Box>
                <div align="center"><ArrivalExport region={props.region}/></div>
                <Button style={{float: 'right'}} href="/">back</Button>
            </div> :
            <div>
                <p> You don't have relevant permission to view the page. If you like to have permission for the page
                    then you can get in touch with the team by email at drtpoiseteam@homeoffice.gov.uk.</p>
            </div>
        }
    </div>
}