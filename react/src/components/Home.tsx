import React from 'react';

import AccessRequestForm from "./AccessRequestForm";
import {PortList} from "./PortList";
import {Box} from "@mui/material";
import {UserProfile} from "../model/User";
import {ConfigValues} from "../model/Config";
import {FlightFlagger} from "@drt/drt-react-components";
// import { SearchFilterPayload } from "drt-react/FlightFlaggerFilters";

interface IProps {
  user: UserProfile;
  config: ConfigValues;
}


export const Home = (props: IProps) => {
  const isRccUser = () => {
    return props.user.roles.includes("rcc:central") || props.user.roles.includes("rcc:heathrow") || props.user.roles.includes("rcc:north") || props.user.roles.includes("rcc:south")
  }
  const [showHighlightOnly, setShowHighlightOnly] = React.useState<boolean>(false);

  // const submitCallback = (payload:string) => {
  //   console.log('payload...' + payload)
  // };

  // const initialFlightData = {"nationalities" :["USA", "UK", "India"],
  // "ageGroups" : ["0-17", "18-64", "65+"],
  // "submitCallback" : submitCallback,
  // "flights" : [],
  // "isLoading" : false}

  // const [flightData, setFlightData] = useState(initialFlightData);



  // const handleFlightUpdate = (newFlightData) => {
  //   setFlightData(newFlightData);
  // };




  return <Box className="App-header">
    {props.user.ports.length === 0 && !isRccUser() ?
      <AccessRequestForm regions={props.config.portsByRegion} teamEmail={props.config.teamEmail}/> :
      <PortList user={props.user} allRegions={props.config.portsByRegion} userPorts={props.user.ports}
                drtDomain={props.config.domain} isRccUser={isRccUser()}/>
    }
    <FlightFlagger nationalities = {["USA", "UK", "India"]}
                   ageGroups = {["0-17", "18-64", "65+"]}
                   submitCallback = {(payload) => {console.log('payload...' + payload)}}
                   flights = {[]} // replace with actual flights
                   isLoading = {false}
    />
    <button onClick={() => setShowHighlightOnly(!showHighlightOnly)}>
      Toggle Highlights
    </button>
  </Box>
}
