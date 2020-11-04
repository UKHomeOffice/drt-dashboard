import React from 'react';
import {AxiosResponse} from 'axios';

import ApiClient from '../services/ApiClient';
import AccessRequestForm from "./AccessRequestForm";
import PortsList from "./PortsList";


interface UserLike {
  email: string;
  ports: string[];
}

class User implements UserLike {
  email: string;
  ports: string[];

  constructor(email: string, ports: string[]) {
    this.email = email;
    this.ports = ports;
  }
}

interface Config {
  ports: string[];
  domain: string;
}

interface IProps {
}

interface IState {
  user?: User;
  config: Config;
}

export default class Home extends React.Component<IProps, IState> {
  apiClient: ApiClient;

  constructor(props: IProps) {
    super(props);

    this.state = {
      config: {
        ports: [],
        domain: "",
      }
    }

    this.apiClient = new ApiClient()
  }

  componentDidMount() {
    this.apiClient.fetchData(this.apiClient.userEndPoint, this.updateUserState);
    this.apiClient.fetchData(this.apiClient.configEndPoint, this.updateConfigState);
  }

  updateUserState = (response: AxiosResponse) => {
    let user = response.data as UserLike;
    this.setState({...this.state, user: user});
  }

  updateConfigState = (response: AxiosResponse) => {
    let config = response.data as Config;
    this.setState({...this.state, config: config});
  }

  render() {
    let content;

    if (this.state.user === undefined)
      content = <p>Loading..</p>
    else if (this.state.user.ports.length === 0)
      content = <AccessRequestForm ports={this.state.config.ports}/>
    else
      content = <PortsList ports={this.state.user.ports} drtDomain={this.state.config.domain} />

    return (
      <header className="App-header">
        <h1>Welcome to DRT</h1>
        {content}
      </header>
    )
  }
}
